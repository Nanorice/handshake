/**
 * Fix User Types Script
 * This script ensures only one user has both role AND userType set to 'professional'.
 * All other users will have both fields set to 'seeker'.
 * 
 * Usage: node scripts/fixUserTypes.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// MongoDB Connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
    fixUserTypes();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixUserTypes() {
  try {
    // Get users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    console.log('Starting user types fix...');
    
    // Find all users
    const users = await usersCollection.find({}).toArray();
    console.log(`Found ${users.length} total users`);
    
    // Find one user to be our professional (prefer one with role already set to professional)
    const professionalUser = users.find(user => user.role === 'professional') || users[0];
    
    if (!professionalUser) {
      console.error('No users found in the database!');
      process.exit(1);
    }
    
    console.log(`\nDesignating user as professional: ${professionalUser.email || professionalUser.name} (ID: ${professionalUser._id})`);
    
    // Update the professional user to have both fields set
    await usersCollection.updateOne(
      { _id: professionalUser._id },
      { 
        $set: { 
          role: 'professional',
          userType: 'professional'
        } 
      }
    );
    
    // Update all other users to be seekers
    const result = await usersCollection.updateMany(
      { _id: { $ne: professionalUser._id } },
      {
        $set: {
          role: 'seeker',
          userType: 'seeker'
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} users to have role and userType set to 'seeker'`);
    
    // Verify the results
    const professionalCount = await usersCollection.countDocuments({ 
      $or: [
        { role: 'professional' },
        { userType: 'professional' }
      ]
    });
    
    const seekerCount = await usersCollection.countDocuments({
      role: 'seeker',
      userType: 'seeker'
    });
    
    console.log(`\nVerification:`);
    console.log(`- Users with professional role or userType: ${professionalCount}`);
    console.log(`- Users with both seeker role and userType: ${seekerCount}`);
    console.log(`- Total users: ${users.length}`);
    
    if (professionalCount === 1 && seekerCount === users.length - 1) {
      console.log('\nSuccess! There is now exactly one professional user.');
    } else {
      console.log('\nWarning: The counts don\'t match expectations. Please verify manually.');
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing user types:', error);
    process.exit(1);
  }
} 