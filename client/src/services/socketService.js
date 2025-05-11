import io from 'socket.io-client';
import { getAuthToken } from '../utils/authUtils';
import { API_URL } from '../utils/apiConfig';
import { getCurrentUserId } from '../utils/authUtils';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    console.log('Connecting to socket at URL:', API_URL, 'with token:', token ? 'Token exists' : 'No token');
    
    try {
      this.socket = io(API_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.setupSocketListeners();
      return this.socket;
    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
      this.handleDisconnect('connection-failed');
      return null;
    }
  }
  
  // Setup default listeners
  setupSocketListeners() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Socket connected with ID:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      this.handleDisconnect(reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleDisconnect('connect_error');
    });
  }
  
  // Handle disconnect and reconnect logic
  handleDisconnect(reason) {
    this.isConnected = false;
    
    // Only attempt to reconnect for certain disconnect reasons
    if (['io server disconnect', 'transport close', 'connection-failed', 'connect_error'].includes(reason)) {
      this.connectionAttempts++;
      
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`Reconnecting (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
        setTimeout(() => {
          // Try to reconnect if socket exists
          if (this.socket) {
            this.socket.connect();
          }
        }, 2000);
      } else {
        console.warn('Max connection attempts reached');
      }
    }
  }

  // Join a thread room
  joinThread(threadId) {
    if (this.isConnected) {
      console.log('Joining thread room:', threadId);
      this.socket.emit('join-thread', threadId);
    } else {
      console.warn('Cannot join thread: Socket not connected');
    }
  }

  // Leave a thread room
  leaveThread(threadId) {
    if (this.isConnected) {
      console.log('Leaving thread room:', threadId);
      this.socket.emit('leave-thread', threadId);
    } else {
      console.warn('Cannot leave thread: Socket not connected');
    }
  }

  // Send a message - simplified to ensure it works
  sendMessage(threadId, message) {
    console.log(`Socket connected: ${this.isConnected}, Socket exists: ${!!this.socket}`);
    
    if (this.socket && this.isConnected) {
      console.log('Emitting send-message event:', { threadId, messageContent: message.content });
      try {
        this.socket.emit('send-message', { threadId, message });
        return true;
      } catch (error) {
        console.error('Socket emit error:', error);
        return false;
      }
    } else {
      console.warn('Cannot send message: Socket not connected');
      
      // Try to reconnect if not connected
      if (!this.isConnected && this.socket) {
        this.connectionAttempts = 0; // Reset counter
        this.socket.connect();
      }
      
      return false;
    }
  }

  // Mark a thread as read
  markThreadRead(threadId) {
    if (this.isConnected) {
      console.log('Marking thread as read:', threadId);
      this.socket.emit('mark-thread-read', threadId);
    } else {
      console.warn('Cannot mark thread read: Socket not connected');
    }
  }

  // Send typing indicator
  sendTyping(threadId) {
    if (this.isConnected) {
      this.socket.emit('typing', threadId);
    } else {
      console.warn('Cannot send typing: Socket not connected');
    }
  }

  // Send typing stopped indicator
  sendTypingStopped(threadId) {
    if (this.isConnected) {
      this.socket.emit('typing-stopped', threadId);
    } else {
      console.warn('Cannot send typing stopped: Socket not connected');
    }
  }

  // Add listener for new messages
  onNewMessage(callback) {
    if (this.socket) {
      console.log('Setting up new-message event listener');
      
      // Remove any existing listeners to avoid duplicates
      this.socket.off('new-message');
      
      this.socket.on('new-message', (data) => {
        console.log('Received new-message event:', data);
        
        // Check if message is from current user - if so, update any optimistic UI data
        const currentUserId = getCurrentUserId();
        if (data.sender && data.sender._id === currentUserId) {
          console.log('Message is from current user, updating optimistic UI data');
        }
        
        // Pass the message to the callback
        callback(data);
        
        // Store the message in localStorage to ensure persistence
        try {
          const storageKey = `messages_${data.threadId}`;
          const existingMessages = JSON.parse(localStorage.getItem(storageKey) || '[]');
          
          // Check if message already exists
          const messageExists = existingMessages.some(m => m._id === data._id);
          
          if (!messageExists) {
            existingMessages.push(data);
            localStorage.setItem(storageKey, JSON.stringify(existingMessages));
          }
        } catch (err) {
          console.error('Error storing message in localStorage:', err);
        }
      });
    } else {
      console.warn('Cannot set up new-message listener: Socket not initialized');
    }
  }

  // Add listener for message notifications
  onMessageNotification(callback) {
    if (this.socket) {
      console.log('Setting up message-notification event listener');
      this.socket.on('message-notification', (data) => {
        console.log('Received message-notification event:', data);
        callback(data);
      });
    } else {
      console.warn('Cannot set up message-notification listener: Socket not initialized');
    }
  }

  // Add listener for thread read status
  onThreadRead(callback) {
    if (this.socket) {
      this.socket.on('thread-read', callback);
    }
  }

  // Add listener for typing indicator
  onTyping(callback) {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
  }

  // Add listener for typing stopped
  onTypingStopped(callback) {
    if (this.socket) {
      this.socket.on('typing-stopped', callback);
    }
  }

  // Remove listener
  removeListener(event, callback) {
    if (this.socket) {
      console.log('Removing listener for event:', event);
      this.socket.off(event, callback);
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
  
  // Check if socket is connected
  isSocketConnected() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService; 