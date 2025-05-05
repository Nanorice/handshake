const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./app');
const User = require('./models/User');
const Thread = require('./models/Thread');
const Message = require('./models/Message');
require('dotenv').config();

// Get port from environment variables or use default
const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection handler
io.use(async (socket, next) => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth.token;
    
    console.log(`Socket auth attempt with token: ${token ? 'Token provided' : 'No token'}`);
    
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    // Attach user to socket
    socket.userId = user._id;
    socket.user = user;
    
    console.log(`Socket authenticated for user: ${user._id} (${user.firstName} ${user.lastName})`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Join user to their private room
  socket.join(socket.userId.toString());
  
  // Handle joining specific thread rooms
  socket.on('join-thread', (threadId) => {
    socket.join(`thread:${threadId}`);
    console.log(`User ${socket.userId} joined thread: ${threadId}`);
  });
  
  // Handle leaving specific thread rooms
  socket.on('leave-thread', (threadId) => {
    socket.leave(`thread:${threadId}`);
    console.log(`User ${socket.userId} left thread: ${threadId}`);
  });
  
  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      const { threadId, message } = data;
      
      console.log(`Received send-message from user ${socket.userId} for thread ${threadId}`);
      
      // Check if this is a MongoDB ID or our custom format
      const isMongoId = mongoose.Types.ObjectId.isValid(threadId) && !threadId.includes('_');
      const isCustomId = threadId.startsWith('thread_');
      
      if (isMongoId) {
        // Try to persist message to database for MongoDB threads
        try {
          const thread = await Thread.findById(threadId);
          if (thread) {
            // Create message in database
            const dbMessage = new Message({
              threadId,
              sender: socket.userId,
              content: message.content,
              messageType: message.messageType || 'text',
              metadata: message.metadata || {},
              isRead: false
            });
            
            await dbMessage.save();
            console.log(`Message saved to database for thread ${threadId}`);
            
            // Update thread last message
            thread.lastMessage = {
              content: message.content,
              sender: socket.userId,
              timestamp: Date.now(),
              messageType: message.messageType || 'text'
            };
            
            // Update unread count for other participants
            thread.participants.forEach(participantId => {
              if (participantId.toString() !== socket.userId.toString()) {
                const currentCount = thread.unreadCount.get(participantId.toString()) || 0;
                thread.unreadCount.set(participantId.toString(), currentCount + 1);
              }
            });
            
            await thread.save();
          }
        } catch (dbError) {
          console.error(`Error saving message to database: ${dbError.message}`);
        }
      }
      
      // Broadcast the message to the thread room regardless of storage method
      io.to(`thread:${threadId}`).emit('new-message', { 
        ...message,
        threadId, // Ensure threadId is included
        sender: {
          _id: socket.userId,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          email: socket.user.email,
          profile: {
            profilePicture: socket.user.profile?.profilePicture
          },
          userType: socket.user.userType
        }
      });
      
      console.log(`Broadcast new-message to thread:${threadId}`);
      
      // Get thread info from database or create a simple one if not found
      let thread;
      try {
        if (isMongoId) {
          thread = await Thread.findById(threadId);
          console.log(`Found thread ${threadId} with participants:`, thread.participants);
        } else if (isCustomId) {
          // For our custom thread IDs (thread_userId1_userId2)
          const userIds = threadId.split('_').slice(1); // Remove 'thread_' prefix and get user IDs
          if (userIds.length === 2) {
            thread = { 
              participants: userIds,
              _id: threadId
            };
            console.log(`Using custom thread with participants: ${userIds.join(', ')}`);
          } else {
            thread = { 
              participants: [socket.userId],
              _id: threadId
            };
          }
        } else {
          // Fallback for any other format
          thread = { 
            participants: [socket.userId],
            _id: threadId
          };
        }
      } catch (err) {
        console.error(`Error finding thread ${threadId}:`, err);
        // If thread not found by ID, try to infer participants from thread ID format
        if (isCustomId) {
          const userIds = threadId.split('_').slice(1); // Remove 'thread_' prefix
          thread = { 
            participants: userIds.length > 0 ? userIds : [socket.userId],
            _id: threadId
          };
        } else {
          thread = { 
            participants: [socket.userId],
            _id: threadId
          };
        }
      }
      
      if (thread) {
        // Get socket rooms to check who's connected
        const socketRooms = io.sockets.adapter.rooms;
        const threadRoomId = `thread:${threadId}`;
        const threadRoom = socketRooms.get(threadRoomId);
        const threadRoomSockets = threadRoom ? [...threadRoom] : [];
        
        console.log(`Thread room ${threadRoomId} has ${threadRoomSockets.length} sockets`);
        
        // Send notification to all participants who are not the sender and not in the thread room
        thread.participants.forEach(participantId => {
          if (!participantId) return; // Skip undefined participants
          
          const participantIdStr = participantId.toString();
          
          // Only send notifications to participants who aren't the sender
          if (participantIdStr !== socket.userId.toString()) {
            console.log(`Sending notification to participant ${participantIdStr}`);
            
            // Direct notification to this user's room
            io.to(participantIdStr).emit('message-notification', {
              threadId,
              message: {
                content: message.content,
                sender: socket.user.firstName
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Error sending message' });
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
      io.to(recipientId.toString()).emit('direct-message', message);
      console.log(`Sent direct-message to ${recipientId}`);
      
      // Also send a notification
      io.to(recipientId.toString()).emit('message-notification', {
        threadId: message.threadId,
        message: {
          content: message.content,
          sender: socket.user.firstName
        }
      });
      console.log(`Sent notification to ${recipientId}`);
    } catch (error) {
      console.error('Error handling direct message:', error);
      socket.emit('error', { message: 'Error sending direct message' });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/handshake', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server once MongoDB is connected
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io server running`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
}); 