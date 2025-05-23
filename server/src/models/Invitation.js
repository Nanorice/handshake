const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true
  },
  sessionDetails: {
    proposedDate: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // in minutes
      default: 30,
      required: true
    },
    topic: {
      type: String,
      required: true,
      trim: true
    }
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread'
  },
  removedByProfessional: {
    type: Boolean,
    default: false
  },
  chatUnlocked: {
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
invitationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
invitationSchema.index({ sender: 1, receiver: 1 });
invitationSchema.index({ receiver: 1, status: 1 });
invitationSchema.index({ status: 1, proposedDate: 1 });
invitationSchema.index({ threadId: 1 });

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation; 