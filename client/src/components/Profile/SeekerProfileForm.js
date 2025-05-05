import React, { useState } from 'react';
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

const SeekerProfileForm = ({ initialData, onSave }) => {
  const [profile, setProfile] = useState(initialData || {
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
    resume: null
  });

  const handleChange = (field) => (event) => {
    setProfile({
      ...profile,
      [field]: event.target.value,
    });
  };

  const handleToggle = (field) => (event) => {
    setProfile({
      ...profile,
      [field]: event.target.checked,
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(profile);
    }
  };

  const addInterest = (interest) => {
    if (interest && !profile.interests.includes(interest)) {
      setProfile({
        ...profile,
        interests: [...profile.interests, interest]
      });
    }
  };

  const removeInterest = (interest) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter(item => item !== interest)
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile({
        ...profile,
        resume: file
      });
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Photo */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ProfilePhotoUploader 
              initialImage={profile.profilePicture || "/placeholder-avatar.jpg"} 
              onSave={(blob, dataUrl) => {
                setProfile({
                  ...profile,
                  profilePicture: dataUrl,
                  profilePictureFile: blob
                });
              }}
              size={120}
            />
          </Box>
        </Grid>

        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={profile.name}
                onChange={handleChange('name')}
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
          <Button
            variant="outlined"
            component="label"
          >
            Upload Resume
            <input
              type="file"
              hidden
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />
          </Button>
          {profile.resume && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected file: {profile.resume.name}
            </Typography>
          )}
        </Grid>

        {/* Privacy Settings */}
        <Grid item xs={12}>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            Privacy Settings
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={profile.isAnonymous}
                onChange={handleToggle('isAnonymous')}
              />
            }
            label="Show as Anonymous in Matches"
          />
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
              sx={{ mt: 2 }}
            >
              Save Changes
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SeekerProfileForm; 