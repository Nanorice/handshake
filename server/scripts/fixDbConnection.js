/**
 * Diagnostic script to check MongoDB database connections and collections.
 * This will help identify where data is being stored and ensure consistency.
 * 
 * Run with: node scripts/fixDbConnection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function checkDbConnection() {
  console.log('----- Database Connection Diagnostic -----');
  
  // Log environment variables
  console.log('Environment variables:');
  console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set (hidden for security)' : 'Not set');
  console.log('- MONGO_URI:', process.env.MONGO_URI ? 'Set (hidden for security)' : 'Not set');
  
  // Determine which connection string to use
  const connectionString = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/test';
  console.log('\nConnection string being used (fallback if none set):', 
              connectionString === 'mongodb://localhost:27017/test' ? 'mongodb://localhost:27017/test' : 'Custom URI (hidden)');
  
  try {
    // Connect to the database
    await mongoose.connect(connectionString);
    console.log('\nSuccessfully connected to MongoDB!');
    
    // Check what database we're actually connected to
    const dbName = mongoose.connection.db.databaseName;
    console.log(`Connected to database: "${dbName}"`);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections in this database:');
    for (const collection of collections) {
      console.log(`- ${collection.name}`);
    }
    
    // Check for users
    try {
      const usersCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`\nFound ${usersCount} documents in the 'users' collection`);
      
      // Get sample user
      if (usersCount > 0) {
        const user = await mongoose.connection.db.collection('users').findOne({});
        console.log('Sample user document structure:', Object.keys(user).join(', '));
        console.log('Sample user roles available:', user.role || 'No role field found');
      }
    } catch (error) {
      console.log('Error accessing users collection:', error.message);
    }
    
    // Check for professional profiles
    try {
      const profilesCount = await mongoose.connection.db.collection('professionalprofiles').countDocuments();
      console.log(`\nFound ${profilesCount} documents in the 'professionalprofiles' collection`);
      
      // Get sample profile
      if (profilesCount > 0) {
        const profile = await mongoose.connection.db.collection('professionalprofiles').findOne({});
        console.log('Sample profile document structure:', Object.keys(profile).join(', '));
      }
    } catch (error) {
      console.log('Error accessing professionalprofiles collection:', error.message);
    }
    
    // Check for professionals (users with role=professional)
    try {
      const professionalsCount = await mongoose.connection.db.collection('users').countDocuments({ role: 'professional' });
      console.log(`\nFound ${professionalsCount} users with role='professional' in the 'users' collection`);
    } catch (error) {
      console.log('Error checking for professional users:', error.message);
    }
    
    // FIXME: Create consistent environment variables and update code to use them
    console.log('\n----- Recommended Actions -----');
    console.log('1. Create a .env file in the server directory with:');
    console.log('   MONGODB_URI=mongodb://localhost:27017/handshake');
    console.log('2. Update all code to consistently use MONGODB_URI');
    console.log('3. Ensure the seeding scripts use the same connection string as the server');
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the diagnostic
checkDbConnection().catch(console.error); 