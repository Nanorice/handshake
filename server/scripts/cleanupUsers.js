/**
 * Database User Cleanup Script
 * This script keeps only one professional and one seeker user, removing all others.
 * 
 * Usage: node scripts/cleanupUsers.js
 */

const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// MongoDB Connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
    performCleanup();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function performCleanup() {
  try {
    // Get collections directly using Mongoose connection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('professionalprofiles');
    const matchesCollection = db.collection('matches');
    const messagesCollection = db.collection('messages');
    const threadsCollection = db.collection('threads');
    const sessionsCollection = db.collection('sessions');
    const paymentsCollection = db.collection('payments');
    
    console.log('Starting cleanup...');
    
    // Count documents before cleanup
    const initialUserCount = await usersCollection.countDocuments();
    const initialProfileCount = await profilesCollection.countDocuments();
    const initialMatchesCount = await matchesCollection.countDocuments();
    const initialMessagesCount = await messagesCollection.countDocuments();
    const initialThreadsCount = await threadsCollection.countDocuments();
    const initialSessionsCount = await sessionsCollection.countDocuments();
    const initialPaymentsCount = await paymentsCollection.countDocuments();
    
    console.log('Initial document counts:');
    console.log(`- Users: ${initialUserCount}`);
    console.log(`- Professional profiles: ${initialProfileCount}`);
    console.log(`- Matches: ${initialMatchesCount}`);
    console.log(`- Messages: ${initialMessagesCount}`);
    console.log(`- Threads: ${initialThreadsCount}`);
    console.log(`- Sessions: ${initialSessionsCount}`);
    console.log(`- Payments: ${initialPaymentsCount}`);
    
    // Find one professional user to keep
    const professionalToKeep = await usersCollection.findOne({ role: 'professional' });
    if (!professionalToKeep) {
      console.error('No professional user found!');
      process.exit(1);
    }
    
    // Find one seeker user to keep
    let seekerToKeep = await usersCollection.findOne({ role: 'seeker' });
    
    // If no seeker user exists, create one by converting a professional user
    if (!seekerToKeep) {
      console.log('No seeker user found. Creating one by converting a professional user...');
      
      // Find a different professional to convert
      const professionalToConvert = await usersCollection.findOne({ 
        role: 'professional', 
        _id: { $ne: professionalToKeep._id } 
      });
      
      if (professionalToConvert) {
        // Update user to be a seeker
        await usersCollection.updateOne(
          { _id: professionalToConvert._id },
          { $set: { role: 'seeker' } }
        );
        
        console.log(`Converted user ${professionalToConvert.email || professionalToConvert.name} to seeker role`);
        
        // Get the updated user
        seekerToKeep = await usersCollection.findOne({ _id: professionalToConvert._id });
      } else {
        // If no other professional user exists, create a new seeker user
        console.log('No additional professional user found. Creating a new seeker user...');
        
        const hashedPassword = await hashPassword('password123');
        
        const newSeeker = {
          email: 'seeker@example.com',
          password: hashedPassword,
          name: 'Test Seeker',
          role: 'seeker',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const result = await usersCollection.insertOne(newSeeker);
        seekerToKeep = await usersCollection.findOne({ _id: result.insertedId });
        console.log(`Created new seeker user: ${seekerToKeep.email}`);
      }
    }
    
    console.log(`Will keep professional user: ${professionalToKeep.email || professionalToKeep.name} (ID: ${professionalToKeep._id})`);
    console.log(`Will keep seeker user: ${seekerToKeep.email || seekerToKeep.name} (ID: ${seekerToKeep._id})`);
    
    // Create a list of user IDs to keep
    const keepUserIds = [
      professionalToKeep._id.toString(),
      seekerToKeep._id.toString()
    ];
    
    // Delete all other users
    const userDeleteResult = await usersCollection.deleteMany({
      _id: { $nin: keepUserIds.map(id => new mongoose.Types.ObjectId(id)) }
    });
    
    console.log(`Deleted ${userDeleteResult.deletedCount} users`);
    
    // Delete all professional profiles not linked to the professional we're keeping
    const profileDeleteResult = await profilesCollection.deleteMany({
      userId: { $ne: new mongoose.Types.ObjectId(professionalToKeep._id) }
    });
    
    console.log(`Deleted ${profileDeleteResult.deletedCount} professional profiles`);
    
    // Clean up matches - keep only matches between our two users
    const matchDeleteResult = await matchesCollection.deleteMany({
      $nor: [
        {
          $and: [
            { seekerId: new mongoose.Types.ObjectId(seekerToKeep._id) },
            { professionalId: new mongoose.Types.ObjectId(professionalToKeep._id) }
          ]
        },
        {
          $and: [
            { seekerId: new mongoose.Types.ObjectId(professionalToKeep._id) },
            { professionalId: new mongoose.Types.ObjectId(seekerToKeep._id) }
          ]
        }
      ]
    });
    
    console.log(`Deleted ${matchDeleteResult.deletedCount} matches`);
    
    // Clean up messages - keep only messages involving our two users
    const messageDeleteResult = await messagesCollection.deleteMany({
      $nor: [
        { senderId: new mongoose.Types.ObjectId(seekerToKeep._id) },
        { receiverId: new mongoose.Types.ObjectId(seekerToKeep._id) },
        { senderId: new mongoose.Types.ObjectId(professionalToKeep._id) },
        { receiverId: new mongoose.Types.ObjectId(professionalToKeep._id) }
      ]
    });
    
    console.log(`Deleted ${messageDeleteResult.deletedCount} messages`);
    
    // Clean up threads - keep only threads involving our two users
    const threadDeleteResult = await threadsCollection.deleteMany({
      $nor: [
        { participants: new mongoose.Types.ObjectId(seekerToKeep._id) },
        { participants: new mongoose.Types.ObjectId(professionalToKeep._id) }
      ]
    });
    
    console.log(`Deleted ${threadDeleteResult.deletedCount} threads`);
    
    // Clean up sessions - keep only sessions for our two users
    const sessionDeleteResult = await sessionsCollection.deleteMany({
      $nor: [
        { userId: new mongoose.Types.ObjectId(seekerToKeep._id) },
        { userId: new mongoose.Types.ObjectId(professionalToKeep._id) }
      ]
    });
    
    console.log(`Deleted ${sessionDeleteResult.deletedCount} sessions`);
    
    // Clean up payments - keep only payments involving our two users
    const paymentDeleteResult = await paymentsCollection.deleteMany({
      $nor: [
        { userId: new mongoose.Types.ObjectId(seekerToKeep._id) },
        { userId: new mongoose.Types.ObjectId(professionalToKeep._id) },
        { seekerId: new mongoose.Types.ObjectId(seekerToKeep._id) },
        { professionalId: new mongoose.Types.ObjectId(professionalToKeep._id) }
      ]
    });
    
    console.log(`Deleted ${paymentDeleteResult.deletedCount} payments`);
    
    // Count documents after cleanup
    const finalUserCount = await usersCollection.countDocuments();
    const finalProfileCount = await profilesCollection.countDocuments();
    const finalMatchesCount = await matchesCollection.countDocuments();
    const finalMessagesCount = await messagesCollection.countDocuments();
    const finalThreadsCount = await threadsCollection.countDocuments();
    const finalSessionsCount = await sessionsCollection.countDocuments();
    const finalPaymentsCount = await paymentsCollection.countDocuments();
    
    console.log('\nFinal document counts:');
    console.log(`- Users: ${finalUserCount}`);
    console.log(`- Professional profiles: ${finalProfileCount}`);
    console.log(`- Matches: ${finalMatchesCount}`);
    console.log(`- Messages: ${finalMessagesCount}`);
    console.log(`- Threads: ${finalThreadsCount}`);
    console.log(`- Sessions: ${finalSessionsCount}`);
    console.log(`- Payments: ${finalPaymentsCount}`);
    
    console.log('\nCleanup completed successfully!');
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
} 