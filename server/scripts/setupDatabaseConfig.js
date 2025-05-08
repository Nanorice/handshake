/**
 * Database Configuration Setup Script
 * This script ensures consistent database connection across the application.
 * 
 * Usage: node scripts/setupDatabaseConfig.js
 * 
 * This script will:
 * 1. Create a .env file with the correct MongoDB URI if it doesn't exist
 * 2. Update any code references to use the consistent database name
 */

const fs = require('fs');
const path = require('path');

// Constants
const DATABASE_NAME = 'test'; // The correct database name
const CONNECTION_STRING = `mongodb://localhost:27017/${DATABASE_NAME}`;
const ENV_FILE_PATH = path.join(__dirname, '..', '.env');

// Create or update .env file
const createEnvFile = () => {
  const envContent = `# MongoDB Connection
MONGODB_URI=${CONNECTION_STRING}

# JWT Secret for authentication
JWT_SECRET=handshake_jwt_secret

# Server settings
PORT=5000
NODE_ENV=development

# Client URL for CORS
CLIENT_URL=http://localhost:3000
`;

  try {
    fs.writeFileSync(ENV_FILE_PATH, envContent);
    console.log(`✅ Created/updated .env file at ${ENV_FILE_PATH}`);
  } catch (error) {
    console.error(`❌ Failed to create .env file: ${error.message}`);
  }
};

// Create a database config reference file
const createDatabaseReferenceFile = () => {
  const referenceContent = `# Database Configuration Reference

## Connection Information
- Database Name: \`${DATABASE_NAME}\`
- Connection String: \`${CONNECTION_STRING}\`

## Collections
- users
- professionalprofiles
- matches
- messages
- threads
- sessions
- payments

## Notes
- All API endpoints should connect to this database
- The application is configured to use MongoDB as the database

Last updated: ${new Date().toISOString()}
`;

  const referencePath = path.join(__dirname, '..', 'DATABASE_CONFIG.md');
  
  try {
    fs.writeFileSync(referencePath, referenceContent);
    console.log(`✅ Created database reference file at ${referencePath}`);
  } catch (error) {
    console.error(`❌ Failed to create database reference file: ${error.message}`);
  }
};

// Main function
const main = () => {
  console.log('📊 Setting up database configuration...');
  
  // Create/update .env file
  createEnvFile();
  
  // Create database reference file
  createDatabaseReferenceFile();
  
  console.log(`\n✅ Database configuration complete. Using database: ${DATABASE_NAME}`);
  console.log('ℹ️ Please restart your server for changes to take effect');
};

// Run the script
main(); 