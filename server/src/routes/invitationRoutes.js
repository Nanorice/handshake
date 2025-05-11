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

// All invitation routes require authentication
router.use(auth);

// Get all invitations for the current user
router.get('/', getMyInvitations);

// Get a specific invitation
router.get('/:id', getInvitation);

// Send a new invitation
router.post('/', (req, res, next) => {
  console.log('Invitation POST endpoint accessed:', req.body);
  console.log('Headers:', req.headers);
  next();
}, sendInvitation);

// Respond to an invitation (accept/decline)
router.put('/:id/respond', respondToInvitation);

// Cancel an invitation (sender only)
router.put('/:id/cancel', cancelInvitation);

// Add debug endpoint
router.get('/test', (req, res) => {
  console.log('Invitation routes test endpoint accessed');
  res.json({
    success: true,
    message: 'Invitation routes are working!'
  });
});

module.exports = router; 