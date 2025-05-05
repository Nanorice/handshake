const Message = require('../models/Message');
const Thread = require('../models/Thread');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get all threads for the current user
 * @route GET /api/messages/threads
 */
const getThreads = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all threads where the user is a participant
    const threads = await Thread.find({ 
      participants: userId,
      status: 'active'
    })
    .populate('participants', 'firstName lastName email profile.profilePicture userType')
    .sort({ updatedAt: -1 });

    // Format the response
    const formattedThreads = threads.map(thread => {
      const otherParticipants = thread.participants.filter(
        p => p._id.toString() !== userId.toString()
      );

      return {
        _id: thread._id,
        participants: thread.participants,
        otherParticipant: otherParticipants[0] || null, // For 1:1 chats
        lastMessage: thread.lastMessage,
        unreadCount: thread.unreadCount.get(userId.toString()) || 0,
        updatedAt: thread.updatedAt,
        createdAt: thread.createdAt
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        threads: formattedThreads
      }
    });
  } catch (error) {
    console.error('Error getting threads:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching threads',
      error: error.message
    });
  }
};

/**
 * Get messages for a specific thread
 * @route GET /api/messages/threads/:threadId
 */
const getMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user._id;
    
    // Verify this thread belongs to the user
    const thread = await Thread.findOne({
      _id: threadId,
      participants: userId
    });
    
    if (!thread) {
      return res.status(404).json({
        status: 'error',
        message: 'Thread not found or you do not have access'
      });
    }
    
    // Get messages sorted by timestamp
    const messages = await Message.find({ threadId })
      .populate('sender', 'firstName lastName email profile.profilePicture userType')
      .sort({ createdAt: 1 });
    
    // Mark messages as read
    if (thread.unreadCount.get(userId.toString()) > 0) {
      await Message.updateMany(
        { 
          threadId,
          sender: { $ne: userId },
          isRead: false
        },
        { isRead: true }
      );
      
      // Update thread unread count
      thread.unreadCount.set(userId.toString(), 0);
      await thread.save();
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        thread,
        messages
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching messages',
      error: error.message
    });
  }
};

/**
 * Send a message to a thread
 * @route POST /api/messages/threads/:threadId
 */
const sendMessage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { threadId } = req.params;
    const { content, messageType = 'text', metadata = {} } = req.body;
    const userId = req.user._id;
    
    // Verify this thread belongs to the user
    const thread = await Thread.findOne({
      _id: threadId,
      participants: userId
    }).session(session);
    
    if (!thread) {
      await session.abortTransaction();
      session.endSession();
      
      return res.status(404).json({
        status: 'error',
        message: 'Thread not found or you do not have access'
      });
    }
    
    // Create the new message
    const message = new Message({
      threadId,
      sender: userId,
      content,
      messageType,
      metadata,
      isRead: false
    });
    
    await message.save({ session });
    
    // Update the thread with last message info
    thread.lastMessage = {
      content,
      sender: userId,
      timestamp: Date.now(),
      messageType
    };
    
    // Increment unread count for other participants
    thread.participants.forEach(participantId => {
      if (participantId.toString() !== userId.toString()) {
        const currentCount = thread.unreadCount.get(participantId.toString()) || 0;
        thread.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });
    
    await thread.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Populate sender info before returning
    await message.populate('sender', 'firstName lastName email profile.profilePicture userType');
    
    res.status(201).json({
      status: 'success',
      data: {
        message
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error sending message:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while sending the message',
      error: error.message
    });
  }
};

/**
 * Create a new thread
 * @route POST /api/messages/threads
 */
