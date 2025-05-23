const mongoose = require('mongoose');
require('dotenv').config();

// Make sure we're using the same schemas as the main app
const Invitation = require('./models/Invitation');
const Thread = require('./models/Thread');
const Message = require('./models/Message');
const User = require('./models/User');

// Test function for the invitation collection
async function testInvitation() {
  try {
    console.log('Starting MongoDB diagnostic tests...');
    
    // Connect to MongoDB - use same connection string as in server.js
    const connectionString = process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    console.log(`Connecting to MongoDB with string: ${connectionString}`);
    
    await mongoose.connect(connectionString);
    console.log('Successfully connected to MongoDB');
    
    // Test basic counts of collections
    const invitationCount = await Invitation.countDocuments();
    const threadCount = await Thread.countDocuments();
    const messageCount = await Message.countDocuments();
    const userCount = await User.countDocuments();
    
    console.log(`Collection counts:
      - Invitations: ${invitationCount}
      - Threads: ${threadCount}
      - Messages: ${messageCount}
      - Users: ${userCount}
    `);
    
    // If we have invitations, examine one
    if (invitationCount > 0) {
      console.log('Fetching details of first invitation...');
      
      const invitation = await Invitation.findOne().lean();
      
      console.log(`Invitation sample: ${JSON.stringify(invitation, null, 2)}`);
      
      // Test a simple update operation (but don't save)
      try {
        console.log('Testing updating an invitation...');
        const updateResult = await Invitation.findByIdAndUpdate(
          invitation._id,
          { $set: { status: invitation.status } }, // Update to current value (no change)
          { new: true }
        );
        console.log('Update operation successful:', updateResult ? 'Yes' : 'No');
      } catch (updateError) {
        console.error('Error during update test:', updateError);
      }
      
      // Test thread relation
      try {
        console.log('Testing thread relation...');
        const thread = await Thread.findById(invitation.threadId).lean();
        console.log('Thread found:', thread ? 'Yes' : 'No');
      } catch (threadError) {
        console.error('Error fetching thread:', threadError);
      }
    } else {
      console.log('No invitations found to test');
    }
    
    console.log('Diagnostic tests completed successfully');
  } catch (error) {
    console.error('Diagnostic error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testInvitation(); 