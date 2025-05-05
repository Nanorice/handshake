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
        status: 'error',
        message: 'Professional ID is required'
      });
    }
    
    // Check if professional exists
    const professional = await User.findOne({
      _id: professionalId,
      userType: 'professional'
    });
    
    if (!professional) {
      return res.status(404).json({
        status: 'error',
        message: 'Professional not found'
      });
    }
    
    // Check if match request already exists
    const existingMatch = await Match.findOne({
      seeker: seekerId,
      professional: professionalId
    });
    
    if (existingMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Match request already exists',
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
      status: 'success',
      message: 'Match request sent successfully',
      data: {
        match: newMatch
      }
    });
  } catch (error) {
    console.error('Error sending match request:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while sending match request',
      error: error.message
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
        status: 'error',
        message: 'Match request not found'
      });
    }
    
    // Verify this professional is the recipient of the request
    if (match.professional.toString() !== professionalId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to accept this match request'
      });
    }
    
    // Check if already accepted
    if (match.status === 'accepted') {
      return res.status(400).json({
        status: 'error',
        message: 'Match request already accepted'
      });
    }
    
    // Update match status
    match.status = 'accepted';
    match.acceptedAt = Date.now();
    await match.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Match request accepted',
      data: {
        match
      }
    });
  } catch (error) {
    console.error('Error accepting match request:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while accepting match request',
      error: error.message
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
        status: 'error',
        message: 'Match request not found'
      });
    }
    
    // Verify this professional is the recipient of the request
    if (match.professional.toString() !== professionalId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to reject this match request'
      });
    }
    
    // Update match status
    match.status = 'rejected';
    match.rejectedAt = Date.now();
    await match.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Match request rejected',
      data: {
        match
      }
    });
  } catch (error) {
    console.error('Error rejecting match request:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while rejecting match request',
      error: error.message
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
    const userType = req.user.userType;
    
    // Build query based on user type
    const query = userType === 'seeker' 
      ? { seeker: userId } 
      : { professional: userId };
    
    // Apply status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Find matches
    const matches = await Match.find(query)
      .populate('seeker', 'firstName lastName email profile.profilePicture')
      .populate('professional', 'firstName lastName email profile')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      data: {
        matches
      }
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching matches',
      error: error.message
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
      .populate('seeker', 'firstName lastName email profile.profilePicture')
      .populate('professional', 'firstName lastName email profile');
    
    if (!match) {
      return res.status(404).json({
        status: 'error',
        message: 'Match not found'
      });
    }
    
    // Check if user is part of this match
    const isUserInvolved = 
      match.seeker._id.toString() === userId.toString() || 
      match.professional._id.toString() === userId.toString();
    
    if (!isUserInvolved) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this match'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        match
      }
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching match',
      error: error.message
    });
  }
};

module.exports = {
  sendMatchRequest,
  acceptMatchRequest,
  rejectMatchRequest,
  getUserMatches,
  getMatchById
}; 