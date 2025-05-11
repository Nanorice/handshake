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
    const { status, type = 'all' } = req.query;
    
    // Build query based on parameters
    const query = {};
    
    if (type === 'sent') {
      query.sender = userId;
    } else if (type === 'received') {
      query.receiver = userId;
    } else {
      // 'all' - both sent and received
      query.$or = [{ sender: userId }, { receiver: userId }];
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
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { status, responseMessage } = req.body;
    const userId = req.user._id;
    
    // Validate status
    if (!['accepted', 'declined'].includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status must be either accepted or declined'
        }
      });
    }
    
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
    
    // Check if this user is the receiver
    if (invitation.receiver.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only the recipient can respond to an invitation'
        }
      });
    }
    
    // Check if invitation is already responded to
    if (invitation.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `This invitation has already been ${invitation.status}`
        }
      });
    }
    
    // Update invitation status
    invitation.status = status;
    await invitation.save({ session });
    
    // Get the thread
    const thread = await Thread.findById(invitation.threadId).session(session);
    
    if (!thread) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Thread not found'
        }
      });
    }
    
    // Update the message status in the thread
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
    ).session(session);
    
    // Add a new message about the response
    const statusMessage = new Message({
      threadId: thread._id,
      sender: userId,
      content: status === 'accepted' 
        ? `I've accepted your invitation for ${new Date(invitation.sessionDetails.proposedDate).toLocaleString()}`
        : `I'm sorry, but I can't make it at the requested time`,
      messageType: 'text',
      metadata: {
        inviteId: invitation._id,
        status
      }
    });
    
    if (responseMessage) {
      statusMessage.content += `. ${responseMessage}`;
    }
    
    await statusMessage.save({ session });
    
    // Update the thread
    thread.lastMessage = {
      content: statusMessage.content,
      sender: userId,
      timestamp: Date.now(),
      messageType: 'text'
    };
    
    // Update unread count for the sender
    const senderId = invitation.sender.toString();
    const currentCount = thread.unreadCount.get(senderId) || 0;
    thread.unreadCount.set(senderId, currentCount + 1);
    
    await thread.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Get populated data for response
    const populatedInvitation = await Invitation.findById(invitation._id)
      .populate('sender', 'firstName lastName email')
      .populate('receiver', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      data: {
        invitation: populatedInvitation
      },
      message: `Invitation ${status} successfully`
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error responding to invitation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while responding to the invitation',
        details: error.message
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