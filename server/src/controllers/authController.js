const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, userType: user.userType },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '1d' }
  );
};

/**
 * User registration
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType, profile } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const newUser = new User({
      email,
      password,
      firstName,
      lastName,
      userType,
      profile
    });
    
    await newUser.save();
    
    // Generate JWT token
    const token = generateToken(newUser);
    
    // Return user data (excluding password) and token
    const userData = newUser.toObject();
    delete userData.password;
    
    res.status(201).json({
      status: 'success',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while registering user',
      error: error.message
    });
  }
};

/**
 * User login
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return user data (excluding password) and token
    const userData = user.toObject();
    delete userData.password;
    
    res.status(200).json({
      status: 'success',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while logging in',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    // User is added to req by auth middleware
    const userData = req.user.toObject();
    delete userData.password;
    
    res.status(200).json({
      status: 'success',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while getting user profile',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
}; 