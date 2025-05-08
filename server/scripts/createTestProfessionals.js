// Script to create a test professional user and profile for testing
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
console.log(`Connecting to MongoDB using: ${connectionString}`);

(async () => {
  try {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    
    // Get collections
    const usersCollection = mongoose.connection.db.collection('users');
    const profilesCollection = mongoose.connection.db.collection('professionalprofiles');
    
    // Check existing users
    const existingUsers = await usersCollection.countDocuments();
    console.log(`Found ${existingUsers} existing users`);
    
    // Create a test professional user
    const testUser = {
      email: 'testpro@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Test Professional',
      firstName: 'Test',
      lastName: 'Professional',
      role: 'professional',
      userType: 'professional', // Set both fields to be safe
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: testUser.email });
    
    let userId;
    if (existingUser) {
      console.log('User already exists, updating...');
      await usersCollection.updateOne(
        { email: testUser.email },
        { $set: { role: 'professional', userType: 'professional' } }
      );
      userId = existingUser._id;
      console.log(`Updated existing user to professional. User ID: ${userId}`);
    } else {
      const result = await usersCollection.insertOne(testUser);
      userId = result.insertedId;
      console.log(`Created new professional user. User ID: ${userId}`);
    }
    
    // Create/update professional profile
    const profileData = {
      userId: userId,
      industries: ['Technology', 'Education'],
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      experience: [
        {
          company: 'Tech Company',
          title: 'Senior Developer',
          startDate: new Date('2020-01-01'),
          description: 'Full stack development'
        }
      ],
      availability: [
        {
          day: 'Monday',
          startTime: '09:00',
          endTime: '17:00'
        },
        {
          day: 'Wednesday',
          startTime: '09:00',
          endTime: '17:00'
        }
      ],
      rate: 100
    };
    
    // Check if profile exists
    const existingProfile = await profilesCollection.findOne({ userId: userId });
    
    if (existingProfile) {
      console.log('Profile already exists, updating...');
      await profilesCollection.updateOne(
        { userId: userId },
        { $set: profileData }
      );
      console.log('Professional profile updated');
    } else {
      await profilesCollection.insertOne(profileData);
      console.log('Professional profile created');
    }
    
    // Log all users to verify
    console.log('\nVerifying users in database:');
    const allUsers = await usersCollection.find({}).toArray();
    allUsers.forEach(user => {
      console.log(`- User ${user._id}: ${user.email}, role=${user.role}, userType=${user.userType}`);
    });
    
    // Log professional profiles
    console.log('\nVerifying professional profiles:');
    const allProfiles = await profilesCollection.find({}).toArray();
    allProfiles.forEach(profile => {
      console.log(`- Profile for userId=${profile.userId}`);
    });
    
    console.log('\nScript completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
})(); 