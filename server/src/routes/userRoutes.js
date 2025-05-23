const express = require('express');
const router = express.Router();
const { 
  getUserProfile,
  updateUserProfile,
  getUserById,
  getUserStats
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validationMiddleware');
const { 
  updateUserProfileSchema, 
  userIdParamsSchema 
} = require('../validations/userValidations');

// Protected routes
router.get('/me', auth, getUserProfile);
router.get('/stats', auth, getUserStats);
router.put('/profile', auth, validate(updateUserProfileSchema), updateUserProfile);
router.get('/:id', auth, validate(userIdParamsSchema), getUserById);

module.exports = router; 