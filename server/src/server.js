const mongoose = require('mongoose');
const http = require('http');
const socketService = require('./services/socketService');
const jwt = require('jsonwebtoken');
const app = require('./app');
const User = require('./models/User');
const Thread = require('./models/Thread');
const Message = require('./models/Message');
require('dotenv').config();

// Fix Mongoose strictQuery deprecation warning
mongoose.set('strictQuery', false);

// Force port to be 5000 to match the original configuration
const PORT = process.env.PORT || 5000;
console.log(`Configuring server to use port: ${PORT}`);

// Create HTTP server
const server = http.createServer(app);

// MongoDB connection with fallback options
const connectToMongoDB = async () => {
  const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  // Try multiple connection strings in order of preference
  const connectionStrings = [
    process.env.MONGODB_URI, // First try environment variable
    // If no env var, try Atlas connection since it was working with quick-start
    'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/handshake?retryWrites=true&w=majority&appName=Cluster0',
    'mongodb://localhost:27017/handshake', // Then try local MongoDB
    'mongodb://127.0.0.1:27017/handshake' // Alternative local address
  ].filter(Boolean); // Remove undefined values

  for (const connectionString of connectionStrings) {
    try {
      console.log(`Attempting to connect to MongoDB: ${connectionString.replace(/\/\/.*@/, '//***:***@')}`);
      await mongoose.connect(connectionString, mongoOptions);
      console.log('Successfully connected to MongoDB database');
      return true;
    } catch (error) {
      console.warn(`Failed to connect to ${connectionString.replace(/\/\/.*@/, '//***:***@')}: ${error.message}`);
      if (connectionString === connectionStrings[connectionStrings.length - 1]) {
        throw error; // Throw error only on the last attempt
      }
    }
  }
};

// Connect to MongoDB with proper error handling
connectToMongoDB()
  .then(() => {
    // Start server after DB connection - ensure we use the PORT variable
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to any MongoDB instance:', err.message);
    console.log('\n📋 To fix this issue, you can:');
    console.log('1. Install and run MongoDB locally: https://docs.mongodb.com/manual/installation/');
    console.log('2. Or update the MONGODB_URI environment variable with a valid connection string');
    console.log('3. Or ensure your IP is whitelisted if using MongoDB Atlas');
    process.exit(1);
  });

// Initialize Socket.io with the server, use the new socketService
socketService.initialize(server);

// Make socketService available to routes by attaching it to req.io
app.use((req, res, next) => {
  req.io = socketService.getIO();
  next();
});

// Socket.io connection handler
socketService.getIO().use(async (socket, next) => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth.token;
    
    console.log(`Socket auth attempt with token: ${token ? 'Token provided' : 'No token'}`);
    
    if (!token) {
      console.warn('Socket authentication failed: No token provided');
      return next(new Error('Authentication error: Token missing'));
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (tokenError) {
      console.error('Socket token verification error:', tokenError.message);
      return next(new Error('Authentication error: Invalid token'));
    }
    
    if (!decoded || !decoded.userId) {
      console.error('Socket token missing userId:', decoded);
      return next(new Error('Authentication error: Invalid token format'));
    }
    
    // Find user
    try {
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        console.error(`Socket auth user not found for ID: ${decoded.userId}`);
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.userId = user._id;
      socket.user = {
        _id: user._id,
        firstName: user.firstName || 'User',
        lastName: user.lastName || '',
        email: user.email,
        userType: user.userType,
        profile: user.profile || {}
      };
      
      console.log(`Socket authenticated for user: ${user._id} (${user.firstName} ${user.lastName}, type: ${user.userType})`);
      next();
    } catch (dbError) {
      console.error('Socket auth DB error:', dbError.message);
      return next(new Error('Authentication error: Database error'));
    }
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: ' + (error.message || 'Unknown error')));
  }
});

