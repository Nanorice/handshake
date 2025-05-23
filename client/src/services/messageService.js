import axios from 'axios';
import { getAuthToken, getCurrentUserId } from '../utils/authUtils';
import userService from './userService'; 
import socketService from './socketService';
import { getApiBaseUrl } from '../utils/apiConfig';

// Use getApiBaseUrl to get the correct API URL with /api prefix
const API_URL = getApiBaseUrl();

// Create axios instance with auth header
const authAxios = axios.create({
  baseURL: API_URL + '/messages',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization header to every request
authAxios.interceptors.request.use(
  (config) => {
    // Get a fresh token for each request to ensure we have the latest
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`Adding auth token to request: ${token.substring(0, 10)}...`);
    } else {
      console.warn('No auth token available for request');
      
      // Instead of throwing an error, redirect to login page if in a browser environment
      if (typeof window !== 'undefined') {
        console.log('Redirecting to login page due to missing authentication');
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
      
      // Still throw error to prevent further execution
      throw new Error('Authentication required');
    }
    
    // Log the full URL being requested for debugging
    console.log(`Requesting: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
authAxios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401/403 errors specifically
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Authentication error in messageService:', error.response.status);
      
      // Clear any invalid auth data
      localStorage.removeItem('token');
      
      // Redirect to login page if in a browser environment
      if (typeof window !== 'undefined') {
        console.log('Redirecting to login page due to authentication failure');
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
      
      // Fall back to local storage for data in the meantime
      console.log('Falling back to local storage for messaging data');
      
      // Create a custom error with fallback flag to trigger localStorage fallback
      const customError = new Error('Authentication required');
      customError.requiresFallback = true;
      return Promise.reject(customError);
    }
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
    // Check if we have a valid token first
    const token = getAuthToken();
    if (!token) {
      console.error('Cannot fetch threads: No valid authentication token');
      return [];
    }
    
    // Try the real API with valid token
    const response = await authAxios.get('/threads');
    
    if (!response?.data?.data) {
      console.warn('API returned invalid data format for threads');
      throw new Error('Invalid API response format');
    }
    
    console.log('Successfully retrieved threads from API');
    
    // Ensure we always return an array
    const threads = response.data.data.threads;
    if (!Array.isArray(threads)) {
      console.warn('API returned non-array for threads:', threads);
      return [];
    }
    
    return threads;
  } catch (error) {
    console.error('Error fetching threads:', error);
    return [];
  }
};

// Get threads from local storage (for fallback)
const getLocalThreads = async () => {
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
};

// Get messages for a specific thread
const getMessages = async (threadId) => {
  if (!threadId) {
    console.error('Invalid thread ID provided to getMessages');
    return []; // Return empty array directly for consistency
  }

  try {
    // Use the correct endpoint for fetching messages
    console.log(`[messageService] Getting messages for thread ${threadId} at /threads/${threadId}`);
    const response = await authAxios.get(`/threads/${threadId}`);
    
    // Check if response.data has the messages array
    if (response?.data?.data?.messages) {
      console.log(`[messageService] Successfully fetched messages for thread ${threadId}:`, response.data.data.messages);
      return response.data.data.messages;
    } else if (response?.data?.messages) {
      console.log(`[messageService] Successfully fetched messages (response.data.messages) for thread ${threadId}:`, response.data.messages);
      return response.data.messages;
    } else if (response?.data && Array.isArray(response.data)) {
      console.log(`[messageService] Successfully fetched messages (response.data is array) for thread ${threadId}:`, response.data);
      return response.data;
    } else {
      console.warn('[messageService] API returned invalid data format for messages. Response data:', response?.data);
      return []; // Return empty array on failure
    }
  } catch (error) {
    console.error(`[messageService] Error fetching messages for thread ${threadId}:`, error);
    // Check if it's a CORS preflight error or other network issue
    if (error.isAxiosError && !error.response) {
      console.error('[messageService] Network error or CORS issue suspected.');
    }
    return []; // Return empty array on error
  }
};

/**
 * Send a message in a thread
 * @param {string} threadId - ID of the thread
 * @param {string} content - Text content of the message
 * @param {Array} attachments - Optional file attachments
 * @param {string} replyToId - Optional ID of the message being replied to
 * @returns {Promise<Object>} - The sent message
 */
const sendMessage = async (threadId, content, attachments = [], replyToId = null) => {
  if (!threadId) {
    console.error('Invalid thread ID');
    return null;
  }

  try {
    const messageData = { content };
    
    // Add replyToId if replying to a message
    if (replyToId) {
      messageData.replyToId = replyToId;
      messageData.messageType = 'reply';
    }
    
    // Add file data if attachments present
    if (attachments && attachments.length > 0) {
      const firstAttachment = attachments[0];
      messageData.file = {
        fileName: firstAttachment.name,
        fileType: firstAttachment.type,
        fileSize: firstAttachment.size,
        filePath: firstAttachment.url || ''
      };
      messageData.messageType = 'file';
    }
    
    // Send the message to the backend
    const response = await authAxios.post(`/threads/${threadId}`, messageData);
    
    if (response.data && response.data.status === 'success') {
      return response.data.data.message;
    }
    
    return null;
  } catch (error) {
    console.error('Error sending message:', error);
    
    // Use socket.io as fallback if HTTP request fails
    try {
      socketService.sendMessage(threadId, {
        content,
        replyToId,
        messageType: replyToId ? 'reply' : (attachments.length > 0 ? 'file' : 'text'),
        file: attachments.length > 0 ? {
          fileName: attachments[0].name,
          fileType: attachments[0].type,
          fileSize: attachments[0].size,
          filePath: attachments[0].url || ''
        } : null
      });
      
      return {
        _id: `temp-${Date.now()}`,
        threadId,
        content,
        sender: { _id: getCurrentUserId() },
        createdAt: new Date().toISOString(),
        replyTo: replyToId,
        messageType: replyToId ? 'reply' : (attachments.length > 0 ? 'file' : 'text'),
        file: attachments.length > 0 ? {
          fileName: attachments[0].name,
          fileType: attachments[0].type,
          fileSize: attachments[0].size,
          filePath: attachments[0].url || ''
        } : null,
        isLocal: true
      };
    } catch (socketError) {
      console.error('Socket fallback failed:', socketError);
      return null;
    }
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

// Export message service methods
const messageService = {
  getThreads,
  getMessages,
  sendMessage,
  createThread,
  markThreadAsRead,
  archiveThread,
  getLocalThreads
};

export default messageService; 