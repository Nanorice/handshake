const mongoose = require('mongoose');
const config = require('../config');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Connect to MongoDB
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ Connected to MongoDB');
    
    // Get database instance
    const db = mongoose.connection.db;
    
    // Create collections if they don't exist
    const collections = [
      'users',
      'professionalprofiles',
      'matches',
      'messages',
      'threads',
      'sessions',
      'payments'
    ];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  Collection already exists: ${collectionName}`);
        } else {
          console.error(`❌ Error creating collection ${collectionName}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 It looks like MongoDB is not running. To fix this:');
      console.log('1. Install MongoDB: https://docs.mongodb.com/manual/installation/');
      console.log('2. Start MongoDB service:');
      console.log('   - Windows: Run "mongod" in command prompt');
      console.log('   - macOS: "brew services start mongodb/brew/mongodb-community"');
      console.log('   - Linux: "sudo systemctl start mongod"');
    }
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = setupDatabase; 