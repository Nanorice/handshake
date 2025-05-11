const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true
  }
});

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  startTime: {
    type: String,
    required: true,
    // Format validation for HH:MM
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM)!`
    }
  },
  endTime: {
    type: String,
    required: true,
    // Format validation for HH:MM
    validate: {
      validator: function(v) {
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM)!`
    }
  }
});

const professionalProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Basic profile information
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  expertise: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    trim: true
  },
  // Original fields
  industries: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  experience: [experienceSchema],
  availability: [availabilitySchema],
  rate: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Create index for faster lookup
professionalProfileSchema.index({ userId: 1 });

const ProfessionalProfile = mongoose.model('ProfessionalProfile', professionalProfileSchema);

module.exports = ProfessionalProfile; 