const express = require('express');
const router = express.Router();
const { 
  getUserProfile,
  updateUserProfile,
  getUserById,
  getUserStats
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// Protected routes
router.get('/me', auth, getUserProfile);
router.get('/stats', auth, getUserStats);
router.put('/profile', auth, updateUserProfile);
router.get('/:id', auth, getUserById);

module.exports = router; 