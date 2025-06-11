import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Grid,
  TextField,
  Button,
  Box,
  Divider,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Avatar,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Paper,
  InputAdornment
} from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import SchoolIcon from '@mui/icons-material/School';
import ProfilePhotoUploader from './ProfilePhotoUploader';

// Fields of interest options
const FIELDS_OF_INTEREST = [
  'Software Development',
  'Data Science',
  'Product Management',
  'UX/UI Design',
  'Marketing',
  'Finance',
  'Consulting',
  'Healthcare',
  'Education',
  'Other'
];

// Career stage options
const CAREER_STAGE_OPTIONS = [
  'Student',
  'Recent Graduate',
  'Early Career',
  'Career Changer',
  'Returning to Workforce'
];

const SeekerProfileForm = ({ initialData, onSave, saving }) => {
  const [profile, setProfile] = useState(() => {
    // Initialize state once with proper defaults
    return {
      name: '',
      email: '',
      university: '',
      major: '',
      graduationYear: '',
      careerStage: '',
      bio: '',
      interests: ['Software Development', 'Product Management'],
      careerGoals: '',
      isAnonymous: false,
      notifications: true,
      emailUpdates: true,
      linkedIn: '',
      resume: null,
      ...initialData // Merge initialData immediately
    };
  });

  const scrollPositionRef = useRef(0);
  const formRef = useRef(null);
  const renderCountRef = useRef(0);
  const initialDataRef = useRef(initialData);

  // Debug excessive re-renders
  renderCountRef.current += 1;
  if (renderCountRef.current > 10) {
    console.warn('[SeekerProfileForm] Excessive re-renders detected:', renderCountRef.current);
  }

  // Completely remove all scroll manipulation
  useEffect(() => {
    // Only track scroll for debugging, no manipulation
    const handleScroll = () => {
      const currentScroll = window.pageYOffset;
      // Only log if there's a sudden jump (more than 100px change)
      if (Math.abs(currentScroll - scrollPositionRef.current) > 100) {
        console.warn('[SeekerProfileForm] Scroll jump detected!', {
          from: scrollPositionRef.current,
          to: currentScroll,
          renderCount: renderCountRef.current
        });
      }
      scrollPositionRef.current = currentScroll;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Only update if initialData actually changes (deep comparison)
  useEffect(() => {
    if (initialData && 
        JSON.stringify(initialData) !== JSON.stringify(initialDataRef.current)) {
      console.log('[SeekerProfileForm] Updating profile from initialData change');
      initialDataRef.current = initialData;
      setProfile(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (field) => (event) => {
    setProfile(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleToggle = (field) => (event) => {
    setProfile(prev => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(profile);
    }
  };

  const addInterest = (interest) => {
    if (interest && !profile.interests.includes(interest)) {
      setProfile(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
  };

  const removeInterest = (interest) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.filter(item => item !== interest)
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('[SeekerProfileForm] Resume file selected:', file.name);
      setProfile(prev => ({
        ...prev,
        resume: file
      }));
    }
  };

  const renderResumeStatus = () => {
    const hasExistingUrl = profile.resumeUrl;
    
    if (!hasExistingUrl) {
      return null; // No additional info needed if no resume exists
    }

    return (
      <Button
        variant="outlined"
        onClick={async () => {
          try {
            const link = document.createElement('a');
            link.href = profile.resumeUrl;
            link.download = `resume.pdf`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (error) {
            console.error('Download error:', error);
            alert(`Download failed: ${error.message}`);
          }
        }}
      >
        📥 Download Current Resume
      </Button>
    );
  };

  return (
    <Paper sx={{ p: 4, minHeight: '100vh' }}>
      <Box ref={formRef} sx={{ minHeight: '80vh' }}>
        <Grid container spacing={3}>
          {/* Profile Photo */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ProfilePhotoUploader 
                initialImage={profile.profilePicture || null} 
                onSave={(blob, dataUrl) => {
                  setProfile(prev => ({
                    ...prev,
                    profilePicture: dataUrl,
                    profilePictureFile: blob
                  }));
                }}
                size={120}
              />
            </Box>
          </Grid>

          {/* Basic Information */}
          <Grid item xs={12} md={8}>
            <Typography variant="body2" color="primary" sx={{ mb: 2, fontWeight: 500 }}>
              💡 Update your First Name, Last Name, or Preferred Name below to change how you're greeted on the dashboard
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Preferred Name (Optional)"
                  value={profile.preferredName || ''}
                  onChange={handleChange('preferredName')}
                  helperText="How you'd like to be addressed (e.g., 'Mike' instead of 'Michael')"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profile.firstName || ''}
                  onChange={handleChange('firstName')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profile.lastName || ''}
                  onChange={handleChange('lastName')}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profile.email}
                  onChange={handleChange('email')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="University"
                  value={profile.university}
                  onChange={handleChange('university')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SchoolIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Major"
                  value={profile.major}
                  onChange={handleChange('major')}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Graduation Year"
                  value={profile.graduationYear}
                  onChange={handleChange('graduationYear')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="career-stage-label">Career Stage</InputLabel>
                  <Select
                    labelId="career-stage-label"
                    id="careerStage"
                    value={profile.careerStage}
                    label="Career Stage"
                    onChange={handleChange('careerStage')}
                  >
                    {CAREER_STAGE_OPTIONS.map(option => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={4}
                  value={profile.bio}
                  onChange={handleChange('bio')}
                  helperText="Share a bit about yourself and what you're looking for from professionals"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Career Goals"
                  multiline
                  rows={2}
                  value={profile.careerGoals}
                  onChange={handleChange('careerGoals')}
                  helperText="What are your short and long-term career goals?"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="LinkedIn Profile"
                  value={profile.linkedIn}
                  onChange={handleChange('linkedIn')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkedInIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Interests */}
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Fields of Interest
            </Typography>
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="add-interest-label">Add Interest</InputLabel>
                <Select
                  labelId="add-interest-label"
                  id="add-interest"
                  label="Add Interest"
                  value=""
                  onChange={(e) => {
                    addInterest(e.target.value);
                    e.target.value = "";
                  }}
                >
                  {FIELDS_OF_INTEREST.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profile.interests.map((interest) => (
                <Chip 
                  key={interest}
                  label={interest}
                  onDelete={() => removeInterest(interest)}
                />
              ))}
            </Box>
          </Grid>

          {/* Resume */}
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Resume
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                component="label"
              >
                {profile.resumeUrl ? 'Update Resume' : 'Upload Resume'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </Button>
              
              {renderResumeStatus()}
            </Box>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12}>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={profile.notifications}
                  onChange={handleToggle('notifications')}
                />
              }
              label="Enable In-App Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={profile.emailUpdates}
                  onChange={handleToggle('emailUpdates')}
                />
              }
              label="Email Updates"
            />
          </Grid>

          {/* Save Button */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={saving}
                sx={{ mt: 2 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default SeekerProfileForm; 