const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const professionalRoutes = require('./routes/professionalRoutes');
const matchRoutes = require('./routes/matchRoutes');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const zoomRoutes = require('./routes/zoomRoutes');
const debugRoutes = require('./debugRoutes');
const professionalProfileRoutes = require('./routes/professionalProfileRoutes');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Logging middleware (only in development)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ message: 'Server is working!' });
});

// Debug routes (no auth required)
app.use('/api/debug', debugRoutes);
console.log('Debug routes registered at /api/debug');

// Special endpoint for updating user roles (no auth required)
app.post('/api/direct-update-role', async (req, res) => {
  try {
    const { email, role } = req.body;
    console.log(`Direct update role request for email: ${email}, role: ${role}`);
    
    if (!email || !role || !['seeker', 'professional'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid email and role (seeker or professional) are required' 
      });
    }
    
    const User = require('./models/User');
    
    // Use findOneAndUpdate instead of save() to avoid full validation
    const result = await User.findOneAndUpdate(
      { email },
      { $set: { role } },
      { new: true, runValidators: false } // Return updated document and skip validation
    );
    
    if (!result) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    console.log(`User ${email} role updated to ${role}`);
    
    res.json({ 
      success: true,
      user: {
        _id: result._id,
        email: result.email,
        role: result.role
      }
    });
  } catch (error) {
    console.error('Error in direct-update-role:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error: ' + error.message 
    });
  }
});

// Special endpoint for updating user roles and refreshing JWT token (no auth required)
app.post('/api/direct-update-role-and-token', async (req, res) => {
  try {
    const { email, role } = req.body;
    console.log(`Direct update role and token request for email: ${email}, role: ${role}`);
    
    if (!email || !role || !['seeker', 'professional'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid email and role (seeker or professional) are required' 
      });
    }
    
    const User = require('./models/User');
    const jwt = require('jsonwebtoken');
    
    // Use findOneAndUpdate instead of save() to avoid full validation
    const result = await User.findOneAndUpdate(
      { email },
      { $set: { role } },
      { new: true, runValidators: false } // Return updated document and skip validation
    );
    
    if (!result) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    console.log(`User ${email} role updated to ${role}`);
    
    // Generate a new JWT token with the updated user info
    const token = jwt.sign(
      { userId: result._id, userType: result.userType, role: result.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );
    
    res.json({ 
      success: true,
      user: {
        _id: result._id,
        email: result.email,
        role: result.role
      },
      token
    });
  } catch (error) {
    console.error('Error in direct-update-role-and-token:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error: ' + error.message 
    });
  }
});

// API Routes
app.use('/api/professionals', professionalRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/professionalprofiles', professionalProfileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  console.error(err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: process.env.NODE_ENV === 'development' ? err.errors : undefined
      }
    });
  }
  
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    });
  }
  
  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Something went wrong!',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

module.exports = app; 