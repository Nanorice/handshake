const express = require('express');
const router = express.Router();
const { 
  sendMatchRequest, 
  acceptMatchRequest, 
  rejectMatchRequest,
  getUserMatches,
  getMatchById
} = require('../controllers/matchController');
const { auth, authorize } = require('../middleware/auth');

// All match routes require authentication
router.use(auth);

// Routes for all authenticated users
router.get('/', getUserMatches);
router.get('/:id', getMatchById);

// Routes for seekers only
router.post('/request', authorize(['seeker']), sendMatchRequest);

// Routes for professionals only
router.put('/:id/accept', authorize(['professional']), acceptMatchRequest);
router.put('/:id/reject', authorize(['professional']), rejectMatchRequest);

module.exports = router; 