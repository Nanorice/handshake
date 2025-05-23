const mongoose = require('mongoose');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Import the User model
const User = require('./models/User');

async function checkUserFromToken(token) {
  try {
    console.log('Starting user check script...');
    
    // Connect to MongoDB
    const connectionString = process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    console.log(`Connecting to MongoDB with string: ${connectionString}`);
    
    await mongoose.connect(connectionString);
    console.log('Successfully connected to MongoDB');
    
    if (!token) {
      console.error('No token provided');
      return;
    }
    
    try {
      // Verify the token
      console.log('Attempting to verify token...');
      const JWT_SECRET = process.env.JWT_SECRET || 'yourSecretKeyHere';
      const decoded = jwt.verify(token, JWT_SECRET);
      
      console.log('Token decoded:', decoded);
      
      // Find user from the decoded token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.error('User not found');
        return;
      }
      
      console.log('\n====== USER DETAILS ======');
      console.log(`ID: ${user._id}`);
      console.log(`Email: ${user.email}`);
      console.log(`First Name: ${user.firstName || 'not set'}`);
      console.log(`Last Name: ${user.lastName || 'not set'}`);
      console.log(`Role: ${user.role || 'not set'}`);
      console.log(`Created At: ${user.createdAt}`);
      
      // Check if user is a professional
      if (user.role === 'professional') {
        console.log('\nThis user is a professional and should be able to RECEIVE invitations.');
        
        // Get professional profile
        console.log('\nChecking for related professional profile...');
        const Professional = require('./models/Professional');
        const profile = await Professional.findOne({ userId: user._id });
        
        if (profile) {
          console.log('Professional profile found:');
          console.log(`Profile ID: ${profile._id}`);
          console.log(`Expertise: ${profile.expertise || 'not set'}`);
          console.log(`Bio: ${profile.bio ? (profile.bio.substring(0, 50) + '...') : 'not set'}`);
        } else {
          console.log('No professional profile found for this user.');
        }
      }
      
      // Check if user is a seeker
      if (user.role === 'seeker') {
        console.log('\nThis user is a seeker and should be able to SEND invitations.');
      }
      
      console.log('\n====== ROLES AND PERMISSIONS ======');
      console.log(`User role: ${user.role || 'not set'}`);
      console.log(`Can send invitations: ${user.role === 'seeker' ? 'Yes' : 'No'}`);
      console.log(`Can receive invitations: ${user.role === 'professional' ? 'Yes' : 'No'}`);
      
    } catch (jwtError) {
      console.error('Invalid token:', jwtError.message);
    }
    
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Get token from command line arguments
const token = process.argv[2];

// Run the script
checkUserFromToken(token); 