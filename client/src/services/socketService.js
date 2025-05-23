import { io } from 'socket.io-client';
import { getAuthToken, getCurrentUserId } from '../utils/authUtils';
import { getApiBaseUrl, getSocketUrl } from '../utils/apiConfig';

class SocketService {
  constructor() {
    this._socket = null;
    this.threadSubscriptions = new Map();
    this.connected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.reconnectionDelay = 1000;
    this.messageQueue = []; // Queue for storing messages when offline
    this.listeners = new Map(); // Store event listeners
    this.isReconnecting = false;
    this.globalMessageHandler = null; // Store the global message handler
    
    // NEW - persistent notification handlers that survive component remounts
    this.persistentHandlers = {
      'message-notification': new Set(),
      'new-message': new Set(),
      'invitation-notification': new Set()
    };
    
    // NEW - last received message for each thread (for debugging)
    this.lastReceivedMessages = {};
  }

  connect() {
    if (this._socket?.connected) {
      console.log('[socketService] connect: Socket already connected.');
      return this._socket;
    }

    const token = getAuthToken();
    if (!token) {
      console.warn('Socket connection attempted without auth token');
      return null;
    }

    const SOCKET_URL = getSocketUrl();
    console.log(`[socketService] Connecting to socket at: ${SOCKET_URL} with token: ${token.substring(0,15)}...`);
    
    // Ensure any previous socket is fully closed
    if (this._socket) {
      console.log('[socketService] Cleaning up previous socket instance before creating new one');
      try {
        this._socket.disconnect();
        this._socket.close();
      } catch (e) {
        console.error('[socketService] Error cleaning up previous socket:', e);
      }
      this._socket = null;
    }
    
    // Create socket with robust configuration
    this._socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'], // Add polling as fallback
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      forceNew: true, // Force new connection
      autoConnect: true
    });

    // Add debugging for connection status changes
    this._socket.on('connect', () => {
      console.log('[socketService DEBUG] Socket CONNECTED with ID:', this._socket.id);
      this.connected = true;
      this.connectionAttempts = 0;
      this.isReconnecting = false;
      
      // Immediately rejoin all thread subscriptions on connect/reconnect
      console.log('[socketService DEBUG] Connection established - rejoining subscribed threads...');
      this.threadSubscriptions.forEach((value, key) => {
        const threadId = key;
        console.log(`[socketService DEBUG] Auto-rejoining thread after connection: ${threadId}`);
        this._socket.emit('join-thread', threadId);
      });
      
      // Set up the global message handler immediately on connect
      this.setupGlobalMessageHandler();
      
      // Process any queued messages
      this.processMessageQueue();
    });

    this._socket.io.on("error", (error) => {
      console.error('[socketService] Socket.io engine error:', error);
      // Don't disconnect or try to reconnect here, let the built-in mechanisms handle it
    });

    this._socket.io.on("reconnect_attempt", (attempt) => {
      console.log(`[socketService] Socket.io reconnect attempt ${attempt}`);
      // If we've tried websocket and it failed, use polling as a fallback
      if (attempt > 1 && this._socket.io.engine && this._socket.io.engine.transport) {
        console.log('[socketService] Switching to polling transport after websocket failure');
        this._socket.io.engine.transport.name = 'polling';
      }
    });

    this._socket.on('connect_error', (error) => {
      console.error('Socket connect_error:', error.message, 'Error object:', error);
      this.connected = false;
      this.handleDisconnect('connect_error');
    });

    this._socket.on('disconnect', (reason) => {
      console.log('Socket disconnected. Reason:', reason);
      this.connected = false;
      this.handleDisconnect('disconnect');
    });

    this._socket.on('error', (error) => {
      console.error('Socket \'error\' event:', error);
      this.handleDisconnect('error');
    });

    // Handle reconnection
    this._socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
      this.connectionAttempts = attemptNumber;
      this.isReconnecting = true;
    });

    this._socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after all attempts');
      this.isReconnecting = false;
    });

    // Listen for server confirmation of thread join
    this._socket.on('thread-joined', (data) => {
      console.log('[socketService] Server confirmed thread join:', data);
      // Optionally, we can use this to manage subscription state more robustly
      // For now, just logging is fine.
    });

    this.setupSocketListeners();
    return this._socket;
  }

  setupSocketListeners() {
    if (!this._socket) return;
    
    // Remove any existing listeners to prevent duplicates
    this._socket.off('disconnect');
    this._socket.off('reconnect');
    this._socket.off('reconnect_attempt');
    this._socket.off('reconnect_error');
    this._socket.off('reconnect_failed');
    this._socket.off('error');
    
    // Note: We don't remove connect and connect_error listeners here
    // since they're used for Promise resolution in the connect method
    
    this._socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      this.handleDisconnect(reason);
    });
    
    this._socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      this.connected = true;
      this.isReconnecting = false;
      
      // Process any queued messages after reconnecting
      this.processMessageQueue();

      // No need to rejoin threads here as the 'connect' handler already does this
      console.log('[socketService] Reconnection complete - room rejoins handled by connect handler');
    });
    
    this._socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}/${this.maxConnectionAttempts}`);
      console.log('Socket connection config:', {
        url: this._socket.io.uri,
        namespace: this._socket.nsp,
        transportOptions: this._socket.io.opts.transports, 
        path: this._socket.io.opts.path
      });
      this.isReconnecting = true;
    });
    
    this._socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      // Add more detailed debug info
      console.error('Socket reconnection context:', {
        url: this._socket.io?.uri,
        connected: this.connected,
        reconnecting: this.isReconnecting,
        transport: this._socket.io?.engine?.transport?.name
      });
    });
    
    this._socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after maximum attempts');
      this.isReconnecting = false;
      // Could notify user that real-time messaging is unavailable
    });
    
    // Add missing event handlers for professional users
    this._socket.on('error', (error) => {
      console.error('Socket error event:', error);
      
      // Special handling for namespace errors
      if (error && error.message && error.message.includes('Invalid namespace')) {
        console.error('Namespace error detected - this typically happens when the client is connecting to the wrong namespace');
        console.error('Socket config:', {
          uri: this._socket.io?.uri,
          namespace: this._socket.nsp,
          path: this._socket.io?.opts?.path
        });
        
        // Attempt to reconnect with correct configuration
        this.disconnect();
        setTimeout(() => {
          const token = getAuthToken();
          if (token) {
            console.log('Attempting to reconnect with corrected namespace...');
            this.connect();
          }
        }, 1000);
      }
    });
    
    this._socket.on('connect_timeout', (timeout) => {
      console.error('Socket connect_timeout:', timeout);
    });
  }
  
  handleDisconnect(reason) {
    this.connected = false;
    
    // Only attempt to reconnect for certain disconnect reasons
    if (['io server disconnect', 'transport close', 'ping timeout', 'connection-failed', 'connect_error'].includes(reason)) {
      if (!this.isReconnecting) {
        this.isReconnecting = true;
        this.connectionAttempts = 0;
        this.attemptReconnection();
      }
    }
  }
  
  attemptReconnection() {
    if (!this._socket || this.connected) return;
    
    this.connectionAttempts++;
    
    if (this.connectionAttempts <= this.maxConnectionAttempts) {
      const delay = this.reconnectionDelay * Math.pow(1.5, this.connectionAttempts - 1);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
      
      setTimeout(() => {
        console.log(`Attempting reconnection ${this.connectionAttempts}...`);
        if (this._socket) {
          this._socket.connect();
        } else {
          // Socket instance lost, create a new one
          const token = getAuthToken();
          if (token) {
            this.connect();
          }
        }
      }, delay);
    } else {
      console.warn('Max connection attempts reached, giving up.');
      this.isReconnecting = false;
      // Could dispatch an event to the UI to show connection status
    }
  }

  setupGlobalMessageHandler() {
    if (this._socket && this.globalMessageHandler) {
      console.log('[socketService DEBUG] Removing existing global message handler');
      this._socket.off('new-message', this.globalMessageHandler);
    }
    
    console.log('[socketService DEBUG] Setting up new global message handler');
    
    this.globalMessageHandler = (message) => {
      console.log('[socketService DEBUG] RECEIVED MESSAGE EVENT:', 
        message ? JSON.stringify(message).substring(0, 300) + '...' : 'undefined message');
      
      if (!message || !message.threadId) {
        console.error('[socketService DEBUG] Malformed message (missing threadId):', message);
        return;
      }
      
      // Store for debugging
      if (message.threadId) {
        this.lastReceivedMessages[message.threadId] = {
          type: 'new-message',
          data: message,
          timestamp: new Date().toISOString()
        };
        console.log(`[socketService DEBUG] Stored message for thread ${message.threadId} in lastReceivedMessages`);
      }
      
      // First notify subscribed threads
      const callback = this.threadSubscriptions.get(message.threadId);
      if (callback) {
        console.log(`[socketService DEBUG] Found subscription callback for thread: ${message.threadId}`);
        try {
          callback(message);
          console.log(`[socketService DEBUG] Successfully called thread subscription callback`);
        } catch (error) {
          console.error(`[socketService ERROR] Error in thread subscription callback:`, error);
        }
      } else {
        console.warn(`[socketService DEBUG] No thread subscription callback found for: ${message.threadId}. Active subscriptions:`, Array.from(this.threadSubscriptions.keys()));
      }
      
      // Always notify persistent handlers
      console.log('[socketService DEBUG] Broadcasting to persistent handlers. Count:', this.persistentHandlers['new-message'].size);
      
      if (this.persistentHandlers['new-message'].size === 0) {
        console.warn('[socketService WARNING] No persistent handlers registered for new-message events!');
      }
      
      // Convert to array for more reliable iteration
      Array.from(this.persistentHandlers['new-message']).forEach(handler => {
        try {
          console.log('[socketService DEBUG] Calling persistent handler...');
          handler(message);
          console.log('[socketService DEBUG] Successfully called persistent handler');
        } catch (error) {
          console.error('[socketService ERROR] Error in persistent handler:', error);
        }
      });
    };
    
    if (this._socket) {
      console.log('[socketService DEBUG] Registering global message handler with socket');
      this._socket.on('new-message', this.globalMessageHandler);
      
      // Also register for generic 'message' event as fallback
      this._socket.on('message', (data) => {
        console.log('[socketService DEBUG] Received generic "message" event:', data);
        // Route to the global handler
        if (this.globalMessageHandler && data) {
          this.globalMessageHandler(data);
        }
      });
    } else {
      console.warn('[socketService WARNING] Cannot set up global message handler - Socket not initialized.');
    }
  }

  subscribeToThread(threadId, callback) {
    if (!threadId || typeof callback !== 'function') {
      console.error('[socketService] Invalid subscribeToThread call: Missing threadId or callback.', { threadId, callbackType: typeof callback });
      return false;
    }

    console.log(`[socketService] subscribeToThread: Storing subscription callback for threadId: ${threadId}. Callback function details:`, callback.toString().substring(0,100) + '...');
    this.threadSubscriptions.set(threadId, callback);
    console.log('[socketService] subscribeToThread: Current threadSubscriptions after add:', Array.from(this.threadSubscriptions.keys()));

    // Ensure socket is connected, attempt to connect if not.
    if (!this._socket?.connected) {
      console.warn('[socketService] subscribeToThread: Socket not connected for thread ', threadId, '. Attempting connect. Join will occur on successful connection via \'connect\' event handler.');
      // If connect() is called, the 'connect' handler will iterate threadSubscriptions and join.
      // Avoid emitting join-thread here if we are not sure about the connection status yet.
      if (!this.isReconnecting && (!this._socket || !this._socket.connecting)) {
        this.connect(); 
      }
    } else {
      // If already connected, explicitly join the thread room.
      console.log(`[socketService] subscribeToThread: Socket already connected. Emitting 'join-thread' for threadId: ${threadId}`);
      this.emitEvent('join-thread', threadId);
    }
    
    // Ensure global handler is set up if socket is already connected here
    // (connect() also calls this, but this is a safeguard if connect() was called earlier)
    if (this._socket?.connected && !this.globalMessageHandler) {
      console.warn('[socketService] Global message handler was not set. Setting up now in subscribeToThread.');
      this.setupGlobalMessageHandler();
    }
    
    return true;
  }

  unsubscribeFromThread(threadId) {
    if (!threadId) {
        console.warn('[socketService] Unsubscribe called with no threadId.');
        return;
    }
    
    try {
      console.log(`[socketService] Removing subscription callback for threadId: ${threadId}`);
      this.threadSubscriptions.delete(threadId);
  
      // Leave the thread room if socket is connected
      if (this.isSocketConnected()) {
        console.log(`[socketService] Emitting 'leave-thread' for threadId: ${threadId}`);
        this.emitEvent('leave-thread', threadId);
      } else {
        console.log(`[socketService] Socket not connected, skipping leave-thread event for: ${threadId}`);
      }
      
      // Note: We don't remove the global new-message handler here,
      // as it's shared. It's removed/re-added if the socket reconnects.
      // If no subscriptions remain, the global handler will simply find no callback.
      console.log(`[socketService] Unsubscribed from thread: ${threadId}`);
    } catch (error) {
      console.error(`[socketService] Error in unsubscribeFromThread for ${threadId}:`, error);
    }
  }

  sendMessage(threadId, message) {
    if (!this._socket || !this.connected) {
      console.log(`Queuing message for thread ${threadId} (socket not connected)`);
      this.messageQueue.push({ threadId, message });
      return Promise.reject(new Error('Socket not connected. Message queued.'));
    }

    // Validate message format
    if (!message.content) {
      return Promise.reject(new Error('Message content is required'));
    }

    // Prepare the message format for socket emission
    const messageData = {
      threadId,
      content: message.content,
      messageType: message.messageType || 'text',
      replyToId: message.replyToId || null // Support for threaded replies
    };

    // Add file data if present
    if (message.file) {
      messageData.file = message.file;
      messageData.messageType = 'file';
    }

    console.log(`Sending message to thread ${threadId}:`, messageData);
    this._socket.emit('send-message', {
      threadId,
      message: messageData
    });

    return Promise.resolve();
  }

  processMessageQueue() {
    if (!this.connected || this.messageQueue.length === 0) return;
    
    console.log(`Processing message queue. ${this.messageQueue.length} items to process`);
    
    // Process queue in order (FIFO)
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    
    // Also check localStorage for any queued messages
    try {
      const queueKey = 'message_queue';
      const storedQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
      if (storedQueue.length > 0) {
        queue.push(...storedQueue);
        localStorage.setItem(queueKey, '[]'); // Clear storage queue
      }
    } catch (err) {
      console.error('Error retrieving message queue from localStorage:', err);
    }
    
    // Process all queued items
    queue.forEach(item => {
      switch (item.type) {
        case 'send-message':
          console.log('Sending queued message:', item.message.content);
          this.sendMessage(item.threadId, item.message);
          break;
        case 'join-thread':
          console.log('Joining queued thread:', item.threadId);
          this.subscribeToThread(item.threadId, item.callback);
          break;
        case 'mark-thread-read':
          console.log('Marking queued thread as read:', item.threadId);
          this.markThreadRead(item.threadId);
          break;
        default:
          console.warn('Unknown queued item type:', item.type);
      }
    });
  }

  markThreadRead(threadId) {
    if (!threadId) return;
    
    if (this.connected) {
      console.log('Marking thread as read:', threadId);
      this._socket.emit('mark-thread-read', threadId);
    } else {
      console.warn('Cannot mark thread read: Socket not connected, queueing');
      this.messageQueue.push({
        type: 'mark-thread-read',
        threadId: threadId
      });
    }
  }

  sendTyping(threadId) {
    if (!threadId) return;
    
    if (this.connected) {
      this._socket.emit('typing', threadId);
    } else {
      console.warn('Cannot send typing: Socket not connected');
    }
  }

  sendTypingStopped(threadId) {
    if (!threadId) return;
    
    if (this.connected) {
      this._socket.emit('typing-stopped', threadId);
    } else {
      console.warn('Cannot send typing stopped: Socket not connected');
    }
  }

  registerListener(event, callback) {
    if (!this._socket) {
      console.warn(`Cannot register listener for '${event}': Socket not initialized`);
      return;
    }
    
    console.log(`[socketService] registerListener: Registering raw listener for event: ${event}. Callback:`, callback.toString().substring(0,100)+'...');
    
    // Store callback in our listeners map with a Set for consistency
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    // Make sure we're working with a Set
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || typeof eventListeners.add !== 'function') {
      console.error(`[socketService] Event listeners for '${event}' is not a proper Set. Resetting.`);
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    // Wrap callback to catch errors
    const wrappedCallback = (data) => {
      try {
        console.log(`[socketService] registerListener: Event '${event}' received by wrappedCallback. Data:`, data ? JSON.parse(JSON.stringify(data)) : 'undefined data');
        callback(data);
        console.log(`[socketService] registerListener: Event '${event}' callback executed successfully.`);
      } catch (error) {
        console.error(`[socketService] registerListener: Error in ${event} listener wrapper:`, error);
      }
    };
    
    // Store the wrapped version with the original
    callback._wrapped = wrappedCallback;
    
    this._socket.on(event, wrappedCallback);
  }

  onNewMessage(callback) {
    console.log('[socketService] onNewMessage: Registering listener for \'new-message\' (direct). Callback:', callback.toString().substring(0,100)+'...');
    this.registerListener('new-message', (data) => {
      console.log('[socketService] \'new-message\' EVENT RECEIVED (via onNewMessage method). Data:', data ? JSON.parse(JSON.stringify(data)) : 'undefined data');
      
      // Check if message is from current user - if so, update any optimistic UI data
      const currentUserId = getCurrentUserId();
      if (data.sender && data.sender._id === currentUserId) {
        console.log('Message is from current user, updating optimistic UI data');
      }
      
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
      
      // Pass the message to the callback
      callback(data);
    });
  }

  onMessageNotification(callback) {
    console.log('[socketService] onMessageNotification: Registering listener for \'message-notification\'. Callback:', callback.toString().substring(0,100)+'...');
    
    // NEW - Add to persistent handlers
    if (!this.persistentHandlers['message-notification'].has(callback)) {
      console.log('[socketService] Adding callback to PERSISTENT message-notification handlers. Current count:', this.persistentHandlers['message-notification'].size);
      this.persistentHandlers['message-notification'].add(callback);
    }
    
    // Still register normally for backward compatibility
    this.registerListener('message-notification', (data) => {
      console.log('[socketService] \'message-notification\' EVENT RECEIVED. Data:', data ? JSON.parse(JSON.stringify(data)) : 'undefined data', 'Calling provided callback.');
      
      // Store for debugging
      if (data && data.threadId) {
        this.lastReceivedMessages[data.threadId] = {
          type: 'message-notification',
          data: data,
          timestamp: new Date().toISOString()
        };
      }
      
      // Call the callback that's registered with this specific listener
      callback(data);
      
      // NEW - also call all persistent handlers
      console.log('[socketService] Calling PERSISTENT message-notification handlers. Count:', this.persistentHandlers['message-notification'].size);
      this.persistentHandlers['message-notification'].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('[socketService] Error in persistent message-notification handler:', error);
        }
      });
    });
  }

  onInvitationNotification(callback) {
    this.registerListener('invitation-notification', (data) => {
      console.log('Received invitation-notification event:', data);
      callback(data);
    });
  }

  onThreadRead(callback) {
    this.registerListener('thread-read', callback);
  }

  onTyping(callback) {
    this.registerListener('typing', callback);
  }

  onTypingStopped(callback) {
    this.registerListener('typing-stopped', callback);
  }

  removeListener(event, callback) {
    if (!this._socket) {
      console.warn(`Cannot remove listener for '${event}': Socket not initialized`);
      return;
    }
    
    console.log('Removing listener for event:', event, 'Callback:', callback ? callback.toString().substring(0,100)+'...' : 'ALL');
    
    // Remove from our internal tracking
    if (this.listeners.has(event)) {
      if (callback) {
        // Remove specific callback from Set
        const eventListeners = this.listeners.get(event);
        if (eventListeners && typeof eventListeners.delete === 'function') {
          eventListeners.delete(callback);
          console.log(`[socketService] Removed specific callback from internal tracking for '${event}'`);
        } else {
          console.warn(`[socketService] Could not remove callback - listeners for '${event}' is not a proper Set`);
        }
      } else {
        // Remove all callbacks for this event
        this.listeners.delete(event);
        console.log(`[socketService] Removed all callbacks from internal tracking for '${event}'`);
      }
    }
    
    // NEW - Do NOT remove from persistentHandlers here to maintain stability.
    // Persistent handlers should remain across component lifecycles.
    
    try {
      // Remove from socket
      if (callback) {
        // If we have a wrapped version of this callback, use that
        if (callback._wrapped) {
          this._socket.off(event, callback._wrapped);
        } else {
          this._socket.off(event, callback);
        }
        console.log(`[socketService] Removed specific callback from socket.io for '${event}'`);
      } else {
        // Remove all listeners for this event
        this._socket.removeAllListeners(event);
        console.log(`[socketService] Removed all callbacks from socket.io for '${event}'`);
      }
    } catch (error) {
      console.error(`[socketService] Error removing listener for '${event}':`, error);
    }
  }

  disconnect() {
    console.log('Disconnecting socket');
    
    if (this._socket) {
      // Clear all listeners
      this._socket.removeAllListeners();
      this._socket.disconnect();
      this._socket = null;
    }
    
    this.connected = false;
    this.isReconnecting = false;
    this.threadSubscriptions.clear();
    
    // Don't clear message queue - keep for reconnection
  }
  
  isSocketConnected() {
    return this.connected && !!this._socket;
  }
  
  getConnectionStatus() {
    return {
      isConnected: this.connected,
      isReconnecting: this.isReconnecting,
      connectionAttempts: this.connectionAttempts,
      queuedMessages: this.messageQueue.length
    };
  }

  // Add a public getter for the socket
  getSocket() {
    return this._socket;
  }

  // Add this method to safely access socket methods
  emitEvent(eventName, data) {
    if (!this._socket || !this.connected) {
      console.warn(`[socketService] emitEvent: Cannot emit ${eventName}: Socket not connected. Socket instance exists: ${!!this._socket}, Connected state: ${this.connected}, Reconnecting: ${this.isReconnecting}`);
      return false;
    }
    console.log(`[socketService] emitEvent: Emitting '${eventName}' with data:`, data);
    this._socket.emit(eventName, data);
    return true;
  }

  // NEW - Debug method to check for any received messages for a given thread
  getLastReceivedMessage(threadId) {
    return this.lastReceivedMessages[threadId] || null;
  }

  // NEW - Force direct message display for a thread
  forceMessageUpdate(threadId) {
    console.log(`[socketService] Force update requested for thread: ${threadId}`);
    const lastMsg = this.lastReceivedMessages[threadId];
    if (lastMsg) {
      console.log(`[socketService] Found last message for thread ${threadId}, forcing update with:`, lastMsg.data);
      
      // Attempt to route through normal channels first
      const callback = this.threadSubscriptions.get(threadId);
      if (callback) {
        try {
          callback(lastMsg.data);
          console.log(`[socketService] Force update: successfully called subscription callback for thread ${threadId}`);
          return true;
        } catch (error) {
          console.error(`[socketService] Force update: error calling subscription callback for thread ${threadId}:`, error);
        }
      }
      
      // Fall back to persistent handlers
      this.persistentHandlers['new-message'].forEach(handler => {
        try {
          handler(lastMsg.data);
        } catch (error) {
          console.error('[socketService] Force update: Error in persistent new-message handler:', error);
        }
      });
      
      return true;
    }
    console.log(`[socketService] No last message found for thread ${threadId}`);
    return false;
  }

  /**
   * Register an event listener with simplified syntax
   * @param {string} event - The event name to listen for
   * @param {Function} callback - The callback function
   */
  on(event, callback) {
    if (!this._socket) {
      console.error(`[socketService] Cannot register event handler: Socket is not initialized. Event: ${event}`);
      
      // Initialize socket if possible and then register
      const token = getAuthToken();
      if (token && ['new-message', 'message-notification', 'connect'].includes(event)) {
        console.log(`[socketService] Attempting to connect socket before registering '${event}' event`);
        this.connect();
        // Schedule registration after connection attempt
        setTimeout(() => {
          if (this._socket) {
            this._registerEvent(event, callback);
          }
        }, 1000);
      }
      
      return;
    }
    
    this._registerEvent(event, callback);
  }
  
  _registerEvent(event, callback) {
    // Store callback in our listeners map for reference and cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    // Make sure we're working with a Set that has an add method
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || typeof eventListeners.add !== 'function') {
      console.error(`[socketService] Event listeners for '${event}' is not a proper Set. Resetting.`);
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    // For persistent event types, also store in persistent handlers
    if (this.persistentHandlers[event]) {
      console.log(`[socketService] Adding to PERSISTENT handlers for '${event}'`);
      this.persistentHandlers[event].add(callback);
    }
    
    // Wrap callback to catch errors and provide debugging
    const wrappedCallback = (data) => {
      try {
        console.log(`[socketService] Event '${event}' received with data:`, 
          data ? JSON.stringify(data).substring(0, 200) + (JSON.stringify(data).length > 200 ? '...' : '') : 'undefined');
        callback(data);
      } catch (error) {
        console.error(`[socketService] Error in '${event}' event handler:`, error);
      }
    };
    
    // Store the wrapped version with the original
    callback._wrapped = wrappedCallback;
    
    // Add the event listener
    this._socket.on(event, wrappedCallback);
    console.log(`[socketService] Successfully registered handler for event: ${event}`);
  }

  /**
   * Remove an event listener
   * @param {string} event - The event name
   * @param {Function} [callback] - The callback function (optional - if not provided, removes all listeners for this event)
   */
  off(event, callback) {
    console.log(`[socketService] Removing listener for '${event}'`, callback ? 'with specific callback' : 'all callbacks');
    
    if (!this._socket) {
      console.warn(`[socketService] Cannot remove listener: Socket not initialized`);
      return;
    }
    
    const eventListeners = this.listeners.get(event);
    
    if (!eventListeners) {
      console.warn(`[socketService] No listeners registered for event '${event}'`);
      return;
    }
    
    if (callback) {
      // Since eventListeners is a Set, not a Map, we don't need to call get()
      // Instead, just check if the callback exists in the Set
      if (eventListeners.has(callback)) {
        // For Socket.io, we need to use the wrapped version of the callback
        if (callback._wrapped) {
          this._socket.off(event, callback._wrapped);
        } else {
          this._socket.off(event, callback);
        }
        eventListeners.delete(callback);
        console.log(`[socketService] Removed specific listener for '${event}'`);
      } else {
        console.warn(`[socketService] Callback not found for event '${event}'`);
      }
    } else {
      // Remove all callbacks for this event
      eventListeners.forEach((cb) => {
        // Try to remove both the callback and its wrapped version
        this._socket.off(event, cb);
        if (cb._wrapped) {
          this._socket.off(event, cb._wrapped);
        }
      });
      eventListeners.clear();
      console.log(`[socketService] Removed all listeners for '${event}'`);
    }
    
    // Clean up empty sets
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

// Add a getter for direct socket access with a warning
Object.defineProperty(socketService, 'socket', {
  get: function() {
    // Access the internal _socket property safely
    return this.getSocket();
  },
  enumerable: true,
  configurable: false
});

export default socketService; 