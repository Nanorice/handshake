const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // The seeker who initiated the match request
  seeker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // The professional who received the match request
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status of the match request
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  // Additional note from seeker to professional (optional)
  note: {
    type: String,
    trim: true
  },
  
  // Timestamps for status updates
  acceptedAt: Date,
  rejectedAt: Date,
  cancelledAt: Date,
  
  // When this match was created
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // When this match was last updated
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups by seeker and professional
matchSchema.index({ seeker: 1, professional: 1 }, { unique: true });

// Update updatedAt timestamp before saving
matchSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Match = mongoose.model('Match', matchSchema);

module.exports = Match; 