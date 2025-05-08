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
    console.log('Expected database:', DATABASE_NAME);
    
    const { 
      industry,
      skill,
      minRate,
      maxRate,
      page = 1,
      limit = 10
    } = req.query;
    
    // Find all professionals by either role or userType
    const filter = {
      $or: [
        { role: 'professional' },
        { userType: 'professional' }
      ]
    };
    
    // Find all professionals
    const professionals = await User.find(filter)
      .select('-password')
      .lean();
    
    console.log(`Found ${professionals.length} professionals`);
    
    // Get all professional profiles
    const profiles = await ProfessionalProfile.find({}).lean();
    console.log(`Found ${profiles.length} professional profiles`);
    
    // Map professionals with their profiles
    const professionalData = professionals.map(pro => {
      // Find matching profile
      const profile = profiles.find(p => 
        p.userId && (p.userId.toString() === pro._id.toString() || p.userId === pro._id.toString())
      );
      
      // Create default profile from user data if no profile found
      const defaultProfile = {
        title: pro.title || pro.profession || 'Professional',
        company: pro.company || pro.organization || 'Independent',
        location: pro.location || 'Remote',
        industries: pro.industries || ['General'],
        skills: pro.skills || ['Consulting'],
        bio: pro.bio || `Professional with expertise in various domains.`,
        rate: 100,
        availability: [],
        experience: []
      };
      
      // Log whether profile was found or created
      if (profile) {
        console.log(`Using existing profile for ${pro.email || pro._id}`);
      } else {
        console.log(`Using default profile for ${pro.email || pro._id}`);
      }
      
      // Normalize user data
      const normalizedPro = { ...pro };
      
      // Ensure name fields exist
      if (!normalizedPro.firstName && normalizedPro.name) {
        const nameParts = normalizedPro.name.split(' ');
        normalizedPro.firstName = nameParts[0];
        normalizedPro.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }
      
      // Ensure both fields are set
      normalizedPro.role = 'professional';
      normalizedPro.userType = 'professional';
      
      // Combine user with profile (use existing or default)
      return {
        ...normalizedPro,
        profile: profile || defaultProfile
      };
    });
    
    // Apply filtering
    let filteredData = professionalData;
    
    // Filter by industry if specified and non-empty
    if (industry && industry !== 'All') {
      filteredData = filteredData.filter(pro => 
        pro.profile && pro.profile.industries && 
        pro.profile.industries.some(ind => 
          ind.toLowerCase().includes(industry.toLowerCase())
        )
      );
    }
    
    // Filter by skill if specified
    if (skill) {
      filteredData = filteredData.filter(pro => 
        pro.profile && pro.profile.skills && 
        pro.profile.skills.some(s => 
          s.toLowerCase().includes(skill.toLowerCase())
        )
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    console.log(`Returning ${paginatedData.length} professionals after filtering and pagination`);
    
    res.status(200).json({
      success: true,
      data: {
        professionals: paginatedData,
        pagination: {
          total: filteredData.length,
          currentPage: page,
          totalPages: Math.ceil(filteredData.length / limit),
          limit
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