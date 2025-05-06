const express = require('express');
const router = express.Router();
const { 
  bookSession,
  getMySessions,
  getSessionById,
  updateSession,
  cancelSession,
  getUpcomingSessions,
  getAllSessions
} = require('../controllers/sessionController');
const { auth, authorize } = require('../middleware/auth');

// All session routes require authentication
router.use(auth);

// Get all sessions or upcoming sessions
router.get('/', getAllSessions);
router.get('/upcoming', getUpcomingSessions);

// Session booking
router.post('/book', bookSession);

// Get user's sessions
router.get('/my', getMySessions);

// Session management
router.get('/:id', getSessionById);
router.put('/:id', updateSession);
router.delete('/:id', cancelSession);

module.exports = router; 