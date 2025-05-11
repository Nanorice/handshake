const express = require('express');
const router = express.Router();
const { 
  getThreads,
  getMessages,
  sendMessage,
  createThread,
  markThreadAsRead,
  archiveThread
} = require('../controllers/messageController');
const { auth } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

// All message routes require authentication
router.use(auth);

// Thread routes
router.get('/threads', getThreads);
router.post('/threads', createThread);
router.get('/threads/:threadId', getMessages);
router.post('/threads/:threadId', sendMessage);
router.put('/threads/:threadId/read', markThreadAsRead);
router.put('/threads/:threadId/archive', archiveThread);

// Add debug endpoint
router.get('/test', (req, res) => {
  console.log('Message routes test endpoint accessed');
  res.json({
    success: true,
    message: 'Message routes are working!'
  });
});

// Add a debug log for the POST endpoint
router.post('/', (req, res, next) => {
  console.log('Message POST endpoint accessed:', req.body);
  console.log('Headers:', req.headers);
  next();
}, messageController.sendMessage);

module.exports = router; 