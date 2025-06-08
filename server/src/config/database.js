const mongoose = require('mongoose');

// Production-ready database configuration
const DATABASE_CONFIG = {
  // MongoDB Atlas connection (production)
  PRODUCTION_URI: 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/handshake?retryWrites=true&w=majority&appName=Cluster0',
  
  // Local development fallback
  LOCAL_URI: 'mongodb://localhost:27017/handshake',
  
  // Connection options
  OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Maximum number of connections in the connection pool
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
  }
};

/**
 * Get the appropriate database URI based on environment
 */
function getDatabaseURI() {
  // Priority order:
  // 1. Environment variable (production)
  // 2. Atlas URI (development with cloud)
  // 3. Local URI (local development)
  return process.env.MONGODB_URI || 
         DATABASE_CONFIG.PRODUCTION_URI || 
         DATABASE_CONFIG.LOCAL_URI;
}

/**
 * Connect to MongoDB with proper error handling
 */
async function connectToDatabase() {
  const uri = getDatabaseURI();
  
  try {
    // Mask credentials in logs
    const maskedUri = uri.replace(/\/\/.*@/, '//***:***@');
    console.log(`🔌 Connecting to MongoDB: ${maskedUri}`);
    
    await mongoose.connect(uri, DATABASE_CONFIG.OPTIONS);
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`✅ Successfully connected to database: ${dbName}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

/**
 * Gracefully close database connection
 */
async function disconnectFromDatabase() {
  try {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
}

/**
 * Check if database is connected
 */
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
  getDatabaseURI,
  isDatabaseConnected,
  DATABASE_CONFIG
}; 