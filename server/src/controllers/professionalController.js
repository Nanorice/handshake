const User = require('../models/User');

/**
 * Get all professionals with filtering options
 * @route GET /api/professionals
 */
const getProfessionals = async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { 
      industry, 
      position, 
      company, 
      location, 
      interests,
      search,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query based on filters
    const query = { userType: 'professional' };
    
    // Add filters if they exist
    if (industry) query['profile.industry'] = industry;
    if (position) query['profile.position'] = position;
    if (company) query['profile.company'] = company;
    if (location) query['profile.location'] = location;
    
    // Handle interests as array or single value
    if (interests) {
      const interestArray = Array.isArray(interests) ? interests : [interests];
      query['profile.interests'] = { $in: interestArray };
    }
    
    // Handle search term (search across multiple fields)
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { 'profile.industry': { $regex: search, $options: 'i' } },
        { 'profile.position': { $regex: search, $options: 'i' } },
        { 'profile.company': { $regex: search, $options: 'i' } },
        { 'profile.bio': { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    
    // Execute query
    const professionals = await User.find(query)
      .select('-password') // Exclude password
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await User.countDocuments(query);
    
    // Return professionals with pagination info
    res.status(200).json({
      status: 'success',
      data: {
        professionals,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching professionals:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching professionals',
      error: error.message
    });
  }
};

/**
 * Get a single professional by ID
 * @route GET /api/professionals/:id
 */
const getProfessionalById = async (req, res) => {
  try {
    const professional = await User.findOne({
      _id: req.params.id,
      userType: 'professional'
    }).select('-password');
    
    if (!professional) {
      return res.status(404).json({
        status: 'error',
        message: 'Professional not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        professional
      }
    });
  } catch (error) {
    console.error('Error fetching professional:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching the professional',
      error: error.message
    });
  }
};

/**
 * Update professional profile
 * @route PUT /api/professionals/profile
 */
const updateProfile = async (req, res) => {
  try {
    const {
      bio,
      industry,
      company,
      position,
      location,
      interests,
      linkedinUrl,
      website,
      availability
    } = req.body;
    
    // Get the user from the request object (added by auth middleware)
    const user = req.user;
    
    // Check if user is a professional
    if (user.userType !== 'professional') {
      return res.status(403).json({
        status: 'error',
        message: 'Only professionals can update their professional profile'
      });
    }
    
    // Update profile fields
    user.profile = {
      ...user.profile,
      bio: bio !== undefined ? bio : user.profile.bio,
      industry: industry !== undefined ? industry : user.profile.industry,
      company: company !== undefined ? company : user.profile.company,
      position: position !== undefined ? position : user.profile.position,
      location: location !== undefined ? location : user.profile.location,
      interests: interests !== undefined ? interests : user.profile.interests,
      linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : user.profile.linkedinUrl,
      website: website !== undefined ? website : user.profile.website,
      availability: availability !== undefined ? availability : user.profile.availability
    };
    
    // Save updated user
    await user.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the profile',
      error: error.message
    });
  }
};

/**
 * Get available industries (for filtering)
 * @route GET /api/professionals/industries
 */
const getIndustries = async (req, res) => {
  try {
    // Find all unique industries
    const industries = await User.distinct('profile.industry', {
      userType: 'professional',
      'profile.industry': { $exists: true, $ne: '' }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        industries
      }
    });
  } catch (error) {
    console.error('Error fetching industries:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching industries',
      error: error.message
    });
  }
};

module.exports = {
  getProfessionals,
  getProfessionalById,
  updateProfile,
  getIndustries
}; 