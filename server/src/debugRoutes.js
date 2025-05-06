const express = require('express');
const router = express.Router();

// Debug endpoint that returns info about the request
router.get('/request-info', (req, res) => {
  res.json({
    success: true,
    message: 'Debug API is working!',
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl,
      headers: req.headers,
      query: req.query
    }
  });
});

// Echo endpoint that returns whatever is sent to it
router.all('/echo', (req, res) => {
  res.json({
    success: true,
    message: 'Echo endpoint',
    timestamp: new Date().toISOString(),
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });
});

// Ping endpoint with no auth required
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'Pong!',
    timestamp: new Date().toISOString(),
    serverTime: new Date().toLocaleTimeString()
  });
});

module.exports = router; 