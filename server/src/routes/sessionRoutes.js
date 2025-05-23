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
const { validate } = require('../middleware/validationMiddleware');
const {
  sessionIdParamsSchema,
  listSessionsQuerySchema,
  bookSessionSchema,
  updateSessionSchema
} = require('../validations/sessionValidations');

// All session routes require authentication
router.use(auth);

// Get all sessions or upcoming sessions
router.get('/', validate(listSessionsQuerySchema), getAllSessions);
router.get('/upcoming', validate(listSessionsQuerySchema), getUpcomingSessions);

// Session booking
router.post('/book', validate(bookSessionSchema), bookSession);

// Get user's sessions
router.get('/my', validate(listSessionsQuerySchema), getMySessions);

// Session management
router.get('/:id', validate(sessionIdParamsSchema), getSessionById);
router.put('/:id', validate(updateSessionSchema), updateSession);
router.delete('/:id', validate(sessionIdParamsSchema), cancelSession);

module.exports = router; 