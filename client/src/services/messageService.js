import axios from 'axios';
import { getAuthToken, getCurrentUserId } from '../utils/authUtils';
import userService from './userService'; 
import socketService from './socketService';
import { getApiBaseUrl } from '../utils/apiConfig';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const authAxios = axios.create({
  baseURL: `${API_URL}/messages`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization header to every request
authAxios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Use localStorage to simulate a database for messages and threads
// This ensures data persists between sessions and different users
const DB_KEYS = {
  THREADS: 'handshake_threads',
  MESSAGES: 'handshake_messages'
};

// Helper functions for the "database"
const getDatabase = () => {
  let threads = [];
  let messages = {};
  
  try {
    // Try to load existing data from localStorage
    const threadsData = localStorage.getItem(DB_KEYS.THREADS);
    if (threadsData) {
      threads = JSON.parse(threadsData);
    }
    
    const messagesData = localStorage.getItem(DB_KEYS.MESSAGES);
    if (messagesData) {
      messages = JSON.parse(messagesData);
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    // Initialize empty if there's an error
    threads = [];
    messages = {};
  }
  
  return { threads, messages };
};

const saveDatabase = (threads, messages) => {
  try {
    localStorage.setItem(DB_KEYS.THREADS, JSON.stringify(threads));
    localStorage.setItem(DB_KEYS.MESSAGES, JSON.stringify(messages));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

const initializeDbIfNeeded = async () => {
  const { threads } = getDatabase();
  
  // Only initialize if there's no data yet
  if (threads.length === 0) {
    console.log('No existing chat data found, initializing empty database');
    saveDatabase([], {});
  } else {
    console.log('Existing chat data found:', {
      threads: threads.length,
      threadIds: threads.map(t => t._id)
    });
    
    // Convert legacy thread IDs to MongoDB format if needed
    let hasLegacyThreads = false;
    threads.forEach(thread => {
      if (thread._id.includes('thread_') || thread._id.includes('_')) {
        hasLegacyThreads = true;
        // Generate MongoDB-compatible ID
        const oldId = thread._id;
        thread._id = new Array(24).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        console.log(`Converted legacy thread ID ${oldId} to MongoDB format: ${thread._id}`);
      }
    });
    
    if (hasLegacyThreads) {
      const { messages } = getDatabase();
      saveDatabase(threads, messages);
      console.log('Saved updated thread IDs to localStorage');
    }
  }
  
  return getDatabase();
};

// Get threads for the current user
const getThreads = async () => {
  try {
    // Try the real API first
    const response = await authAxios.get('/threads');
    console.log('Successfully retrieved threads from API');
    return response.data.data.threads;
  } catch (error) {
    console.error('Error fetching threads from API, falling back to local storage:', error);
    
    // Get the current user ID
    const currentUserId = getCurrentUserId();
    
    // Initialize database if needed
    const { threads } = await initializeDbIfNeeded();
    
    // Filter threads for the current user (they should be a participant)
    const userThreads = threads.filter(thread => 
      thread.participants.includes(currentUserId)
    );
    
    console.log(`Found ${userThreads.length} threads for user ${currentUserId}`);
    
    // Get other participant details for each thread
    await Promise.all(userThreads.map(async (thread) => {
      if (!thread.otherParticipant) {
        const otherUserId = thread.participants.find(p => p !== currentUserId);
        if (otherUserId) {
          try {
            const testUsers = await userService.getTestUsers();
            const otherUser = testUsers.find(user => user._id === otherUserId);
            if (otherUser) {
              thread.otherParticipant = otherUser;
            }
          } catch (err) {
            console.error('Error getting user details:', err);
          }
        }
      }
    }));
    
    return userThreads;
  }
};

// Get messages for a specific thread
const getMessages = async (threadId) => {
  try {
    const response = await authAxios.get(`/threads/${threadId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching messages from API, falling back to local storage:', error);
    
    // Initialize database if needed
    const { threads, messages } = await initializeDbIfNeeded();
    
    // Check both storage locations for messages
    
    // First check the primary messages object
    const threadMessages = messages[threadId] || [];
    
    // Then check the per-thread storage used for cross-user communication
    let additionalMessages = [];
    try {
      const storageKey = `messages_${threadId}`;
      const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      additionalMessages = existingMessages;
      console.log('Retrieved additional messages from per-thread storage:', additionalMessages.length);
    } catch (err) {
      console.error('Error retrieving messages from per-thread storage:', err);
    }
    
    // Combine both message sources
    const allMessages = [...threadMessages, ...additionalMessages];
    
    // Filter out duplicates (based on _id)
    const uniqueMessages = [];
    const seenIds = new Set();
    
    allMessages.forEach(msg => {
      if (msg._id && !seenIds.has(msg._id)) {
        seenIds.add(msg._id);
        uniqueMessages.push(msg);
      } else if (!msg._id) {
        // Include messages with no _id (rare case)
        uniqueMessages.push(msg);
      }
    });
    
    // Sort messages by timestamp
    uniqueMessages.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
    
    console.log(`Retrieved ${uniqueMessages.length} messages for thread ${threadId}`);
    
    // Find thread for return
    const thread = threads.find(t => t._id === threadId);
    
    return { messages: uniqueMessages, thread };
  }
};

// Send a message to a thread
const sendMessage = async (threadId, content, attachments = []) => {
  try {
    // Improved thread ID format detection
    // MongoDB ObjectIDs are typically 24 hex characters
    const isMongoId = /^[0-9a-f]{24}$/i.test(threadId);
    const isLocalThread = threadId.includes('thread_') || threadId.includes('_');
    
    console.log(`Thread ID format check: ${threadId}, isMongoId: ${isMongoId}, isLocalThread: ${isLocalThread}`);
    
    // Try to use MongoDB if it seems like a MongoDB ID
    if (isMongoId) {
      try {
        console.log('Attempting to use MongoDB API for this thread ID');
        const response = await authAxios.post(`/threads/${threadId}`, {
          content,
          attachments,
          messageType: attachments.length > 0 ? 'mixed' : 'text'
        });
        console.log('Successfully sent message via MongoDB API');
        return response.data.data.message;
      } catch (apiError) {
        console.error('API call failed despite having MongoDB ID format:', apiError);
        throw new Error('API call failed, falling back to localStorage');
      }
    } else {
      // This is definitely a localStorage thread
      console.log('Using local storage for this thread (non-MongoDB ID format)');
      throw new Error('Using local storage for this thread');
    }
  } catch (error) {
    console.error('Using local storage for messaging:', error.message);
    
    // Get current database
    const { threads, messages } = await initializeDbIfNeeded();
    
    // Find the thread
    const threadIndex = threads.findIndex(t => t._id === threadId);
    if (threadIndex === -1) {
      console.error(`Thread not found: ${threadId}`);
      throw new Error('Thread not found');
    }
    
    // Get current user info
    const currentUserId = getCurrentUserId();
    
    // Create a new message
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date().toISOString();
    
    // Get user data for better display
    const userData = JSON.parse(localStorage.getItem('userData')) || {};
    
    const newMessage = {
      _id: messageId,
      threadId: threadId,
      content: content,
      sender: { 
        _id: currentUserId,
        firstName: userData.firstName || 'User',
        lastName: userData.lastName || ''
      },
      messageType: attachments.length > 0 ? 'mixed' : 'text',
      attachments,
      createdAt: now,
      isRead: false
    };
    
    // Add message to the thread's messages
    if (!messages[threadId]) {
      messages[threadId] = [];
    }
    messages[threadId].push(newMessage);
    
    // Update the thread's last message info
    threads[threadIndex].lastMessage = {
      content: content,
      sender: currentUserId,
      timestamp: now,
      messageType: attachments.length > 0 ? 'mixed' : 'text'
    };
    threads[threadIndex].updatedAt = now;
    
    // Update unread count for the other participant
    const otherParticipantId = threads[threadIndex].participants.find(
      id => id !== currentUserId
    );
    
    // If we're not the other participant, increment their unread count
    if (currentUserId !== otherParticipantId) {
      // Make sure unreadCount is an object
      if (typeof threads[threadIndex].unreadCount === 'number') {
        // Convert from number to object format
        const currentCount = threads[threadIndex].unreadCount || 0;
        threads[threadIndex].unreadCount = {};
        threads[threadIndex].unreadCount[otherParticipantId] = currentCount;
      } else if (!threads[threadIndex].unreadCount) {
        // Initialize if it doesn't exist
        threads[threadIndex].unreadCount = {};
      }
      
      // Now increment the count for the other participant
      threads[threadIndex].unreadCount[otherParticipantId] = 
        (threads[threadIndex].unreadCount[otherParticipantId] || 0) + 1;
    }
    
    // Save updated database
    saveDatabase(threads, messages);
    
    // Also save to the per-thread message storage for cross-user communication
    try {
      const storageKey = `messages_${threadId}`;
      const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingMessages.push(newMessage);
      localStorage.setItem(storageKey, JSON.stringify(existingMessages));
    } catch (err) {
      console.error('Error saving to per-thread storage:', err);
    }
    
    // Use socket to broadcast message to other users
    socketService.sendMessage(threadId, newMessage);
    
    console.log('Message saved to local storage:', {
      threadId,
      messageId,
      content: content.substring(0, 20) + (content.length > 20 ? '...' : '')
    });
    
    return newMessage;
  }
};

// Create a new thread
const createThread = async (participantId, initialMessage, attachments = []) => {
  try {
    // Check if MongoDB is available by making a simple test request
    let useMongoDb = false;
    try {
      // Quick test to see if the server is reachable
      const testResponse = await axios.get(`${API_URL}/test`, { timeout: 1000 });
      useMongoDb = true;
      console.log('MongoDB appears to be available, using API for thread creation');
    } catch (testError) {
      console.warn('API test failed, will use localStorage:', testError.message);
    }
    
    if (useMongoDb) {
      // Use the real API to create the thread
      const response = await authAxios.post('/threads', {
        participantId,
        initialMessage,
        attachments
      });
      console.log('Thread created via API:', response.data.data.thread);
      return response.data.data.thread;
    } else {
      // Fall back to localStorage if the test failed
      throw new Error('Using localStorage for thread creation');
    }
  } catch (error) {
    console.error('Error creating thread via API, using local storage instead:', error);
    
    // Get current database
    const { threads, messages } = await initializeDbIfNeeded();
    
    // Get the current user ID
    const currentUserId = getCurrentUserId();
    
    // Check if thread already exists between these two users
    const existingThreadIndex = threads.findIndex(thread => 
      thread.participants.includes(currentUserId) && 
      thread.participants.includes(participantId)
    );
    
    if (existingThreadIndex !== -1) {
      // Thread already exists
      console.log('Thread already exists between these users');
      
      // If there's an initial message, add it
      if (initialMessage) {
        await sendMessage(threads[existingThreadIndex]._id, initialMessage, attachments);
        
        // Move thread to top (most recent)
        const existingThread = threads[existingThreadIndex];
        threads.splice(existingThreadIndex, 1);
        threads.unshift(existingThread);
        saveDatabase(threads, messages);
      }
      
      return threads[0];
    }
    
    // Get participant info
    let otherParticipant = null;
    try {
      const testUsers = await userService.getTestUsers();
      otherParticipant = testUsers.find(user => user._id === participantId);
    } catch (err) {
      console.error('Error getting participant info:', err);
    }
    
    // Generate a mongo-like ID to better integrate with API
    // This is a simplified mock of a MongoDB ObjectId
    const mongoLikeId = new Array(24).fill(0).map(() => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    const now = new Date().toISOString();
    
    // Create new thread with mongo-like ID
    const newThread = {
      _id: mongoLikeId,
      participants: [currentUserId, participantId],
      otherParticipant,
      lastMessage: initialMessage ? {
        content: initialMessage,
        sender: currentUserId,
        timestamp: now,
        messageType: attachments.length > 0 ? 'mixed' : 'text'
      } : null,
      unreadCount: {},
      isArchived: false,
      createdAt: now,
      updatedAt: now
    };
    
    // Add to threads list
    threads.unshift(newThread);
    
    // If there's an initial message, create it
    if (initialMessage) {
      // Get user data for better display
      const userData = JSON.parse(localStorage.getItem('userData')) || {};
      
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const newMessage = {
        _id: messageId,
        threadId: newThread._id,
        content: initialMessage,
        sender: { 
          _id: currentUserId,
          firstName: userData.firstName || 'User',
          lastName: userData.lastName || ''
        },
        messageType: attachments.length > 0 ? 'mixed' : 'text',
        attachments,
        createdAt: now,
        isRead: false
      };
      
      // Create message array for this thread
      messages[newThread._id] = [newMessage];
    } else {
      // Initialize empty message array
      messages[newThread._id] = [];
    }
    
    // Save to database
    saveDatabase(threads, messages);
    
    console.log('New thread created in local storage:', {
      threadId: newThread._id,
      participants: [currentUserId, participantId],
      hasInitialMessage: !!initialMessage
    });
    
    return newThread;
  }
};

// Mark a thread as read
const markThreadAsRead = async (threadId) => {
  try {
    const response = await authAxios.put(`/threads/${threadId}/read`);
    return response.data.data;
  } catch (error) {
    console.error('Error marking thread as read, using local storage instead:', error);
    
    // Get database
    const { threads, messages } = getDatabase();
    
    // Find and update thread
    const threadIndex = threads.findIndex(t => t._id === threadId);
    if (threadIndex !== -1) {
      // Handle resetting unread count properly
      const currentUserId = getCurrentUserId();
      
      // Convert number to object if needed
      if (typeof threads[threadIndex].unreadCount === 'number') {
        threads[threadIndex].unreadCount = {}; // Reset it completely
      } else if (!threads[threadIndex].unreadCount) {
        threads[threadIndex].unreadCount = {};
      }
      
      // Reset unread count for current user
      threads[threadIndex].unreadCount[currentUserId] = 0;
      
      // Also update last read timestamp
      threads[threadIndex].lastReadAt = new Date().toISOString();
      
      // Save updated threads to localStorage
      saveDatabase(threads, messages);
      
      console.log(`Thread ${threadId} marked as read in localStorage`);
      
      // Also update any separate storage of messages per thread 
      try {
        const storageKey = `messages_${threadId}`;
        const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        // Mark all messages as read
        existingMessages.forEach(message => {
          message.isRead = true;
        });
        
        localStorage.setItem(storageKey, JSON.stringify(existingMessages));
      } catch (err) {
        console.error('Error updating message read status in localStorage:', err);
      }
    }
    
    return { success: true };
  }
};

// Archive a thread
const archiveThread = async (threadId) => {
  try {
    const response = await authAxios.put(`/threads/${threadId}/archive`);
    return response.data.data;
  } catch (error) {
    console.error('Error archiving thread, using local storage instead:', error);
    
    // Get database
    const { threads, messages } = getDatabase();
    
    // Find and update thread
    const threadIndex = threads.findIndex(t => t._id === threadId);
    if (threadIndex !== -1) {
      threads[threadIndex].isArchived = true;
      saveDatabase(threads, messages);
    }
    
    return { success: true };
  }
};

const messageService = {
  getThreads,
  getMessages,
  sendMessage,
  createThread,
  markThreadAsRead,
  archiveThread
};

export default messageService; 