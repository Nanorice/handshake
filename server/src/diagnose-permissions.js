const mongoose = require('mongoose');
require('dotenv').config();

// Make sure we're using the same schemas as the main app
const Invitation = require('./models/Invitation');
const Thread = require('./models/Thread');
const User = require('./models/User');

async function checkUserPermissions(invitationId, userId) {
  try {
    console.log('Starting permission check script...');
    
    // Connect to MongoDB
    const connectionString = process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    console.log(`Connecting to MongoDB with string: ${connectionString}`);
    
    await mongoose.connect(connectionString);
    console.log('Successfully connected to MongoDB');
    
    // Check if invitationId was provided
    if (!invitationId) {
      console.error('No invitation ID provided');
      return;
    }
    
    // Get the specific invitation
    const invitation = await Invitation.findById(invitationId);
    
    if (!invitation) {
      console.error(`Invitation with ID ${invitationId} not found`);
      return;
    }
    
    console.log('\n====== INVITATION DETAILS ======');
    console.log(`ID: ${invitation._id}`);
    console.log(`Sender: ${invitation.sender}`);
    console.log(`Receiver: ${invitation.receiver}`);
    console.log(`Status: ${invitation.status || 'undefined'}`);
    console.log(`Thread: ${invitation.threadId}`);
    
    // Get user details
    let receiverUser = null;
    if (invitation.receiver) {
      receiverUser = await User.findById(invitation.receiver);
      console.log('\n====== RECEIVER USER DETAILS ======');
      if (receiverUser) {
        console.log(`ID: ${receiverUser._id}`);
        console.log(`Name: ${receiverUser.firstName} ${receiverUser.lastName}`);
        console.log(`Role: ${receiverUser.role}`);
        console.log(`Email: ${receiverUser.email}`);
      } else {
        console.log('Receiver user not found in database!');
      }
    } else {
      console.log('Invitation has no receiver field!');
    }
    
    let senderUser = null;
    if (invitation.sender) {
      senderUser = await User.findById(invitation.sender);
      console.log('\n====== SENDER USER DETAILS ======');
      if (senderUser) {
        console.log(`ID: ${senderUser._id}`);
        console.log(`Name: ${senderUser.firstName} ${senderUser.lastName}`);
        console.log(`Role: ${senderUser.role}`);
        console.log(`Email: ${senderUser.email}`);
      } else {
        console.log('Sender user not found in database!');
      }
    } else {
      console.log('Invitation has no sender field!');
    }
    
    // Check specified user's permission
    if (userId) {
      const user = await User.findById(userId);
      
      console.log('\n====== SPECIFIED USER DETAILS ======');
      if (user) {
        console.log(`ID: ${user._id}`);
        console.log(`Name: ${user.firstName} ${user.lastName}`);
        console.log(`Role: ${user.role}`);
        console.log(`Email: ${user.email}`);
        
        // Determine permissions
        const isSender = user._id.toString() === invitation.sender?.toString();
        const isReceiver = user._id.toString() === invitation.receiver?.toString();
        
        console.log('\n====== PERMISSION ANALYSIS ======');
        console.log(`Is Sender: ${isSender}`);
        console.log(`Is Receiver: ${isReceiver}`);
        
        if (isReceiver) {
          console.log('This user CAN respond to this invitation (accept/decline)');
        } else {
          console.log('This user CANNOT respond to this invitation (not the receiver)');
        }
        
        if (isSender) {
          console.log('This user CAN cancel this invitation (as the sender)');
        } else {
          console.log('This user CANNOT cancel this invitation (not the sender)');
        }
        
        // Check for role requirements
        console.log('\n====== ROLE ANALYSIS ======');
        if (user.role === 'professional') {
          console.log('User is a professional. Should be able to RECEIVE invitations.');
          if (!isReceiver) {
            console.log('ERROR: This professional is not the receiver of this invitation!');
          }
        }
        
        if (user.role === 'seeker') {
          console.log('User is a seeker. Should be able to SEND invitations.');
          if (!isSender) {
            console.log('ERROR: This seeker is not the sender of this invitation!');
          }
        }
      } else {
        console.log(`User with ID ${userId} not found in database!`);
      }
    }
    
    console.log('\n====== VALIDATION CHECKS ======');
    const invitationSchema = Invitation.schema;
    
    // Check if invitation status is valid
    const validStatuses = invitationSchema.path('status').enumValues;
    console.log(`Valid Status Values: ${validStatuses.join(', ')}`);
    console.log(`Current Status: ${invitation.status || 'undefined'}`);
    console.log(`Status Valid: ${validStatuses.includes(invitation.status)}`);
    
    // Check if session details are valid
    console.log('\n====== SESSION DETAILS ======');
    if (invitation.sessionDetails) {
      console.log(`Topic: ${invitation.sessionDetails.topic || 'missing'}`);
      console.log(`Date: ${invitation.sessionDetails.proposedDate ? new Date(invitation.sessionDetails.proposedDate).toLocaleString() : 'missing'}`);
      console.log(`Duration: ${invitation.sessionDetails.duration || 'missing'} minutes`);
    } else {
      console.log('No session details found!');
    }
    
    console.log('\n====== POSSIBLE ISSUES ======');
    // Check for common issues
    const issues = [];
    
    if (!invitation.sender) issues.push('Missing sender');
    if (!invitation.receiver) issues.push('Missing receiver');
    if (!invitation.status) issues.push('Missing status');
    if (!validStatuses.includes(invitation.status)) issues.push('Invalid status value');
    if (!invitation.threadId) issues.push('Missing thread ID');
    if (!invitation.sessionDetails) issues.push('Missing session details');
    else {
      if (!invitation.sessionDetails.topic) issues.push('Missing session topic');
      if (!invitation.sessionDetails.proposedDate) issues.push('Missing proposed date');
      if (!invitation.sessionDetails.duration) issues.push('Missing session duration');
    }
    
    if (issues.length > 0) {
      console.log('Issues found:');
      issues.forEach(issue => console.log(`- ${issue}`));
    } else {
      console.log('No data validation issues found');
    }
    
    // Check if the invitation has already been responded to
    if (invitation.status !== 'pending') {
      console.log(`\nWARNING: This invitation has already been ${invitation.status}`);
      console.log('You cannot respond to an invitation that is not pending');
    }
    
  } catch (error) {
    console.error('Error checking permissions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Get invitationId and userId from command line arguments
const invitationId = process.argv[2];
const userId = process.argv[3];

// Run the script
checkUserPermissions(invitationId, userId); 