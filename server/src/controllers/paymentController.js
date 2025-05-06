const Session = require('../models/Session');
const Payment = require('../models/Payment');
const User = require('../models/User');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const Notification = require('../models/Notification');

// In a real application, we would use the actual Stripe SDK
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe checkout session for booking payment
 * @route POST /api/payments/create-session
 */
const createCheckoutSession = async (req, res) => {
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
    
    // Find the session
    const bookingSession = await Session.findById(sessionId);
    
    if (!bookingSession) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Session not found'
        }
      });
    }
    
    // Verify that the user is the seeker for this session
    if (bookingSession.seekerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to pay for this session'
        }
      });
    }
    
    // Check if payment has already been processed
    const existingPayment = await Payment.findOne({ sessionId });
    if (existingPayment && existingPayment.status === 'succeeded') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Payment has already been processed for this session'
        }
      });
    }
    
    // Get professional details for the rate
    const professional = await User.findById(bookingSession.professionalId);
    const professionalProfile = await ProfessionalProfile.findOne({ 
      userId: bookingSession.professionalId 
    });
    
    if (!professionalProfile) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Professional profile not found'
        }
      });
    }
    
    // Calculate amount based on professional's rate and session duration
    const amount = professionalProfile.rate * (bookingSession.duration / 60); // Rate is per hour
    
    // In a real application, we would create a Stripe checkout session here
    // This is a simplified example
    /* 
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Session with ${professional.name}`,
              description: `${bookingSession.duration} minute coffee chat`,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/sessions/${bookingSession._id}/success`,
      cancel_url: `${process.env.CLIENT_URL}/sessions/${bookingSession._id}/cancel`,
      metadata: {
        sessionId: bookingSession._id.toString(),
        seekerId: bookingSession.seekerId.toString(),
        professionalId: bookingSession.professionalId.toString()
      }
    });
    */
    
    // For this example, we'll create a mock Stripe session ID
    const mockStripeSessionId = `cs_test_${Date.now()}`;
    
    // Update booking session with Stripe session ID
    bookingSession.stripeSessionId = mockStripeSessionId;
    await bookingSession.save();
    
    // Create a pending payment record
    const payment = new Payment({
      sessionId: bookingSession._id,
      userId: req.user._id,
      stripePaymentId: mockStripeSessionId,
      amount: amount,
      currency: 'usd',
      status: 'pending'
    });
    
    await payment.save();
    
    res.status(200).json({
      success: true,
      data: {
        // In a real app, this would be the Stripe checkout URL
        // checkoutUrl: stripeSession.url,
        checkoutUrl: `https://example.com/checkout/${mockStripeSessionId}`,
        sessionId: bookingSession._id,
        amount
      }
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while creating the checkout session'
      }
    });
  }
};

/**
 * Handle Stripe webhook events
 * @route POST /api/payments/webhook
 */
const handleWebhook = async (req, res) => {
  try {
    // In a real application, we would verify the Stripe signature
    // const signature = req.headers['stripe-signature'];
    // let event;
    
    // try {
    //   event = stripe.webhooks.constructEvent(
    //     req.body,
    //     signature,
    //     process.env.STRIPE_WEBHOOK_SECRET
    //   );
    // } catch (err) {
    //   return res.status(400).send(`Webhook Error: ${err.message}`);
    // }
    
    // For this example, we'll simulate a successful payment
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: req.body.stripeSessionId,
          metadata: {
            sessionId: req.body.sessionId,
            seekerId: req.body.seekerId,
            professionalId: req.body.professionalId
          },
          payment_intent: `pi_${Date.now()}`
        }
      }
    };
    
    // Handle the event
    if (mockEvent.type === 'checkout.session.completed') {
      const session = mockEvent.data.object;
      
      // Find the booking session
      const bookingSession = await Session.findById(session.metadata.sessionId);
      if (bookingSession) {
        // Update session status to confirmed
        bookingSession.status = 'confirmed';
        await bookingSession.save();
        
        // Update payment status to succeeded
        const payment = await Payment.findOne({ 
          sessionId: session.metadata.sessionId 
        });
        
        if (payment) {
          payment.status = 'succeeded';
          payment.stripePaymentId = session.payment_intent;
          await payment.save();
          
          // Create notifications for both users
          await Notification.create({
            userId: session.metadata.seekerId,
            type: 'payment',
            title: 'Payment Successful',
            message: 'Your payment for the session has been processed successfully.',
            relatedId: bookingSession._id,
            onModel: 'Session'
          });
          
          await Notification.create({
            userId: session.metadata.professionalId,
            type: 'payment',
            title: 'Payment Received',
            message: 'You have received a payment for an upcoming session.',
            relatedId: bookingSession._id,
            onModel: 'Session'
          });
        }
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while handling the webhook'
      }
    });
  }
};

/**
 * Get payment history for current user
 * @route GET /api/payments/history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Find payments made by or received by the current user
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate({
        path: 'sessionId',
        select: 'seekerId professionalId datetime duration status',
        populate: [
          { path: 'seekerId', select: 'name profileImage' },
          { path: 'professionalId', select: 'name profileImage' }
        ]
      })
      .lean();
    
    // Get total count for pagination
    const totalPayments = await Payment.countDocuments({ userId: req.user._id });
    
    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total: totalPayments,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPayments / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting payment history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while getting payment history'
      }
    });
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
  getPaymentHistory
}; 