const mongoose = require('mongoose');
require('dotenv').config();

// Make sure we're using the same schemas as the main app
const Invitation = require('./models/Invitation');
const Thread = require('./models/Thread');
const User = require('./models/User');

async function resetInvitation(invitationId) {
  try {
    console.log('Starting invitation reset script...');
    
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
    
    console.log(`Found invitation: ${invitation._id}`);
    
    // Get users
    const users = await User.find();
    
    if (users.length < 2) {
      console.error('Need at least 2 users to reset invitation');
      return;
    }
    
    // Find professional and seeker users
    let professionalUser = users.find(u => u.role === 'professional');
    let seekerUser = users.find(u => u.role === 'seeker');
    
    // Fallback if specific roles not found
    if (!professionalUser) professionalUser = users[0];
    if (!seekerUser || seekerUser._id.equals(professionalUser._id)) seekerUser = users[1];
    
    console.log(`Using professional: ${professionalUser._id} (${professionalUser.email})`);
    console.log(`Using seeker: ${seekerUser._id} (${seekerUser.email})`);
    
    // Create a new thread
    console.log('Creating a new thread...');
    const thread = new Thread({
      participants: [seekerUser._id, professionalUser._id],
      metadata: {
        isGroupChat: false
      },
      unreadCount: new Map()
    });
    
    await thread.save();
    console.log(`Created thread with ID: ${thread._id}`);
    
    // Create a new invitation
    console.log('Creating a new invitation...');
    const newInvitation = new Invitation({
      sender: seekerUser._id,
      receiver: professionalUser._id,
      status: 'pending',
      message: invitation.message || 'Would you be available for a coffee chat?',
      sessionDetails: {
        topic: invitation.sessionDetails?.topic || 'Career Discussion',
        proposedDate: invitation.sessionDetails?.proposedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: invitation.sessionDetails?.duration || 30
      },
      threadId: thread._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newInvitation.save();
    console.log(`Created new invitation with ID: ${newInvitation._id}`);
    
    // Return success message with details
    console.log('\n====== RESET SUCCESSFUL ======');
    console.log(`Original invitation ID: ${invitationId}`);
    console.log(`New invitation ID: ${newInvitation._id}`);
    console.log(`New thread ID: ${thread._id}`);
    console.log(`Sender (seeker): ${seekerUser._id} (${seekerUser.email})`);
    console.log(`Receiver (professional): ${professionalUser._id} (${professionalUser.email})`);
    console.log(`Status: ${newInvitation.status}`);
    console.log(`You can now test with the new invitation ID.`);
    
  } catch (error) {
    console.error('Error resetting invitation:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Get invitationId from command line arguments
const invitationId = process.argv[2];

// Run the script
resetInvitation(invitationId); 