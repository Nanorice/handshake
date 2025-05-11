/**
 * Script to create professional profiles for any professional users that don't have one
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const ProfessionalProfile = require('../src/models/ProfessionalProfile');
const User = require('../src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('Connected to MongoDB');
    createMissingProfiles();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Create profiles for any professional users that don't have one
 */
async function createMissingProfiles() {
  try {
    // Get all professional users
    const users = await User.find({ 
      $or: [
        { role: 'professional' },
        { userType: 'professional' }
      ]
    }).lean();
    
    console.log(`Found ${users.length} professional users in database`);
    
    // Get all existing professional profiles
    const profiles = await ProfessionalProfile.find().lean();
    console.log(`Found ${profiles.length} existing professional profiles`);
    
    // Find users who don't have profiles
    const usersWithoutProfiles = users.filter(user => 
      !profiles.some(profile => profile.userId.toString() === user._id.toString())
    );
    
    console.log(`Found ${usersWithoutProfiles.length} professional users without profiles`);
    
    // Create profiles for users who don't have them
    if (usersWithoutProfiles.length > 0) {
      console.log('Creating missing profiles...');
      
      for (const user of usersWithoutProfiles) {
        console.log(`Creating profile for user: ${user._id} (${user.email})`);
        
        // Create default profile data from user info
        const profileData = {
          userId: user._id,
          industries: user.industries || [],
          skills: user.skills || [],
          experience: [],
          availability: [],
          rate: user.rate || 0,
          // Essential UI fields
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          title: user.title || '',
          bio: user.bio || '',
          expertise: user.expertise || '',
          email: user.email,
          profilePicture: user.profilePicture || '',
        };
        
        // Create the profile
        const newProfile = new ProfessionalProfile(profileData);
        await newProfile.save();
        
        console.log(`✅ Created profile for ${user.email}`);
      }
      
      console.log('Done creating missing profiles');
      
      // Count profiles again to verify
      const updatedProfileCount = await ProfessionalProfile.countDocuments();
      console.log(`Now have ${updatedProfileCount} professional profiles (added ${updatedProfileCount - profiles.length})`);
    } else {
      console.log('No missing profiles to create');
    }
    
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error creating missing profiles:', error);
    mongoose.disconnect();
    process.exit(1);
  }
} 