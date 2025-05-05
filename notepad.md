// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Protect routes
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Not authorized');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.userId);
  next();
};

// Redirect to Stripe
const handlePayment = async (slotId) => {
  const { data: { sessionId } } = await axios.post('/api/payment/create-session', { slotId });
  const stripe = await loadStripe(process.env.STRIPE_KEY);
  stripe.redirectToCheckout({ sessionId });
};

// Generate Zoom link for a booking
const generateZoomLink = async (bookingId) => {
  const zoomResponse = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
    topic: 'Coffee Chat',
    type: 1 // Instant meeting
  }, {
    headers: { Authorization: `Bearer ${process.env.ZOOM_JWT}` }
  });
  return zoomResponse.data.join_url;
};