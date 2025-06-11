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

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const User = require('../models/User');
    
    // Get the current user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const User = require('../models/User');
    
    console.log('[AUTH PROFILE UPDATE] Request received');
    console.log('[AUTH PROFILE UPDATE] User ID:', userId);
    console.log('[AUTH PROFILE UPDATE] Request body:', JSON.stringify(req.body, null, 2));
    
    // Get the current user
    const user = await User.findById(userId);
    if (!user) {
      console.log('[AUTH PROFILE UPDATE] User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[AUTH PROFILE UPDATE] Current user data:', {
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      preferredName: user.preferredName,
      email: user.email
    });

    // Update allowed fields
    const allowedFields = [
      'name', 'firstName', 'lastName', 'preferredName', 'email', 'university', 'major',
      'graduationYear', 'bio', 'skills', 'linkedinUrl', 'githubUrl',
      'portfolioUrl', 'phoneNumber', 'location', 'resumeUrl'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body.hasOwnProperty(field)) {
        updateData[field] = req.body[field];
        console.log(`[AUTH PROFILE UPDATE] Will update ${field}:`, req.body[field]);
      }
    });

    console.log('[AUTH PROFILE UPDATE] Final update data:', JSON.stringify(updateData, null, 2));

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    console.log('[AUTH PROFILE UPDATE] Updated user data:', {
      name: updatedUser.name,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      preferredName: updatedUser.preferredName,
      email: updatedUser.email
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('[AUTH PROFILE UPDATE] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

module.exports = router; 