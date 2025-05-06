const User = require('../models/User');

/**
 * Get current user's profile
 * @route GET /api/users/me
 */
const getUserProfile = async (req, res) => {
  try {
    // User is attached to req by auth middleware
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    const userData = user.toObject();
    delete userData.password;
    
    res.status(200).json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
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
 * Update current user's profile
 * @route PUT /api/users/profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const { name, bio, linkedinUrl } = req.body;
    
    // Find user by ID (from auth middleware)
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Update user fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl;
    
    // Save updated user
    await user.save();
    
    const userData = user.toObject();
    delete userData.password;
    
    res.status(200).json({
      success: true,
      data: {
        user: userData
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating user profile'
      }
    });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Check if the requesting user is trying to access another user's private data
    if (user._id.toString() !== req.user._id.toString() && user.role === 'seeker') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to view this user\'s profile'
        }
      });
    }
    
    const userData = user.toObject();
    delete userData.password;
    
    res.status(200).json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while getting user'
      }
    });
  }
};

/**
 * Get all users (optional filtering by userType)
 * @route GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const { userType } = req.query;
    
    // Build query based on parameters
    const query = {};
    if (userType) {
      query.userType = userType;
    }
    
    // Find users matching query, excluding password
    const users = await User.find(query).select('-password');
    
    res.status(200).json({
      status: 'success',
      data: {
        users,
        count: users.length
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching users',
      error: error.message
    });
  }
};

/**
 * Search for users by name or email
 * @route GET /api/users/search
 */
const searchUsers = async (req, res) => {
  try {
    const { query, userType } = req.query;
    
    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }
    
    // Build search criteria
    const searchCriteria = {
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    };
    
    // Add userType filter if specified
    if (userType) {
      searchCriteria.userType = userType;
    }
    
    // Find users matching criteria, excluding password
    const users = await User.find(searchCriteria).select('-password');
    
    res.status(200).json({
      status: 'success',
      data: {
        users,
        count: users.length
      }
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while searching users',
      error: error.message
    });
  }
};

/**
 * Get user statistics for dashboard
 * @route GET /api/users/stats
 */
const getUserStats = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      console.error('User ID missing in getUserStats');
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User ID is required'
        }
      });
    }
    
    const userId = req.user._id;
    console.log(`Getting stats for user: ${userId}`);
    
    try {
      // For a real app, these would be actual queries to get metrics
      // For now, we'll return mock data that matches what the frontend expects
      
      // You would replace this with actual database queries in a production app
      const stats = {
        pendingRequests: Math.floor(Math.random() * 5),
        totalMatches: Math.floor(Math.random() * 10) + 5,
        completedMeetings: Math.floor(Math.random() * 8),
        profileViews: Math.floor(Math.random() * 50) + 10
      };
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (dbError) {
      console.error('Database error in getUserStats:', dbError);
      
      // Provide mock data as a fallback
      return res.status(200).json({
        success: true,
        data: {
          pendingRequests: 2,
          totalMatches: 8,
          completedMeetings: 3,
          profileViews: 25,
          isMockData: true
        },
        message: 'Using mock data due to database error'
      });
    }
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while getting user statistics'
      }
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserById,
  getUserStats
}; 