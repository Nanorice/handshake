const mongoose = require('mongoose');
const User = require('../models/User');
const Thread = require('../models/Thread');
const Message = require('../models/Message');
require('dotenv').config();

// Helper function to get random item from array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Function to seed messages
const seedMessages = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/handshake?retryWrites=true&w=majority&appName=Cluster0'', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Get professional and seeker users
    const professionalUsers = await User.find({ userType: 'professional' }).limit(3);
    const seekerUsers = await User.find({ userType: 'seeker' }).limit(3);
    
    if (professionalUsers.length === 0 || seekerUsers.length === 0) {
      console.log('No users found. Please run the user seeder first.');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`Found ${professionalUsers.length} professional users and ${seekerUsers.length} seeker users`);
    
    // Create threads and messages
    let threadCount = 0;
    let messageCount = 0;
    
    // Create a thread between each seeker and professional
    for (const seeker of seekerUsers) {
      for (const professional of professionalUsers) {
        // Create a thread
        const thread = new Thread({
          participants: [seeker._id, professional._id],
          metadata: {
            isGroupChat: false
          }
        });
        
        await thread.save();
        threadCount++;
        
        console.log(`Created thread ${threadCount} between seeker ${seeker.email} and professional ${professional.email}`);
        
        // Generate 3-5 messages for this thread
        const messageCount = Math.floor(Math.random() * 3) + 3;
        const senders = [seeker._id, professional._id];
        
        for (let i = 0; i < messageCount; i++) {
          // Alternate sender
          const sender = senders[i % 2];
          const content = `Test message ${i + 1} from ${sender === seeker._id ? 'seeker' : 'professional'}`;
          
          const message = new Message({
            threadId: thread._id,
            sender,
            content,
            isRead: Math.random() > 0.5 // randomly mark as read or unread
          });
          
          await message.save();
          messageCount++;
          
          // Update thread with last message
          thread.lastMessage = {
            content,
            sender,
            timestamp: Date.now(),
            messageType: 'text'
          };
          
          // Update unread count for the recipient
          const recipientId = sender.equals(seeker._id) ? professional._id : seeker._id;
          const currentCount = thread.unreadCount.get(recipientId.toString()) || 0;
          thread.unreadCount.set(recipientId.toString(), currentCount + 1);
          
          await thread.save();
        }
      }
    }
    
    console.log(`Created ${threadCount} threads and ${messageCount} messages`);
    
    // Verify collections are created
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections after seeding:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error seeding messages:', error);
  }
};

// Execute
seedMessages(); 