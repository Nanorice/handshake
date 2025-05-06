/**
 * Script to analyze and prepare professional users in the existing database
 * Run with: node scripts/createProfessionals.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to the database
mongoose.connect('mongodb://localhost:27017/test')
  .then(async () => {
    console.log('Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    try {
      // 1. Analyze existing users collection
      const usersCollection = mongoose.connection.db.collection('users');
      const userCount = await usersCollection.countDocuments();
      console.log(`Found ${userCount} users in database`);
      
      if (userCount > 0) {
        // Get a sample user to see its structure
        const sampleUser = await usersCollection.findOne();
        console.log('Sample user field names:', Object.keys(sampleUser));
        console.log('Sample user has role field?', sampleUser.hasOwnProperty('role'));
        console.log('Sample user has userType field?', sampleUser.hasOwnProperty('userType'));
        
        // Identify the field used for user type (role or userType)
        const roleField = sampleUser.hasOwnProperty('role') ? 'role' : 'userType';
        console.log(`Using "${roleField}" field to identify user types`);
        
        // Check if there are already professionals
        const existingProfessionals = await usersCollection.find({ [roleField]: 'professional' }).toArray();
        console.log(`Found ${existingProfessionals.length} existing professionals`);
        
        // 2. Find users that could be converted to professionals
        const candidateUsers = await usersCollection.find().limit(5).toArray();
        console.log(`Selected ${candidateUsers.length} users to convert to professionals`);
        
        // 3. Convert users to professionals and create professional profiles
        const professionals = [];
        for (let i = 0; i < candidateUsers.length; i++) {
          const user = candidateUsers[i];
          
          // Update the user to be a professional
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { [roleField]: 'professional' } }
          );
          
          console.log(`Converted user ${user._id} to professional using ${roleField} field`);
          
          // Create a professional profile
          const profilesCollection = mongoose.connection.db.collection('professionalprofiles');
          
          // Check if profile already exists
          const existingProfile = await profilesCollection.findOne({ userId: user._id });
          
          if (!existingProfile) {
            // Generate a profile with sample data
            const profile = {
              userId: user._id,
              title: ['Software Engineer', 'Marketing Director', 'UX Designer', 'Data Scientist', 'Financial Advisor'][i % 5],
              company: ['Tech Solutions Inc.', 'Global Marketing', 'Design Studio', 'Data Insights', 'Finance Partners'][i % 5],
              location: ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Chicago, IL'][i % 5],
              industries: [
                ['Technology', 'Software Development'],
                ['Marketing', 'Advertising'],
                ['Design', 'Technology'],
                ['Technology', 'Data Science'],
                ['Finance', 'Investment']
              ][i % 5],
              skills: [
                ['JavaScript', 'React', 'Node.js', 'MongoDB'],
                ['Digital Marketing', 'Brand Strategy', 'Social Media Marketing'],
                ['User Experience Design', 'User Interface Design', 'Figma', 'Adobe XD'],
                ['Machine Learning', 'Python', 'Data Analysis', 'SQL'],
                ['Financial Planning', 'Investment Management', 'Retirement Planning']
              ][i % 5],
              bio: [
                'Experienced software engineer with expertise in web development.',
                'Marketing professional with expertise in brand development and digital marketing.',
                'Creative designer focused on crafting intuitive and engaging user experiences.',
                'Data scientist with a passion for turning data into actionable insights.',
                'Certified financial planner with a focus on helping individuals achieve their financial goals.'
              ][i % 5],
              experienceYears: [10, 8, 6, 7, 15][i % 5],
              rate: [120, 100, 90, 130, 150][i % 5],
              availability: [],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await profilesCollection.insertOne(profile);
            console.log(`Created professional profile for user ${user._id}`);
            professionals.push({ user, profile });
          } else {
            console.log(`Professional profile already exists for user ${user._id}`);
            professionals.push({ user, profile: existingProfile });
          }
        }
        
        console.log(`\nSuccessfully prepared ${professionals.length} professionals`);
        console.log('Sample professional: ', professionals[0].user.firstName || professionals[0].user.name, professionals[0].profile.title);
      } else {
        console.log('No users found in database. Please run user seeding first.');
      }
    } catch (error) {
      console.error('Error preparing professionals:', error);
    } finally {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  }); 