const createThread = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { participantId, initialMessage, matchId } = req.body;
    const userId = req.user._id;
    
    console.log('Creating thread with participant:', participantId);
    
    // Special handling for our test users (pro1, seeker1, etc.)
    let participantObjectId;
    if (typeof participantId === 'string' && 
        (participantId.startsWith('pro') || participantId.startsWith('seeker'))) {
      // For our test users, we'll search by the pattern
      const userType = participantId.startsWith('pro') ? 'professional' : 'seeker';
      const userNumber = participantId.replace(/[^0-9]/g, ''); // Extract just the number
      const email = `${participantId}@example.com`;
      
      // First try to find by email
      const participant = await User.findOne({ email });
      if (participant) {
        participantObjectId = participant._id;
      } else {
        // If not found, return an error
        await session.abortTransaction();
        session.endSession();
        
        return res.status(404).json({
          status: 'error',
          message: `Test user ${participantId} not found. Make sure the database is seeded with test users.`
        });
      }
    } else {
      // Regular MongoDB ObjectId
      try {
        participantObjectId = mongoose.Types.ObjectId(participantId);
        
        // Check if participant exists
        const participant = await User.findById(participantObjectId);
        if (!participant) {
          await session.abortTransaction();
          session.endSession();
          
          return res.status(404).json({
            status: 'error',
            message: 'Participant not found'
          });
        }
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        return res.status(400).json({
          status: 'error',
          message: 'Invalid participant ID format'
        });
      }
    }
    
    // Check if a thread already exists between these users
    const existingThread = await Thread.findOne({
      participants: { $all: [userId, participantObjectId] },
      'metadata.isGroupChat': false
    });
    
    if (existingThread) {
      await session.abortTransaction();
      session.endSession();
      
      return res.status(200).json({
        status: 'success',
        message: 'Thread already exists',
        data: {
          thread: existingThread
        }
      });
    }
    
    // Create new thread
    const thread = new Thread({
      participants: [userId, participantObjectId],
      match: matchId || null,
      metadata: {
        isGroupChat: false
      }
    });
    
    await thread.save({ session });
    
    // If initial message is provided, create it
    if (initialMessage) {
      const message = new Message({
        threadId: thread._id,
        sender: userId,
        content: initialMessage,
        messageType: 'text',
        isRead: false
      });
      
      await message.save({ session });
      
      // Update thread with last message
      thread.lastMessage = {
        content: initialMessage,
        sender: userId,
        timestamp: Date.now(),
        messageType: 'text'
      };
      
      // Set unread count for the other participant
      thread.unreadCount.set(participantObjectId.toString(), 1);
      
      await thread.save({ session });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    // Populate thread before returning
    await thread.populate('participants', 'firstName lastName email profile.profilePicture userType');
    
    res.status(201).json({
      status: 'success',
      data: {
        thread
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error creating thread:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating the thread',
      error: error.message
    });
  }
};

/**
 * Mark a thread as read
 * @route PUT /api/messages/threads/:threadId/read
 */
const markThreadAsRead = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user._id;
    
    // Verify this thread belongs to the user
    const thread = await Thread.findOne({
      _id: threadId,
      participants: userId
    });
    
    if (!thread) {
      return res.status(404).json({
        status: 'error',
        message: 'Thread not found or you do not have access'
      });
    }
    
    // Mark messages as read
    await Message.updateMany(
      { 
        threadId,
        sender: { $ne: userId },
        isRead: false
      },
      { isRead: true }
    );
    
    // Update thread unread count
    thread.unreadCount.set(userId.toString(), 0);
    await thread.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Thread marked as read'
    });
  } catch (error) {
    console.error('Error marking thread as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while marking thread as read',
      error: error.message
    });
  }
};

/**
 * Archive a thread
 * @route PUT /api/messages/threads/:threadId/archive
 */
const archiveThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user._id;
    
    // Verify this thread belongs to the user
    const thread = await Thread.findOne({
      _id: threadId,
      participants: userId
    });
    
    if (!thread) {
      return res.status(404).json({
        status: 'error',
        message: 'Thread not found or you do not have access'
      });
    }
    
    // Archive the thread
    thread.status = 'archived';
    await thread.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Thread archived'
    });
  } catch (error) {
    console.error('Error archiving thread:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while archiving the thread',
      error: error.message
    });
  }
};

module.exports = {
  getThreads,
  getMessages,
  sendMessage,
  createThread,
  markThreadAsRead,
  archiveThread
}; 