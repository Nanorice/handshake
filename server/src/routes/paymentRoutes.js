const express = require('express');
const router = express.Router();
const { 
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory
} = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// Webhook handling (no auth required)
router.post('/webhook', handleWebhook);

// Routes that require authentication
router.post('/create-session', auth, createCheckoutSession);
router.get('/history', auth, getPaymentHistory);

module.exports = router; 