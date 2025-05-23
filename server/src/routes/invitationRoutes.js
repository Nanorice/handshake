const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  sendInvitation,
  getMyInvitations,
  getInvitation,
  respondToInvitation,
  cancelInvitation
} = require('../controllers/invitationController');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const { validate } = require('../middleware/validationMiddleware');
const {
  invitationIdParamsSchema,
  sendInvitationSchema,
  getInvitationsQuerySchema,
  respondToInvitationSchema
} = require('../validations/invitationValidations');

// Simple test route that doesn't rely on any database operations
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Invitation routes test endpoint working'
  });
});

// Test login endpoint for debugging - NO AUTHENTICATION REQUIRED
router.post('/test-login', async (req, res) => {
  try {
    console.log('=== TEST LOGIN ENDPOINT CALLED ===');
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Missing email in request body'
      });
    }
    
    console.log(`Looking up user with email: ${email}`);
    
    // Find the user - don't validate password for this test endpoint
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Create JWT token
    const payload = {
      id: user._id
    };
    
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });
    
    // Return success with token and user data
    return res.status(200).json({
      success: true,
      message: 'Test login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
    
  } catch (error) {
    console.error('Test login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error in test-login endpoint',
      error: error.message
    });
  }
});

// SUPER DIRECT UPDATE - NO AUTH, NO VALIDATION
// This is for absolute emergency testing only
router.post('/direct-update', async (req, res) => {
  try {
    console.log('=== DIRECT UPDATE ENDPOINT CALLED ===');
    console.log('WARNING: This endpoint bypasses all security and business logic');
    
    const { invitationId, status } = req.body;
    
    if (!invitationId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing invitationId or status in request body'
      });
    }
    
    console.log(`Directly updating invitation ${invitationId} with status ${status}`);
    
    // Direct database update that bypasses all middleware and validations
    try {
      // Option 1: Use updateOne - bypasses all middleware and validations
      const updateResult = await Invitation.updateOne(
        { _id: invitationId },
        { $set: { status: status, updatedAt: new Date() } }
      );
      
      console.log('Direct update result:', updateResult);
      
      if (updateResult.modifiedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found or no changes made'
        });
      }
      
      // Get the updated invitation
      const invitation = await Invitation.findById(invitationId);
      
      return res.status(200).json({
        success: true,
        message: 'Invitation updated directly in database',
        invitation: invitation,
        updateResult: updateResult
      });
    } catch (dbError) {
      console.error('Database error during direct update:', dbError);
      
      // Option 2: Even more direct with native MongoDB driver
      try {
        console.log('Trying native MongoDB driver as fallback...');
        const db = Invitation.db;
        const collection = db.collection('invitations');
        
        const nativeResult = await collection.updateOne(
          { _id: Invitation.mongoose.Types.ObjectId(invitationId) },
          { $set: { status: status, updatedAt: new Date() } }
        );
        
        console.log('Native MongoDB update result:', nativeResult);
        
        return res.status(200).json({
          success: true,
          message: 'Invitation updated using native MongoDB driver',
          nativeResult: nativeResult
        });
      } catch (nativeError) {
        console.error('Native MongoDB error:', nativeError);
        throw nativeError;
      }
    }
  } catch (error) {
    console.error('Direct update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error in direct-update endpoint',
      error: error.message,
      stack: error.stack
    });
  }
});

