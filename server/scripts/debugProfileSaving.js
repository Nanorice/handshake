/**
 * Debug script to check if professional profiles are being saved correctly
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
    checkProfiles();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Check professional profiles in the database
 */
async function checkProfiles() {
  try {
    // Get all professional profiles
    const profiles = await ProfessionalProfile.find().lean();
    console.log(`Found ${profiles.length} professional profiles in database`);
    
    // Get all professional users
    const users = await User.find({ 
      $or: [
        { role: 'professional' },
        { userType: 'professional' }
      ]
    }).lean();
    
    console.log(`Found ${users.length} professional users in database`);
    
    // Compare and find mismatches
    const usersWithoutProfiles = users.filter(user => 
      !profiles.some(profile => profile.userId.toString() === user._id.toString())
    );
    
    console.log(`Found ${usersWithoutProfiles.length} professional users without profiles`);
    
    // Print details of existing profiles
    console.log('\n===== EXISTING PROFESSIONAL PROFILES =====');
    for (const profile of profiles) {
      console.log('-----------------------------------------');
      console.log(`Profile ID: ${profile._id}`);
      console.log(`User ID: ${profile.userId}`);
      console.log(`Name: ${profile.name || 'Not set'}`);
      console.log(`Title: ${profile.title || 'Not set'}`);
      console.log(`Bio: ${profile.bio ? profile.bio.substring(0, 30) + '...' : 'Not set'}`);
      console.log(`Expertise: ${profile.expertise || 'Not set'}`);
      console.log(`Created: ${profile.createdAt}`);
      console.log(`Updated: ${profile.updatedAt}`);
      console.log('-----------------------------------------');
    }
    
    // Check the findOneAndUpdate method
    console.log('\n===== TESTING findOneAndUpdate =====');
    const testUserId = profiles.length > 0 ? profiles[0].userId : (users.length > 0 ? users[0]._id : null);
    
    if (testUserId) {
      console.log(`Testing with user ID: ${testUserId}`);
      
      // Simulate the update request
      const testUpdate = {
        name: 'Test User Update ' + Date.now(),
        title: 'Test Title Update',
        bio: 'This is a test bio update from the debug script ' + Date.now(),
        expertise: 'Testing, Debugging'
      };
      
      console.log('Update fields:', testUpdate);
      
      // Test the findOneAndUpdate method
      const updatedProfile = await ProfessionalProfile.findOneAndUpdate(
        { userId: testUserId },
        { $set: testUpdate },
        { new: true, upsert: true }
      );
      
      console.log('Update result:', updatedProfile ? 'Success' : 'Failed');
      if (updatedProfile) {
        console.log('Updated profile:', {
          name: updatedProfile.name,
          title: updatedProfile.title,
          bio: updatedProfile.bio ? updatedProfile.bio.substring(0, 30) + '...' : 'None',
          expertise: updatedProfile.expertise
        });
      }
      
      // Verify the update was saved
      const verifyProfile = await ProfessionalProfile.findOne({ userId: testUserId }).lean();
      console.log('Verification:', verifyProfile ? 'Profile found in database' : 'Profile not found');
      if (verifyProfile) {
        console.log('Verified fields match:', {
          nameMatches: verifyProfile.name === testUpdate.name,
          titleMatches: verifyProfile.title === testUpdate.title,
          bioMatches: verifyProfile.bio === testUpdate.bio,
          expertiseMatches: verifyProfile.expertise === testUpdate.expertise
        });
      }
    } else {
      console.log('No users found to test with');
    }
    
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking profiles:', error);
    mongoose.disconnect();
    process.exit(1);
  }
} 