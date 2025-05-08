const ProfessionalProfile = require('../models/ProfessionalProfile');
const User = require('../models/User');

// GET /api/professionalprofiles/me
const getMyProfessionalProfile = async (req, res) => {
  console.log('GET /api/professionalprofiles/me endpoint accessed');
  try {
    const userId = req.user._id;
    console.log('Fetching profile for user:', userId);
    
    let profile = await ProfessionalProfile.findOne({ userId });
    if (!profile) {
      console.log('No existing profile found, creating a default one from user data');
      // If no profile, use user info as default
      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found:', userId);
        return res.status(404).json({ success: false, error: { message: 'User not found' } });
      }
      profile = {
        userId,
        industries: user.industries || [],
        skills: user.skills || [],
        experience: [],
        availability: [],
        rate: user.rate || 0,
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        profilePicture: user.profilePicture || '',
      };
      console.log('Returning default profile:', profile);
      return res.status(200).json({ success: true, data: { profile, isDefault: true } });
    }
    console.log('Existing profile found:', profile);
    res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    console.error('Error fetching professional profile:', error);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

// POST /api/professionalprofiles
const upsertMyProfessionalProfile = async (req, res) => {
  console.log('POST /api/professionalprofiles endpoint accessed');
  try {
    const userId = req.user._id;
    const update = req.body;
    console.log('Updating profile for user:', userId);
    console.log('Update data:', update);
    
    const profile = await ProfessionalProfile.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true }
    );
    
    console.log('Updated profile:', profile);
    res.status(200).json({ success: true, data: { profile } });
  } catch (error) {
    console.error('Error upserting professional profile:', error);
    res.status(500).json({ success: false, error: { message: 'Server error' } });
  }
};

module.exports = {
  getMyProfessionalProfile,
  upsertMyProfessionalProfile,
}; 