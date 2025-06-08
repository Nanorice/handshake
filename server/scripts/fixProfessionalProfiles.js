// Script to ensure all professional users have proper profile data
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
const connectionString = process.env.MONGODB_URI || 'process.env.MONGODB_URI || 'mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/handshake?retryWrites=true&w=majority&appName=Cluster0'';
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
    const existingUsers = await usersCollection.find({}).toArray();
    console.log(`Found ${existingUsers.length} existing users`);
    
    // Track professionals and updates
    let professionalsUpdated = 0;
    let profilesCreated = 0;
    
    // Get existing professional profiles
    const existingProfiles = await profilesCollection.find({}).toArray();
    console.log(`Found ${existingProfiles.length} existing professional profiles`);
    
    // Process each user
    for (const user of existingUsers) {
      // Check if user might be a professional based on multiple criteria
      const isProfessionalByRole = user.role === 'professional';
      const isProfessionalByUserType = user.userType === 'professional';
      const isProfessionalByEmail = user.email && (
        user.email.includes('professional') || 
        user.email.includes('prof') || 
        user.email.includes('mentor')
      );
      
      // If any criteria match, ensure they're set as professional
      if (isProfessionalByRole || isProfessionalByUserType || isProfessionalByEmail) {
        // Update the user to ensure both fields are set
        const updateResult = await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              role: 'professional',
              userType: 'professional'
            } 
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`Updated user ${user._id} (${user.email}) to professional`);
          professionalsUpdated++;
        }
        
        // Check if this professional already has a profile
        const existingProfile = existingProfiles.find(
          p => p.userId && (p.userId.toString() === user._id.toString() || p.userId === user._id.toString())
        );
        
        if (!existingProfile) {
          // Create a profile using their user data
          const profileData = {
            userId: user._id,
            industries: ['General'],
            skills: user.skills || ['Consulting'],
            experience: user.experience || [],
            availability: [],
            rate: 100,
            title: user.title || user.profession || 'Professional',
            location: user.location || 'Remote',
            company: user.company || user.organization || 'Independent',
            bio: user.bio || `Professional with expertise in various domains`,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const result = await profilesCollection.insertOne(profileData);
          console.log(`Created professional profile for ${user.email || user._id}`);
          profilesCreated++;
        }
      }
    }
    
    // Create at least one professional user if none exist
    const professionals = await usersCollection.find({ 
      $or: [
        { role: 'professional' },
        { userType: 'professional' }
      ]
    }).toArray();
    
    if (professionals.length === 0) {
      console.log('No professionals found. Creating a default professional user...');
      
      // Create a test professional
      const testPro = {
        email: 'testpro@example.com',
        password: '$2a$10$YOURHASHEDPASSWORDHERExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        firstName: 'Test',
        lastName: 'Professional',
        name: 'Test Professional',
        role: 'professional',
        userType: 'professional',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const userResult = await usersCollection.insertOne(testPro);
      console.log(`Created new professional user with ID: ${userResult.insertedId}`);
      
      // Create profile for this user
      const profileData = {
        userId: userResult.insertedId,
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
          }
        ],
        rate: 100,
        title: 'Senior Developer',
        location: 'Remote',
        company: 'Tech Solutions',
        bio: 'Experienced professional with expertise in web development and consulting.',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await profilesCollection.insertOne(profileData);
      console.log(`Created professional profile for test user`);
      profilesCreated++;
    }
    
    // VERIFY: Check for professionals and their profiles
    const verifyProfessionals = await usersCollection.find({ 
      $or: [
        { role: 'professional' },
        { userType: 'professional' }
      ]
    }).toArray();
    
    console.log(`\n===== VERIFICATION =====`);
    console.log(`Found ${verifyProfessionals.length} professionals after updates`);
    
    // Verify each professional has a profile
    let missingProfiles = 0;
    const allProfiles = await profilesCollection.find({}).toArray();
    
    console.log('Professionals and their profiles:');
    for (const pro of verifyProfessionals) {
      const hasProfile = allProfiles.some(p => 
        p.userId && (p.userId.toString() === pro._id.toString() || p.userId === pro._id.toString())
      );
      
      console.log(`- ${pro.email || pro._id}: ${hasProfile ? '✓ Has profile' : '✗ MISSING PROFILE'}`);
      
      if (!hasProfile) {
        missingProfiles++;
      }
    }
    
    console.log('\nSummary:');
    console.log(`- ${professionalsUpdated} users updated to professional role/type`);
    console.log(`- ${profilesCreated} new professional profiles created`);
    console.log(`- ${verifyProfessionals.length} total professionals in system`);
    console.log(`- ${missingProfiles} professionals still missing profiles`);
    
    console.log('\nScript completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
})(); 