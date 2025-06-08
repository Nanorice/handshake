const mongoose = require('mongoose');
require('dotenv').config();

// Import Thread and Message models
const Thread = require('../src/models/Thread');
const Message = require('../src/models/Message');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/handshake?retryWrites=true&w=majority&appName=Cluster0'', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Deduplicate threads function
async function deduplicateThreads() {
  try {
    console.log('Starting thread deduplication process...');
    
    // Find all thread pairs (not group chats)
    const threads = await Thread.find({ 'metadata.isGroupChat': false }).lean();
    
    console.log(`Found ${threads.length} total threads`);
    
    // Create a map to track threads between the same users
    const threadMap = new Map();
    const duplicates = [];
    
    // Find duplicates
    threads.forEach(thread => {
      // Sort participant IDs to ensure consistent key regardless of participant order
      const participantIds = thread.participants.map(p => p.toString()).sort();
      const key = participantIds.join('_');
      
      if (!threadMap.has(key)) {
        threadMap.set(key, [thread._id]);
      } else {
        threadMap.get(key).push(thread._id);
        // If this is the second thread for this pair, it's a duplicate
        if (threadMap.get(key).length === 2) {
          duplicates.push({
            participants: participantIds,
            threadIds: [...threadMap.get(key)]
          });
        }
      }
    });

    // No duplicates found
    if (duplicates.length === 0) {
      console.log('No duplicate threads found');
      return { duplicateThreads: [] };
    }

    console.log(`Found ${duplicates.length} duplicate thread pairs`);
    
    // Process duplicates - for each duplicate pair, keep the newer one (usually has more messages)
    // and merge data from the older one if needed
    const results = [];
    
    for (const dup of duplicates) {
      // Get full thread objects, not just IDs
      const threadObjects = await Promise.all(
        dup.threadIds.map(id => Thread.findById(id))
      );
      
      // Sort by updatedAt (newest first)
      threadObjects.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      const [keepThread, removeThread] = threadObjects;
      
      console.log(`Keeping thread ${keepThread._id}, removing ${removeThread._id}`);
      
      // 1. Move all messages from the old thread to the new one
      const updateResult = await Message.updateMany(
        { threadId: removeThread._id },
        { $set: { threadId: keepThread._id } }
      );
      
      console.log(`Moved ${updateResult.modifiedCount} messages to thread ${keepThread._id}`);
      
      // 2. Merge unread counts (take the max)
      for (const [userId, count] of removeThread.unreadCount.entries()) {
        const currentCount = keepThread.unreadCount.get(userId) || 0;
        if (count > currentCount) {
          keepThread.unreadCount.set(userId, count);
          keepThread.markModified('unreadCount');
        }
      }
      
      // 3. Take the newer lastMessage if available
      if (removeThread.lastMessage && (!keepThread.lastMessage || 
          new Date(removeThread.lastMessage.timestamp) > new Date(keepThread.lastMessage.timestamp))) {
        keepThread.lastMessage = removeThread.lastMessage;
      }
      
      // 4. Update the kept thread
      await keepThread.save();
      
      // 5. Delete the duplicate thread
      await Thread.deleteOne({ _id: removeThread._id });
      
      results.push({
        participants: dup.participants,
        keptThreadId: keepThread._id,
        removedThreadId: removeThread._id,
        messagesMoved: await Message.countDocuments({ threadId: keepThread._id })
      });
    }
    
    console.log('Deduplication completed successfully');
    console.log(`Processed ${duplicates.length} duplicate thread pairs`);
    
    return { duplicateThreads: results };
    
  } catch (error) {
    console.error('Error deduplicating threads:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB after processing
    mongoose.disconnect();
  }
}

// Run the deduplication
deduplicateThreads()
  .then(results => {
    console.log('Deduplication results:', JSON.stringify(results, null, 2));
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  }); 