// Debug route to diagnose issues with responding to invitations
// Adding auth middleware to fix 401 errors
router.post('/test-respond', auth, async (req, res) => {
  try {
    console.log('=== TEST RESPOND ENDPOINT CALLED ===');
    console.log('User from auth middleware:', req.user ? req.user._id : 'No user');
    const { invitationId, status } = req.body;
    
    if (!invitationId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing invitationId or status in request body'
      });
    }
    
    console.log(`Testing response to invitation ${invitationId} with status ${status}`);
    
    const Invitation = require('../models/Invitation');
    const invitation = await Invitation.findById(invitationId);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }
    
    // Get raw invitation data
    console.log('Raw invitation data:', JSON.stringify(invitation));
    
    // Try to update status directly
    invitation.status = status;
    try {
      await invitation.save();
      console.log('Successfully updated invitation status directly');
      
      return res.status(200).json({
        success: true,
        message: `Invitation status updated to ${status} successfully`,
        invitation: invitation
      });
    } catch (saveError) {
      console.error('Error saving invitation:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Error saving invitation',
        error: saveError.message,
        stack: saveError.stack
      });
    }
    
  } catch (error) {
    console.error('Test respond error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error in test-respond endpoint',
      error: error.message,
      stack: error.stack
    });
  }
});

// All invitation routes below this line require authentication
router.use(auth);

// Simple test route that requires authentication
router.get('/test-auth', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authenticated invitation routes test endpoint working',
    user: {
      id: req.user._id,
      email: req.user.email
    }
  });
});

// Send an invitation
router.post('/', validate(sendInvitationSchema), sendInvitation);

// Get all invitations for the current user
router.get('/', validate(getInvitationsQuerySchema), getMyInvitations);

// Get a specific invitation
router.get('/:id', validate(invitationIdParamsSchema), getInvitation);

// Respond to an invitation (accept/decline)
router.put('/:id/respond', validate(respondToInvitationSchema), respondToInvitation);

// Cancel an invitation
router.put('/:id/cancel', validate(invitationIdParamsSchema), cancelInvitation); // Only params validation

// Get chat thread for an invitation
router.get('/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the invitation
    const invitation = await Invitation.findById(id);
    
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
    const isParticipant = 
      invitation.sender.toString() === userId.toString() || 
      invitation.receiver.toString() === userId.toString();
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You are not a participant in this invitation'
        }
      });
    }
    
    // Check if invitation is accepted
    if (invitation.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Chat is only available for accepted invitations'
        }
      });
    }
    
    // Get the thread ID
    const threadId = invitation.threadId;
    
    if (!threadId) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Chat thread not found for this invitation'
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        threadId: threadId
      }
    });
  } catch (error) {
    console.error('Error getting chat thread:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while getting the chat thread',
        details: error.message
      }
    });
  }
});

// Unlock chat access for a specific invitation
router.post('/:id/unlock-chat', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the invitation
    const invitation = await Invitation.findById(id);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Invitation not found'
        }
      });
    }
    
    // Check if user is the sender (seeker)
    if (invitation.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only the sender can unlock chat access'
        }
      });
    }
    
    // Check if invitation is accepted
    if (invitation.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Chat can only be unlocked for accepted invitations'
        }
      });
    }
    
    // Set the chat as unlocked
    invitation.chatUnlocked = true;
    await invitation.save();
    
    return res.status(200).json({
      success: true,
      data: {
        threadId: invitation.threadId
      },
      message: 'Chat access unlocked successfully'
    });
  } catch (error) {
    console.error('Error unlocking chat access:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while unlocking chat access',
        details: error.message
      }
    });
  }
});

// Remove an invitation (professional only, for cleaning up accepted invitations)
router.put('/:id/remove', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the invitation
    const invitation = await Invitation.findById(id);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Invitation not found'
        }
      });
    }
    
    // Get user to check if they're a professional
    const user = await User.findById(userId);
    
    if (!user || user.userType !== 'professional') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only professionals can remove accepted invitations'
        }
      });
    }
    
    // Check if user is the receiver (professional)
    if (invitation.receiver.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You can only remove invitations sent to you'
        }
      });
    }
    
    // Check if invitation is accepted
    if (invitation.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Only accepted invitations can be removed'
        }
      });
    }
    
    // Mark the invitation as removed for the professional
    invitation.removedByProfessional = true;
    await invitation.save();
    
    return res.status(200).json({
      success: true,
      message: 'Invitation removed successfully'
    });
  } catch (error) {
    console.error('Error removing invitation:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while removing the invitation',
        details: error.message
      }
    });
  }
});

module.exports = router; 