const mongoose = require('mongoose');
const Thread = require('../models/Thread');
const Message = require('../models/Message');
require('dotenv').config();

/**
 * Script to clear all test/dummy messages from the database
 */
const clearMessages = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/handshake?retryWrites=true&w=majority&appName=Cluster0'', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Count messages and threads before deletion
    const messageCountBefore = await Message.countDocuments();
    const threadCountBefore = await Thread.countDocuments();
    
    console.log(`Before deletion: ${messageCountBefore} messages, ${threadCountBefore} threads`);
    
    // Delete all messages
    const messageDeleteResult = await Message.deleteMany({});
    console.log(`Deleted ${messageDeleteResult.deletedCount} messages`);
    
    // Reset thread's lastMessage and unreadCount fields (but don't delete the threads)
    const threadUpdateResult = await Thread.updateMany(
      {},
      { 
        $set: { 
          lastMessage: null,
          unreadCount: new Map()
        }
      }
    );
    console.log(`Updated ${threadUpdateResult.modifiedCount} threads`);
    
    // Count after deletion
    const messageCountAfter = await Message.countDocuments();
    console.log(`After deletion: ${messageCountAfter} messages remain`);
    
    console.log('Message cleanup complete');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error clearing messages:', error);
  }
};

// Execute the script
clearMessages(); 