import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import ProfessionalProfileForm from '../components/Profile/ProfessionalProfileForm';
import SeekerProfileForm from '../components/Profile/SeekerProfileForm';
import { getUserData, getUserType } from '../utils/authUtils';

const Profile = () => {
  const [userType, setUserType] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // In a real app, we'd fetch the user profile from the backend
    // For now, let's simulate loading the user type and profile
    const simulateFetchUserProfile = () => {
      setLoading(true);
      
      // Get user type from localStorage (this would come from API in real app)
      const userData = getUserData() || {};
      const userType = getUserType() || 'seeker'; // Default to seeker if not specified
      
      // Simulated profile data based on user type
      let profileData;
      
      if (userType === 'professional') {
        profileData = {
          name: (userData.firstName || '') + ' ' + (userData.lastName || '') || 'Professional User',
          email: userData.email || 'pro@example.com',
          company: 'Company Inc.',
          position: 'Senior Developer',
          industry: 'Technology',
          seniority: 'Senior',
          hourlyRate: 75,
          bio: 'Experienced software developer with expertise in React and Node.js.',
          expertise: ['React', 'Node.js', 'TypeScript', 'AWS'],
          isAnonymous: false,
          notifications: true,
          emailUpdates: true,
          linkedIn: 'https://linkedin.com/in/username',
          availability: {
            monday: true,
            tuesday: true,
            wednesday: false,
            thursday: true,
            friday: false
          },
          profilePicture: userData.profilePicture || null
        };
      } else {
        profileData = {
          name: (userData.firstName || '') + ' ' + (userData.lastName || '') || 'Student User',
          email: userData.email || 'student@example.com',
          university: 'State University',
          major: 'Computer Science',
          graduationYear: '2024',
          careerStage: 'Student',
          bio: 'Computer Science student interested in software development and AI.',
          interests: ['Software Development', 'Artificial Intelligence'],
          careerGoals: 'To become a full-stack developer at a tech company.',
          isAnonymous: false,
          notifications: true,
          emailUpdates: true,
          linkedIn: 'https://linkedin.com/in/studentuser',
          resume: null,
          profilePicture: userData.profilePicture || null
        };
      }
      
      setUserType(userType);
      setUserProfile(profileData);
      setLoading(false);
    };
    
    // Simulate API call
    setTimeout(simulateFetchUserProfile, 500);
  }, []);

  const handleSaveProfile = (profileData) => {
    // In a real app, we would send this data to the backend
    console.log('Saving profile:', profileData);
    
    // Handle profile picture if it's a blob
    if (profileData.profilePictureFile) {
      console.log('Profile picture blob:', profileData.profilePictureFile);
      // In a real app, you would upload this to a server
      // Example: 
      // const formData = new FormData();
      // formData.append('profilePicture', profileData.profilePictureFile);
      // axios.post('/api/upload-profile-picture', formData);
    }
    
    // Simulate successful save
    setSnackbar({
      open: true,
      message: 'Profile saved successfully!',
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading your profile...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Update your personal information and preferences
        </Typography>
      </Box>

      {userType === 'professional' ? (
        <ProfessionalProfileForm initialData={userProfile} onSave={handleSaveProfile} />
      ) : (
        <SeekerProfileForm initialData={userProfile} onSave={handleSaveProfile} />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile; 