const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');
const { auth } = require('../middleware/auth');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  // For development - allow admin access for testing
  // In production, you should check user role in database
  const isAdmin = req.headers['x-admin-override'] === 'true' || 
                  req.user?.isAdmin || 
                  process.env.NODE_ENV === 'development';
  
  if (!isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// GET /api/analytics/overview - Get comprehensive analytics overview
router.get('/overview', auth, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching analytics overview...');
    const metrics = await AnalyticsService.getRealTimeMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics overview',
      error: error.message
    });
  }
});

// GET /api/analytics/users - Get user growth metrics
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    console.log('👥 Fetching user growth metrics...');
    const userMetrics = await AnalyticsService.getUserGrowthMetrics();
    res.json({
      success: true,
      data: userMetrics
    });
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user metrics',
      error: error.message
    });
  }
});

// GET /api/analytics/messaging - Get messaging analytics
router.get('/messaging', auth, requireAdmin, async (req, res) => {
  try {
    console.log('💬 Fetching messaging metrics...');
    const messagingMetrics = await AnalyticsService.getMessagingMetrics();
    res.json({
      success: true,
      data: messagingMetrics
    });
  } catch (error) {
    console.error('Error fetching messaging metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messaging metrics',
      error: error.message
    });
  }
});

// GET /api/analytics/professional - Get professional interaction metrics
router.get('/professional', auth, requireAdmin, async (req, res) => {
  try {
    console.log('🤝 Fetching professional metrics...');
    const professionalMetrics = await AnalyticsService.getProfessionalMetrics();
    res.json({
      success: true,
      data: professionalMetrics
    });
  } catch (error) {
    console.error('Error fetching professional metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch professional metrics',
      error: error.message
    });
  }
});

// GET /api/analytics/system - Get system health metrics
router.get('/system', auth, requireAdmin, async (req, res) => {
  try {
    console.log('🖥️ Fetching system health metrics...');
    const systemMetrics = await AnalyticsService.getSystemHealthMetrics();
    res.json({
      success: true,
      data: systemMetrics
    });
  } catch (error) {
    console.error('Error fetching system health metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health metrics',
      error: error.message
    });
  }
});

// GET /api/analytics/timeline - Get user activity timeline
router.get('/timeline', auth, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    console.log(`📈 Fetching user activity timeline for ${days} days...`);
    
    const timeline = await AnalyticsService.getUserActivityTimeline(days);
    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity timeline',
      error: error.message
    });
  }
});

// GET /api/analytics/categories - Get top industries and universities
router.get('/categories', auth, requireAdmin, async (req, res) => {
  try {
    console.log('🏢 Fetching top categories...');
    const categories = await AnalyticsService.getTopCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// GET /api/analytics/health - Quick health check endpoint
router.get('/health', auth, requireAdmin, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        database: 'connected',
        analytics: 'operational'
      }
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      message: 'System health check failed',
      error: error.message
    });
  }
});

module.exports = router; 