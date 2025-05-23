const Invitation = require('../models/Invitation');
const Thread = require('../models/Thread');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Send an invitation from a seeker to a professional
 * @route POST /api/invitations
 */
const sendInvitation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { receiverId, message, sessionDetails } = req.body;
    const senderId = req.user._id;
    
    // Validate the receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'The recipient user was not found'
        }
      });
    }
    
    // Validate the professional role
    if (receiver.role !== 'professional') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invitations can only be sent to professionals'
        }
      });
    }
    
    // Find or create a thread between these users
    let thread = await Thread.findOne({
      participants: { $all: [senderId, receiverId] },
      'metadata.isGroupChat': false
    }).session(session);
    
    if (!thread) {
      thread = new Thread({
        participants: [senderId, receiverId],
        metadata: {
          isGroupChat: false
        }
      });
      await thread.save({ session });
    }
    
    // Create the invitation
    const invitation = new Invitation({
      sender: senderId,
      receiver: receiverId,
      message,
      sessionDetails,
      threadId: thread._id
    });
    
    await invitation.save({ session });
    
    // Create a message in the thread for this invitation
    const inviteMessage = new Message({
      threadId: thread._id,
      sender: senderId,
      content: `I'd like to schedule a meeting with you on ${new Date(sessionDetails.proposedDate).toLocaleString()}`,
      messageType: 'invite',
      metadata: {
        inviteId: invitation._id,
        status: 'pending'
      }
    });
    
    await inviteMessage.save({ session });
    
    // Update the thread with the new message
    thread.lastMessage = {
      content: inviteMessage.content,
      sender: senderId,
      timestamp: Date.now(),
      messageType: 'invite'
    };
    
    // Update unread count for receiver
    const currentCount = thread.unreadCount.get(receiverId.toString()) || 0;
    thread.unreadCount.set(receiverId.toString(), currentCount + 1);
    
    await thread.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Get populated data for response
    const populatedInvitation = await Invitation.findById(invitation._id)
      .populate('sender', 'firstName lastName email')
      .populate('receiver', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: {
        invitation: populatedInvitation,
        thread: thread
      },
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error sending invitation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while sending the invitation',
        details: error.message
      }
    });
  }
};

/**
 * Get all invitations for the current user (sent or received)
 * @route GET /api/invitations
 */
const getMyInvitations = async (req, res) => {
  try {
    const userId = req.user._id;
    const userType = req.user.userType;
    const { status, type = 'all' } = req.query;
    
    // Build query based on parameters
    const query = {};
    
    if (type === 'sent') {
      query.sender = userId;
    } else if (type === 'received') {
      query.receiver = userId;
      
      // For professionals, exclude invitations they've removed
      if (userType === 'professional') {
        query.removedByProfessional = { $ne: true };
      }
    } else {
      // 'all' - both sent and received
      const orConditions = [{ sender: userId }];
      
      // For professionals, only include received invitations that haven't been removed
      if (userType === 'professional') {
        orConditions.push({ 
          receiver: userId,
          removedByProfessional: { $ne: true }
        });
      } else {
        orConditions.push({ receiver: userId });
      }
      
      query.$or = orConditions;
    }
    
    if (status) {
      query.status = status;
    }
    
    const invitations = await Invitation.find(query)
      .populate('sender', 'firstName lastName email profileImage')
      .populate('receiver', 'firstName lastName email profileImage')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        invitations
      }
    });
  } catch (error) {
    console.error('Error getting invitations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching invitations',
        details: error.message
      }
    });
  }
};

/**
 * Get a specific invitation by ID
 * @route GET /api/invitations/:id
 */
const getInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const invitation = await Invitation.findById(id)
      .populate('sender', 'firstName lastName email profileImage')
      .populate('receiver', 'firstName lastName email profileImage');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Invitation not found'
        }
      });
    }
    
    // Check if user is part of this invitation
    if (invitation.sender.toString() !== userId.toString() && 
        invitation.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to view this invitation'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        invitation
      }
    });
  } catch (error) {
    console.error('Error getting invitation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching the invitation',
        details: error.message
      }
    });
  }
};

