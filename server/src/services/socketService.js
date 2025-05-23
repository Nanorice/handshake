const socketAuth = require('../middleware/socketAuth');
const Message = require('../models/Message');
const Thread = require('../models/Thread');

class SocketService {
  constructor() {
    this.io = null;
    this.connections = new Map();
    this.threadRooms = new Map();
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
      transports: ['websocket', 'polling']
    });

    // Set up authentication middleware
    this.io.use(socketAuth);

    // Set up connection handler
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('Socket.IO server initialized');
  }

  /**
   * Handle new socket connections
   * @param {Object} socket - Socket.IO socket instance
   */
  handleConnection(socket) {
    console.log(`User connected: ${socket.userId} (${socket.id})`);
    
    // Add the connection to our map
    this.connections.set(socket.userId.toString(), socket);
    
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
    
    // Send a message
    socket.on('send-message', async (data) => this.handleSendMessage(socket, data));
    
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

    // Emit thread joined event
    socket.emit('thread-joined', {
      threadId,
      success: true
    });

    // Emit to other participants that a user has joined
    socket.to(threadRoom).emit('user-joined-thread', {
      userId: socket.userId,
      threadId
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
   * Handle sending a message
   * @param {Object} socket - Socket.IO socket instance
   * @param {Object} data - Message data
   */
  async handleSendMessage(socket, data) {
    try {
      const { threadId, content, messageType = 'text', replyToId = null, file = null } = data;
      
      console.log(`Received message from ${socket.userId} for thread ${threadId}: ${content}`);
      
      // First, check if this is a valid thread that the user belongs to
      const thread = await Thread.findOne({
        _id: threadId,
        participants: socket.userId
      });
      
      if (!thread) {
        socket.emit('error', {
          message: 'Thread not found or you do not have access'
        });
        return;
      }
      
      // If it's a reply, verify the original message exists
      if (replyToId) {
        const originalMessage = await Message.findOne({
          _id: replyToId,
          threadId
        });
        
        if (!originalMessage) {
          socket.emit('error', {
            message: 'Original message not found or does not belong to this thread'
          });
          return;
        }
      }
      
      // Create the message
      const messageData = {
        threadId,
        sender: socket.userId,
        content,
        messageType,
        isRead: false
      };
      
      // Add reply reference if it's a reply
      if (replyToId) {
        messageData.replyTo = replyToId;
        messageData.messageType = 'reply';
      }
      
      // Add file data if it's a file attachment
      if (file && messageType === 'file') {
        messageData.file = file;
      }
      
      const message = new Message(messageData);
      await message.save();
      
      // Update the thread
      thread.lastMessage = {
        content,
        sender: socket.userId,
        timestamp: Date.now(),
        messageType: messageData.messageType
      };
      
      // Increment unread count for other participants
      thread.participants.forEach(participantId => {
        if (participantId.toString() !== socket.userId.toString()) {
          const currentCount = thread.unreadCount.get(participantId.toString()) || 0;
          thread.unreadCount.set(participantId.toString(), currentCount + 1);
        }
      });
      
      await thread.save();
      
      // Populate the message
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'firstName lastName email profile.profilePicture userType')
        .populate('replyTo');
      
      // Emit the message to the thread room
      const threadRoom = `thread:${threadId}`;
      this.io.to(threadRoom).emit('new-message', populatedMessage);
      
      // Also send notifications to each participant
      thread.participants.forEach(participantId => {
        if (participantId.toString() !== socket.userId.toString()) {
          this.io.to(participantId.toString()).emit('message-notification', {
            threadId,
            message: populatedMessage
          });
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', {
        message: 'Failed to send message'
      });
    }
  }

  /**
   * Handle marking a thread as read
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} threadId - ID of the thread to mark as read
   */
  async handleMarkThreadRead(socket, threadId) {
    try {
      // Update messages
      await Message.updateMany(
        {
          threadId,
          sender: { $ne: socket.userId },
          isRead: false
        },
        { isRead: true }
      );
      
      // Update thread unread count
      const thread = await Thread.findById(threadId);
      if (thread) {
        thread.unreadCount.set(socket.userId.toString(), 0);
        await thread.save();
        
        // Emit to the thread room
        const threadRoom = `thread:${threadId}`;
        this.io.to(threadRoom).emit('thread-read', {
          threadId,
          userId: socket.userId
        });
      }
    } catch (error) {
      console.error('Error marking thread as read:', error);
    }
  }

  /**
   * Handle typing indicator
   * @param {Object} socket - Socket.IO socket instance
   * @param {string} threadId - ID of the thread
   */
  handleTyping(socket, threadId) {
    const threadRoom = `thread:${threadId}`;
    socket.to(threadRoom).emit('user-typing', {
      threadId,
      user: {
        _id: socket.userId,
        firstName: socket.user.firstName
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
}

// Create and export a singleton instance
const socketService = new SocketService();
module.exports = socketService; 