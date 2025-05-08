import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import { getAuthToken, getUserData } from '../../utils/authUtils';
import UpdateRoleButton from './UpdateRoleButton';

// Define API_URL with explicit port 5000 to match the server
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('ProfessionalPublicProfileSetup API_URL initialized as:', API_URL);

// Use the full URL including the server address and port
const API_BASE = `${API_URL}/api/professionalprofiles`;
console.log('ProfessionalPublicProfileSetup component loaded with API_BASE:', API_BASE);

const defaultProfile = (userData) => ({
  name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
  title: userData.title || '',
  bio: userData.bio || '',
  expertise: userData.expertise || '',
  profilePicture: userData.profilePicture || '',
  email: userData.email || '',
});

const ProfessionalPublicProfileSetup = ({ onSave }) => {
  const [profile, setProfile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const user = getUserData();
  const isRoleProfessional = user?.role === 'professional';

  // Fetch profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const requestUrl = `${API_BASE}/me`;
        console.log('Fetching profile from:', requestUrl);
        
        const res = await fetch(requestUrl, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Profile API response status:', res.status);
        const data = await res.json();
        console.log('Profile API response data:', data);
        
        if (data.success && data.data && data.data.profile) {
          setProfile(data.data.profile);
          setPreview(data.data.profile);
        } else {
          setProfile(defaultProfile({}));
          setPreview(defaultProfile({}));
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setProfile(defaultProfile({}));
        setPreview(defaultProfile({}));
      }
      setLoading(false);
    };
    
    if (isRoleProfessional) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [isRoleProfessional]);

  const handleChange = (field) => (e) => {
    const updated = { ...profile, [field]: e.target.value };
    setProfile(updated);
    setPreview(updated);
  };

  const handleSave = async () => {
    try {
      const requestUrl = `${API_BASE}`;
      console.log('Saving profile to:', requestUrl);
      console.log('Profile data being saved:', profile);
      
      const res = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });
      
      console.log('Save profile API response status:', res.status);
      const data = await res.json();
      console.log('Save profile API response data:', data);
      
      if (data.success) {
        setSnackbar({ open: true, message: 'Profile saved successfully!', severity: 'success' });
        setProfile(data.data.profile);
        setPreview(data.data.profile);
        if (onSave) onSave(data.data.profile);
      } else {
        setSnackbar({ open: true, message: data.error?.message || 'Failed to save profile', severity: 'error' });
      }
    } catch (err) {
      console.error('Network error saving profile:', err);
      setSnackbar({ open: true, message: 'Network error saving profile', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  if (loading) {
    return <Typography>Loading...</Typography>;
  }
  
  if (!isRoleProfessional) {
    return (
      <Paper sx={{ p: 3, my: 2 }}>
        <Typography variant="h5" gutterBottom>
          Professional Role Required
        </Typography>
        <Typography paragraph>
          Your account is currently set as a job seeker. To create a professional profile,
          you need to update your role to "professional".
        </Typography>
        <Box sx={{ mt: 2 }}>
          <UpdateRoleButton />
        </Box>
      </Paper>
    );
  }

  return (
    <Grid container spacing={4}>
      {/* Edit Form */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Public Profile Setup
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TextField
            label="Full Name"
            value={profile?.name || ''}
            onChange={handleChange('name')}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Title/Position"
            value={profile?.title || ''}
            onChange={handleChange('title')}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Bio"
            value={profile?.bio || ''}
            onChange={handleChange('bio')}
            fullWidth
            margin="normal"
            multiline
            rows={4}
          />
          <TextField
            label="Expertise (comma separated)"
            value={profile?.expertise || ''}
            onChange={handleChange('expertise')}
            fullWidth
            margin="normal"
          />
          {/* Add more fields as needed */}
          <Button variant="contained" color="primary" onClick={handleSave} sx={{ mt: 2 }}>
            Save Public Profile
          </Button>
        </Paper>
      </Grid>
      {/* Live Preview */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, minHeight: 300 }}>
          <Typography variant="h6" gutterBottom>
            Public Profile Preview
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar src={preview?.profilePicture} sx={{ width: 64, height: 64, mr: 2 }} />
            <Box>
              <Typography variant="h6">{preview?.name || 'Name'}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {preview?.title || 'Title/Position'}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {preview?.bio || 'Bio goes here.'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <b>Expertise:</b> {preview?.expertise || 'None listed'}
          </Typography>
        </Paper>
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default ProfessionalPublicProfileSetup; 