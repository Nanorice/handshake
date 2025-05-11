const User = require('../models/User');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Database configuration reference
const DATABASE_NAME = process.env.MONGODB_URI ? 
  process.env.MONGODB_URI.split('/').pop() : 
  'test';

/**
 * Get list of professionals with filtering
 * @route GET /api/professionals
 */
const getProfessionals = async (req, res) => {
  try {
    console.log('\n=== GET /api/professionals ===');
    console.log('Query params:', req.query);
    console.log('Database:', mongoose.connection.db.databaseName);
    
    const { 
      industry,
      skill,
      minRate,
      maxRate,
      page = 1,
      limit = 10
    } = req.query;
    
    // Find all professional profiles
    let query = {};
    
    // Apply filters directly to the query
    if (industry && industry !== 'All') {
      query.industries = { $regex: industry, $options: 'i' };
    }
    
    if (skill) {
      query.skills = { $regex: skill, $options: 'i' };
    }
    
    if (minRate) {
      query.rate = { $gte: Number(minRate) };
    }
    
    if (maxRate) {
      query.rate = { ...query.rate, $lte: Number(maxRate) };
    }
    
    // Count total matching documents for pagination
    const totalCount = await ProfessionalProfile.countDocuments(query);
    
    // Apply pagination
    const skip = (page - 1) * limit;
    
    // Get professional profiles with user data
    const profiles = await ProfessionalProfile.find(query)
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', '-password') // Join with User collection
      .lean();
    
    console.log(`Found ${profiles.length} professional profiles`);
    
    // Format the data for the frontend
    const professionals = profiles.map(profile => {
      // Extract user data from the populated userId field
      const user = profile.userId || {};
      
      return {
        _id: user._id || profile.userId,
        firstName: user.firstName || profile.name?.split(' ')[0] || '',
        lastName: user.lastName || profile.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || profile.email,
        role: 'professional',
        userType: 'professional',
        profileImage: user.profileImage || profile.profilePicture,
        // Profile data
        profile: {
          title: profile.title || '',
          bio: profile.bio || '',
          industries: profile.industries || [],
          skills: profile.skills || [],
          rate: profile.rate || 0,
          experience: profile.experience || []
        }
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        professionals,
        pagination: {
          total: totalCount,
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting professionals:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while getting professionals'
      }
    });
  }
};

/**
 * Get specific professional details
 * @route GET /api/professionals/:id
 */
const getProfessionalById = async (req, res) => {
  try {
    const professionalId = req.params.id;
    
    // Find user by ID
    const professional = await User.findById(professionalId).select('-password').lean();
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Professional not found'
        }
      });
    }
    
    // Check both role fields
    if (professional.role !== 'professional' && professional.userType !== 'professional') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User is not a professional'
        }
      });
    }
    
    // Get professional profile
    const profile = await ProfessionalProfile.findOne({ userId: professionalId }).lean();
    
    res.status(200).json({
      success: true,
      data: {
        professional: {
          ...professional,
          profile: profile || null
        }
      }
    });
  } catch (error) {
    console.error('Error getting professional by ID:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while getting professional details'
      }
    });
  }
};

/**
 * Update professional availability
 * @route POST /api/professionals/availability
 */
const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    
    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Availability must be an array'
        }
      });
    }
    
    // Validate availability format
    for (const slot of availability) {
      if (!slot.day || !slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Each availability slot must have day, startTime, and endTime'
          }
        });
      }
      
      // Validate time format (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Time must be in format HH:MM (24-hour format)'
          }
        });
      }
      
      // Validate that endTime is after startTime
      const start = slot.startTime.split(':').map(Number);
      const end = slot.endTime.split(':').map(Number);
      
      if (start[0] > end[0] || (start[0] === end[0] && start[1] >= end[1])) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'End time must be after start time'
          }
        });
      }
    }
    
    // Get professional profile or create if it doesn't exist
    let profile = await ProfessionalProfile.findOne({ userId: req.user._id });
    
    if (!profile) {
      profile = new ProfessionalProfile({
        userId: req.user._id,
        industries: [],
        skills: [],
        experience: [],
        availability: [],
        rate: 0
      });
    }
    
    // Update availability
    profile.availability = availability;
    
    await profile.save();
    
    res.status(200).json({
      success: true,
      data: {
        availability: profile.availability
      },
      message: 'Availability updated successfully'
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating availability'
      }
    });
  }
};

module.exports = {
  getProfessionals,
  getProfessionalById,
  updateAvailability
}; 