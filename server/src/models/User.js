const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['seeker', 'professional'],
    required: true,
    default: 'seeker'
  },
  // Add userType as a virtual that maps to role
  name: {
    type: String,
    required: true,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
    required: false
  },
  resumeUrl: {
    type: String,
    trim: true,
    required: false
  },
  linkedinUrl: {
    type: String,
    trim: true,
    required: false
  },
  profileImage: {
    type: String,
    trim: true,
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
  toJSON: { virtuals: true }, // Enable virtuals when converting to JSON
  toObject: { virtuals: true } // Enable virtuals when converting to object
});

// Virtual for userType that maps to role
userSchema.virtual('userType')
  .get(function() {
    return this.role;
  })
  .set(function(value) {
    this.role = value;
  });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Print debugging info
    console.log('Hashing password for user:', this.email);
    
    // Use a simpler hash for testing
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 