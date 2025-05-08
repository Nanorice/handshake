/**
 * MongoDB Connection Test Script
 * This script tests different MongoDB connection configurations
 * 
 * Usage: node scripts/testMongoConnection.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Reduce timeout for faster feedback
};

// Test various connection strings
async function testConnections() {
  console.log('🔍 MongoDB Connection Diagnostic Tool');
  console.log('=====================================');
  
  console.log('\n📊 System Information:');
  console.log(`- Node.js: ${process.version}`);
  console.log(`- Mongoose: ${mongoose.version}`);
  console.log(`- Platform: ${process.platform}`);
  
  console.log('\n📝 Testing various connection configurations...');
  
  const connectionStrings = [
    // Test 1: Default localhost without auth
    {
      name: 'Default localhost (no auth)',
      uri: 'mongodb://localhost:27017/test'
    },
    // Test 2: Default localhost with auth
    {
      name: 'Localhost with auth',
      uri: 'mongodb://username:password@localhost:27017/test'
    },
    // Test 3: Environment variable if set
    {
      name: 'From environment variable',
      uri: process.env.MONGODB_URI || null
    },
    // Test 4: Environment variable with auth fallback
    {
      name: 'With credentials fallback',
      uri: process.env.MONGODB_URI || 'mongodb://username:password@localhost:27017/test'
    },
    // Test 5: Try different port
    {
      name: 'Alternate port',
      uri: 'mongodb://localhost:27018/test'
    },
    // Test 6: Try MongoDB Atlas style connection if available
    {
      name: 'MongoDB Atlas (if configured)',
      uri: process.env.MONGODB_ATLAS_URI || null
    },
    // Test 7: Try connecting to 127.0.0.1 instead of localhost
    {
      name: 'Using 127.0.0.1 instead of localhost',
      uri: 'mongodb://127.0.0.1:27017/test'
    }
  ];

  // Try each connection string
  for (const conn of connectionStrings) {
    if (!conn.uri) {
      console.log(`\n❌ ${conn.name}: Not configured, skipping`);
      continue;
    }
    
    console.log(`\n🔄 Testing: ${conn.name}`);
    console.log(`URI: ${conn.uri.replace(/:([^:@]+)@/, ':***@')}`); // Hide password in logs
    
    try {
      await mongoose.disconnect(); // Ensure previous connections are closed
      console.log('Attempting connection...');
      
      // Try to connect
      await mongoose.connect(conn.uri, options);
      
      // If we reach here, connection was successful
      console.log('✅ Connection successful!');
      console.log(`Connected to database: ${mongoose.connection.db.databaseName}`);
      
      // Test listing collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`Found ${collections.length} collections:`);
      collections.forEach(c => console.log(` - ${c.name}`));
      
      // Success - this is a working configuration!
      console.log('\n✅ THIS CONNECTION CONFIGURATION WORKS! ✅');
      console.log('You should update your .env file to use this connection string.');
      
      // Exit with success
      await mongoose.disconnect();
      console.log('Connection closed.');
      return conn.uri;
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      
      // If auth failed, suggest credentials issue
      if (error.message.includes('Authentication failed')) {
        console.log('📋 Suggestion: Check your username and password');
      }
      // If connection refused, suggest service not running
      else if (error.message.includes('ECONNREFUSED')) {
        console.log('📋 Suggestion: Make sure MongoDB is running on the specified host and port');
      }
    }
  }
  
  console.log('\n❌ All connection attempts failed.');
  console.log('Please check that MongoDB is running and any required credentials are correct.');
  return null;
}

// Main function
async function main() {
  try {
    const workingUri = await testConnections();
    
    if (workingUri) {
      console.log('\n✅ Found a working connection configuration!');
      console.log('\nTo update your .env file, run this command:');
      
      // Create sanitized version of URI (hide password)
      const sanitizedUri = workingUri.replace(/:([^:@]+)@/, ':***@');
      console.log(`echo "MONGODB_URI=${sanitizedUri}" > server/.env`);
      
      process.exit(0);
    } else {
      console.log('\n❌ No working MongoDB connection found.');
      console.log('\nTry these solutions:');
      console.log('1. Ensure MongoDB is installed and running');
      console.log('2. Check if authentication is required and use correct credentials');
      console.log('3. Verify the MongoDB service is listening on the expected port');
      
      process.exit(1);
    }
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
}

// Run the script
main(); 