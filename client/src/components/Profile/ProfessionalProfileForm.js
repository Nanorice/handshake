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
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ProfilePhotoUploader from './ProfilePhotoUploader';

// Industry options
const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Marketing',
  'Design',
  'Sales',
  'Consulting',
  'Legal',
  'Other'
];

// Seniority options
const SENIORITY_OPTIONS = [
  'Entry Level',
  'Associate',
  'Mid-Level',
  'Senior',
  'Manager',
  'Director',
  'VP',
  'C-Suite',
  'Founder'
];

const ProfessionalProfileForm = ({ initialData, onSave }) => {
  const [profile, setProfile] = useState(initialData || {
    name: '',
    email: '',
    company: '',
    position: '',
    industry: '',
    seniority: '',
    hourlyRate: 50,
    bio: '',
    expertise: ['React', 'JavaScript', 'Web Development'],
    isAnonymous: false,
    notifications: true,
    emailUpdates: true,
    linkedIn: '',
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false
    }
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

  const handleAvailabilityToggle = (day) => (event) => {
    setProfile({
      ...profile,
      availability: {
        ...profile.availability,
        [day]: event.target.checked
      }
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(profile);
    }
  };

  const addExpertise = (skill) => {
    if (skill && !profile.expertise.includes(skill)) {
      setProfile({
        ...profile,
        expertise: [...profile.expertise, skill]
      });
    }
  };

  const removeExpertise = (skill) => {
    setProfile({
      ...profile,
      expertise: profile.expertise.filter(item => item !== skill)
    });
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Photo */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ProfilePhotoUploader 
              initialImage={profile.profilePicture || null} 
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
                helperText="How you'd like to be addressed"
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
                label="Company"
                value={profile.company}
                onChange={handleChange('company')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={profile.position}
                onChange={handleChange('position')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="industry-label">Industry</InputLabel>
                <Select
                  labelId="industry-label"
                  id="industry"
                  value={profile.industry}
                  label="Industry"
                  onChange={handleChange('industry')}
                >
                  {INDUSTRY_OPTIONS.map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="seniority-label">Seniority Level</InputLabel>
                <Select
                  labelId="seniority-label"
                  id="seniority"
                  value={profile.seniority}
                  label="Seniority Level"
                  onChange={handleChange('seniority')}
                >
                  {SENIORITY_OPTIONS.map(option => (
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
                helperText="Share your professional experience and what you can offer to seekers"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="hourlyRate"
                label="Hourly Rate"
                type="number"
                value={profile.hourlyRate}
                onChange={handleChange('hourlyRate')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
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

        {/* Expertise */}
        <Grid item xs={12}>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            Expertise
          </Typography>
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Add skill or expertise"
              size="small"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addExpertise(e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {profile.expertise.map((skill) => (
              <Chip 
                key={skill}
                label={skill}
                onDelete={() => removeExpertise(skill)}
              />
            ))}
          </Box>
        </Grid>

        {/* Availability */}
        <Grid item xs={12}>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            Availability
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={profile.availability.monday}
                  onChange={handleAvailabilityToggle('monday')}
                />
              }
              label="Monday"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={profile.availability.tuesday}
                  onChange={handleAvailabilityToggle('tuesday')}
                />
              }
              label="Tuesday"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={profile.availability.wednesday}
                  onChange={handleAvailabilityToggle('wednesday')}
                />
              }
              label="Wednesday"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={profile.availability.thursday}
                  onChange={handleAvailabilityToggle('thursday')}
                />
              }
              label="Thursday"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={profile.availability.friday}
                  onChange={handleAvailabilityToggle('friday')}
                />
              }
              label="Friday"
            />
          </Box>
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

export default ProfessionalProfileForm; 