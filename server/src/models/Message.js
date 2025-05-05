const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'invite', 'timeProposal', 'timeSuggestion', 'timeConfirmation', 'payment'],
    default: 'text'
  },
  metadata: {
    // For invite messages
    inviteId: mongoose.Schema.Types.ObjectId,
    status: {
      type: String,
      enum: ['pending', 'proposed', 'suggested', 'confirmed', 'paid', 'completed', 'cancelled'],
      default: 'pending'
    },
    // For time proposal/suggestion messages
    timeSlots: [{
      date: Date,
      time: String
    }],
    // For time confirmation messages
    confirmedTimeSlot: {
      date: Date,
      time: String
    },
    // For payment messages
    paymentId: String,
    amount: Number,
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  },
  isRead: {
    type: Boolean,
    default: false
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
messageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
messageSchema.index({ threadId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'metadata.inviteId': 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 