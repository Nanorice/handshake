const mongoose = require('mongoose');
const Match = require('../models/Match');
const User = require('../models/User');

/**
 * Send a match request from seeker to professional
 * @route POST /api/matches/request
 */
const sendMatchRequest = async (req, res) => {
  try {
    const { professionalId } = req.body;
    const seekerId = req.user._id;
    
    // Validate input
    if (!professionalId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Professional ID is required'
        }
      });
    }
    
    // Check if professional exists
    const professional = await User.findOne({
      _id: professionalId,
      $or: [{ role: 'professional' }, { userType: 'professional' }]
    });
    
    if (!professional) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Professional not found'
        }
      });
    }
    
    // Check if match request already exists
    const existingMatch = await Match.findOne({
      seeker: seekerId,
      professional: professionalId
    });
    
    if (existingMatch) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Match request already exists'
        },
        data: {
          match: existingMatch
        }
      });
    }
    
    // Create new match request
    const newMatch = new Match({
      seeker: seekerId,
      professional: professionalId,
      status: 'pending'
    });
    
    await newMatch.save();
    
    res.status(201).json({
      success: true,
      data: {
        match: newMatch
      },
      message: 'Match request sent successfully'
    });
  } catch (error) {
    console.error('Error sending match request:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while sending match request'
      }
    });
  }
};

/**
 * Accept a match request (by professional)
 * @route PUT /api/matches/:id/accept
 */
const acceptMatchRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const professionalId = req.user._id;
    
    // Find match request
    const match = await Match.findById(id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Match request not found'
        }
      });
    }
    
    // Verify this professional is the recipient of the request
    if (match.professional.toString() !== professionalId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to accept this match request'
        }
      });
    }
    
    // Check if already accepted
    if (match.status === 'accepted') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Match request already accepted'
        }
      });
    }
    
    // Update match status
    match.status = 'accepted';
    match.acceptedAt = Date.now();
    await match.save();
    
    res.status(200).json({
      success: true,
      data: {
        match
      },
      message: 'Match request accepted'
    });
  } catch (error) {
    console.error('Error accepting match request:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while accepting match request'
      }
    });
  }
};

/**
 * Reject a match request (by professional)
 * @route PUT /api/matches/:id/reject
 */
const rejectMatchRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const professionalId = req.user._id;
    
    // Find match request
    const match = await Match.findById(id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Match request not found'
        }
      });
    }
    
    // Verify this professional is the recipient of the request
    if (match.professional.toString() !== professionalId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to reject this match request'
        }
      });
    }
    
    // Update match status
    match.status = 'rejected';
    match.rejectedAt = Date.now();
    await match.save();
    
    res.status(200).json({
      success: true,
      data: {
        match
      },
      message: 'Match request rejected'
    });
  } catch (error) {
    console.error('Error rejecting match request:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while rejecting match request'
      }
    });
  }
};

/**
 * Get matches for the current user (works for both seekers and professionals)
 * @route GET /api/matches
 */
const getUserMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    // Check both role and userType to handle different field names
    const userRole = req.user.role || req.user.userType;
    
    // Verify user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication required'
        }
      });
    }
    
    // Build query based on user role
    let query;
    if (userRole === 'seeker') {
      query = { seeker: userId };
    } else if (userRole === 'professional') {
      query = { professional: userId };
    } else {
      // If role is undefined or not recognized
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user role'
        }
      });
    }
    
    // Apply status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Find matches
    const matches = await Match.find(query)
      .populate('seeker', 'name profileImage')
      .populate('professional', 'name profileImage')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        matches
      }
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching matches'
      }
    });
  }
};

/**
 * Get a single match by ID
 * @route GET /api/matches/:id
 */
const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find match
    const match = await Match.findById(id)
      .populate('seeker', 'name profileImage')
      .populate('professional', 'name profileImage');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Match not found'
        }
      });
    }
    
    // Check if user is part of this match
    const isUserInvolved = 
      match.seeker._id.toString() === userId.toString() || 
      match.professional._id.toString() === userId.toString();
    
    if (!isUserInvolved) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to view this match'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        match
      }
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching match'
      }
    });
  }
};

/**
 * Simple test endpoint to verify the matches API is working
 * @route GET /api/matches/test
 */
const testMatchesApi = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Matches API is working!',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  sendMatchRequest,
  acceptMatchRequest,
  rejectMatchRequest,
  getUserMatches,
  getMatchById,
  testMatchesApi
}; 