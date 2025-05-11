const ProfessionalProfile = require('../models/ProfessionalProfile');
const User = require('../models/User');

// GET /api/professionalprofiles/me
const getMyProfessionalProfile = async (req, res) => {
  console.log('GET /api/professionalprofiles/me endpoint accessed');
  try {
    const userId = req.user._id;
    console.log('Fetching profile for user:', userId);
    
    let profile = await ProfessionalProfile.findOne({ userId }).lean();
    if (!profile) {
      console.log('No existing profile found, creating a default one from user data');
      // If no profile, use user info as default
      const user = await User.findById(userId).lean();
      if (!user) {
        console.error('User not found:', userId);
        return res.status(404).json({ success: false, error: { message: 'User not found' } });
      }
      
      // Create a complete default profile with all expected UI fields
      const defaultProfile = {
        userId,
        industries: user.industries || [],
        skills: user.skills || [],
        experience: [],
        availability: [],
        rate: user.rate || 0,
        // Essential UI fields
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        title: user.title || '',
        bio: user.bio || '',
        expertise: user.expertise || '',
        email: user.email,
        profilePicture: user.profilePicture || '',
      };
      
      console.log('Creating and saving default profile to database');
      
      // Create the profile in the database
      try {
        const newProfile = new ProfessionalProfile(defaultProfile);
        profile = await newProfile.save();
        console.log('Default profile created and saved:', profile._id);
        
        return res.status(200).json({ 
          success: true, 
          data: { 
            profile: profile.toObject(),
            isDefault: true,
            message: 'Default profile created from user data'
          } 
        });
      } catch (createErr) {
        console.error('Error creating default profile:', createErr);
        
        // Still return a usable profile even if saving failed
        console.log('Returning unsaved default profile with all UI fields');
        return res.status(200).json({ 
          success: true, 
          data: { 
            profile: defaultProfile, 
            isDefault: true,
            error: 'Could not save default profile to database',
            message: 'Using temporary profile'
          } 
        });
      }
    }
    
    console.log('Existing profile found:', profile._id);
    res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    console.error('Error fetching professional profile:', error);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

// POST /api/professionalprofiles
const upsertMyProfessionalProfile = async (req, res) => {
  console.log('POST/PUT /api/professionalprofiles endpoint accessed');
  try {
    const userId = req.user._id;
    const update = req.body;
    console.log('Updating profile for user:', userId);
    console.log('Update data received from client:', JSON.stringify(update, null, 2));
    
    // Log existing profile if any
    const existingProfile = await ProfessionalProfile.findOne({ userId });
    console.log('Existing profile before update:', existingProfile ? JSON.stringify(existingProfile.toObject(), null, 2) : 'None');
    
    // Ensure we're actually setting all fields from the request
    // Create an explicit $set object with only the provided fields
    const setFields = {};
    
    // Fields from the form
    if ('name' in update) setFields.name = update.name;
    if ('title' in update) setFields.title = update.title;
    if ('bio' in update) setFields.bio = update.bio;
    if ('expertise' in update) setFields.expertise = update.expertise;
    if ('email' in update) setFields.email = update.email;
    if ('profilePicture' in update) setFields.profilePicture = update.profilePicture;
    
    // Other fields that might be there
    if ('industries' in update) setFields.industries = update.industries;
    if ('skills' in update) setFields.skills = update.skills;
    if ('experience' in update) setFields.experience = update.experience;
    if ('availability' in update) setFields.availability = update.availability;
    if ('rate' in update) setFields.rate = update.rate;
    
    // Add userId if this is a new profile
    if (!existingProfile) {
      setFields.userId = userId;
      
      // Also set default values for required fields if not provided
      if (!('rate' in setFields)) {
        setFields.rate = 0;
      }
      if (!('industries' in setFields)) {
        setFields.industries = [];
      }
      if (!('skills' in setFields)) {
        setFields.skills = [];
      }
    }
    
    console.log('Fields being updated:', JSON.stringify(setFields, null, 2));
    
    // Use findOneAndUpdate with upsert to create if not exists
    const profile = await ProfessionalProfile.findOneAndUpdate(
      { userId },
      { $set: setFields },
      { new: true, upsert: true, runValidators: true }
    );
    
    // Log and double check that the update actually happened
    console.log('Updated profile after save:', JSON.stringify(profile.toObject(), null, 2));
    
    // Verify the update was successful by retrieving it again
    const verifiedProfile = await ProfessionalProfile.findOne({ userId });
    console.log('Verified profile after save:', 
      verifiedProfile ? 'Profile verified in database' : 'WARNING: Profile not found after save');
    
    res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    console.error('Error upserting professional profile:', error);
    res.status(500).json({ success: false, error: { message: 'Server error', details: error.message } });
  }
};

// GET /api/professionalprofiles/:id
const getPublicProfile = async (req, res) => {
  console.log('GET /api/professionalprofiles/:id endpoint accessed');
  try {
    const userId = req.params.id;
    console.log('Fetching public profile for user:', userId);
    
    // Find the profile and populate user data
    const profile = await ProfessionalProfile.findOne({ userId })
      .populate('userId', '-password')
      .lean();
    
    if (!profile) {
      console.error('Profile not found for user:', userId);
      return res.status(404).json({ 
        success: false, 
        error: { message: 'Professional profile not found' } 
      });
    }
    
    console.log('Found public profile:', profile);
    res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    console.error('Error fetching professional public profile:', error);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

module.exports = {
  getMyProfessionalProfile,
  upsertMyProfessionalProfile,
  getPublicProfile
}; 