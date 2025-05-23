const express = require('express');
const router = express.Router();
const { createMeeting } = require('../controllers/zoomController');
const { auth, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validationMiddleware');
const { createMeetingSchema } = require('../validations/zoomValidations');

// All routes require authentication
router.use(auth);

// Only professionals can create meetings (or admin, adjust as needed)
router.post('/create-meeting', authorize(['professional']), validate(createMeetingSchema), createMeeting);

module.exports = router; 