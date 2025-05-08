const express = require('express');
const router = express.Router();
const { 
  register, 
  login,
  refresh,
  logout,
  getCurrentUser,
  updateUserRole
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', auth, logout);
router.get('/me', auth, getCurrentUser);
router.put('/update-role', auth, updateUserRole);

module.exports = router; 