/**
 * Simplified Invitation Routes
 * 
 * These routes provide a more direct path to essential invitation functionality
 * with improved error handling and reliability.
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { respondToInvitation, getInvitation } = require('../controllers/simpleInvitationController');
const { validate } = require('../middleware/validationMiddleware');
const { 
  invitationIdParamsSchema, 
  simpleRespondToInvitationSchema 
} = require('../validations/invitationValidations');

// All routes below this line require authentication
router.use(auth);

// Basic test route
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Simple invitation routes are working',
    user: {
      id: req.user._id,
      email: req.user.email
    }
  });
});

// Get a specific invitation
router.get('/:id', validate(invitationIdParamsSchema), getInvitation);

// Respond to an invitation (accept/decline)
router.put('/:id/respond', validate(simpleRespondToInvitationSchema), respondToInvitation);

// Export the router
module.exports = router; 