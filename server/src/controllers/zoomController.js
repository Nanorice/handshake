const Session = require('../models/Session');
const Notification = require('../models/Notification');

// In a real application, we would use the actual Zoom SDK
// const { Zoom } = require('@zoom/api');
// const zoom = new Zoom({ token: process.env.ZOOM_JWT_TOKEN });

/**
 * Create a Zoom meeting for a session
 * @route POST /api/zoom/create-meeting
 */
const createMeeting = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        }
      });
    }
    
    // Find session
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
    
    // Verify that the user is the professional for this session
    if (session.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to create a meeting for this session'
        }
      });
    }
    
    // Verify that the session is confirmed
    if (session.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot create a meeting for a session that is not confirmed'
        }
      });
    }
    
    // Check if a Zoom link already exists
    if (session.zoomLink) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A meeting has already been created for this session'
        }
      });
    }
    
    // In a real application, we would create a Zoom meeting using the Zoom API
    // This is a simplified example
    /*
    const zoomMeeting = await zoom.meetings.create({
      topic: `Handshake Coffee Chat`,
      type: 2, // Scheduled meeting
      start_time: session.datetime,
      duration: session.duration,
      timezone: 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: true,
        waiting_room: true
      }
    });
    */
    
    // For this example, we'll create a mock Zoom meeting link
    const mockZoomLink = `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`;
    
    // Update session with Zoom link
    session.zoomLink = mockZoomLink;
    await session.save();
    
    // Create notification for seeker
    const notification = new Notification({
      userId: session.seekerId,
      type: 'booking',
      title: 'Zoom Meeting Created',
      message: 'The professional has created a Zoom meeting for your upcoming session.',
      relatedId: session._id,
      onModel: 'Session'
    });
    
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: {
        zoomLink: mockZoomLink,
        sessionId: session._id
      },
      message: 'Zoom meeting created successfully'
    });
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while creating the Zoom meeting'
      }
    });
  }
};

module.exports = {
  createMeeting
}; 