/**
 * Seed script to create professional users for testing
 * 
 * Run with: node scripts/seedProfessionals.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const ProfessionalProfile = require('../src/models/ProfessionalProfile');
const bcrypt = require('bcryptjs');

// Sample professionals data
const professionals = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'professional',
    profile: {
      title: 'Senior Software Engineer',
      company: 'Tech Solutions Inc.',
      location: 'San Francisco, CA',
      industries: ['Technology', 'Software Development'],
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      bio: 'Experienced software engineer with 10+ years in web development.',
      experienceYears: 10,
      rate: 120
    }
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'professional',
    profile: {
      title: 'Marketing Director',
      company: 'Brand Builders',
      location: 'New York, NY',
      industries: ['Marketing', 'Advertising'],
      skills: ['Digital Marketing', 'Brand Strategy', 'Social Media Marketing'],
      bio: 'Marketing professional with expertise in brand development and digital marketing.',
      experienceYears: 8,
      rate: 100
    }
  },
  {
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.johnson@example.com',
    password: 'password123',
    role: 'professional',
    profile: {
      title: 'Financial Advisor',
      company: 'Wealth Management Partners',
      location: 'Chicago, IL',
      industries: ['Finance', 'Investment'],
      skills: ['Financial Planning', 'Investment Management', 'Retirement Planning'],
      bio: 'Certified financial planner with a focus on helping individuals achieve their financial goals.',
      experienceYears: 15,
      rate: 150
    }
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    password: 'password123',
    role: 'professional',
    profile: {
      title: 'UX/UI Designer',
      company: 'Creative Designs',
      location: 'Austin, TX',
      industries: ['Design', 'Technology'],
      skills: ['User Experience Design', 'User Interface Design', 'Figma', 'Adobe XD'],
      bio: 'Creative designer focused on crafting intuitive and engaging user experiences.',
      experienceYears: 6,
      rate: 90
    }
  },
  {
    firstName: 'Michael',
    lastName: 'Wilson',
    email: 'michael.wilson@example.com',
    password: 'password123',
    role: 'professional',
    profile: {
      title: 'Data Scientist',
      company: 'Data Insights',
      location: 'Seattle, WA',
      industries: ['Technology', 'Data Science'],
      skills: ['Machine Learning', 'Python', 'Data Analysis', 'SQL'],
      bio: 'Data scientist with a passion for turning data into actionable insights.',
      experienceYears: 7,
      rate: 130
    }
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/handshake')
  .then(async () => {
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    try {
      // Clear existing professionals and profiles
      await User.deleteMany({ role: 'professional' });
      await ProfessionalProfile.deleteMany({});
      
      console.log('Existing professional data cleared');
      
      // Create each professional
      for (const pro of professionals) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(pro.password, salt);
        
        // Create user
        const user = new User({
          firstName: pro.firstName,
          lastName: pro.lastName,
          email: pro.email,
          password: hashedPassword,
          role: pro.role,
          name: `${pro.firstName} ${pro.lastName}`
        });
        
        const savedUser = await user.save();
        
        // Create profile
        const profile = new ProfessionalProfile({
          userId: savedUser._id,
          title: pro.profile.title,
          company: pro.profile.company,
          location: pro.profile.location,
          industries: pro.profile.industries,
          skills: pro.profile.skills,
          bio: pro.profile.bio,
          experienceYears: pro.profile.experienceYears,
          rate: pro.profile.rate,
          availability: []
        });
        
        await profile.save();
        
        console.log(`Created professional: ${pro.firstName} ${pro.lastName}`);
      }
      
      console.log('Professional seeding completed successfully');
    } catch (error) {
      console.error('Error seeding professionals:', error);
    } finally {
      // Close connection
      mongoose.connection.close();
    }
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  }); 