/**
 * Respond to an invitation (accept/decline)
 * @route PUT /api/invitations/:id/respond
 */
const respondToInvitation = async (req, res) => {
  try {
    console.log('=== BEGIN RESPOND TO INVITATION ===');
    const { id } = req.params;
    const { status, responseMessage } = req.body;
    const userId = req.user._id;
    
    console.log(`STEP 1: Request received to respond to invitation ${id} with status ${status}`);
    console.log(`User ID: ${userId}, Response message provided: ${responseMessage ? 'Yes' : 'No'}`);
    console.log(`User details: ${JSON.stringify(req.user)}`);
    
    // Validate status
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status must be either accepted or declined'
        }
      });
    }
    
    console.log('STEP 2: Finding invitation');
    // Find the invitation without using a session
    const invitation = await Invitation.findById(id);
    
    if (!invitation) {
      console.error(`Invitation with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Invitation not found'
        }
      });
    }
    
    console.log(`Found invitation: ${JSON.stringify(invitation)}`);
    
    // Check if invitation data is complete
    const hasSender = invitation.sender && String(invitation.sender).length > 0;
    const hasReceiver = invitation.receiver && String(invitation.receiver).length > 0;
    
    if (!hasSender || !hasReceiver) {
      console.log('STEP 2.5: Incomplete invitation detected, attempting to complete data');
      // This is an incomplete invitation that needs to be fixed
      if (!hasSender) {
        console.log('Missing sender, using current user as receiver and finding a sender');
        // Find a seeker to use as sender since current user is professional
        const seekerUser = await User.findOne({ role: 'seeker' });
        if (seekerUser) {
          invitation.sender = seekerUser._id;
          console.log(`Added sender ${seekerUser._id} to invitation`);
        } else {
          console.log('No seeker user found, using first user in database');
          const anyUser = await User.findOne({});
          if (anyUser) {
            invitation.sender = anyUser._id;
            console.log(`Added sender ${anyUser._id} to invitation`);
          }
        }
      }
      
      if (!hasReceiver) {
        console.log('Missing receiver, using current user as receiver');
        invitation.receiver = userId;
        console.log(`Added receiver ${userId} to invitation`);
      }
      
      // Set status to pending if not set
      if (!invitation.status) {
        invitation.status = 'pending';
        console.log('Added default status: pending');
      }
      
      // Save the fixed invitation
      try {
        await invitation.save();
        console.log(`Fixed invitation ${id} with missing data`);
      } catch (fixError) {
        console.error('Error fixing invitation:', fixError);
        // Continue with the original invitation data - we'll try anyway
      }
    }
    
    console.log('STEP 3: Checking permissions');
    // Check if this user is the receiver
    console.log(`Receiver ID: ${invitation.receiver}, User ID: ${userId}`);
    console.log(`Receiver String: ${invitation.receiver.toString()}, User String: ${userId.toString()}`);
    console.log(`Comparison: ${invitation.receiver.toString() === userId.toString()}`);
    
    // Check user role directly from the database
    const user = await User.findById(userId);
    console.log(`User role from DB: ${user?.role || 'unknown'}`);
    
    // For professional users, make sure they're allowed to respond
    if (user?.role === 'professional') {
      console.log('User is a professional');
      
      // CRITICAL: Allow professional users to respond to invitations sent to them
      if (invitation.receiver.toString() !== userId.toString()) {
        console.error('Permission denied: Professional is not the receiver');
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Only the recipient can respond to an invitation',
            details: {
              userRole: user.role,
              userId: userId.toString(),
              receiverId: invitation.receiver.toString()
            }
          }
        });
      }
    } else {
      console.log(`User is not a professional (role: ${user?.role || 'unknown'})`);
      
      // Regular permission check
      if (invitation.receiver.toString() !== userId.toString()) {
        console.error('Permission denied: User is not the receiver');
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Only the recipient can respond to an invitation',
            details: {
              userRole: user?.role || 'unknown',
              userId: userId.toString(),
              receiverId: invitation.receiver.toString()
            }
          }
        });
      }
    }
    
    console.log('STEP 4: Checking current status');
    // Check if invitation is already responded to
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `This invitation has already been ${invitation.status}`
        }
      });
    }
    
    console.log('STEP 5: Updating invitation status');
    // Update invitation status - no transaction
    invitation.status = status;
    await invitation.save();
    console.log(`Updated invitation ${id} status to ${status}`);
    
    console.log('STEP 6: Finding thread');
    // Get the thread - no transaction
    let thread = null;
    
    if (invitation.threadId) {
      thread = await Thread.findById(invitation.threadId);
    }
    
    // Create thread if it doesn't exist
    if (!thread) {
      console.log('Thread not found, creating a new one');
      thread = new Thread({
        participants: [invitation.sender, invitation.receiver],
        metadata: {
          isGroupChat: false
        },
        unreadCount: new Map()
      });
      await thread.save();
      
      // Update invitation with new thread
      invitation.threadId = thread._id;
      await invitation.save();
      console.log(`Created new thread ${thread._id} for invitation`);
    }
    
    console.log('STEP 7: Updating message status');
    // Update the message status in the thread - no transaction
    try {
      await Message.updateOne(
        { 
          threadId: thread._id,
          'metadata.inviteId': invitation._id
        },
        { 
          $set: { 
            'metadata.status': status 
          }
        }
      );
      console.log(`Updated message status for invitation ${id}`);
    } catch (updateErr) {
      console.error('Error updating message status:', updateErr);
      // Continue execution even if this fails
    }
    
    console.log('STEP 8: Adding status message');
    // Add a new message about the response - no transaction
    try {
      let messageContent = status === 'accepted' 
        ? `I've accepted your invitation` 
        : `I'm sorry, but I can't make it at the requested time`;
        
      // Add date if available
      if (invitation.sessionDetails && invitation.sessionDetails.proposedDate) {
        messageContent = status === 'accepted' 
          ? `I've accepted your invitation for ${new Date(invitation.sessionDetails.proposedDate).toLocaleString()}`
          : `I'm sorry, but I can't make it on ${new Date(invitation.sessionDetails.proposedDate).toLocaleString()}`;
      }
      
      const statusMessage = new Message({
        threadId: thread._id,
        sender: userId,
        content: messageContent,
        messageType: 'text',
        metadata: {
          inviteId: invitation._id,
          status
        }
      });
      
      if (responseMessage) {
        statusMessage.content += `. ${responseMessage}`;
      }
      
      await statusMessage.save();
      console.log(`Added status message for invitation ${id}`);
      
      console.log('STEP 9: Updating thread');
      // Update the thread - no transaction
      thread.lastMessage = {
        content: statusMessage.content,
        sender: userId,
        timestamp: Date.now(),
        messageType: 'text'
      };
      
      // Update unread count for the sender
      if (invitation.sender) {
        const senderId = invitation.sender.toString();
        const currentCount = thread.unreadCount.get(senderId) || 0;
        thread.unreadCount.set(senderId, currentCount + 1);
      }
      
      await thread.save();
      console.log(`Updated thread for invitation ${id}`);
    } catch (messageErr) {
      console.error('Error creating status message:', messageErr);
      // Continue execution even if this fails
    }
    
    console.log('STEP 10: Getting populated data');
    // Get populated data for response
    const populatedInvitation = await Invitation.findById(invitation._id)
      .populate('sender', 'firstName lastName email profileImage')
      .populate('receiver', 'firstName lastName email profileImage');
    
    console.log('STEP 11: Emitting socket event');
    // Emit socket event to the sender (seeker)
    try {
      // Try different ways to access the Socket.io instance
      const io = req.io || req.app.get('io');
      const senderId = invitation.sender ? invitation.sender.toString() : null;
      
      if (io && senderId) {
        console.log(`Found Socket.io instance, attempting to emit to sender ID: ${senderId}`);
        
        // Create notification data with error handling for missing fields
        const notificationData = {
          type: status === 'accepted' ? 'invitation_accepted' : 'invitation_declined',
          invitation: populatedInvitation || { _id: invitation._id },
          sender: {
            _id: populatedInvitation?.receiver?._id || userId,
            firstName: populatedInvitation?.receiver?.firstName || 'Professional',
            lastName: populatedInvitation?.receiver?.lastName || 'User'
          },
          receiver: {
            _id: populatedInvitation?.sender?._id || senderId,
            firstName: populatedInvitation?.sender?.firstName || 'Seeker',
            lastName: populatedInvitation?.sender?.lastName || 'User'
          }
        };
        
        io.to(senderId).emit('invitation-notification', notificationData);
        console.log(`Successfully emitted invitation-notification to sender ID: ${senderId}`);
      } else {
        console.error(`Socket.io instance not found or invalid sender ID: ${senderId}`);
      }
    } catch (emitError) {
      console.error('Error emitting invitation-notification:', emitError);
      // Continue with the response even if socket emission fails
    }

    console.log('STEP 12: Sending response');
    res.status(200).json({
      success: true,
      data: {
        invitation: populatedInvitation
      },
      message: `Invitation ${status} successfully`
    });
  } catch (error) {
    console.error('=== ERROR IN RESPOND TO INVITATION ===');
    console.error('Error responding to invitation:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while responding to the invitation',
        details: error.message,
        stack: error.stack
      }
    });
  }
};

