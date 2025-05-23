const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth'); // Assuming auth middleware is needed
const { getInvitationNotifications } = require('../controllers/notificationController');

// @route   GET /api/notifications/invitations
// @desc    Get invitation notifications for the current user
// @access  Private
router.get('/invitations', auth, getInvitationNotifications);

module.exports = router; 