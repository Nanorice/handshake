import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getUserData, getUserType, getAuthToken, updateUserProfile } from '../utils/authUtils';
import { getApiBaseUrl } from '../utils/apiConfig';
import axios from 'axios';

const Profile = React.memo(() => {
  const [userType, setUserType] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Memoize the profile loading logic to prevent unnecessary re-renders
  const loadUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user data from localStorage first
      const userData = getUserData() || {};
      const currentUserType = getUserType() || userData.role || 'seeker';
      
      console.log('[Profile] Loading profile for user:', userData);
      
      // Try to fetch fresh profile data from API
      let profileData = null;
      const token = getAuthToken();
      
      if (token) {
        try {
          const baseUrl = getApiBaseUrl();
          const response = await axios.get(`${baseUrl}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.data && response.data.success) {
            profileData = response.data.data;
            console.log('[Profile] Loaded fresh profile from API:', profileData);
            console.log('[Profile] Resume data from API:', profileData.resume);
            console.log('[Profile] ResumeUrl from API:', profileData.resumeUrl);
          }
        } catch (apiError) {
          console.warn('[Profile] API fetch failed, using localStorage data:', apiError.message);
        }
      }
      
      // Fallback to localStorage data if API fails
      if (!profileData) {
        profileData = userData;
      }
      
      // Construct complete profile object based on user type
      let completeProfile;
      
      if (currentUserType === 'professional') {
        completeProfile = {
          name: profileData.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'Professional User',
          firstName: profileData.firstName || profileData.name?.split(' ')[0] || '',
          lastName: profileData.lastName || profileData.name?.split(' ').slice(1).join(' ') || '',
          preferredName: profileData.preferredName || '',
          email: profileData.email || '',
          company: profileData.company || '',
          position: profileData.position || profileData.title || '',
          industry: profileData.industry || 'Technology',
          seniority: profileData.seniority || 'Mid-level',
          hourlyRate: profileData.hourlyRate || 75,
          bio: profileData.bio || '',
          expertise: profileData.expertise || ['React', 'Node.js'],
          isAnonymous: profileData.isAnonymous || false,
          notifications: profileData.notifications !== false, // Default true
          emailUpdates: profileData.emailUpdates !== false, // Default true
          linkedIn: profileData.linkedIn || profileData.linkedinUrl || '',
          availability: profileData.availability || {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true
          },
          profilePicture: profileData.profilePicture || 
            (profileData.profilePhoto && profileData.profilePhoto.fileId ? `${getApiBaseUrl()}/files/file/${profileData.profilePhoto.fileId}` : null) ||
            profileData.profileImage || null
        };
      } else {
        completeProfile = {
          name: profileData.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'Student User',
          firstName: profileData.firstName || profileData.name?.split(' ')[0] || '',
          lastName: profileData.lastName || profileData.name?.split(' ').slice(1).join(' ') || '',
          preferredName: profileData.preferredName || '',
          email: profileData.email || '',
          university: profileData.university || profileData.school || '',
          major: profileData.major || profileData.fieldOfStudy || '',
          graduationYear: profileData.graduationYear || new Date().getFullYear() + 1,
          careerStage: profileData.careerStage || 'Student',
          bio: profileData.bio || '',
          interests: profileData.interests || ['Software Development', 'Career Development'],
          careerGoals: profileData.careerGoals || '',
          isAnonymous: profileData.isAnonymous || false,
          notifications: profileData.notifications !== false, // Default true
          emailUpdates: profileData.emailUpdates !== false, // Default true
          linkedIn: profileData.linkedIn || profileData.linkedinUrl || '',
          resume: profileData.resume || null,
          resumeUrl: profileData.resumeUrl || (profileData.resume && profileData.resume.fileId ? `${getApiBaseUrl()}/files/file/${profileData.resume.fileId}` : null),
          profilePicture: profileData.profilePicture || 
            (profileData.profilePhoto && profileData.profilePhoto.fileId ? `${getApiBaseUrl()}/files/file/${profileData.profilePhoto.fileId}` : null) ||
            profileData.profileImage || null
        };
      }
      
      console.log('[Profile] Final constructed profile resume:', completeProfile.resume);
      console.log('[Profile] Final constructed profile resumeUrl:', completeProfile.resumeUrl);
      console.log('[Profile] 📸 Profile photo data from API:', profileData.profilePhoto);
      console.log('[Profile] 📸 Constructed profile picture URL:', completeProfile.profilePicture);
      
      setUserType(currentUserType);
      setUserProfile(completeProfile);
      
    } catch (error) {
      console.error('[Profile] Error loading profile:', error);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced profile saving with API integration and localStorage update
  const handleSaveProfile = useCallback(async (profileData) => {
    setSaving(true);
    console.log('[Profile] 🚀 SAVE OPERATION STARTED');
    console.log('[Profile] 📋 Profile data to save:', profileData);
    
    try {
      const token = getAuthToken();
      let savedProfile = null;
      let uploadResults = {
        profilePicture: null,
        resume: null,
        apiSave: null
      };
      
      console.log('[Profile] 🔑 Auth token:', token ? 'Present' : 'Missing');
      
      // CRITICAL: Ensure firstName/lastName are properly extracted from name field
      const processedProfileData = {
        ...profileData,
        // Build name from firstName/lastName if not provided (since we removed the name field from forms)
        name: profileData.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
        // Ensure firstName and lastName are included
        firstName: profileData.firstName || (profileData.name ? profileData.name.split(' ')[0] : ''),
        lastName: profileData.lastName || (profileData.name ? profileData.name.split(' ').slice(1).join(' ') : ''),
        // Ensure preferredName is included if provided
        preferredName: profileData.preferredName || '',
        // Extract email if it's not already present
        email: profileData.email || ''
      };
      
      // SYNC LOGIC: If firstName/lastName are provided but name is not, build name from them
      if ((processedProfileData.firstName || processedProfileData.lastName) && !processedProfileData.name) {
        processedProfileData.name = `${processedProfileData.firstName || ''} ${processedProfileData.lastName || ''}`.trim();
      }
      
      // SYNC LOGIC: If name is provided but firstName/lastName are empty, extract them
      if (processedProfileData.name && (!processedProfileData.firstName || !processedProfileData.lastName)) {
        const nameParts = processedProfileData.name.split(' ');
        if (!processedProfileData.firstName) {
          processedProfileData.firstName = nameParts[0] || '';
        }
        if (!processedProfileData.lastName) {
          processedProfileData.lastName = nameParts.slice(1).join(' ') || '';
        }
      }
      
      console.log('[Profile] 🔍 Processed profile data with name sync:', {
        name: processedProfileData.name,
        firstName: processedProfileData.firstName,
        lastName: processedProfileData.lastName,
        preferredName: processedProfileData.preferredName
      });
      
      // Handle profile picture upload if present
      if (profileData.profilePictureFile) {
        console.log('[Profile] 📸 Uploading profile picture...');
        try {
          const formData = new FormData();
          formData.append('profilePicture', profileData.profilePictureFile);
          
          const baseUrl = getApiBaseUrl();
          const uploadUrl = `${baseUrl}/files/upload/profile-photo`;
          console.log('[Profile] 📸 Uploading to:', uploadUrl);
          
          const uploadResponse = await axios.post(uploadUrl, formData, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (uploadResponse.data.success) {
            processedProfileData.profilePicture = uploadResponse.data.data.url;
            uploadResults.profilePicture = uploadResponse.data.data.url;
            console.log('[Profile] ✅ Profile picture uploaded successfully:', uploadResults.profilePicture);
          } else {
            console.log('[Profile] ❌ Profile picture upload failed:', uploadResponse.data);
          }
        } catch (uploadError) {
          console.error('[Profile] ❌ Profile picture upload error:', uploadError);
          uploadResults.profilePicture = 'ERROR: ' + uploadError.message;
        }
      }
      
      // Handle resume upload if present
      if (profileData.resume && profileData.resume instanceof File) {
        console.log('[Profile] 📄 Uploading resume file:', profileData.resume.name);
        try {
          const formData = new FormData();
          formData.append('resume', profileData.resume);
          
          const baseUrl = getApiBaseUrl();
          const uploadUrl = `${baseUrl}/files/upload/resume`;
          console.log('[Profile] 📄 Uploading to:', uploadUrl);
          
          const uploadResponse = await axios.post(uploadUrl, formData, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (uploadResponse.data.success) {
            processedProfileData.resumeUrl = uploadResponse.data.data.url;
            uploadResults.resume = uploadResponse.data.data.url;
            console.log('[Profile] ✅ Resume uploaded successfully:', uploadResults.resume);
          } else {
            console.log('[Profile] ❌ Resume upload failed:', uploadResponse.data);
            uploadResults.resume = 'FAILED: ' + JSON.stringify(uploadResponse.data);
          }
        } catch (uploadError) {
          console.error('[Profile] ❌ Resume upload error:', uploadError);
          uploadResults.resume = 'ERROR: ' + uploadError.message;
        }
      }
      
      // Save profile data to API
      if (token) {
        console.log('[Profile] 💾 Saving profile data to API...');
        try {
          const baseUrl = getApiBaseUrl();
          const profileUrl = `${baseUrl}/auth/profile`;
          console.log('[Profile] 💾 Saving to:', profileUrl);
          console.log('[Profile] 💾 Processed data being sent:', processedProfileData);
          
          const response = await axios.put(profileUrl, processedProfileData, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log('[Profile] 💾 API Response:', response.data);
          
          if (response.data && response.data.success) {
            savedProfile = response.data.data;
            uploadResults.apiSave = 'SUCCESS';
            console.log('[Profile] ✅ Profile saved to API successfully:', savedProfile);
          } else {
            uploadResults.apiSave = 'FAILED: ' + JSON.stringify(response.data);
            console.log('[Profile] ❌ API save failed:', response.data);
          }
        } catch (apiError) {
          console.error('[Profile] ❌ API save error:', apiError);
          uploadResults.apiSave = 'ERROR: ' + apiError.message;
        }
      } else {
        uploadResults.apiSave = 'SKIPPED: No token';
        console.log('[Profile] ⚠️ Skipping API save - no token');
      }
      
      // Update localStorage with processed profile data using the enhanced utility
      console.log('[Profile] 💾 Updating localStorage...');
      const updateSuccess = updateUserProfile(processedProfileData);
      console.log('[Profile] 💾 localStorage update:', updateSuccess ? 'SUCCESS' : 'FAILED');
      
      // Verify what's actually in localStorage now
      const currentStoredData = JSON.parse(localStorage.getItem('userData') || '{}');
      console.log('[Profile] 🔍 Current localStorage userData after update:', currentStoredData);
      
      // Dispatch custom event to notify other components (like Dashboard) to refresh
      console.log('[Profile] 📢 Dispatching userDataUpdated event...');
      window.dispatchEvent(new CustomEvent('userDataUpdated', { 
        detail: processedProfileData 
      }));
      
      // Update local state to reflect changes immediately
      setUserProfile(prev => ({ ...prev, ...processedProfileData }));
      
      // Show comprehensive success message
      const successDetails = [
        uploadResults.profilePicture && `Profile picture: ${uploadResults.profilePicture.includes('ERROR') ? '❌' : '✅'}`,
        uploadResults.resume && `Resume: ${uploadResults.resume.includes('ERROR') || uploadResults.resume.includes('FAILED') ? '❌' : '✅'}`,
        `API save: ${uploadResults.apiSave.includes('ERROR') || uploadResults.apiSave.includes('FAILED') ? '❌' : '✅'}`,
        `localStorage: ${updateSuccess ? '✅' : '❌'}`
      ].filter(Boolean).join(', ');
      
      console.log('[Profile] 🎉 SAVE OPERATION COMPLETED');
      console.log('[Profile] 📊 Results summary:', uploadResults);
      
      setSnackbar({
        open: true,
        message: `Profile updated successfully! ${successDetails}`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('[Profile] 💥 SAVE OPERATION FAILED:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save profile. Check console for details.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
      console.log('[Profile] 🏁 SAVE OPERATION ENDED');
    }
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Load profile data on component mount
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // Memoized components to prevent unnecessary re-renders
  const ProfileFormComponent = useMemo(() => {
    if (!userProfile) return null;
    
    return userType === 'professional' ? (
      <ProfessionalProfileForm 
        initialData={userProfile} 
        onSave={handleSaveProfile} 
        saving={saving}
      />
    ) : (
      <SeekerProfileForm 
        initialData={userProfile} 
        onSave={handleSaveProfile} 
        saving={saving}
      />
    );
  }, [userProfile, userType, handleSaveProfile, saving]);

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

      {ProfileFormComponent}

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
});

Profile.displayName = 'Profile';

export default Profile; 