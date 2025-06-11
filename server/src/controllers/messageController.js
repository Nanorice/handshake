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

    const threads = await Thread.find({ 
      participants: userId,
      status: 'active'
    })
    // UPDATED: Include profilePhoto field for GridFS support
    .populate('participants', 'name email profileImage profilePhoto role firstName lastName') 
    .sort({ updatedAt: -1 });

    const formattedThreads = threads.map(thread => {
      const otherParticipantDoc = thread.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      let otherParticipantData = null;
      if (otherParticipantDoc) {
        // Attempt to split name into firstName and lastName
        // This is a common heuristic; adjust if names can be more complex
        const nameParts = otherParticipantDoc.name ? otherParticipantDoc.name.split(' ') : [];
        const firstName = otherParticipantDoc.firstName || nameParts[0] || '';
        const lastName = otherParticipantDoc.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');

        otherParticipantData = {
          _id: otherParticipantDoc._id,
          id: otherParticipantDoc._id, // Frontend might use id
          email: otherParticipantDoc.email,
          name: otherParticipantDoc.name, // Full name from User model
          firstName: firstName,          // Derived first name
          lastName: lastName,            // Derived last name
          // UPDATED: Include both legacy and new profile photo fields
          profilePhoto: otherParticipantDoc.profilePhoto || null, // GridFS profile photo
          profileImage: otherParticipantDoc.profileImage || null, // Legacy profile image
          profile: {
            // Create the nested profile.profilePicture structure expected by frontend
            profilePicture: otherParticipantDoc.profileImage || null 
          },
          userType: otherParticipantDoc.userType // virtual, derived from role
        };
      }

      return {
        _id: thread._id,
        // participants: thread.participants, // Keep this if frontend needs full list of populated participants
        otherParticipant: otherParticipantData, 
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
    // UPDATED: Include profilePhoto field for GridFS support
    const messagesFromDb = await Message.find({ threadId })
      .populate('sender', 'name email profileImage profilePhoto role firstName lastName')
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
    
    const formattedMessages = messagesFromDb.map(msg => {
      let senderData = null;
      if (msg.sender && typeof msg.sender === 'object') {
        const senderDoc = msg.sender;
        const nameParts = senderDoc.name ? senderDoc.name.split(' ') : [];
        const firstName = senderDoc.firstName || nameParts[0] || '';
        const lastName = senderDoc.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
        
        senderData = {
          _id: senderDoc._id,
          name: senderDoc.name,
          firstName,
          lastName,
          email: senderDoc.email,
          // UPDATED: Include both legacy and new profile photo fields
          profilePhoto: senderDoc.profilePhoto || null, // GridFS profile photo
          profileImage: senderDoc.profileImage || null, // Legacy profile image
          profile: {
            profilePicture: senderDoc.profileImage || null // Legacy nested structure
          },
          userType: senderDoc.role === 'professional' ? 'professional' : 'seeker'
        };
      }
      return {
        ...msg.toObject(),
        sender: senderData || msg.sender
      };
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        thread,
        messages: formattedMessages
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
    const { content, messageType = 'text', metadata = {}, replyToId = null, file = null } = req.body;
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
    
    // If it's a reply, verify the original message exists and belongs to this thread
    if (replyToId) {
      const originalMessage = await Message.findOne({
        _id: replyToId,
        threadId
      }).session(session);
      
      if (!originalMessage) {
        await session.abortTransaction();
        session.endSession();
        
        return res.status(404).json({
          status: 'error',
          message: 'Original message not found or does not belong to this thread'
        });
      }
    }
    
    // Create the new message
    const messageData = {
      threadId,
      sender: userId,
      content,
      messageType,
      metadata,
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
    
    await message.save({ session });
    
    // Update the thread with last message info
    thread.lastMessage = {
      content,
      sender: userId,
      timestamp: Date.now(),
      messageType: messageData.messageType // Use the potentially updated messageType
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
    
    // Populate sender info before returning and emitting
    let populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profileImage profilePhoto role firstName lastName')
      .populate('replyTo')
      .lean(); // Use .lean() for a plain JS object

    if (populatedMessage.sender && typeof populatedMessage.sender === 'object') {
      const senderDoc = populatedMessage.sender;
      const nameParts = senderDoc.name ? senderDoc.name.split(' ') : [];
      const firstName = senderDoc.firstName || nameParts[0] || '';
      const lastName = senderDoc.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
      
      populatedMessage.sender = {
        _id: senderDoc._id,
        name: senderDoc.name,
        firstName,
        lastName,
        email: senderDoc.email,
        // UPDATED: Include both legacy and new profile photo fields
        profilePhoto: senderDoc.profilePhoto || null, // GridFS profile photo
        profileImage: senderDoc.profileImage || null, // Legacy profile image
        profile: {
          profilePicture: senderDoc.profileImage || null // Legacy nested structure
        },
        userType: senderDoc.role === 'professional' ? 'professional' : 'seeker'
      };
    }
    
    // Emit the message via Socket.io to the thread room
    if (req.io) {
      // Construct the thread room ID
      const threadRoomId = `thread:${threadId}`;
      
      console.log(`[MESSAGE_CONTROLLER] Emitting new-message to room ${threadRoomId} for message:`, {
        messageId: populatedMessage._id,
        content: populatedMessage.content.substring(0, 50) + '...',
        sender: populatedMessage.sender._id
      });
      
      // Get connected clients in this room for debugging
      req.io.in(threadRoomId).allSockets().then(clients => {
        console.log(`[MESSAGE_CONTROLLER] Clients in room ${threadRoomId}: ${Array.from(clients).join(', ')}`);
        if (clients.size === 0) {
          console.warn(`[MESSAGE_CONTROLLER] No clients in room ${threadRoomId}! Message will not be received in real-time.`);
        }
      }).catch(err => {
        console.error(`[MESSAGE_CONTROLLER] Error getting clients in room:`, err);
      });
      
      req.io.to(threadRoomId).emit('new-message', populatedMessage);
      console.log(`[MESSAGE_CONTROLLER] Socket emission completed for room ${threadRoomId}`);
    } else {
      console.warn('[MESSAGE_CONTROLLER] Socket.io not available on request object - real-time messaging disabled');
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        message: populatedMessage
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while sending message',
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
      $and: [
        { participants: { $all: [userId, participantObjectId] } },
        { participants: { $size: 2 } }, // Ensure exactly 2 participants for a direct thread
        { 'metadata.isGroupChat': false }
      ]
    }).session(session);
    
    console.log(`[createThread] Checking for existing thread between ${userId} and ${participantObjectId}, found:`, existingThread ? existingThread._id : 'none');
    
    if (existingThread) {
      await session.abortTransaction();
      session.endSession();
      
      // If thread exists but the user wants to send an initial message, do that
      if (initialMessage) {
        try {
          // Send the message to the existing thread
          const fakeRes = { status: () => ({ json: (data) => console.log('[createThread] Initial message sent to existing thread:', data) }) };
          const fakeReq = {
              params: { threadId: existingThread._id.toString() }, // Ensure it's a string
              body: { content: initialMessage },
              user: { _id: userId },
              io: req.io // Pass io instance for socket emission
          };
          await sendMessage(fakeReq, fakeRes); // Call sendMessage directly
        } catch (err) {
          console.error('[createThread] Error sending initial message to existing thread:', err);
        }
      }
      
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
    // UPDATED: Include profilePhoto field for GridFS support
    let populatedThread = await Thread.findById(thread._id)
        .populate('participants', 'name email profileImage profilePhoto role firstName lastName')
        .lean();

    // Format participants in the same way as getThreads
    if (populatedThread && populatedThread.participants) {
        populatedThread.participants = populatedThread.participants.map(p => {
            if (!p || typeof p !== 'object') return p; // Should not happen if populated
            const nameParts = p.name ? p.name.split(' ') : [];
            const firstName = p.firstName || nameParts[0] || '';
            const lastName = p.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
            return {
                _id: p._id,
                id: p._id,
                email: p.email,
                name: p.name,
                firstName,
                lastName,
                // UPDATED: Include both legacy and new profile photo fields
                profilePhoto: p.profilePhoto || null, // GridFS profile photo
                profileImage: p.profileImage || null, // Legacy profile image
                profile: {
                    profilePicture: p.profileImage || null
                },
                userType: p.role // Assuming role is directly userType or maps to it
            };
        });
    }

    // Reconstruct otherParticipant for consistency if needed, similar to getThreads
    if (populatedThread) {
        const otherP = populatedThread.participants.find(p => p._id.toString() !== userId.toString());
        populatedThread.otherParticipant = otherP || null;
    }

    res.status(201).json({
      status: 'success',
      data: {
        thread: populatedThread
      }
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
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

/**
 * Get all messages for a specific thread, ensuring user is a participant.
 * @route GET /api/messages/:threadId/messages
 */
const getMessagesForThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user._id;

    // 1. Validate threadId and user's access to this thread
    const thread = await Thread.findOne({ _id: threadId, participants: userId });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found or access denied.'
      });
    }

    // 2. Fetch messages for the thread
    const messagesFromDb = await Message.find({ threadId: threadId })
      .sort({ createdAt: 1 }) // Sort by oldest first
      // Populate sender with fields consistent with getThreads
      .populate('sender', 'name email profileImage profilePhoto role firstName lastName'); 

    // 3. Mark messages as read and update thread unread count for the current user
    // Check if the user actually has unread messages in this thread
    const userUnreadCount = thread.unreadCount.get(userId.toString()) || 0;
    if (userUnreadCount > 0) {
      // Mark messages sent by OTHERS as read by THIS user
      await Message.updateMany(
        { threadId: threadId, sender: { $ne: userId }, isRead: false }, // Only update messages not sent by the current user
        { $set: { isRead: true } } // It's better to set isRead for specific messages rather than all.
                                     // However, a simpler approach is just to reset the thread's unread count for the user.
      );

      // Reset the unread count for the current user on the thread document
      thread.unreadCount.set(userId.toString(), 0);
      thread.markModified('unreadCount'); // Important when modifying Map types
      await thread.save();
    }

    // Transform sender info to match frontend expectations if necessary (similar to getThreads)
    const formattedMessages = messagesFromDb.map(msg => {
      let senderData = null;
      if (msg.sender && typeof msg.sender === 'object') {
        const senderDoc = msg.sender;
        const nameParts = senderDoc.name ? senderDoc.name.split(' ') : [];
        const firstName = senderDoc.firstName || nameParts[0] || '';
        const lastName = senderDoc.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
        senderData = {
          _id: senderDoc._id,
          name: senderDoc.name,
          firstName,
          lastName,
          email: senderDoc.email,
          // UPDATED: Include both legacy and new profile photo fields
          profilePhoto: senderDoc.profilePhoto || null, // GridFS profile photo
          profileImage: senderDoc.profileImage || null, // Legacy profile image
          profile: {
            profilePicture: senderDoc.profileImage || null // Legacy nested structure
          },
          userType: senderDoc.role === 'professional' ? 'professional' : 'seeker'
        };
      }
      return {
        ...msg.toObject(), // Convert Mongoose document to plain object
        sender: senderData || msg.sender // Fallback to original sender ID if population failed or not an object
      };
    });

    res.status(200).json({
      success: true,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Error in getMessagesForThread:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching messages for thread.',
      error: error.message
    });
  }
};

/**
 * Utility function to clean up duplicate threads between the same users
 * @route GET /api/messages/utils/dedup-threads
 * @access Admin only
 */
const deduplicateThreads = async (req, res) => {
  try {
    // For security, allow admin or any user in development environment
    // Update this condition to match your user role structure
    // Instead of req.user.role !== 'admin', use the appropriate field and value
    if (process.env.NODE_ENV === 'production' && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin users can perform this operation in production'
      });
    }

    // Find all thread pairs
    const threads = await Thread.find({ 'metadata.isGroupChat': false }).lean();
    
    console.log(`[deduplicateThreads] Found ${threads.length} total threads`);
    
    // Create a map to track threads between the same users
    const threadMap = new Map();
    const duplicates = [];
    
    // Find duplicates
    threads.forEach(thread => {
      // Sort participant IDs to ensure consistent key regardless of participant order
      const participantIds = thread.participants.map(p => p.toString()).sort();
      const key = participantIds.join('_');
      
      if (!threadMap.has(key)) {
        threadMap.set(key, [thread._id]);
      } else {
        threadMap.get(key).push(thread._id);
        // If this is the second thread for this pair, it's a duplicate
        if (threadMap.get(key).length === 2) {
          duplicates.push({
            participants: participantIds,
            threadIds: [...threadMap.get(key)]
          });
        }
      }
    });

    // No duplicates found
    if (duplicates.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No duplicate threads found',
        data: { duplicateThreads: [] }
      });
    }

    console.log(`[deduplicateThreads] Found ${duplicates.length} duplicate thread pairs`);
    
    // Process duplicates - for each duplicate pair, keep the newer one (usually has more messages)
    // and merge data from the older one if needed
    const results = [];
    
    for (const dup of duplicates) {
      // Get full thread objects, not just IDs
      const threadObjects = await Promise.all(
        dup.threadIds.map(id => Thread.findById(id))
      );
      
      // Sort by updatedAt (newest first)
      threadObjects.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      const [keepThread, removeThread] = threadObjects;
      
      console.log(`[deduplicateThreads] Keeping thread ${keepThread._id}, removing ${removeThread._id}`);
      
      // 1. Move all messages from the old thread to the new one
      await Message.updateMany(
        { threadId: removeThread._id },
        { $set: { threadId: keepThread._id } }
      );
      
      // 2. Merge unread counts (take the max)
      for (const [userId, count] of removeThread.unreadCount.entries()) {
        const currentCount = keepThread.unreadCount.get(userId) || 0;
        if (count > currentCount) {
          keepThread.unreadCount.set(userId, count);
          keepThread.markModified('unreadCount');
        }
      }
      
      // 3. Take the newer lastMessage if available
      if (removeThread.lastMessage && (!keepThread.lastMessage || 
          new Date(removeThread.lastMessage.timestamp) > new Date(keepThread.lastMessage.timestamp))) {
        keepThread.lastMessage = removeThread.lastMessage;
      }
      
      // 4. Update the kept thread
      await keepThread.save();
      
      // 5. Delete the duplicate thread
      await Thread.deleteOne({ _id: removeThread._id });
      
      results.push({
        participants: dup.participants,
        keptThreadId: keepThread._id,
        removedThreadId: removeThread._id,
        messagesMoved: await Message.countDocuments({ threadId: keepThread._id })
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Successfully processed ${duplicates.length} duplicate thread pairs`,
      data: {
        duplicateThreads: results
      }
    });
    
  } catch (error) {
    console.error('Error in deduplicateThreads:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deduplicating threads',
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
  archiveThread,
  getMessagesForThread,
  deduplicateThreads
}; 