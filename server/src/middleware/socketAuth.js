const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Socket.IO authentication middleware
 * Validates the token and attaches the user to the socket
 */
const socketAuth = async (socket, next) => {
  try {
    // Get token from socket handshake auth
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.warn('Socket authentication failed: No token provided');
      return next(new Error('Authentication required'));
    }
    
    // Verify the token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(token, jwtSecret);
    
    if (!decoded.userId) {
      console.error('Socket token missing userId:', decoded);
      return next(new Error('Invalid token'));
    }
    
    // Find the user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.error(`Socket auth user not found for ID: ${decoded.userId}`);
      return next(new Error('User not found'));
    }
    
    // Attach user to socket
    socket.userId = user._id;
    socket.user = {
      _id: user._id,
      firstName: user.firstName || user.name?.split(' ')[0] || '',
      lastName: user.lastName || (user.name?.split(' ').slice(1).join(' ') || ''),
      email: user.email,
      role: user.role,
      profile: {
        profilePicture: user.profileImage
      },
      userType: user.role === 'professional' ? 'professional' : 'seeker'
    };
    
    console.log(`Socket authenticated for user: ${user._id}`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

module.exports = socketAuth; 