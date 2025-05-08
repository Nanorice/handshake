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
 * Generate refresh token for user
 * @param {Object} user - User object
 * @returns {String} Refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret',
    { expiresIn: '7d' }
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
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User with this email already exists'
        }
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
    
    // Generate tokens
    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    
    // Return user data (excluding password) and token
    const userData = newUser.toObject();
    delete userData.password;
    
    res.status(201).json({
      success: true,
      data: {
        user: userData,
        token,
        refreshToken
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while registering user'
      }
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
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }
    
    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Return user data (excluding password) and token
    const userData = user.toObject();
    delete userData.password;
    
    res.status(200).json({
      success: true,
      data: {
        user: userData,
        token,
        refreshToken
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while logging in'
      }
    });
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required'
        }
      });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret');
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid refresh token'
        }
      });
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while refreshing token'
      }
    });
  }
};

/**
 * User logout
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // In a real implementation, you might want to invalidate the token
    // by adding it to a blacklist or similar mechanism
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while logging out'
      }
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
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while getting user profile'
      }
    });
  }
};

/**
 * Update current user's role
 * @route PUT /api/auth/update-role
 */
const updateUserRole = async (req, res) => {
  try {
    const userId = req.user._id;
    const { role } = req.body;
    
    if (!role || !['seeker', 'professional'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid role (seeker or professional) is required'
        }
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { role } },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Return updated user data (excluding password)
    const userData = updatedUser.toObject();
    delete userData.password;
    
    res.status(200).json({
      success: true,
      data: {
        user: userData
      },
      message: `User role updated to ${role} successfully`
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating user role'
      }
    });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  updateUserRole
}; 