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

// All message routes require authentication
router.use(auth);

// Thread routes
router.get('/threads', getThreads);
router.post('/threads', createThread);
router.get('/threads/:threadId', getMessages);
router.post('/threads/:threadId', sendMessage);
router.put('/threads/:threadId/read', markThreadAsRead);
router.put('/threads/:threadId/archive', archiveThread);

module.exports = router; 