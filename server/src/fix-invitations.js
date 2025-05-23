const mongoose = require('mongoose');
require('dotenv').config();

// Make sure we're using the same schemas as the main app
const Invitation = require('./models/Invitation');
const Thread = require('./models/Thread');
const User = require('./models/User');

async function fixInvitations() {
  try {
    console.log('Starting invitation fix script...');
    
    // Connect to MongoDB
    const connectionString = process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    console.log(`Connecting to MongoDB with string: ${connectionString}`);
    
    await mongoose.connect(connectionString);
    console.log('Successfully connected to MongoDB');
    
    // Get all invitations
    const invitations = await Invitation.find();
    console.log(`Found ${invitations.length} invitation(s) to fix`);

    // Get users to use for sender/receiver
    const users = await User.find();
    
    if (users.length < 2) {
      console.error('Need at least 2 users to fix invitations');
      return;
    }

    // Get a professional and a seeker user
    let professionalUser = users.find(u => u.role === 'professional');
    let seekerUser = users.find(u => u.role === 'seeker' || u.role !== 'professional');
    
    // Fallback if roles are not set
    if (!professionalUser) professionalUser = users[0];
    if (!seekerUser) seekerUser = users[1];
    
    console.log(`Using professional user: ${professionalUser._id}`);
    console.log(`Using seeker user: ${seekerUser._id}`);

    // Fix each invitation
    for (const invitation of invitations) {
      console.log(`Fixing invitation ${invitation._id}...`);
      
      // Check if thread exists
      let thread = invitation.threadId ? await Thread.findById(invitation.threadId) : null;
      
      // If no thread or thread doesn't exist, create one
      if (!thread) {
        console.log('Creating new thread for invitation...');
        thread = new Thread({
          participants: [seekerUser._id, professionalUser._id],
          metadata: {
            isGroupChat: false
          }
        });
        await thread.save();
      }
      
      // Update the invitation with missing fields
      const updates = {
        sender: seekerUser._id,  // Seeker sends invitations
        receiver: professionalUser._id, // Professional receives them
        status: invitation.status || 'pending', // Keep status if exists, otherwise set to pending
        threadId: thread._id // Link to thread
      };
      
      // Add session details if missing
      if (!invitation.sessionDetails) {
        updates.sessionDetails = {
          topic: invitation.topic || 'Coffee Chat Discussion',
          proposedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          duration: 30 // 30 minutes
        };
      }
      
      // Add message if missing
      if (!invitation.message) {
        updates.message = "I'd like to connect and discuss career opportunities";
      }
      
      console.log('Updates to apply:', updates);
      
      // Apply updates to invitation
      const updatedInvitation = await Invitation.findByIdAndUpdate(
        invitation._id,
        { $set: updates },
        { new: true }
      );
      
      console.log(`Invitation ${invitation._id} fixed:`, updatedInvitation ? 'Success' : 'Failed');
    }
    
    console.log('\nInvitation fix completed successfully!');
    console.log('\nYou should now be able to accept/decline invitations.');
  } catch (error) {
    console.error('Error fixing invitations:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the fix
fixInvitations(); 