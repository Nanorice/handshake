/**
 * Check Invitation Document Integrity
 * 
 * This script checks if invitation documents in the database have all the required fields
 * and reports any issues that might be causing update failures.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import required models
const Invitation = require('./models/Invitation');
const User = require('./models/User');
const Thread = require('./models/Thread');

async function checkInvitations() {
  try {
    console.log('Starting invitation integrity check...');
    
    // Connect to MongoDB
    const connectionString = process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    console.log(`Connecting to MongoDB with string: ${connectionString}`);
    
    await mongoose.connect(connectionString);
    console.log('Successfully connected to MongoDB');
    
    // Check for specific invitation if ID is provided
    const invitationId = process.argv[2];
    
    if (invitationId) {
      console.log(`Checking specific invitation: ${invitationId}`);
      const invitation = await Invitation.findById(invitationId);
      
      if (!invitation) {
        console.error(`❌ Invitation with ID ${invitationId} not found`);
        return;
      }
      
      await checkInvitationIntegrity(invitation);
    } else {
      // Check all invitations in the database
      console.log('Checking all invitations in the database...');
      const invitations = await Invitation.find();
      
      console.log(`Found ${invitations.length} invitations`);
      
      for (const invitation of invitations) {
        await checkInvitationIntegrity(invitation);
      }
    }
    
    console.log('\nInvitation check complete!');
    
  } catch (error) {
    console.error('Error checking invitations:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

async function checkInvitationIntegrity(invitation) {
  console.log(`\n------- Checking invitation ${invitation._id} -------`);
  
  let hasIssues = false;
  
  // Check required fields
  const requiredFields = ['sender', 'receiver', 'status', 'message'];
  for (const field of requiredFields) {
    if (!invitation[field]) {
      console.error(`❌ Missing required field: ${field}`);
      hasIssues = true;
    }
  }
  
  // Check references
  if (invitation.sender) {
    const sender = await User.findById(invitation.sender);
    if (!sender) {
      console.error(`❌ Sender user ${invitation.sender} not found`);
      hasIssues = true;
    } else {
      console.log(`✅ Sender: ${sender.email} (${sender._id})`);
    }
  }
  
  if (invitation.receiver) {
    const receiver = await User.findById(invitation.receiver);
    if (!receiver) {
      console.error(`❌ Receiver user ${invitation.receiver} not found`);
      hasIssues = true;
    } else {
      console.log(`✅ Receiver: ${receiver.email} (${receiver._id})`);
    }
  }
  
  if (invitation.threadId) {
    const thread = await Thread.findById(invitation.threadId);
    if (!thread) {
      console.error(`❌ Thread ${invitation.threadId} not found`);
      hasIssues = true;
    } else {
      console.log(`✅ Thread exists with ${thread.participants.length} participants`);
    }
  } else {
    console.log(`⚠️ No threadId associated with this invitation`);
  }
  
  // Log status and other important fields
  console.log(`Status: ${invitation.status}`);
  console.log(`Created: ${invitation.createdAt}`);
  console.log(`Updated: ${invitation.updatedAt}`);
  
  // Check session details
  if (invitation.sessionDetails) {
    console.log(`Session topic: ${invitation.sessionDetails.topic || 'not set'}`);
    console.log(`Proposed date: ${invitation.sessionDetails.proposedDate || 'not set'}`);
    console.log(`Duration: ${invitation.sessionDetails.duration || 'not set'}`);
  } else {
    console.log(`⚠️ No session details`);
  }
  
  // Check mongodb validation
  const validationErrors = invitation.validateSync();
  if (validationErrors) {
    console.error('❌ Validation errors:');
    Object.keys(validationErrors.errors).forEach(key => {
      console.error(`  - ${key}: ${validationErrors.errors[key].message}`);
    });
    hasIssues = true;
  }
  
  // Summary
  if (hasIssues) {
    console.log(`\n❌ Invitation ${invitation._id} has issues that might prevent updates`);
    
    // Suggest reset command
    console.log(`\nTry reset command: node src/reset-invitation.js ${invitation._id}`);
  } else {
    console.log(`\n✅ Invitation ${invitation._id} looks valid`);
  }
}

// Run the check
checkInvitations(); 