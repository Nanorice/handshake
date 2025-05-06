const User = require('../models/User');
const Session = require('../models/Session');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

/**
 * Book a new session with a professional
 * @route POST /api/sessions/book
 */
const bookSession = async (req, res) => {
  try {
    const { professionalId, datetime, duration, notes } = req.body;
    
    if (!professionalId || !datetime) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Professional ID and datetime are required'
        }
      });
    }
    
    // Validate datetime is in the future
    const sessionDate = new Date(datetime);
    if (sessionDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session must be scheduled in the future'
        }
      });
    }
    
    // Check if professional exists and is a professional
    const professional = await User.findOne({ 
      _id: professionalId,
      role: 'professional'
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
    
    // Check if professional has a profile
    const professionalProfile = await ProfessionalProfile.findOne({ userId: professionalId });
    if (!professionalProfile) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Professional has not set up their profile yet'
        }
      });
    }
    
    // Verify that the professional is available at this time
    const day = sessionDate.toLocaleString('en-US', { weekday: 'long' });
    const hours = sessionDate.getHours().toString().padStart(2, '0');
    const minutes = sessionDate.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    const availability = professionalProfile.availability.find(a => a.day === day);
    if (!availability) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BOOKING_CONFLICT',
          message: `Professional is not available on ${day}`
        }
      });
    }
    
    // Check if time slot falls within availability
    const startTime = availability.startTime.split(':').map(Number);
    const endTime = availability.endTime.split(':').map(Number);
    const bookingTime = timeString.split(':').map(Number);
    
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];
    const bookingMinutes = bookingTime[0] * 60 + bookingTime[1];
    const bookingEndMinutes = bookingMinutes + (duration || 30);
    
    if (bookingMinutes < startMinutes || bookingEndMinutes > endMinutes) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BOOKING_CONFLICT',
          message: `Professional is not available at this time on ${day}`
        }
      });
    }
    
    // Create new session
    const session = new Session({
      seekerId: req.user._id,
      professionalId,
      datetime: sessionDate,
      duration: duration || 30,
      status: 'pending',
      notes: {
        seeker: notes
      }
    });
    
    // Check for time conflicts
    const hasConflict = await session.hasTimeConflict(req.user._id) || 
                        await session.hasTimeConflict(professionalId);
    
    if (hasConflict) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BOOKING_CONFLICT',
          message: 'This time slot conflicts with an existing session'
        }
      });
    }
    
    // Save session
    await session.save();
    
    // Create notification for professional
    const notification = new Notification({
      userId: professionalId,
      type: 'booking',
      title: 'New Session Request',
      message: `${req.user.name} has requested a session with you.`,
      relatedId: session._id,
      onModel: 'Session'
    });
    
    await notification.save();
    
    // In a production app, we would generate a Stripe checkout session here
    // and return the checkout URL to the client
    
    res.status(201).json({
      success: true,
      data: {
        session
      },
      message: 'Session requested successfully'
    });
  } catch (error) {
    console.error('Error booking session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while booking the session'
      }
    });
  }
};

/**
 * Get current user's sessions
 * @route GET /api/sessions/my
 */
const getMySessions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build filter query
    const filter = {
      $or: [
        { seekerId: req.user._id },
        { professionalId: req.user._id }
      ]
    };
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Get sessions with pagination
    const sessions = await Session.find(filter)
      .sort({ datetime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('seekerId', 'name profileImage')
      .populate('professionalId', 'name profileImage')
      .lean();
    
    // Get total count for pagination
    const totalSessions = await Session.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        sessions,
        pagination: {
          total: totalSessions,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSessions / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while getting sessions'
      }
    });
  }
};

/**
 * Get specific session details
 * @route GET /api/sessions/:id
 */
const getSessionById = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Find session by ID
    const session = await Session.findById(sessionId)
      .populate('seekerId', 'name profileImage')
      .populate('professionalId', 'name profileImage')
      .lean();
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Session not found'
        }
      });
    }
    
    // Validate that the user is part of this session
    const isParticipant = 
      session.seekerId._id.toString() === req.user._id.toString() ||
      session.professionalId._id.toString() === req.user._id.toString();
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to view this session'
        }
      });
    }
    
    // Get payment information for this session if available
    const payment = await Payment.findOne({ sessionId }).lean();
    
    res.status(200).json({
      success: true,
      data: {
        session,
        payment: payment || null
      }
    });
  } catch (error) {
    console.error('Error getting session by ID:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while getting session details'
      }
    });
  }
};

/**
 * Update session details (status, notes)
 * @route PUT /api/sessions/:id
 */
const updateSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { status, zoomLink, notes } = req.body;
    
    // Find session by ID
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Session not found'
        }
      });
    }
    
    // Validate that the user is part of this session
    const isSeeker = session.seekerId.toString() === req.user._id.toString();
    const isProfessional = session.professionalId.toString() === req.user._id.toString();
    
    if (!isSeeker && !isProfessional) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to update this session'
        }
      });
    }
    
    // Update status if provided (only professional can update status)
    if (status && isProfessional) {
      // Validate status transition
      const validStatusTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['completed', 'cancelled'],
        completed: [],
        cancelled: []
      };
      
      if (!validStatusTransitions[session.status].includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Cannot transition from ${session.status} to ${status}`
          }
        });
      }
      
      session.status = status;
      
      // Create notification for seeker
      let notificationType = 'booking';
      let notificationTitle = '';
      let notificationMessage = '';
      
      if (status === 'confirmed') {
        notificationTitle = 'Session Confirmed';
        notificationMessage = `Your session with ${req.user.name} has been confirmed.`;
      } else if (status === 'cancelled') {
        notificationTitle = 'Session Cancelled';
        notificationMessage = `Your session with ${req.user.name} has been cancelled.`;
      } else if (status === 'completed') {
        notificationTitle = 'Session Completed';
        notificationMessage = `Your session with ${req.user.name} has been marked as completed.`;
      }
      
      if (notificationTitle) {
        const notification = new Notification({
          userId: session.seekerId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          relatedId: session._id,
          onModel: 'Session'
        });
        
        await notification.save();
      }
    }
    
    // Update zoom link if provided (only professional can update zoom link)
    if (zoomLink && isProfessional) {
      session.zoomLink = zoomLink;
    }
    
    // Update notes if provided
    if (notes) {
      if (isSeeker && notes.seeker) {
        session.notes.seeker = notes.seeker;
      }
      
      if (isProfessional && notes.professional) {
        session.notes.professional = notes.professional;
      }
    }
    
    // Save updated session
    await session.save();
    
    res.status(200).json({
      success: true,
      data: {
        session
      },
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating the session'
      }
    });
  }
};

/**
 * Cancel a session
 * @route DELETE /api/sessions/:id
 */
const cancelSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Find session by ID
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Session not found'
        }
      });
    }
    
    // Validate that the user is part of this session
    const isSeeker = session.seekerId.toString() === req.user._id.toString();
    const isProfessional = session.professionalId.toString() === req.user._id.toString();
    
    if (!isSeeker && !isProfessional) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to cancel this session'
        }
      });
    }
    
    // Check if the session can be cancelled
    if (['completed', 'cancelled'].includes(session.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Cannot cancel a session that is already ${session.status}`
        }
      });
    }
    
    // Update session status to cancelled
    session.status = 'cancelled';
    await session.save();
    
    // Create notifications for both parties
    const targetUserId = isSeeker ? session.professionalId : session.seekerId;
    
    const notification = new Notification({
      userId: targetUserId,
      type: 'booking',
      title: 'Session Cancelled',
      message: `Your session with ${req.user.name} has been cancelled.`,
      relatedId: session._id,
      onModel: 'Session'
    });
    
    await notification.save();
    
    // If a payment was made, handle refund logic here (in a real app)
    
    res.status(200).json({
      success: true,
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while cancelling the session'
      }
    });
  }
};

/**
 * Get all upcoming sessions for the current user
 * @route GET /api/sessions/upcoming
 */
const getUpcomingSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Add debug logging
    console.log(`Getting upcoming sessions for user: ${userId}`);
    
    // Check if userId is valid
    if (!userId) {
      console.error('Invalid user ID in request');
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user ID'
        }
      });
    }
    
    // Find sessions where the current user is either the seeker or professional
    // and the status is pending or confirmed
    // and the datetime is in the future
    const now = new Date();
    
    // Simple query without complex operations first
    const upcomingSessions = await Session.find({
      $or: [
        { seekerId: userId },
        { professionalId: userId }
      ],
      status: { $in: ['pending', 'confirmed'] },
      datetime: { $gt: now }
    })
    .sort({ datetime: 1 })
    .populate('seekerId', 'name profileImage')
    .populate('professionalId', 'name profileImage')
    .lean();
    
    console.log(`Found ${upcomingSessions.length} upcoming sessions`);
    
    // If we get here, the query executed without error
    return res.status(200).json({
      success: true,
      data: {
        sessions: upcomingSessions
      }
    });
  } catch (error) {
    console.error('Error getting upcoming sessions:', error);
    
    // Provide fallback data only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock data as fallback');
      const mockSessions = [
        {
          _id: 'mock_session_1',
          datetime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          status: 'confirmed',
          seekerId: { _id: 'mock_seeker_id', name: 'Jane Doe', profileImage: null },
          professionalId: { _id: 'mock_prof_id', name: 'John Professional', profileImage: null },
          duration: 30,
          zoomLink: 'https://zoom.us/mock-link'
        }
      ];
      
      return res.status(200).json({
        success: true,
        data: {
          sessions: mockSessions,
          isMockData: true
        },
        message: 'Using mock data due to database error'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while getting upcoming sessions'
      }
    });
  }
};

/**
 * Get all sessions (fallback for the main sessions endpoint)
 * @route GET /api/sessions
 */
const getAllSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Reuse most of the logic from getMySessions but without pagination
    const filter = {
      $or: [
        { seekerId: userId },
        { professionalId: userId }
      ]
    };
    
    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    const sessions = await Session.find(filter)
      .sort({ datetime: 1 })
      .populate('seekerId', 'name profileImage')
      .populate('professionalId', 'name profileImage')
      .lean();
    
    res.status(200).json({
      success: true,
      data: {
        sessions
      }
    });
  } catch (error) {
    console.error('Error getting all sessions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while getting sessions'
      }
    });
  }
};

module.exports = {
  bookSession,
  getMySessions,
  getSessionById,
  updateSession,
  cancelSession,
  getUpcomingSessions,
  getAllSessions
}; 