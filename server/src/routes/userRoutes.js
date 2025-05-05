const express = require('express');
const router = express.Router();
const { 
  getUsers,
  getUserById,
  searchUsers
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// All user routes require authentication
router.use(auth);

// Get all users (can filter by userType)
router.get('/', getUsers);

// Search users by name or email
router.get('/search', searchUsers);

// Get user by ID
router.get('/:userId', getUserById);

module.exports = router; 