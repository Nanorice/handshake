/**
 * Script to clear all messages from MongoDB without deleting thread structures
 * 
 * Usage:
 * 1. Make sure MongoDB connection string is set in .env
 * 2. Run: node server/scripts/clearMessages.js
 * 
 * This is useful for clearing test data while preserving thread structures.
 * Messages will be removed but threads will be retained with empty message collections.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Message = require('../src/models/Message');
const Thread = require('../src/models/Thread');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function clearMessages() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Get counts before clearing
    const messageCountBefore = await Message.countDocuments();
    const threadCountBefore = await Thread.countDocuments();
    
    console.log(`Before cleanup: ${messageCountBefore} messages, ${threadCountBefore} threads`);
    
    // Delete all messages
    const deleteResult = await Message.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} messages`);
    
    // Update all threads to have empty unreadCount and reset lastMessage
    const updateResult = await Thread.updateMany(
      {}, 
      { 
        $set: { 
          unreadCount: {}, 
          lastMessage: null,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} threads`);
    
    // Get counts after clearing
    const messageCountAfter = await Message.countDocuments();
    const threadCountAfter = await Thread.countDocuments();
    
    console.log(`After cleanup: ${messageCountAfter} messages, ${threadCountAfter} threads`);
    
    console.log('Message cleanup completed successfully');
  } catch (error) {
    console.error('Error clearing messages:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
clearMessages(); 