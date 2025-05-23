const express = require('express');
const router = express.Router();
const { 
  getThreads,
  getMessages,
  sendMessage,
  createThread,
  markThreadAsRead,
  archiveThread,
  getMessagesForThread,
  deduplicateThreads
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

// Reply to a specific message
router.post('/threads/:threadId/reply/:messageId', (req, res, next) => {
  // Add the messageId to the request body as replyToId
  req.body.replyToId = req.params.messageId;
  next();
}, sendMessage);

// New route specifically for fetching messages of a thread
// GET /api/messages/:threadId/messages
router.get('/:threadId/messages', getMessagesForThread);

// Utility endpoints
router.get('/utils/dedup-threads', deduplicateThreads);

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