import { io } from 'socket.io-client';
import { getAuthToken, getCurrentUserId } from '../utils/authUtils';
import { getApiBaseUrl, getSocketUrl } from '../utils/apiConfig';

class SocketService {
  constructor() {
    this._socket = null;
    this.connected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.reconnectionDelay = 1000;
    this.messageQueue = []; // Queue for storing messages when offline
    this.isReconnecting = false;
    
    // PERFORMANCE: Simplified event handlers for immediate processing
    this.eventHandlers = new Map();
    
    // PERFORMANCE: Direct message callbacks for zero-delay processing
    this.onMessageCallback = null;
    this.onNotificationCallback = null;
    
    // PERFORMANCE: Message deduplication cache (lightweight)
    this.messageCache = new Set();
    this.cacheCleanupInterval = null;
    
    // OPTIMIZATION: Connection health monitoring for smart polling
    this.connectionHealth = {
      lastHeartbeat: Date.now(),
      missedHeartbeats: 0,
      lastMessageReceived: Date.now(),
      isStable: true,
      connectionDrops: 0
    };
    this.heartbeatInterval = null;
    
    // CRITICAL: Restore persistentHandlers for MessageProvider compatibility
    this.persistentHandlers = {
      'new-message': new Set(),
      'message-notification': new Set(),
      'typing': new Set(),
      'typing-stopped': new Set()
    };
  }

  get socket() {
    return this._socket;
  }

