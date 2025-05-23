# Reusable Code Snippets

## Backend: Generate JWT token
// Used in authController.js for issuing tokens upon login/registration
// Depends on 'jsonwebtoken' library and JWT_SECRET environment variable.
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

## Backend: Protect Express Routes (Middleware)
// Example middleware for Express to protect routes. 
// Ensures a valid JWT is present and attaches user to req.
// Depends on 'jsonwebtoken' and a User model (e.g., Mongoose).
// For production, enhance error handling (e.g., res.status(401).json(...)).
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Ensure User model is imported and correct
      req.user = await User.findById(decoded.userId).select('-password'); // Exclude password
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

## Frontend: Redirect to Stripe for Payment
// Example function to initiate Stripe checkout.
// Used in a frontend component when a user proceeds to payment.
// Depends on 'axios' for API calls and '@stripe/stripe-js' for loadStripe.
// Assumes STRIPE_KEY (publishable key) is available in frontend environment.
const handlePayment = async (slotId) => {
  try {
    // Replace '/api/payment/create-session' with your actual backend endpoint
    const { data } = await axios.post('/api/payments/create-session', { slotId /* or other relevant data */ });
    const sessionId = data.sessionId; // Adjust based on your backend response
    
    const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY); // Ensure your env var is named appropriately
    if (stripe) {
      stripe.redirectToCheckout({ sessionId });
    } else {
      console.error('Stripe.js has not loaded yet.');
    }
  } catch (error) {
    console.error('Payment error:', error);
    // Handle error, e.g., show a notification to the user
  }
};

## Backend: Generate Zoom Meeting Link (Example)
// Example of creating a Zoom meeting. 
// Typically called from a backend service when a session is confirmed.
// Depends on 'axios'. ZOOM_JWT needs to be securely managed.
// This is a simplified example; Zoom API offers more options.
const generateZoomLink = async (bookingId, meetingTopic = 'Coffee Chat') => {
  try {
    const zoomResponse = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
      topic: meetingTopic,
      type: 2, // Scheduled meeting (type 1 is instant)
      // Add other meeting settings as needed (e.g., start_time, duration)
      settings: {
        join_before_host: true,
        // etc.
      }
    }, {
      headers: { Authorization: `Bearer ${process.env.ZOOM_JWT_TOKEN}` } // Ensure correct env var name
    });
    return zoomResponse.data.join_url;
  } catch (error) {
    console.error('Zoom API error:', error.response ? error.response.data : error.message);
    // Handle error appropriately
    return null;
  }
};