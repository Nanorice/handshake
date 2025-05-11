const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

// Import the match controller
const matchController = require('../controllers/matchController');

// Test endpoint that doesn't require auth
router.get('/test', (req, res) => {
  console.log('Match routes test endpoint accessed');
  res.json({
    success: true,
    message: 'Match routes are working!'
  });
});

// All other match routes require authentication
router.use(auth);

// Routes for all authenticated users
router.get('/', matchController.getUserMatches);
router.get('/:id', matchController.getMatchById);

// Routes for seekers only
router.post('/request', (req, res, next) => {
  console.log('Match request endpoint accessed:', req.body);
  console.log('Headers:', req.headers);
  next();
}, authorize(['seeker']), matchController.sendMatchRequest);

// Routes for professionals only
router.put('/:id/accept', authorize(['professional']), matchController.acceptMatchRequest);
router.put('/:id/reject', authorize(['professional']), matchController.rejectMatchRequest);

module.exports = router; 