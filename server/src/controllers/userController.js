const User = require('../models/User');

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
 * Get user by ID
 * @route GET /api/users/:userId
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user by ID, excluding password
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching user',
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

module.exports = {
  getUsers,
  getUserById,
  searchUsers
}; 