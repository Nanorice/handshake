const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/handshake', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Check if messages and threads collections exist
    const hasMessages = collections.some(col => col.name === 'messages');
    const hasThreads = collections.some(col => col.name === 'threads');
    
    console.log(`\nMessages collection exists: ${hasMessages}`);
    console.log(`Threads collection exists: ${hasThreads}`);
    
    // If messages collection exists, count documents
    if (hasMessages) {
      const messagesCount = await mongoose.connection.db.collection('messages').countDocuments();
      console.log(`Number of messages: ${messagesCount}`);
    }
    
    // If threads collection exists, count documents
    if (hasThreads) {
      const threadsCount = await mongoose.connection.db.collection('threads').countDocuments();
      console.log(`Number of threads: ${threadsCount}`);
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Execute
connectDB(); 