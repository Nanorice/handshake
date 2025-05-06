const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  seekerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  datetime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,  // Minimum session duration in minutes
    default: 30
  },
  zoomLink: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
    required: true
  },
  stripeSessionId: {
    type: String,
    trim: true
  },
  notes: {
    seeker: {
      type: String,
      trim: true
    },
    professional: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Create indexes for faster lookups
sessionSchema.index({ seekerId: 1 });
sessionSchema.index({ professionalId: 1 });
sessionSchema.index({ datetime: 1 });
sessionSchema.index({ status: 1 });

// Method to check if session time conflicts with existing sessions
sessionSchema.methods.hasTimeConflict = async function(userId) {
  const buffer = 15; // 15 minutes buffer before and after session
  const sessionStart = new Date(this.datetime);
  const sessionEnd = new Date(sessionStart.getTime() + this.duration * 60000);
  
  const bufferStart = new Date(sessionStart.getTime() - buffer * 60000);
  const bufferEnd = new Date(sessionEnd.getTime() + buffer * 60000);
  
  // Check for conflicts with user's existing sessions
  const conflictingSessions = await this.constructor.countDocuments({
    _id: { $ne: this._id }, // Exclude current session if it's being updated
    $or: [
      { seekerId: userId },
      { professionalId: userId }
    ],
    status: { $nin: ['cancelled'] },
    $or: [
      { 
        datetime: { 
          $gte: bufferStart,
          $lt: bufferEnd
        }
      },
      {
        $and: [
          { datetime: { $lte: bufferStart } },
          { 
            $expr: {
              $gte: [
                { $add: ["$datetime", { $multiply: ["$duration", 60000] }] },
                bufferStart.getTime()
              ]
            }
          }
        ]
      }
    ]
  });
  
  return conflictingSessions > 0;
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session; 