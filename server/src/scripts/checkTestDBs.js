const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

// Function to check a specific database
const checkDatabase = async (dbName) => {
  try {
    console.log(`\nChecking database: ${dbName}`);
    const conn = await mongoose.connect(`mongodb://localhost:27017/${dbName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`Connected to ${dbName}`);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:');
    if (collections.length === 0) {
      console.log('No collections found');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }

    // Check for messages and threads collections
    const hasMessages = collections.some(col => col.name === 'messages');
    const hasThreads = collections.some(col => col.name === 'threads');
    
    console.log(`Messages collection exists: ${hasMessages}`);
    console.log(`Threads collection exists: ${hasThreads}`);
    
    // Check for users collection
    const hasUsers = collections.some(col => col.name === 'users');
    console.log(`Users collection exists: ${hasUsers}`);
    
    if (hasUsers) {
      const usersCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`Number of users: ${usersCount}`);
      
      // Show a sample user if any exist
      if (usersCount > 0) {
        const sampleUser = await mongoose.connection.db.collection('users').findOne({});
        console.log('Sample user:', JSON.stringify(sampleUser, null, 2).substring(0, 200) + '...');
      }
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log(`Closed connection to ${dbName}`);
    
  } catch (error) {
    console.error(`Error checking ${dbName}:`, error);
    try {
      await mongoose.connection.close();
    } catch (err) {
      // Ignore
    }
  }
};

// Check both databases
const checkDatabases = async () => {
  await checkDatabase('test');
  await checkDatabase('handshake-test');
  
  // Also check the default handshake database
  await checkDatabase('handshake');
};

// Execute
checkDatabases().then(() => {
  console.log('Finished checking all databases');
}); 