/**
 * MongoDB Setup Guide
 * 
 * This script provides guidance for setting up MongoDB
 * for the Handshake application.
 */

console.log('🚀 MongoDB Setup Guide');
console.log('======================');
console.log('\nThis script will help you set up MongoDB for your Handshake application.');
console.log('Choose one of the following options:');

console.log('\n1️⃣ Install MongoDB Locally');
console.log('-------------------------');
console.log('Option 1: Using Chocolatey (Windows package manager):');
console.log('  > choco install mongodb');
console.log('\nOption 2: Manual installation:');
console.log('  > Download: https://www.mongodb.com/try/download/community');
console.log('  > Follow installation instructions');
console.log('\nAfter installing, start MongoDB:');
console.log('  > Start the MongoDB service');
console.log('  > Or run mongod.exe manually');
console.log('\nThen update your .env file with:');
console.log('  MONGODB_URI=mongodb://localhost:27017/test');

console.log('\n2️⃣ Use MongoDB Atlas (Cloud-hosted)');
console.log('--------------------------------');
console.log('Step 1: Create a free MongoDB Atlas account at:');
console.log('  https://www.mongodb.com/cloud/atlas/register');
console.log('\nStep 2: Create a new cluster (the free tier works fine)');
console.log('\nStep 3: Under "Security" -> "Database Access", create a new database user');
console.log('\nStep 4: Under "Security" -> "Network Access", add your IP address');
console.log('\nStep 5: Under "Databases" -> "Connect", choose "Connect your application"');
console.log('  and copy the connection string');
console.log('\nStep 6: Update your .env file with:');
console.log('  MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/test?retryWrites=true&w=majority');
console.log('  (Replace <username>, <password>, and <cluster> with your actual values)');

console.log('\n3️⃣ Use Docker Container');
console.log('---------------------');
console.log('Step 1: Install Docker if not already installed:');
console.log('  https://www.docker.com/products/docker-desktop');
console.log('\nStep 2: Run MongoDB in a Docker container:');
console.log('  > docker run -d -p 27017:27017 --name mongodb mongo:latest');
console.log('\nStep 3: Update your .env file with:');
console.log('  MONGODB_URI=mongodb://localhost:27017/test');

console.log('\n📝 Creating .env file template');
console.log('--------------------------');
console.log('A template .env file will be created in the server directory.');
console.log('Edit it with the correct MongoDB connection string after you set up MongoDB.');

// Include fs module to create .env template
const fs = require('fs');
const path = require('path');

// Create .env template file
const envTemplatePath = path.join(__dirname, '..', '.env.template');
const envTemplate = `# MongoDB Connection
# CHOOSE ONE OF THE OPTIONS BELOW AND UNCOMMENT IT

# Local MongoDB
# MONGODB_URI=mongodb://localhost:27017/test

# MongoDB Atlas (Replace with your connection string)
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/test?retryWrites=true&w=majority

# Docker MongoDB
# MONGODB_URI=mongodb://localhost:27017/test

# JWT Secret for authentication
JWT_SECRET=handshake_jwt_secret

# Server settings
PORT=5000
NODE_ENV=development

# Client URL for CORS
CLIENT_URL=http://localhost:3000
`;

try {
  fs.writeFileSync(envTemplatePath, envTemplate);
  console.log(`\n✅ Template created at: ${envTemplatePath}`);
  console.log('Copy this file to .env and update with your MongoDB connection string');
} catch (error) {
  console.error(`❌ Error creating template: ${error.message}`);
}

console.log('\n🔄 Next Steps:');
console.log('1. Set up MongoDB using one of the options above');
console.log('2. Update your .env file with the correct connection string');
console.log('3. Restart your server');
console.log('\nℹ️ For more help, visit: https://www.mongodb.com/docs/'); 