/**
 * Cancel an invitation (sender only)
 * @route PUT /api/invitations/:id/cancel
 */
const cancelInvitation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the invitation
    const invitation = await Invitation.findById(id).session(session);
    
    if (!invitation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Invitation not found'
        }
      });
    }
    
    // Check if this user is the sender
    if (invitation.sender.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only the sender can cancel an invitation'
        }
      });
    }
    
    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `This invitation has already been ${invitation.status} and cannot be cancelled`
        }
      });
    }
    
    // Update invitation status
    invitation.status = 'cancelled';
    await invitation.save({ session });
    
    // Get the thread
    const thread = await Thread.findById(invitation.threadId).session(session);
    
    if (thread) {
      // Update the message status in the thread
      await Message.updateOne(
        { 
          threadId: thread._id,
          'metadata.inviteId': invitation._id
        },
        { 
          $set: { 
            'metadata.status': 'cancelled' 
          }
        }
      ).session(session);
      
      // Add a new message about the cancellation
      const cancelMessage = new Message({
        threadId: thread._id,
        sender: userId,
        content: `I've cancelled my invitation for ${new Date(invitation.sessionDetails.proposedDate).toLocaleString()}`,
        messageType: 'text',
        metadata: {
          inviteId: invitation._id,
          status: 'cancelled'
        }
      });
      
      await cancelMessage.save({ session });
      
      // Update the thread
      thread.lastMessage = {
        content: cancelMessage.content,
        sender: userId,
        timestamp: Date.now(),
        messageType: 'text'
      };
      
      // Update unread count for the receiver
      const receiverId = invitation.receiver.toString();
      const currentCount = thread.unreadCount.get(receiverId) || 0;
      thread.unreadCount.set(receiverId, currentCount + 1);
      
      await thread.save({ session });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error cancelling invitation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while cancelling the invitation',
        details: error.message
      }
    });
  }
};

module.exports = {
  sendInvitation,
  getMyInvitations,
  getInvitation,
  respondToInvitation,
  cancelInvitation
}; 