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
const { validate } = require('../middleware/validationMiddleware');
const { 
  registerSchema, 
  loginSchema, 
  refreshSchema, 
  updateUserRoleSchema 
} = require('../validations/authValidations');

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);

// Protected routes
router.post('/logout', auth, logout);
router.get('/me', auth, getCurrentUser);
router.put('/update-role', auth, validate(updateUserRoleSchema), updateUserRole);

module.exports = router; 