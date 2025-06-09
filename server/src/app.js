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
const professionalProfileRoutes = require('./routes/professionalProfileRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const simpleInvitationRoutes = require('./routes/simpleInvitationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const fileRoutes = require('./routes/fileRoutes');

// Initialize express app
const app = express();

// Debug logging for socket.io attachment
app.on('mount', () => {
  console.log('Express app mounted');
});

// Check if io is attached during requests (debug helper)
app.use((req, res, next) => {
  if (req.url.includes('/invitations') && req.method === 'PUT') {
    console.log('Invitation endpoint hit - io attached:', !!req.app.get('io'));
  }
  next();
});

// Debug request logger - logs all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  
  // Log body for non-GET requests
  if (req.method !== 'GET' && req.body) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Add response logging
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`Response ${res.statusCode} for ${req.method} ${req.url}`);
    return originalSend.apply(this, arguments);
  };
  
  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use(cors());

// Request logger
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Test endpoints
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Test POST endpoint
app.post('/test-post', (req, res) => {
  console.log('Test POST request received');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({
    message: 'POST test successful',
    receivedData: req.body
  });
});

// Test PUT endpoint for debugging
app.put('/test-put', (req, res) => {
  console.log('Test PUT request received');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({
    message: 'PUT test successful',
    receivedData: req.body
  });
});

// Test detailed endpoint to diagnose request issues
app.all('/debug-request/*', (req, res) => {
  console.log('DEBUG REQUEST HIT:');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  res.json({
    success: true,
    request: {
      url: req.url,
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.body,
      query: req.query
    }
  });
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
app.use('/api/invitations', invitationRoutes);
app.use('/api/simple-invitations', simpleInvitationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', fileRoutes);

// Add upload route alias to match frontend expectations
app.use('/api/upload', fileRoutes);

console.log('✅ File routes mounted at /api/files and /api/upload');

// Diagnostic endpoint for invitation testing
const Invitation = require('./models/Invitation');
app.get('/api/diagnostic/invitations', async (req, res) => {
  try {
    console.log('Diagnostic endpoint accessed');
    
    // Basic MongoDB connection test
    const count = await Invitation.countDocuments();
    
    // Get basic info about invitations without fully loading them
    const invitationSummary = await Invitation.find()
      .select('_id status sender receiver')
      .limit(5)
      .lean();
    
    res.json({
      success: true,
      message: 'MongoDB connection and Invitation collection test',
      data: {
        totalInvitations: count,
        sampleInvitations: invitationSummary
      }
    });
  } catch (error) {
    console.error('Diagnostic endpoint error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.errors
      }
    });
  }
  
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed: ' + err.message
      }
    });
  }
  
  if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body'
      }
    });
  }
  
  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Something went wrong!'
    }
  });
});

module.exports = app; 