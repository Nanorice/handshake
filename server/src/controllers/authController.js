const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'your_jwt_secret';
  console.log('Using JWT secret:', secret ? 'Secret provided' : 'Using fallback secret');
  
  return jwt.sign(
    { userId: user._id, userType: user.userType },
    secret,
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
  console.log('==== REGISTRATION REQUEST RECEIVED ====');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  try {
    // Validate database connection
    const dbState = mongoose.connection.readyState;
    console.log('MongoDB connection state:', dbState);
    
    if (dbState !== 1) {
      console.error('Database not connected. Current state:', dbState);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database is not connected. Please try again later.'
        }
      });
    }

    // Extract user data from request
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      userType,
      university,
      major,
      graduationYear,
      interests,
      careerGoals,
      linkedinUrl,
    } = req.body;
    
    console.log('Extracted user data:', {
      email,
      password: password ? '[PROVIDED]' : '[MISSING]',
      firstName,
      lastName,
      userType,
    });
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Required fields missing: email, password, firstName, lastName'
        }
      });
    }

    // Check if user already exists
    console.log('Checking if user already exists with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User with this email already exists'
        }
      });
    }

    // Create new user
    console.log('Creating new user with role:', userType || 'seeker');
    const newUser = new User({
      email,
      password,
      name: `${firstName} ${lastName}`,
      role: userType || 'seeker',
      linkedinUrl
    });
    
    // Validate user model
    console.log('Validating user model');
    const validationError = newUser.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation error',
          details: validationError.errors
        }
      });
    }
    
    // Save user to database
    console.log('Saving user to database');
    try {
      await newUser.save();
      console.log('User saved successfully with ID:', newUser._id);
      
      // Create a professional profile if user type is professional
      if (userType === 'professional') {
        console.log('Creating initial professional profile');
        try {
          const ProfessionalProfile = require('../models/ProfessionalProfile');
          const newProfile = new ProfessionalProfile({
            userId: newUser._id,
            industries: [],
            skills: [],
            experience: [],
            availability: [],
            rate: 0,
            bio: "",
            title: "",
            name: `${firstName} ${lastName}`,
            email: email,
            profilePicture: "",
          });
          await newProfile.save();
          console.log('Created initial professional profile');
        } catch (profileError) {
          console.error('Error creating professional profile:', profileError);
          // Continue with registration even if profile creation fails
          // We'll create it later if needed
        }
      }
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Error saving user: ' + saveError.message
        }
      });
    }
    
    // Generate authentication tokens
    console.log('Generating authentication tokens');
    try {
      const token = generateToken(newUser);
      const refreshToken = generateRefreshToken(newUser);
      
      // Prepare response data (excluding password)
      const userData = newUser.toObject();
      delete userData.password;
      
      // Add additional user info to response
      userData.firstName = firstName;
      userData.lastName = lastName;
      
      console.log('Registration successful, sending response');
      
      // Return success response
      return res.status(201).json({
        success: true,
        data: {
          user: userData,
          token,
          refreshToken
        },
        message: 'User registered successfully'
      });
    } catch (tokenError) {
      console.error('Error generating tokens:', tokenError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'TOKEN_ERROR',
          message: 'Error generating authentication tokens: ' + tokenError.message
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during registration: ' + error.message
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
    
    // Create a professional profile if role is set to professional
    if (role === 'professional') {
      console.log('Creating professional profile on role update');
      try {
        const ProfessionalProfile = require('../models/ProfessionalProfile');
        // Check if a profile already exists
        const existingProfile = await ProfessionalProfile.findOne({ userId });
        if (!existingProfile) {
          // Create a new profile
          const newProfile = new ProfessionalProfile({
            userId,
            industries: [],
            skills: [],
            experience: [],
            availability: [],
            rate: 0,
            bio: "",
            title: "",
            name: `${updatedUser.firstName || ""} ${updatedUser.lastName || ""}`,
            email: updatedUser.email,
            profilePicture: "",
          });
          await newProfile.save();
          console.log('Created professional profile on role update');
        } else {
          console.log('Professional profile already exists');
        }
      } catch (profileError) {
        console.error('Error creating professional profile:', profileError);
        // Continue even if profile creation fails
      }
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