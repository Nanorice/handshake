const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    content: {
      type: String,
      trim: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageType: {
      type: String,
      enum: ['text', 'file', 'reply', 'invite', 'timeProposal', 'timeSuggestion', 'timeConfirmation', 'payment'],
      default: 'text'
    }
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  metadata: {
    // Can store additional data about the thread
    subject: String,
    isGroupChat: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
threadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
threadSchema.index({ participants: 1 });
threadSchema.index({ match: 1 });
threadSchema.index({ updatedAt: -1 });

// Ensure the same thread doesn't get created multiple times between the same users
threadSchema.index(
  { participants: 1 },
  { 
    unique: true,
    partialFilterExpression: { 'metadata.isGroupChat': false } 
  }
);

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread; 