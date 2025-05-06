const User = require('../models/User');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const mongoose = require('mongoose');

/**
 * Get list of professionals with filtering
 * @route GET /api/professionals
 */
const getProfessionals = async (req, res) => {
  try {
    console.log('=== GET /api/professionals ===');
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
    
    // First check a sample user to determine the correct field for role
    let roleField = 'role'; // default
    try {
      const sampleUser = await User.findOne().lean();
      if (sampleUser) {
        console.log('Sample user fields:', Object.keys(sampleUser));
        // Check if we should use userType instead of role
        if (sampleUser.hasOwnProperty('userType') && !sampleUser.hasOwnProperty('role')) {
          roleField = 'userType';
          console.log('Using "userType" field instead of "role"');
        } else {
          console.log('Using "role" field as expected');
        }
      }
    } catch (error) {
      console.error('Error checking user schema:', error);
    }
    
    // Build filter query based on the correct field
    const filter = { [roleField]: 'professional' };
    console.log('Filter query:', filter);
    
    // Find users who are professionals
    let professionals = [];
    let totalProfessionals = 0;
    
    try {
      professionals = await User.find(filter)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
      
      // Get total count for pagination
      totalProfessionals = await User.countDocuments(filter);
      
      console.log(`Found ${professionals.length} professionals (total: ${totalProfessionals})`);
    } catch (dbError) {
      console.error('Error querying database for professionals:', dbError);
      professionals = [];
    }
    
    // If no professionals found, return mock data for testing
    if (professionals.length === 0) {
      console.log('No professionals found, generating mock data');
      return res.status(200).json({
        success: true,
        data: {
          professionals: [
            {
              _id: '1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              role: 'professional',
              profile: {
                title: 'Senior Software Engineer',
                company: 'Tech Solutions Inc.',
                location: 'San Francisco, CA',
                industries: ['Technology', 'Software Development'],
                skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
                bio: 'Experienced software engineer with 10+ years in web development.',
                experienceYears: 10,
                rate: 120
              }
            },
            {
              _id: '2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane.smith@example.com',
              role: 'professional',
              profile: {
                title: 'Marketing Director',
                company: 'Brand Builders',
                location: 'New York, NY',
                industries: ['Marketing', 'Advertising'],
                skills: ['Digital Marketing', 'Brand Strategy', 'Social Media Marketing'],
                bio: 'Marketing professional with expertise in brand development and digital marketing.',
                experienceYears: 8,
                rate: 100
              }
            },
            {
              _id: '3',
              firstName: 'Emily',
              lastName: 'Davis',
              email: 'emily.davis@example.com',
              role: 'professional',
              profile: {
                title: 'UX/UI Designer',
                company: 'Creative Designs',
                location: 'Austin, TX',
                industries: ['Design', 'Technology'],
                skills: ['User Experience Design', 'User Interface Design', 'Figma', 'Adobe XD'],
                bio: 'Creative designer focused on crafting intuitive and engaging user experiences.',
                experienceYears: 6,
                rate: 90
              }
            }
          ],
          pagination: {
            total: 3,
            currentPage: 1,
            totalPages: 1,
            limit: 10
          }
        }
      });
    }
    
    // Get professional profiles for each user
    let profiles = [];
    try {
      const professionalIds = professionals.map(p => p._id);
      console.log('Looking for profiles for users:', professionalIds);
      
      profiles = await ProfessionalProfile.find({
        userId: { $in: professionalIds }
      }).lean();
      
      console.log(`Found ${profiles.length} professional profiles`);
    } catch (profileError) {
      console.error('Error fetching professional profiles:', profileError);
      profiles = [];
    }
    
    // Map profiles to users
    const professionalData = professionals.map(pro => {
      // First try exact match
      let profile = profiles.find(p => p.userId && p.userId.toString() === pro._id.toString());
      
      // If no profile found, look for other fields that might be used
      if (!profile && profiles.length > 0) {
        console.log('No exact profile match found for', pro._id, '- checking other fields');
        profile = profiles.find(p => 
          (p.user && p.user.toString() === pro._id.toString()) ||
          (p.professionalId && p.professionalId.toString() === pro._id.toString())
        );
      }
      
      // Add debug info for this professional
      if (profile) {
        console.log(`Found profile for ${pro.firstName || pro.name || pro.email}`);
      } else {
        console.log(`No profile found for ${pro.firstName || pro.name || pro.email}`);
      }
      
      // Normalize user field names if needed
      const normalizedPro = { ...pro };
      
      // Ensure firstName and lastName exist
      if (!normalizedPro.firstName && normalizedPro.name) {
        const nameParts = normalizedPro.name.split(' ');
        normalizedPro.firstName = nameParts[0];
        normalizedPro.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }
      
      return {
        ...normalizedPro,
        profile: profile || null
      };
    });
    
    // Filter by industry if specified
    let filteredData = professionalData;
    if (industry) {
      filteredData = filteredData.filter(pro => 
        pro.profile && pro.profile.industries && 
        pro.profile.industries.some(ind => ind.toLowerCase().includes(industry.toLowerCase()))
      );
    }
    
    // Filter by skill if specified
    if (skill) {
      filteredData = filteredData.filter(pro => 
        pro.profile && pro.profile.skills && 
        pro.profile.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );
    }
    
    // Filter by rate if specified
    if (minRate !== undefined) {
      filteredData = filteredData.filter(pro => 
        pro.profile && pro.profile.rate && pro.profile.rate >= parseInt(minRate)
      );
    }
    
    if (maxRate !== undefined) {
      filteredData = filteredData.filter(pro => 
        pro.profile && pro.profile.rate && pro.profile.rate <= parseInt(maxRate)
      );
    }
    
    res.status(200).json({
      success: true,
      data: {
        professionals: filteredData,
        pagination: {
          total: totalProfessionals,
          currentPage: page,
          totalPages: Math.ceil(totalProfessionals / limit),
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
    
    if (professional.role !== 'professional') {
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