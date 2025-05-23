/**
 * Test Login Script for JWT Token
 * 
 * This script logs in a user and returns a valid JWT token for testing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Get email and password from command line args
const args = process.argv.slice(2);
const email = args[0];
const password = args[1];

if (!email || !password) {
  console.error('Please provide email and password as arguments');
  console.log('Usage: node auth-login-test.js <email> <password>');
  process.exit(1);
}

async function testLogin() {
  try {
    console.log('\n=== AUTH LOGIN TEST ===\n');
    
    // Connect to MongoDB
    const connectionString = process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    console.log(`Connecting to MongoDB...`);
    
    await mongoose.connect(connectionString);
    console.log('✅ Successfully connected to MongoDB\n');
    
    // Find user by email
    console.log(`Searching for user with email: ${email}`);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.email} (ID: ${user._id})`);
    console.log(`User role: ${user.role || 'not set'}`);
    console.log(`User type: ${user.userType || 'not set'}`);
    
    // Compare password
    console.log('\nVerifying password...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.error(`❌ Invalid password for user ${email}`);
      process.exit(1);
    }
    
    console.log('✅ Password verified successfully');
    
    // Generate JWT token
    console.log('\nGenerating JWT token...');
    
    const payload = {
      id: user._id
    };
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('❌ JWT_SECRET not found in environment variables');
      process.exit(1);
    }
    
    // Token with 1 year expiration
    const token = jwt.sign(
      payload,
      secret,
      { expiresIn: '1y' }
    );
    
    console.log('✅ JWT token generated successfully');
    console.log(`\nToken: ${token}`);
    
    // Token info
    const decoded = jwt.decode(token);
    console.log('\nToken payload:', JSON.stringify(decoded, null, 2));
    
    console.log(`\nExpires: ${new Date(decoded.exp * 1000).toLocaleString()}`);
    
    // Copy command for tests
    console.log('\n=== COPY THIS FOR TESTING ===');
    console.log(`localStorage.setItem('token', '${token}');`);
    console.log(`localStorage.setItem('userId', '${user._id}');`);
    console.log(`localStorage.setItem('isLoggedIn', 'true');`);
    console.log('=== END COPY ===\n');
    
    console.log('Login test completed successfully!');
    
  } catch (error) {
    console.error('Error in test login:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testLogin(); 