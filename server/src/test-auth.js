/**
 * Test JWT Authentication with Server
 * 
 * This script helps diagnose authentication issues by validating 
 * a JWT token directly with the server.
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Command line arguments
const args = process.argv.slice(2);
const token = args[0];

if (!token) {
  console.error('Please provide a JWT token as the first argument');
  console.log('Usage: node test-auth.js <JWT_TOKEN>');
  process.exit(1);
}

async function testAuth() {
  try {
    console.log('\n=== JWT AUTHENTICATION TEST ===\n');
    
    // Connect to the database
    const connectionString = process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    console.log(`Connecting to MongoDB with connection string: ${connectionString}`);
    
    await mongoose.connect(connectionString);
    console.log('✅ Successfully connected to MongoDB\n');
    
    // Step 1: Verify the token format
    console.log('STEP 1: Verifying token format');
    
    if (!token.startsWith('ey')) {
      console.log('⚠️ Warning: Token does not start with "ey". This may not be a valid JWT.');
    } else {
      console.log('✅ Token has valid JWT prefix');
    }
    
    console.log(`Token length: ${token.length}`);
    console.log(`Token preview: ${token.substring(0, 15)}...${token.substring(token.length - 5)}\n`);
    
    // Step 2: Decode the token without verification
    console.log('STEP 2: Decoding token without verification');
    
    let decoded;
    try {
      decoded = jwt.decode(token);
      console.log('✅ Token decoded successfully');
      console.log('Token payload:', JSON.stringify(decoded, null, 2));
      
      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        console.log(`⚠️ Token expired at ${new Date(decoded.exp * 1000).toLocaleString()}`);
        console.log(`Current time: ${new Date().toLocaleString()}`);
      } else if (decoded.exp) {
        console.log(`✅ Token is valid until ${new Date(decoded.exp * 1000).toLocaleString()}`);
      }
      
      console.log();
    } catch (error) {
      console.error('❌ Failed to decode token:', error.message);
      process.exit(1);
    }
    
    // Step 3: Verify the token with the secret
    console.log('STEP 3: Verifying token with secret');
    
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('❌ JWT_SECRET not found in environment variables');
        process.exit(1);
      }
      
      const verified = jwt.verify(token, secret);
      console.log('✅ Token verified successfully with secret');
    } catch (error) {
      console.error(`❌ Token verification failed: ${error.message}`);
      process.exit(1);
    }
    
    // Step 4: Check if user exists in database
    console.log('\nSTEP 4: Checking if user exists in database');
    
    if (decoded?.id) {
      try {
        const user = await User.findById(decoded.id);
        if (user) {
          console.log(`✅ User found: ${user.email} (ID: ${user._id})`);
          console.log(`User role: ${user.role || 'not set'}`);
          console.log(`User type: ${user.userType || 'not set'}`);
        } else {
          console.error(`❌ No user found with ID: ${decoded.id}`);
        }
      } catch (error) {
        console.error('❌ Error finding user:', error.message);
      }
    } else {
      console.error('❌ No user ID in token');
    }
    
    console.log('\n=== AUTH TEST COMPLETED ===\n');
    
  } catch (error) {
    console.error('Error in testAuth:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testAuth(); 