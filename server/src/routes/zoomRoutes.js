const express = require('express');
const router = express.Router();
const { createMeeting } = require('../controllers/zoomController');
const { auth, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Only professionals can create meetings
router.post('/create-meeting', authorize(['professional']), createMeeting);

module.exports = router; 