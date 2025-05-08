const express = require('express');
const router = express.Router();
const User = require('./models/User');

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

// List all routes in the Express app
router.get('/routes', (req, res) => {
  // Access the main Express app through the router's parent
  const app = req.app;
  
  // Function to extract routes from a router
  const getRoutes = (stack, basePath = '') => {
    const routes = [];
    
    // Iterate through the router's stack
    stack.forEach(layer => {
      if (layer.route) {
        // This is a route (e.g., app.get(), app.post())
        const path = basePath + layer.route.path;
        const methods = Object.keys(layer.route.methods)
          .filter(method => layer.route.methods[method])
          .map(method => method.toUpperCase());
        
        routes.push({
          path,
          methods,
          pattern: layer.regexp.toString()
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        // This is a mounted router (e.g., app.use('/path', router))
        const routerPath = basePath + (layer.regexp.source.replace(/\^\\|\\\/\?\(\?\:\\\/?$\)/g, '').replace(/\\\//g, '/') || '/');
        const nestedRoutes = getRoutes(layer.handle.stack, routerPath);
        routes.push(...nestedRoutes);
      } else if (layer.name === 'bound dispatch' && layer.handle.stack) {
        // This might be a middleware that contains routes
        const middlewarePath = basePath + (layer.regexp.source.replace(/\^\\|\\\/\?\(\?\:\\\/?$\)/g, '').replace(/\\\//g, '/') || '/');
        const nestedRoutes = getRoutes(layer.handle.stack, middlewarePath);
        routes.push(...nestedRoutes);
      }
    });
    
    return routes;
  };
  
  try {
    // Get all registered routes
    const routes = getRoutes(app._router.stack);
    
    // Filter out duplicate routes and sort by path
    const uniqueRoutes = routes
      .filter((route, index, self) => 
        index === self.findIndex(r => r.path === route.path && r.methods.toString() === route.methods.toString())
      )
      .sort((a, b) => a.path.localeCompare(b.path));
    
    res.json({
      success: true,
      count: uniqueRoutes.length,
      routes: uniqueRoutes
    });
  } catch (error) {
    console.error('Error getting routes:', error);
    res.status(500).json({
      success: false,
      error: 'Could not list routes: ' + error.message
    });
  }
});

// Debug route to get all users (DEV ONLY - not for production)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Debug route to update a user's role by email (DEV ONLY - not for production)
router.post('/update-user-role', async (req, res) => {
  try {
    const { email, role } = req.body;
    console.log(`Debug route: update role request for email: ${email}, role: ${role}`);
    
    if (!email || !role || !['seeker', 'professional'].includes(role)) {
      return res.status(400).json({ 
        error: 'Valid email and role (seeker or professional) are required',
        success: false
      });
    }
    
    // Use findOneAndUpdate instead of find + save to bypass validation
    const result = await User.findOneAndUpdate(
      { email },
      { $set: { role } },
      { new: true, runValidators: false }
    );
    
    if (!result) {
      return res.status(404).json({ 
        error: 'User not found',
        success: false
      });
    }
    
    console.log(`Debug route: User ${email} role updated to ${role}`);
    
    res.json({ 
      message: `User role updated to ${role}`,
      success: true,
      user: {
        _id: result._id,
        email: result.email,
        role: result.role
      }
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ 
      error: 'Server error: ' + error.message,
      success: false
    });
  }
});

module.exports = router; 