// Configuration file for the server
// This file manages environment variables and provides fallback defaults

const config = {
  // Database Configuration
  database: {
    // MongoDB connection URI - prioritize environment variable, then fallback to local
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/handshake',
    
    // Alternative URIs to try if the primary fails
    fallbackUris: [
      'mongodb://localhost:27017/handshake',
      'mongodb://127.0.0.1:27017/handshake'
    ],
    
    // Mongoose connection options
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development'
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_change_in_production',
    sessionSecret: process.env.SESSION_SECRET || 'your_session_secret_key'
  },

  // Application Settings
  app: {
    name: 'Handshake Server',
    version: '1.0.0'
  }
};

module.exports = config; 