/**
 * Delete All Users Script
 * This script deletes all users and their associated data from the database.
 * 
 * Usage: node scripts/deleteAllUsers.js
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
    deleteAllUsers();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function deleteAllUsers() {
  try {
    // Get collections
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('professionalprofiles');
    const matchesCollection = db.collection('matches');
    const messagesCollection = db.collection('messages');
    const threadsCollection = db.collection('threads');
    const sessionsCollection = db.collection('sessions');
    const paymentsCollection = db.collection('payments');
    
    console.log('Starting deletion process...');
    
    // Count documents before deletion
    const initialUserCount = await usersCollection.countDocuments();
    const initialProfileCount = await profilesCollection.countDocuments();
    const initialMatchesCount = await matchesCollection.countDocuments();
    const initialMessagesCount = await messagesCollection.countDocuments();
    const initialThreadsCount = await threadsCollection.countDocuments();
    const initialSessionsCount = await sessionsCollection.countDocuments();
    const initialPaymentsCount = await paymentsCollection.countDocuments();
    
    console.log('\nInitial document counts:');
    console.log(`- Users: ${initialUserCount}`);
    console.log(`- Professional profiles: ${initialProfileCount}`);
    console.log(`- Matches: ${initialMatchesCount}`);
    console.log(`- Messages: ${initialMessagesCount}`);
    console.log(`- Threads: ${initialThreadsCount}`);
    console.log(`- Sessions: ${initialSessionsCount}`);
    console.log(`- Payments: ${initialPaymentsCount}`);
    
    // Delete data from all collections
    const userResult = await usersCollection.deleteMany({});
    const profileResult = await profilesCollection.deleteMany({});
    const matchResult = await matchesCollection.deleteMany({});
    const messageResult = await messagesCollection.deleteMany({});
    const threadResult = await threadsCollection.deleteMany({});
    const sessionResult = await sessionsCollection.deleteMany({});
    const paymentResult = await paymentsCollection.deleteMany({});
    
    console.log('\nDeletion results:');
    console.log(`- Deleted ${userResult.deletedCount} users`);
    console.log(`- Deleted ${profileResult.deletedCount} professional profiles`);
    console.log(`- Deleted ${matchResult.deletedCount} matches`);
    console.log(`- Deleted ${messageResult.deletedCount} messages`);
    console.log(`- Deleted ${threadResult.deletedCount} threads`);
    console.log(`- Deleted ${sessionResult.deletedCount} sessions`);
    console.log(`- Deleted ${paymentResult.deletedCount} payments`);
    
    // Verify all data is gone
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
    
    if (finalUserCount === 0 && 
        finalProfileCount === 0 && 
        finalMatchesCount === 0 && 
        finalMessagesCount === 0 && 
        finalThreadsCount === 0 && 
        finalSessionsCount === 0 && 
        finalPaymentsCount === 0) {
      console.log('\nSuccess! All users and associated data have been deleted.');
    } else {
      console.log('\nWarning: Some data still remains. Please check the database manually.');
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting users:', error);
    process.exit(1);
  }
} 