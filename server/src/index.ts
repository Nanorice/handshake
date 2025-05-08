import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { MatchingService } from './services/matchingService';
import Professional from './models/Professional';
import CoffeeChat from './models/CoffeeChat';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test')
  .then(() => {
    console.log('Connected to MongoDB (database: test)');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// LinkedIn OAuth Strategy
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  callbackURL: `${process.env.API_URL}/auth/linkedin/callback`,
  scope: ['r_emailaddress', 'r_liteprofile'],
}, async (accessToken: string, refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
  try {
    // Handle user authentication and profile creation
    // This is a simplified version - implement proper user creation/update logic
    return done(null, profile);
  } catch (error) {
    return done(error as Error);
  }
}));

// Routes
app.post('/api/matches', async (req, res) => {
  try {
    const preferences = req.body;
    const professionals = await Professional.find({ isVerified: true });
    const matches = await MatchingService.findBestMatches(preferences, professionals);
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to find matches' });
  }
});

app.post('/api/coffee-chats', async (req, res) => {
  try {
    const { seekerId, professionalId, scheduledTime, duration, preferences } = req.body;
    
    // Create Stripe payment intent
    const professional = await Professional.findById(professionalId);
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' });
    }
    
    const amount = professional.hourlyRate * (duration / 60);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        seekerId,
        professionalId,
        duration
      }
    });

    const coffeeChat = new CoffeeChat({
      seekerId,
      professionalId,
      scheduledTime,
      duration,
      price: amount,
      paymentIntentId: paymentIntent.id,
      preferences
    });

    await coffeeChat.save();
    res.json({ coffeeChat, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create coffee chat' });
  }
});

app.get('/api/professionals/:id', async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' });
    }
    res.json(professional);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch professional' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 