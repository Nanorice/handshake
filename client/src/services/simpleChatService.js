import { io } from 'socket.io-client';
import { getAuthToken, getCurrentUserId } from '../utils/authUtils';
import userService from './userService';
import { API_URL, getSocketUrl } from '../utils/apiConfig';

// Singleton class for socket.io connection and messaging
class SimpleChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageCallbacks = [];
    this.notificationCallbacks = [];
    this.typingCallbacks = [];
    this.threadCache = new Map(); // Cache threads locally
    this.messageCache = new Map(); // Cache messages locally
  }

  // Connect to socket.io server
  connect() {
    if (this.socket) {
      this.disconnect();
    }

    const token = getAuthToken();
    if (!token) {
      console.error('No auth token available for socket connection');
      return false;
    }

    // Connect to socket.io server using correct URL (without /api prefix)
    const SOCKET_URL = getSocketUrl();
    console.log(`SimpleChatService: Connecting to socket at: ${SOCKET_URL}`);
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('SimpleChatService: Socket connected!', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('SimpleChatService: Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('SimpleChatService: Socket connection error:', error);
      this.isConnected = false;
    });

    // Listen for messages
    this.socket.on('direct-message', (data) => {
      console.log('SimpleChatService: Received direct message:', data);
      
      // Cache the message
      this.addMessageToCache(data.threadId, data);
      
      // Update thread if exists in cache
      this.updateThreadInCache(data.threadId, data);
      
      // Call all callbacks
      this.messageCallbacks.forEach(callback => callback(data));
    });

    // Listen for notifications
    this.socket.on('message-notification', (data) => {
      console.log('SimpleChatService: Received notification:', data);
      this.notificationCallbacks.forEach(callback => callback(data));
    });

    return true;
  }

  // Disconnect from socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('SimpleChatService: Disconnected from socket');
    }
  }

  // Ensure connection is active
  ensureConnection() {
    if (!this.isConnected) {
      return this.connect();
    }
    return true;
  }

  // Add message to cache
  addMessageToCache(threadId, message) {
    if (!this.messageCache.has(threadId)) {
      this.messageCache.set(threadId, []);
    }
    
    // Check if message already exists
    const messages = this.messageCache.get(threadId);
    const messageExists = messages.some(m => m.id === message.id);
    
    if (!messageExists) {
      messages.push(message);
      // Sort by timestamp (newest first)
      messages.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
    }
  }

  // Update thread in cache
  updateThreadInCache(threadId, message) {
    // Create or update thread in cache
    const existingThread = this.threadCache.get(threadId);
    
    if (existingThread) {
      existingThread.lastMessage = {
        content: message.content,
        sender: message.sender._id,
        timestamp: message.timestamp || message.createdAt || new Date().toISOString()
      };
      existingThread.updatedAt = new Date().toISOString();
      
      // Increment unread count if not from current user
      if (message.sender._id !== getCurrentUserId()) {
        existingThread.unreadCount = (existingThread.unreadCount || 0) + 1;
      }
    }
  }

  // Send a direct message
  async sendDirectMessage(recipientId, content) {
    if (!this.ensureConnection()) {
      return { success: false, error: 'Not connected to socket' };
    }

    // Create thread ID if not exists (consistent format)
    const senderId = getCurrentUserId();
    const threadId = `thread-${recipientId}`;
    
    try {
      // Create message
      const messageId = `msg-${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Get user info for sender
      const testUsers = await userService.getTestUsers();
      const currentUser = testUsers.find(user => user._id === senderId) || { 
        firstName: 'Current', 
        lastName: 'User',
        _id: senderId
      };
      
      const message = {
        id: messageId,
        threadId,
        content,
        sender: {
          _id: senderId,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName
        },
        timestamp,
        createdAt: timestamp
      };
      
      // Emit message through socket
      this.socket.emit('direct-message', {
        recipientId,
        message
      });
      
      // Cache the message locally
      this.addMessageToCache(threadId, message);
      
      // Update thread cache
      await this.ensureThreadExists(recipientId);
      this.updateThreadInCache(threadId, message);
      
      return { success: true, message };
    } catch (error) {
      console.error('SimpleChatService: Error sending message:', error);
      return { success: false, error };
    }
  }

  // Ensure thread exists in cache
  async ensureThreadExists(participantId) {
    const threadId = `thread-${participantId}`;
    
    if (!this.threadCache.has(threadId)) {
      // Get other user info
      const testUsers = await userService.getTestUsers();
      const otherUser = testUsers.find(user => user._id === participantId);
      
      if (!otherUser) {
        console.error(`SimpleChatService: User ${participantId} not found`);
        return false;
      }
      
      const currentUserId = getCurrentUserId();
      const thread = {
        _id: threadId,
        participants: [currentUserId, participantId],
        otherParticipant: otherUser,
        lastMessage: null,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.threadCache.set(threadId, thread);
    }
    
    return true;
  }

  // Get all threads for current user
  async getThreads() {
    // Get test users
    const testUsers = await userService.getTestUsers();
    const currentUserId = getCurrentUserId();
    
    // If cache is empty, initialize with some threads
    if (this.threadCache.size === 0) {
      // Create threads with first 5 users who aren't the current user
      const otherUsers = testUsers.filter(user => user._id !== currentUserId).slice(0, 5);
      
      otherUsers.forEach(user => {
        const threadId = `thread-${user._id}`;
        this.threadCache.set(threadId, {
          _id: threadId,
          participants: [currentUserId, user._id],
          otherParticipant: user,
          lastMessage: null,
          unreadCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    }
    
    // Convert Map to array and sort by updatedAt (newest first)
    const threads = Array.from(this.threadCache.values());
    threads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    return threads;
  }

  // Get messages for a thread
  async getMessages(threadId) {
    // Ensure thread exists in cache
    const threadParts = threadId.split('-');
    if (threadParts.length > 1) {
      const participantId = threadParts[1];
      await this.ensureThreadExists(participantId);
    }
    
    // Return cached messages or empty array
    return this.messageCache.get(threadId) || [];
  }

  // Mark thread as read
  markThreadAsRead(threadId) {
    const thread = this.threadCache.get(threadId);
    if (thread) {
      thread.unreadCount = 0;
      return true;
    }
    return false;
  }

  // Register callback for new messages
  onMessage(callback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  // Register callback for notifications
  onNotification(callback) {
    this.notificationCallbacks.push(callback);
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
    };
  }

  // Check connection status
  isConnected() {
    return this.isConnected;
  }
}

// Create singleton instance
const simpleChatService = new SimpleChatService();
export default simpleChatService; 