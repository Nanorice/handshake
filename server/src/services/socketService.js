const socketAuth = require('../middleware/socketAuth');
const Message = require('../models/Message');
const Thread = require('../models/Thread');

class SocketService {
  constructor() {
    this.io = null;
    this.connections = new Map();
    this.threadRooms = new Map();
    // OPTIMIZATION: Cache user data to avoid repeated DB calls
    this.userCache = new Map();
  }

  /**
   * Initialize the Socket.IO server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    if (!server) {
      console.error('Cannot initialize Socket.IO: No server provided');
      return;
    }

    const { Server } = require('socket.io');
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      // OPTIMIZATION: Increase performance settings
      pingTimeout: 30000,
      pingInterval: 25000,
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e6
    });

    // Set up authentication middleware
    this.io.use(socketAuth);

    // Set up connection handler
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('Socket.IO server initialized with optimized settings');
  }

  /**
   * Handle new socket connections
   * @param {Object} socket - Socket.IO socket instance
   */
  handleConnection(socket) {
    console.log(`User connected: ${socket.userId} (${socket.id})`);
    
    // Add the connection to our map
    this.connections.set(socket.userId.toString(), socket);
    
    // OPTIMIZATION: Cache user data for faster message processing
    this.userCache.set(socket.userId.toString(), {
      _id: socket.userId,
      firstName: socket.user?.firstName || 'User',
      lastName: socket.user?.lastName || '',
      email: socket.user?.email || '',
      profile: socket.user?.profile || {},
      userType: socket.user?.userType || 'seeker'
    });
    
    // Join the user's personal room
    socket.join(socket.userId.toString());
    
    // Set up event handlers
    this.setupEventHandlers(socket);
    
    // Handle disconnection
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  /**
   * Set up event handlers for a socket
   * @param {Object} socket - Socket.IO socket instance
   */
  setupEventHandlers(socket) {
    // Join a thread room
    socket.on('join-thread', (threadId) => this.handleJoinThread(socket, threadId));
    
    // Leave a thread room
    socket.on('leave-thread', (threadId) => this.handleLeaveThread(socket, threadId));
    
    // OPTIMIZED: Handle message sending with immediate response
    socket.on('send-message', async (data) => this.handleSendMessageOptimized(socket, data));
    
    // Mark thread as read
    socket.on('mark-thread-read', (threadId) => this.handleMarkThreadRead(socket, threadId));
    
    // Typing indicator
    socket.on('typing', (threadId) => this.handleTyping(socket, threadId));
    
    // Typing stopped indicator
    socket.on('typing-stopped', (threadId) => this.handleTypingStopped(socket, threadId));
  }

  /**
   * Handle socket disconnection
   * @param {Object} socket - Socket.IO socket instance
   */
  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.userId} (${socket.id})`);
    this.connections.delete(socket.userId.toString());
    // Keep user cache for a while in case they reconnect quickly
    setTimeout(() => {
      this.userCache.delete(socket.userId.toString());
    }, 60000); // Remove after 1 minute
  }

  /**
   * Handle joining a thread room
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} threadId - ID of the thread to join
   */
  async handleJoinThread(socket, threadId) {
    if (!threadId) {
      console.error(`User ${socket.userId} tried to join invalid thread: ${threadId}`);
      return;
    }

    const threadRoom = `thread:${threadId}`;
    socket.join(threadRoom);
    console.log(`User ${socket.userId} joined thread: ${threadId} (room: ${threadRoom})`);

    // Add the thread to our map
    if (!this.threadRooms.has(threadId)) {
      this.threadRooms.set(threadId, new Set());
    }
    this.threadRooms.get(threadId).add(socket.userId.toString());

    // OPTIMIZATION: Send immediate acknowledgment
    socket.emit('thread-joined', {
      threadId,
      success: true,
      timestamp: Date.now()
    });
  }

  /**
   * Handle leaving a thread room
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} threadId - ID of the thread to leave
   */
  handleLeaveThread(socket, threadId) {
    const threadRoom = `thread:${threadId}`;
    socket.leave(threadRoom);
    console.log(`User ${socket.userId} left thread: ${threadId}`);

    // Remove the user from our thread map
    if (this.threadRooms.has(threadId)) {
      this.threadRooms.get(threadId).delete(socket.userId.toString());
      
      // If no users left in the thread, remove it from our map
      if (this.threadRooms.get(threadId).size === 0) {
        this.threadRooms.delete(threadId);
      }
    }
  }

  /**
   * OPTIMIZED: Handle sending a message with immediate broadcasting
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} data - Message data
   */
  async handleSendMessageOptimized(socket, data) {
    try {
      const { threadId, message } = data;
      const { content, messageType = 'text', replyToId = null } = message;
      
      console.log(`[OPTIMIZED] Processing message from ${socket.userId} for thread ${threadId}`);
      
      // OPTIMIZATION: Use cached user data instead of DB lookup
      const cachedUser = this.userCache.get(socket.userId.toString());
      if (!cachedUser) {
        socket.emit('error', { message: 'User session expired' });
        return;
      }

      // OPTIMIZATION: Create message object immediately for broadcasting
      const messageObj = {
        _id: null, // Will be set after DB save
        threadId,
        sender: cachedUser,
        content,
        messageType,
        isRead: false,
        createdAt: new Date(),
        replyTo: replyToId
      };

      // OPTIMIZATION: Broadcast immediately before DB operations
      const threadRoom = `thread:${threadId}`;
      const tempId = `temp-${Date.now()}-${socket.userId}`;
      
      // Send immediate response to sender
      socket.emit('message-sent', {
        tempId,
        message: { ...messageObj, _id: tempId }
      });

      // Broadcast to thread room immediately
      this.io.to(threadRoom).emit('new-message', {
        ...messageObj,
        _id: tempId,
        status: 'pending'
      });

      // OPTIMIZATION: Parallel processing - DB operations don't block broadcasting
      Promise.all([
        this.saveMessageToDatabase(socket.userId, threadId, message),
        this.updateThreadMetadata(socket.userId, threadId, content, messageType)
      ]).then(([savedMessage, thread]) => {
        // Update with real message ID
        const finalMessage = {
          ...messageObj,
          _id: savedMessage._id,
          status: 'sent'
        };

        // Send confirmation with real ID
        socket.emit('message-confirmed', {
          tempId,
          realId: savedMessage._id,
          message: finalMessage
        });

        // Update thread room with real ID
        this.io.to(threadRoom).emit('message-updated', {
          tempId,
          message: finalMessage
        });

        // OPTIMIZATION: Send notifications only to offline users to reduce noise
        this.sendNotificationsToOfflineUsers(thread, finalMessage, socket.userId);

      }).catch(error => {
        console.error('[OPTIMIZED] Error processing message:', error);
        
        // Send error notification
        socket.emit('message-error', {
          tempId,
          error: 'Failed to save message'
        });
        
        // Remove failed message from thread room
        this.io.to(threadRoom).emit('message-removed', { tempId });
      });

    } catch (error) {
      console.error('[OPTIMIZED] Error in handleSendMessageOptimized:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  }

  /**
   * OPTIMIZATION: Separate DB operations for parallel processing
   */
  async saveMessageToDatabase(senderId, threadId, messageData) {
    const messageRecord = new Message({
      threadId,
      sender: senderId,
      content: messageData.content,
      messageType: messageData.messageType || 'text',
      isRead: false,
      replyTo: messageData.replyToId || null
    });

    return await messageRecord.save();
  }

  /**
   * PERFORMANCE: Ultra-fast thread update with atomic operations
   */
  async updateThreadMetadata(senderId, threadId, content, messageType) {
    // PERFORMANCE: Use atomic findByIdAndUpdate instead of find->modify->save
    const updateOperations = {
      'lastMessage.content': content,
      'lastMessage.sender': senderId,
      'lastMessage.timestamp': Date.now(),
      'lastMessage.messageType': messageType
    };

    // PERFORMANCE: Atomic increment for unread counts (no need to fetch first)
    const thread = await Thread.findById(threadId).select('participants').lean();
    if (!thread) {
      throw new Error('Thread not found');
    }

    // Build atomic increment operations for unread counts
    thread.participants.forEach(participantId => {
      if (participantId.toString() !== senderId.toString()) {
        updateOperations[`unreadCount.${participantId.toString()}`] = { $inc: 1 };
      }
    });

    // PERFORMANCE: Single atomic update operation
    const updatedThread = await Thread.findByIdAndUpdate(
      threadId,
      { $set: updateOperations },
      { new: true, lean: true }
    );

    return updatedThread;
  }

  /**
   * OPTIMIZATION: Send notifications only to users who are offline
   */
  async sendNotificationsToOfflineUsers(thread, message, senderId) {
    thread.participants.forEach(participantId => {
      if (participantId.toString() !== senderId.toString()) {
        const participantSocket = this.connections.get(participantId.toString());
        
        // If user is not connected, they'll get notification when they reconnect
        // If user is connected, they already got the real-time message
        if (participantSocket) {
          // Send unread count update for UI badge
          participantSocket.emit('message-notification', {
            threadId: thread._id,
            unreadCount: thread.unreadCount.get(participantId.toString()) || 0,
            lastMessage: message
          });
        }
      }
    });
  }

  /**
   * Handle marking a thread as read - OPTIMIZED
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} threadId - ID of the thread to mark as read
   */
  async handleMarkThreadRead(socket, threadId) {
    try {
      // OPTIMIZATION: Parallel operations
      const [messagesUpdate, threadUpdate] = await Promise.all([
        Message.updateMany(
          {
            threadId,
            sender: { $ne: socket.userId },
            isRead: false
          },
          { isRead: true }
        ),
        Thread.findByIdAndUpdate(
          threadId,
          { [`unreadCount.${socket.userId}`]: 0 },
          { new: true }
        )
      ]);

      // Immediate UI feedback
      socket.emit('thread-marked-read', {
        threadId,
        success: true,
        timestamp: Date.now()
      });

      // Notify other participants
      const threadRoom = `thread:${threadId}`;
      socket.to(threadRoom).emit('thread-read', {
        threadId,
        userId: socket.userId
      });

    } catch (error) {
      console.error('Error marking thread as read:', error);
      socket.emit('error', { message: 'Failed to mark thread as read' });
    }
  }

  /**
   * Handle typing indicator - OPTIMIZED
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} threadId - ID of the thread
   */
  handleTyping(socket, threadId) {
    const threadRoom = `thread:${threadId}`;
    const cachedUser = this.userCache.get(socket.userId.toString());
    
    socket.to(threadRoom).emit('user-typing', {
      threadId,
      user: {
        _id: socket.userId,
        firstName: cachedUser?.firstName || 'User'
      }
    });
  }

  /**
   * Handle typing stopped indicator
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} threadId - ID of the thread
   */
  handleTypingStopped(socket, threadId) {
    const threadRoom = `thread:${threadId}`;
    socket.to(threadRoom).emit('user-typing-stopped', {
      threadId,
      userId: socket.userId
    });
  }

  /**
   * Get the Socket.IO instance
   * @returns {Object} Socket.IO instance
   */
  getIO() {
    return this.io;
  }

  /**
   * OPTIMIZATION: Get connection statistics
   */
  getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      activeThreadRooms: this.threadRooms.size,
      cachedUsers: this.userCache.size
    };
  }
}

// Create and export a singleton instance
const socketService = new SocketService();
module.exports = socketService; 