// Quick start script for immediate Atlas connection
// This bypasses local MongoDB requirements

const mongoose = require('mongoose');
const http = require('http');
const socketService = require('./src/services/socketService');
const app = require('./src/app');

// Fix Mongoose strictQuery deprecation warning
mongoose.set('strictQuery', false);

const PORT = process.env.PORT || 5000;
console.log(`🚀 Quick-starting server on port: ${PORT}`);

// Create HTTP server
const server = http.createServer(app);

// Direct Atlas connection (temporary solution)
const ATLAS_URI = 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/handshake?retryWrites=true&w=majority&appName=Cluster0';

async function quickStart() {
  try {
    console.log('⚡ Attempting quick connection to MongoDB Atlas...');
    
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Initialize Socket.io
    socketService.initialize(server);
    console.log('✅ Socket.IO initialized');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🎉 Server running successfully on port ${PORT}`);
      console.log(`🌐 Frontend proxy should connect to: http://localhost:${PORT}`);
      console.log('\n📋 Next steps:');
      console.log('1. Your server is now running!');
      console.log('2. Start your frontend with: npm start (in client directory)');
      console.log('3. If this works, you can set up proper environment variables later');
    });
    
  } catch (error) {
    console.error('❌ Quick start failed:', error.message);
    
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.log('\n🔧 IP Whitelist Issue - Follow these steps:');
      console.log('1. Go to: https://cloud.mongodb.com');
      console.log('2. Navigate to your cluster');
      console.log('3. Click "Network Access" in the left sidebar');
      console.log('4. Click "Add IP Address"');
      console.log('5. Add your current IP or use 0.0.0.0/0 for development');
      console.log('6. Save and wait 2-3 minutes for changes to apply');
      console.log('7. Try running this script again');
    } else {
      console.log('\n💡 Alternative solutions:');
      console.log('1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/');
      console.log('2. Or check your Atlas credentials and connection string');
    }
    
    process.exit(1);
  }
}

quickStart(); 