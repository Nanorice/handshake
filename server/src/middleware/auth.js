const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware to protect routes
 * Verifies the JWT token from the request header
 * and adds the authenticated user to the request object
 */
const auth = async (req, res, next) => {
  try {
    // Get token from the Authorization header
    const authHeader = req.header('Authorization');
    
    console.log('Auth middleware called:', {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? `${authHeader.substring(0, 15)}...` : 'none',
      path: req.path
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid auth header format');
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        }
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', token ? `${token.substring(0, 10)}...` : 'none');
    
    // Special handling for temporary tokens (useful for development)
    if (token.startsWith('temp_')) {
      console.log('Detected temporary token in auth middleware');
      
      // Extract user ID from the temporary token format temp_userId_timestamp
      const parts = token.split('_');
      if (parts.length >= 2) {
        const userId = parts[1];
        
        // Try to find the user by ID
        const user = await User.findById(userId);
        
        if (user) {
          console.log(`Temporary auth successful for user: ${user.firstName} ${user.lastName}`);
          req.user = user;
          req.token = token;
          req.isTemporaryAuth = true;
          return next();
        }
      }
      
      // Fall through to normal auth if temporary token doesn't yield a user
    }
    
    // Regular token verification
    try {
      // Verify token
      const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
      console.log('Using JWT secret:', jwtSecret ? 'Secret exists' : 'Default fallback secret');
      
      let decoded;
      try {
        decoded = jwt.verify(token, jwtSecret);
        console.log('JWT verified successfully:', decoded ? 'Contains payload' : 'Invalid payload');
      } catch (tokenError) {
        console.error('JWT verification failed:', tokenError.message);
        
        // Provide more context in the error response
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Authentication token is invalid or expired'
          }
        });
      }
      
      if (!decoded || !decoded.userId) {
        console.error('JWT payload missing userId');
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Authentication token is missing required data'
          }
        });
      }
      
      // Find user by ID and ensure they exist
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        console.error(`User not found for ID: ${decoded.userId}`);
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User associated with this token no longer exists'
          }
        });
      }
      
      console.log(`Authentication successful for user: ${user.firstName || 'Unknown'} ${user.lastName || 'User'}`);
      
      // Add user to request object
      req.user = user;
      req.token = token;
      
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Invalid token'
        }
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ 
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Not authorized to access this resource'
      }
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Array of allowed roles
 * @returns {function} Middleware function
 */
const authorize = (roles) => {
  return (req, res, next) => {
    // Log authorization info for debugging
    console.log('Authorize middleware called:', {
      userRole: req.user.role,
      userType: req.user.userType,
      allowedRoles: roles,
      requestPath: req.path
    });
    
    // Check both role and userType to support both old and new token formats
    const userRole = req.user.role || req.user.userType;
    
    if (!roles.includes(userRole)) {
      console.log(`Authorization failed: User role '${userRole}' not in allowed roles: [${roles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to perform this action'
        }
      });
    }
    
    console.log('Authorization successful');
    next();
  };
};

module.exports = {
  auth,
  authorize
}; 