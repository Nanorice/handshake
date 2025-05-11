/**
 * Debug script to verify profile loading and check for issues
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
    verifyProfileLoading();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Simulate the same process that the server uses to load a profile
 */
async function verifyProfileLoading() {
  try {
    // Get all professional users
    const users = await User.find({ 
      $or: [
        { role: 'professional' },
        { userType: 'professional' }
      ]
    }).lean();
    
    console.log(`Found ${users.length} professional users in database`);
    
    if (users.length === 0) {
      console.log('No professional users found to test with');
      mongoose.disconnect();
      return;
    }
    
    // Test loading for the first professional user
    const testUser = users[0];
    console.log(`Testing profile loading for user: ${testUser._id} (${testUser.email})`);
    
    // Try to load the profile
    console.log('\n===== SIMULATING GET /api/professionalprofiles/me =====');
    const profile = await ProfessionalProfile.findOne({ userId: testUser._id });
    
    if (!profile) {
      console.log('❌ No profile found in database for this user');
      
      // Simulate creating a default profile (as the controller would)
      console.log('\nCreating a default profile with user data:');
      const defaultProfile = {
        userId: testUser._id,
        industries: testUser.industries || [],
        skills: testUser.skills || [],
        experience: [],
        availability: [],
        rate: testUser.rate || 0,
        name: `${testUser.firstName || ''} ${testUser.lastName || ''}`.trim(),
        title: testUser.title || '',
        bio: testUser.bio || '',
        expertise: testUser.expertise || '',
        email: testUser.email,
        profilePicture: testUser.profilePicture || '',
      };
      
      console.log('Default profile data:', defaultProfile);
      
      // Create a new profile in the database
      console.log('\nTrying to create this profile in the database...');
      const newProfile = new ProfessionalProfile(defaultProfile);
      await newProfile.save();
      
      console.log('✅ Profile created successfully. Verify it was saved:');
      const verifyProfile = await ProfessionalProfile.findOne({ userId: testUser._id });
      console.log('Verification:', verifyProfile ? 'Profile found in database' : 'Profile not created');
    } else {
      console.log('✅ Found existing profile:');
      console.log(JSON.stringify(profile.toObject(), null, 2));
      
      // Test updating the profile
      console.log('\n===== TESTING PROFILE UPDATE =====');
      
      const testUpdate = {
        title: 'Updated Test Title ' + Date.now(),
        bio: 'This is an updated test bio ' + Date.now()
      };
      
      console.log('Sending update:', testUpdate);
      
      const updatedProfile = await ProfessionalProfile.findOneAndUpdate(
        { userId: testUser._id },
        { $set: testUpdate },
        { new: true }
      );
      
      console.log('Update result:', updatedProfile ? 'Success' : 'Failed');
      
      if (updatedProfile) {
        console.log('Updated profile:', JSON.stringify(updatedProfile.toObject(), null, 2));
      }
    }
    
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error verifying profile loading:', error);
    mongoose.disconnect();
    process.exit(1);
  }
} 