  connect(token = null) {
    if (this._socket?.connected) {
      console.log('[socketService] Already connected');
      return Promise.resolve();
    }

    // PERFORMANCE: Start cache cleanup if not running
    if (!this.cacheCleanupInterval) {
      this.cacheCleanupInterval = setInterval(() => {
        this.messageCache.clear(); // Clear cache every 30 seconds
      }, 30000);
    }

    return new Promise((resolve, reject) => {
      try {
        const authToken = token || getAuthToken();
        if (!authToken) {
          console.error('[socketService] No auth token available');
          return reject(new Error('No authentication token'));
        }

        const socketUrl = getSocketUrl();
        console.log(`[socketService] Connecting to: ${socketUrl}`);

        this._socket = io(socketUrl, {
          auth: { token: authToken },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          forceNew: false
        });

        this._socket.on('connect', () => {
          console.log('[socketService] Connected successfully');
          this.connected = true;
          this.connectionAttempts = 0;
          this.isReconnecting = false;
          
          // OPTIMIZATION: Reset connection health on successful connection
          this.connectionHealth.lastHeartbeat = Date.now();
          this.connectionHealth.missedHeartbeats = 0;
          this.connectionHealth.isStable = true;
          this.connectionHealth.lastMessageReceived = Date.now();
          
          // Process queued messages immediately
          this.processMessageQueue();
          resolve();
        });

        this._socket.on('disconnect', (reason) => {
          console.log('[socketService] Disconnected:', reason);
          this.connected = false;
          
          // OPTIMIZATION: Track connection drops for health monitoring
          this.connectionHealth.connectionDrops++;
          this.connectionHealth.isStable = false;
          
          if (this.eventHandlers.has('disconnect')) {
            this.eventHandlers.get('disconnect').forEach(handler => handler(reason));
          }
        });

        this._socket.on('connect_error', (error) => {
          console.error('[socketService] Connection error:', error);
          this.connected = false;
          this.connectionAttempts++;
          
          if (this.connectionAttempts >= this.maxConnectionAttempts) {
            reject(new Error('Max connection attempts reached'));
          }
        });

        // CRITICAL: Direct event handlers + persistentHandlers compatibility
        this._socket.on('new-message', (message) => {
          console.log('[socketService] new-message received:', message);
          this.handleIncomingMessage(message);
          // CRITICAL: Trigger persistentHandlers for MessageProvider
          this.persistentHandlers['new-message'].forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('[socketService] PersistentHandler error:', error);
            }
          });
        });

        // OPTIMIZATION: Listen for thread-joined confirmation
        this._socket.on('thread-joined', (data) => {
          console.log('[socketService] Successfully joined thread room:', data);
          this.connectionHealth.lastHeartbeat = Date.now();
          this.connectionHealth.isStable = true;
        });

        // OPTIMIZATION: Add ping/pong heartbeat for connection health
        this._socket.on('ping', () => {
          this._socket.emit('pong');
          this.connectionHealth.lastHeartbeat = Date.now();
          this.connectionHealth.missedHeartbeats = 0;
        });

        this._socket.on('pong', () => {
          this.connectionHealth.lastHeartbeat = Date.now();
          this.connectionHealth.missedHeartbeats = 0;
        });

        // OPTIMIZATION: Handle typing events
        this._socket.on('user-typing', (data) => {
          console.log('[socketService] User typing:', data);
          if (this.eventHandlers.has('typing')) {
            this.eventHandlers.get('typing').forEach(handler => handler(data));
          }
        });

        this._socket.on('user-typing-stopped', (data) => {
          console.log('[socketService] User stopped typing:', data);
          if (this.eventHandlers.has('typing-stopped')) {
            this.eventHandlers.get('typing-stopped').forEach(handler => handler(data));
          }
        });

        // DEBUGGING: Log any socket events we're not handling
        this._socket.onAny((eventName, ...args) => {
          if (!['connect', 'disconnect', 'new-message', 'message-notification', 'thread-joined', 'ping', 'pong', 'user-typing', 'user-typing-stopped', 'user-joined-thread'].includes(eventName)) {
            console.log(`[socketService] Unhandled socket event '${eventName}':`, args);
          }
        });

        this._socket.on('direct-message', (message) => {
          console.log('[socketService] direct-message received:', message);
          this.handleIncomingMessage(message);
        });

        this._socket.on('message-notification', (notification) => {
          console.log('[socketService] message-notification received:', notification);
          this.handleIncomingNotification(notification);
          // CRITICAL: Trigger persistentHandlers
          this.persistentHandlers['message-notification'].forEach(handler => {
            try {
              handler(notification);
            } catch (error) {
              console.error('[socketService] PersistentHandler error:', error);
            }
          });
        });

        this._socket.on('invitation-notification', (notification) => {
          console.log('[socketService] invitation-notification received:', notification);
          if (this.eventHandlers.has('invitation-notification')) {
            this.eventHandlers.get('invitation-notification').forEach(handler => handler(notification));
          }
        });

        this._socket.on('typing', (data) => {
          console.log('[socketService] typing received:', data);
          if (this.eventHandlers.has('typing')) {
            this.eventHandlers.get('typing').forEach(handler => handler(data));
          }
        });

        this._socket.on('typing-stopped', (data) => {
          console.log('[socketService] typing-stopped received:', data);
          if (this.eventHandlers.has('typing-stopped')) {
            this.eventHandlers.get('typing-stopped').forEach(handler => handler(data));
          }
        });

        this._socket.on('thread-read', (data) => {
          console.log('[socketService] thread-read received:', data);
          if (this.eventHandlers.has('thread-read')) {
            this.eventHandlers.get('thread-read').forEach(handler => handler(data));
          }
        });

      } catch (error) {
        console.error('[socketService] Connection setup error:', error);
        reject(error);
      }
    });
  }

  // PERFORMANCE: Ultra-fast message processing with deduplication
  handleIncomingMessage(message) {
    if (!message || !message._id) return;
    
    // OPTIMIZATION: Update connection health when receiving messages
    this.connectionHealth.lastMessageReceived = Date.now();
    this.connectionHealth.lastHeartbeat = Date.now();
    this.connectionHealth.missedHeartbeats = 0;
    this.connectionHealth.isStable = true;
    
    // PERFORMANCE: Lightweight deduplication check
    const messageKey = `${message._id}-${message.threadId}`;
    if (this.messageCache.has(messageKey)) {
      console.log('[socketService] Duplicate message ignored:', messageKey);
      return;
    }
    
    // Add to cache
    this.messageCache.add(messageKey);
    
    // PERFORMANCE: Immediate callback for zero-delay processing
    if (this.onMessageCallback) {
      this.onMessageCallback(message);
    }
    
    // PERFORMANCE: Direct event triggering (no loops)
    if (this.eventHandlers.has('new-message')) {
      this.eventHandlers.get('new-message').forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('[socketService] Handler error:', error);
        }
      });
    }
  }

  // OPTIMIZED: Direct notification processing
  handleIncomingNotification(notification) {
    if (!notification) return;
    
    // Immediate callback for real-time updates
    if (this.onNotificationCallback) {
      this.onNotificationCallback(notification);
    }
    
    // Trigger registered handlers
    if (this.eventHandlers.has('message-notification')) {
      this.eventHandlers.get('message-notification').forEach(handler => handler(notification));
    }
  }

  disconnect() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
      this.connected = false;
      console.log('[socketService] Disconnected');
    }
  }

  isSocketConnected() {
    return this._socket?.connected || false;
  }

  // SIMPLIFIED: Direct event registration
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
    
    console.log(`[socketService] Registered handler for '${event}'. Total handlers: ${this.eventHandlers.get(event).size}`);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
      if (this.eventHandlers.get(event).size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  // OPTIMIZED: Simple emit without complex queuing
  emitEvent(event, data) {
    if (this.isSocketConnected()) {
      this._socket.emit(event, data);
      console.log(`[socketService] Emitted '${event}':`, data);
    } else {
      console.warn(`[socketService] Cannot emit '${event}' - not connected`);
      if (event === 'send-message') {
        this.messageQueue.push({ event, data });
      }
    }
  }

  // SIMPLIFIED: Direct message sending
  sendMessage(threadId, messageData) {
    if (!this.isSocketConnected()) {
      console.warn('[socketService] Not connected, queuing message');
      this.messageQueue.push({ 
        event: 'send-message',
        data: { threadId, message: messageData }
      });
      return Promise.reject(new Error('Socket not connected'));
    }

    const payload = {
      threadId,
      message: {
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        replyToId: messageData.replyToId || null
      }
    };

    this._socket.emit('send-message', payload);
    console.log('[socketService] Message sent:', payload);
    return Promise.resolve();
  }

  // OPTIMIZED: Simple thread subscription
  subscribeToThread(threadId, callback) {
    console.log(`[socketService] Subscribing to thread: ${threadId}`);
    
    // Join the room
    this.emitEvent('join-thread', threadId);
    
    // Register callback for this specific thread
    this.on('new-message', (message) => {
      if (message.threadId === threadId) {
        callback(message);
      }
    });
  }

  unsubscribeFromThread(threadId) {
    console.log(`[socketService] Unsubscribing from thread: ${threadId}`);
    this.emitEvent('leave-thread', threadId);
  }

  // SIMPLIFIED: Direct callback registration for immediate processing
  onNewMessage(callback) {
    this.onMessageCallback = callback;
    this.on('new-message', callback);
  }

  onMessageNotification(callback) {
    this.onNotificationCallback = callback;
    this.on('message-notification', callback);
  }

  onInvitationNotification(callback) {
    this.on('invitation-notification', callback);
  }

  onTyping(callback) {
    this.on('typing', callback);
  }

  onTypingStopped(callback) {
    this.on('typing-stopped', callback);
  }

  onThreadRead(callback) {
    this.on('thread-read', callback);
  }

  // Emit typing events
  emitTyping(threadId) {
    this.emitEvent('typing', threadId);
  }

  emitTypingStopped(threadId) {
    this.emitEvent('typing-stopped', threadId);
  }

  // Alternative method names for typing (used in some components)
  sendTyping(threadId) {
    this.emitTyping(threadId);
  }

  sendTypingStopped(threadId) {
    this.emitTypingStopped(threadId);
  }

  // Thread management methods
  joinThread(threadId) {
    this.emitEvent('join-thread', threadId);
  }

  leaveThread(threadId) {
    this.emitEvent('leave-thread', threadId);
  }

  markThreadRead(threadId) {
    this.emitEvent('mark-thread-read', threadId);
  }

  // Utility methods (stubs for now)
  getLastReceivedMessage(threadId) {
    // This method might need to be implemented based on specific requirements
    console.log('[socketService] getLastReceivedMessage called for thread:', threadId);
    return null;
  }

  forceMessageUpdate(threadId) {
    // This method might need to be implemented based on specific requirements
    console.log('[socketService] forceMessageUpdate called for thread:', threadId);
    this.emitEvent('request-thread-update', threadId);
  }

  // Remove specific listeners
  removeListener(event, handler) {
    this.off(event, handler);
  }

  // Process queued messages when connection is restored
  processMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`[socketService] Processing ${this.messageQueue.length} queued messages`);
      const queue = [...this.messageQueue];
      this.messageQueue = [];
      
      queue.forEach(({ event, data }) => {
        this.emitEvent(event, data);
      });
    }
  }

  // OPTIMIZATION: Check if socket has connection issues for smart polling
  hasConnectionIssues() {
    const now = Date.now();
    const timeSinceLastMessage = now - this.connectionHealth.lastMessageReceived;
    const timeSinceLastHeartbeat = now - this.connectionHealth.lastHeartbeat;
    
    // Consider connection unstable if:
    // 1. No messages received in last 2 minutes
    // 2. Multiple connection drops
    // 3. Socket reports disconnected
    const isStale = timeSinceLastMessage > 120000; // 2 minutes
    const hasMultipleDrops = this.connectionHealth.connectionDrops > 2;
    const isDisconnected = !this.isSocketConnected();
    
    const hasIssues = isStale || hasMultipleDrops || isDisconnected || !this.connectionHealth.isStable;
    
    if (hasIssues) {
      console.log('[socketService] Connection issues detected:', {
        isStale,
        hasMultipleDrops,
        isDisconnected,
        timeSinceLastMessage: timeSinceLastMessage / 1000,
        connectionDrops: this.connectionHealth.connectionDrops
      });
    }
    
    return hasIssues;
  }

  // Utility method to get connection status
  getConnectionStatus() {
    return {
      connected: this.connected,
      socketId: this._socket?.id,
      transport: this._socket?.io?.engine?.transport?.name,
      health: this.connectionHealth
    };
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService; 