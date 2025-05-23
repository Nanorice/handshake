/**
 * Simplified Invitation Controller
 * 
 * This controller implements a more reliable version of the invitation response
 * functionality without the complex error handling and with proper transactions.
 */

const Invitation = require('../models/Invitation');
const Thread = require('../models/Thread');
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Respond to an invitation (accept/decline)
 * 
 * This implementation uses a transaction to ensure data consistency
 * and has simplified error handling.
 * 
 * @route PUT /api/simple-invitations/:id/respond
 */
const respondToInvitation = async (req, res) => {
  // Start a MongoDB session for transactions
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { status, responseMessage } = req.body;
    const userId = req.user._id;
    
    console.log(`Simple invitation response for ID ${id} with status ${status}`);
    
    // Validate status
    if (!['accepted', 'declined'].includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Status must be either accepted or declined'
      });
    }
    
    // Find the invitation with session
    const invitation = await Invitation.findById(id).session(session);
    
    if (!invitation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    // Check if the current user is the receiver
    if (invitation.receiver.toString() !== userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'Only the recipient can respond to an invitation'
      });
    }
    
    // Check if invitation is already responded to
    if (invitation.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `This invitation has already been ${invitation.status}`
      });
    }
    
    // Update invitation status
    invitation.status = status;
    await invitation.save({ session });
    
    // Get the thread or create it if it doesn't exist
    let thread = null;
    
    if (invitation.threadId) {
      thread = await Thread.findById(invitation.threadId).session(session);
    }
    
    if (!thread) {
      thread = new Thread({
        participants: [invitation.sender, invitation.receiver],
        metadata: {
          isGroupChat: false
        },
        unreadCount: new Map()
      });
      await thread.save({ session });
      
      // Update invitation with the new thread
      invitation.threadId = thread._id;
      await invitation.save({ session });
    }
    
    // Create a response message
    let messageContent = status === 'accepted' 
      ? `I've accepted your invitation` 
      : `I'm sorry, but I can't make it at the requested time`;
      
    if (invitation.sessionDetails && invitation.sessionDetails.proposedDate) {
      messageContent = status === 'accepted' 
        ? `I've accepted your invitation for ${new Date(invitation.sessionDetails.proposedDate).toLocaleString()}`
        : `I'm sorry, but I can't make it on ${new Date(invitation.sessionDetails.proposedDate).toLocaleString()}`;
    }
    
    if (responseMessage) {
      messageContent += `. ${responseMessage}`;
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
    
    await statusMessage.save({ session });
    
    // Update the thread's last message
    thread.lastMessage = {
      content: messageContent,
      sender: userId,
      timestamp: Date.now(),
      messageType: 'text'
    };
    
    // Update unread count for the sender
    const senderId = invitation.sender.toString();
    const currentCount = thread.unreadCount.get(senderId) || 0;
    thread.unreadCount.set(senderId, currentCount + 1);
    
    await thread.save({ session });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    // Get populated data for response
    const populatedInvitation = await Invitation.findById(invitation._id)
      .populate('sender', 'firstName lastName email profileImage')
      .populate('receiver', 'firstName lastName email profileImage');
    
    // Try to emit socket event if socket.io is available
    try {
      const io = req.io || req.app.get('io');
      
      if (io) {
        const notificationData = {
          type: status === 'accepted' ? 'invitation_accepted' : 'invitation_declined',
          invitation: populatedInvitation,
          sender: populatedInvitation.receiver,
          receiver: populatedInvitation.sender
        };
        
        io.to(senderId).emit('invitation-notification', notificationData);
      }
    } catch (socketError) {
      // Log but don't fail the request
      console.error('Socket emission error:', socketError);
    }
    
    // Send the success response
    return res.status(200).json({
      success: true,
      message: `Invitation ${status} successfully`,
      data: {
        invitation: populatedInvitation
      }
    });
    
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error responding to invitation:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred while responding to the invitation',
      error: error.message
    });
  }
};

/**
 * Get a specific invitation by ID
 * @route GET /api/simple-invitations/:id
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
        message: 'Invitation not found'
      });
    }
    
    // Check if user is part of this invitation
    if (invitation.sender.toString() !== userId.toString() && 
        invitation.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this invitation'
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
      message: 'An error occurred while fetching the invitation',
      error: error.message
    });
  }
};

module.exports = {
  respondToInvitation,
  getInvitation
}; 