socketService.getIO().on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Join user to their private room
  socket.join(socket.userId.toString());
  
  // Handle joining specific thread rooms
  socket.on('join-thread', (threadId) => {
    if (!threadId) {
      console.error(`User ${socket.userId} tried to join invalid thread: ${threadId}`);
      return;
    }
    const threadRoom = `thread:${threadId.toString()}`;
    socket.join(threadRoom);
    console.log(`[SOCKET] User ${socket.userId} (socket ${socket.id}) joined thread: ${threadId} (room: ${threadRoom})`);
    
    // Emit confirmation back to client
    socket.emit('thread-joined', {
      threadId, 
      roomName: threadRoom,
      timestamp: new Date().toISOString()
    });
    
    // Get all clients in this room for debugging
    socketService.getIO().in(threadRoom).allSockets().then(clients => {
      console.log(`[SOCKET] Current clients in room ${threadRoom}: ${Array.from(clients).join(', ')}`);
      
      // Inform other participants that this user has joined (helpful for UI indicators)
      socket.to(threadRoom).emit('user-joined-thread', {
        userId: socket.userId,
        threadId,
        timestamp: new Date().toISOString()
      });
    });
  });

  // OPTIMIZATION: Add heartbeat mechanism for connection health
  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('pong', () => {
    // Client responded to ping, connection is healthy
    console.log(`[SOCKET] Received pong from user ${socket.userId}`);
  });
  
  // Handle leaving specific thread rooms
  socket.on('leave-thread', (threadId) => {
    socket.leave(`thread:${threadId}`);
    console.log(`[SOCKET] User ${socket.userId} (socket ${socket.id}) left thread: ${threadId}`);
  });
  
  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { threadId, message } = data;
      console.log(`[SOCKET] Received send-message from user ${socket.userId} (socket ${socket.id}) for thread ${threadId}:`, message.content);
      
      const isMongoId = mongoose.Types.ObjectId.isValid(threadId) && !threadId.includes('_');
      // const isCustomId = threadId.startsWith('thread_'); // Example for custom ID check if needed elsewhere

      if (isMongoId) {
        // For MongoDB backed threads, we typically rely on the REST API controller for save & emit.
        // However, if the message already has an _id, it means it's a backup/redundant socket emission
        // from the client to ensure real-time delivery in case the HTTP controller emission failed.
        if (message._id && message.sender) {
          console.log(`[SOCKET] Backup socket emission for saved message ${message._id} in thread ${threadId}`);
          
          // This is a backup emission - just broadcast without saving to DB
          const threadRoomId = `thread:${threadId}`;
          const messageToEmit = {
            ...message,
            threadId
          };
          
          console.log(`[SOCKET] Broadcasting backup message to room ${threadRoomId}`);
          socketService.getIO().to(threadRoomId).emit('new-message', messageToEmit);
          return;
        } else {
          // Original message without _id - let HTTP handle it
          console.log(`[SOCKET] Original send-message for MongoID thread ${threadId}. Processing will be handled by REST API controller.`);
          return;
        }
      }
      
      // If it's NOT a MongoID thread (e.g., a custom temporary threadId or other logic):
      // The original code within this handler only attempted DB saves if isMongoId was true.
      // So, for non-MongoId threads, it only broadcasted. We will retain that broadcast logic.
      
      // Broadcast the message to the thread room for non-MongoID threads
      const threadRoomId = `thread:${threadId}`;
      // Construct the sender object similar to how it was done before, using socket.user
      const senderPayload = {
        _id: socket.userId,
        firstName: socket.user.firstName || 'User',
        lastName: socket.user.lastName || '',
        email: socket.user.email,
        // Ensure profile and profilePicture are handled safely if they might be undefined
        profileImage: socket.user.profile?.profileImage || socket.user.profile?.profilePicture || null, 
        userType: socket.user.userType
      };

      // Construct the message payload to emit
      // Ensure it's consistent with what clients expect and what messageController.js emits
      const messageToEmit = {
        ...message, // Original message content from client (e.g., content, messageType, metadata)
        threadId,   // Ensure threadId is included
        sender: senderPayload,
        // For non-MongoID threads, _id and createdAt won't be from DB unless client provides them
        // or they are generated here. Add a createdAt for consistency.
        _id: message._id || new mongoose.Types.ObjectId().toString(), // Generate an ID if client didn't send one
        createdAt: message.createdAt || new Date().toISOString(),
        isRead: false // Default isRead for new messages
      };
      
      console.log(`[SOCKET] Emitting 'new-message' to room ${threadRoomId} for non-MongoID thread:`, messageToEmit);
      socketService.getIO().to(threadRoomId).emit('new-message', messageToEmit);
      console.log(`[SOCKET] Broadcast new-message to non-MongoID thread:${threadId} completed.`);
      
      // Original code had logic to find/create thread info for non-MongoId,
      // then get other participants to emit 'incoming-message' to them.
      // This part seems to be about notifications more than the primary message broadcast.
      // We'll simplify here to only include the direct 'new-message' broadcast for non-MongoID,
      // as the main duplication issue is with the 'new-message' emit for MongoID threads.
      // If 'incoming-message' logic for non-MongoID threads is crucial, it can be reviewed separately.
      // The original code for that part started around line 180.
      // For now, focusing on fixing the duplicate 'new-message'.

    } catch (error) {
      console.error(`[SOCKET] Error in send-message handler for user ${socket.userId}, thread ${data?.threadId}:`, error.message, error.stack);
      // Optionally, emit an error back to the specific socket that sent the message
      // socket.emit('message-error', { 
      //   threadId: data?.threadId, 
      //   messageContent: data?.message?.content,
      //   error: 'Failed to process message on server' 
      // });
    }
  });
  
  // Handle message read status
  socket.on('mark-thread-read', (threadId) => {
    // Broadcast to other participants that this user read the thread
    socket.to(`thread:${threadId}`).emit('thread-read', {
      threadId,
      userId: socket.userId
    });
  });
  
  // Handle typing indicator
  socket.on('typing', (threadId) => {
    socket.to(`thread:${threadId}`).emit('user-typing', {
      threadId,
      user: {
        _id: socket.userId,
        firstName: socket.user.firstName
      }
    });
  });
  
  // Handle typing stopped
  socket.on('typing-stopped', (threadId) => {
    socket.to(`thread:${threadId}`).emit('user-typing-stopped', {
      threadId,
      userId: socket.userId
    });
  });
  
  // Handle direct messages (for simplified chat)
  socket.on('direct-message', async (data) => {
    try {
      const { recipientId, message } = data;
      console.log(`Received direct-message from ${socket.userId} to ${recipientId}:`, message.content);
      
      // Attach the sender info to the message
      message.sender = {
        _id: socket.userId,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName,
        email: socket.user.email,
        profile: {
          profilePicture: socket.user.profile?.profilePicture
        },
        userType: socket.user.userType
      };
      
      // Broadcast to recipient's room (if online)
      socketService.getIO().to(recipientId.toString()).emit('direct-message', message);
      console.log(`Sent direct-message to ${recipientId}`);
      
      // Create a consistently formatted notification using the same structure as regular messages
      const notificationData = {
        // Include threadId at all possible locations for maximum compatibility
        threadId: message.threadId,
        message: {
          threadId: message.threadId,
          content: message.content,
          sender: {
            _id: socket.userId,
            firstName: socket.user?.firstName || 'Unknown',
            lastName: socket.user?.lastName || '',
            profilePicture: socket.user?.profile?.profilePicture || null
          }
        },
        thread: {
          _id: message.threadId
        }
      };
      
      // Log the notification structure before sending
      console.log(`Sending direct message-notification to ${recipientId} with format:`, {
        hasTopLevelThreadId: !!notificationData.threadId,
        hasMessageThreadId: !!notificationData.message.threadId,
        hasThreadObject: !!notificationData.thread,
        threadIdConsistency: notificationData.threadId === notificationData.thread._id
      });
      
      // Send the notification
      socketService.getIO().to(recipientId.toString()).emit('message-notification', notificationData);
      console.log(`Sent notification to ${recipientId}`);
    } catch (error) {
      console.error('Error handling direct message:', error);
      socket.emit('error', { message: 'Error sending direct message' });
    }
  });
  
  // Handle analytics subscription (admin only)
  socket.on('subscribe-analytics', () => {
    if (socket.user?.isAdmin || process.env.NODE_ENV === 'development') {
      socket.join('analytics-room');
      console.log(`[ANALYTICS] Admin user ${socket.userId} subscribed to analytics updates`);
    } else {
      console.log(`[ANALYTICS] Non-admin user ${socket.userId} tried to subscribe to analytics`);
    }
  });

  // Handle analytics unsubscription
  socket.on('unsubscribe-analytics', () => {
    socket.leave('analytics-room');
    console.log(`[ANALYTICS] User ${socket.userId} unsubscribed from analytics`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Real-time Analytics Broadcasting
const AnalyticsService = require('./services/analyticsService');

// Broadcast analytics updates every 30 seconds
setInterval(async () => {
  try {
    // Check if any admin users are subscribed to analytics
    const analyticsRoom = socketService.getIO().sockets.adapter.rooms.get('analytics-room');
    if (analyticsRoom && analyticsRoom.size > 0) {
      console.log(`[ANALYTICS] Broadcasting to ${analyticsRoom.size} admin subscribers`);
      
      const metrics = await AnalyticsService.getRealTimeMetrics();
      socketService.getIO().to('analytics-room').emit('analytics-update', {
        type: 'real-time-metrics',
        data: metrics,
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error('[ANALYTICS] Error broadcasting real-time metrics:', error);
  }
}, 30000); // 30 seconds

// Broadcast immediate analytics updates on specific events
const broadcastAnalyticsUpdate = async (eventType, data = {}) => {
  try {
    const analyticsRoom = socketService.getIO().sockets.adapter.rooms.get('analytics-room');
    if (analyticsRoom && analyticsRoom.size > 0) {
      console.log(`[ANALYTICS] Broadcasting ${eventType} event to admins`);
      
      // Get fresh metrics for immediate updates
      const metrics = await AnalyticsService.getRealTimeMetrics();
      socketService.getIO().to('analytics-room').emit('analytics-update', {
        type: 'event-triggered',
        eventType,
        data: { ...data, metrics },
        timestamp: new Date()
      });
    }
  } catch (error) {
    console.error(`[ANALYTICS] Error broadcasting ${eventType} update:`, error);
  }
};

// Export the broadcast function for use in other modules
global.broadcastAnalyticsUpdate = broadcastAnalyticsUpdate;

// Add a handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('==== UNHANDLED PROMISE REJECTION ====');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('====================================');
});

// Add a handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('==== UNCAUGHT EXCEPTION ====');
  console.error('Error message:', error.message);
  console.error('Error name:', error.name);
  console.error('Full error object:', error);
  console.error('Error stack:', error.stack);
  console.error('============================');
}); 