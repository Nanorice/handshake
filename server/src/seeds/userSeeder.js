const mongoose = require('mongoose');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Arrays for generating realistic data
const industries = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
  'Design', 'Engineering', 'Consulting', 'Legal', 'Media'
];

const companies = [
  'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta',
  'Netflix', 'Tesla', 'IBM', 'Oracle', 'Intel',
  'Salesforce', 'Adobe', 'Twitter', 'Uber', 'Airbnb',
  'Spotify', 'Shopify', 'Slack', 'Zoom', 'Stripe'
];

const positions = [
  'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer',
  'Marketing Specialist', 'Financial Analyst', 'HR Manager', 'Operations Director',
  'Sales Representative', 'Customer Success Manager', 'Business Analyst',
  'Project Manager', 'Account Executive', 'Content Strategist', 'DevOps Engineer'
];

const locations = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX',
  'Boston, MA', 'Chicago, IL', 'Los Angeles, CA', 'Denver, CO',
  'Atlanta, GA', 'Miami, FL', 'Portland, OR', 'Washington, DC',
  'Toronto, Canada', 'London, UK', 'Berlin, Germany'
];

const interests = [
  'Artificial Intelligence', 'Blockchain', 'Cloud Computing', 'Data Science',
  'Entrepreneurship', 'Remote Work', 'UI/UX Design', 'Product Development',
  'Digital Marketing', 'E-commerce', 'FinTech', 'Cybersecurity',
  'Leadership', 'Mentoring', 'Work-Life Balance', 'Career Development',
  'Sustainability', 'Health Tech', 'EdTech', 'Future of Work'
];

const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah',
  'Thomas', 'Karen', 'Charles', 'Nancy', 'Christopher', 'Lisa', 'Daniel', 'Margaret',
  'Matthew', 'Betty', 'Anthony', 'Sandra', 'Mark', 'Ashley', 'Donald', 'Dorothy',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

// Helper functions
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate professional user data
const generateProfessionalUser = (index) => {
  const firstName = getRandomItem(firstNames);
  const lastName = getRandomItem(lastNames);
  
  return {
    email: `pro${index}@example.com`,
    password: 'password123',
    userType: 'professional',
    firstName,
    lastName,
    profile: {
      bio: `Experienced professional with expertise in ${getRandomItem(industries)}.`,
      industry: getRandomItem(industries),
      company: getRandomItem(companies),
      position: getRandomItem(positions),
      location: getRandomItem(locations),
      interests: getRandomItems(interests, getRandomInt(2, 5)),
      availability: [
        {
          day: 'Monday',
          timeSlots: ['09:00', '10:00', '11:00', '13:00', '14:00']
        },
        {
          day: 'Wednesday',
          timeSlots: ['13:00', '14:00', '15:00', '16:00']
        },
        {
          day: 'Friday',
          timeSlots: ['09:00', '10:00', '15:00', '16:00']
        }
      ],
      linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      website: `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.com`
    },
    preferences: {
      meetingType: getRandomItem(['virtual', 'in-person', 'both']),
      preferredIndustries: getRandomItems(industries, getRandomInt(2, 4))
    }
  };
};

// Generate seeker user data
const generateSeekerUser = (index) => {
  const firstName = getRandomItem(firstNames);
  const lastName = getRandomItem(lastNames);
  
  return {
    email: `seeker${index}@example.com`,
    password: 'password123',
    userType: 'seeker',
    firstName,
    lastName,
    profile: {
      bio: `Looking to connect with professionals in ${getRandomItems(industries, 2).join(' and ')}.`,
      interests: getRandomItems(interests, getRandomInt(2, 5)),
      location: getRandomItem(locations)
    },
    preferences: {
      meetingType: getRandomItem(['virtual', 'in-person', 'both']),
      preferredIndustries: getRandomItems(industries, getRandomInt(2, 4))
    }
  };
};

// Function to seed users
const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/handshake?retryWrites=true&w=majority&appName=Cluster0'', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Generate professional users
    const professionalUsers = [];
    const professionalCredentials = [];
    
    for (let i = 1; i <= 20; i++) {
      const userData = generateProfessionalUser(i);
      const user = new User(userData);
      await user.save();
      
      professionalUsers.push(user);
      professionalCredentials.push({
        email: userData.email,
        password: userData.password,
        userType: userData.userType,
        name: `${userData.firstName} ${userData.lastName}`
      });
      
      console.log(`Created professional user: ${userData.email}`);
    }
    
    // Generate seeker users
    const seekerUsers = [];
    const seekerCredentials = [];
    
    for (let i = 1; i <= 20; i++) {
      const userData = generateSeekerUser(i);
      const user = new User(userData);
      await user.save();
      
      seekerUsers.push(user);
      seekerCredentials.push({
        email: userData.email,
        password: userData.password,
        userType: userData.userType,
        name: `${userData.firstName} ${userData.lastName}`
      });
      
      console.log(`Created seeker user: ${userData.email}`);
    }
    
    // Save credentials to a file
    const credentials = {
      professionals: professionalCredentials,
      seekers: seekerCredentials
    };
    
    const credentialsFilePath = path.join(__dirname, '../../user_credentials.json');
    fs.writeFileSync(credentialsFilePath, JSON.stringify(credentials, null, 2));
    
    console.log(`Saved ${professionalUsers.length} professional users and ${seekerUsers.length} seeker users`);
    console.log(`Credentials saved to: ${credentialsFilePath}`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

// Run the seeder
seedUsers(); 