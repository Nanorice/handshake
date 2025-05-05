import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  InputAdornment,
  SelectChangeEvent,
  FormHelperText
} from '@mui/material';
import Button from '../UI/Button';
import Card from '../UI/Card';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

// Industry and seniority options
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

// Initial form values
interface ProfessionalProfileFormValues {
  industry: string;
  seniority: string;
  expertise: string[];
  hourlyRate: number;
  linkedInProfile: string;
  bio: string;
  availability: {
    timezone: string;
    slots: {
      day: string;
      startTime: string;
      endTime: string;
    }[];
  };
}

const initialValues: ProfessionalProfileFormValues = {
  industry: '',
  seniority: '',
  expertise: [],
  hourlyRate: 50,
  linkedInProfile: '',
  bio: '',
  availability: {
    timezone: 'UTC',
    slots: []
  }
};

interface ProfessionalProfileFormProps {
  onSubmit: (values: ProfessionalProfileFormValues) => void;
  initialData?: Partial<ProfessionalProfileFormValues>;
  isSubmitting?: boolean;
}

const ProfessionalProfileForm: React.FC<ProfessionalProfileFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false
}) => {
  // Merge initial data with default values
  const mergedInitialValues = { ...initialValues, ...initialData };
  
  // Form state
  const [values, setValues] = useState<ProfessionalProfileFormValues>(mergedInitialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // New expertise input
  const [newExpertise, setNewExpertise] = useState<string>('');

  // Handle text fields change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle select fields change
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle hourly rate change
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setValues(prev => ({
        ...prev,
        hourlyRate: value
      }));
      
      // Clear error for this field
      if (errors.hourlyRate) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.hourlyRate;
          return newErrors;
        });
      }
    }
  };

  // Add expertise tag
  const handleAddExpertise = () => {
    if (newExpertise.trim() !== '' && !values.expertise.includes(newExpertise.trim())) {
      setValues(prev => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()]
      }));
      setNewExpertise('');
      
      // Clear error for expertise
      if (errors.expertise) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.expertise;
          return newErrors;
        });
      }
    }
  };

  // Handle key press in expertise input
  const handleExpertiseKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddExpertise();
    }
  };

  // Remove expertise tag
  const handleDeleteExpertise = (expertiseToDelete: string) => {
    setValues(prev => ({
      ...prev,
      expertise: prev.expertise.filter(exp => exp !== expertiseToDelete)
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!values.industry) {
      newErrors.industry = 'Industry is required';
    }
    
    if (!values.seniority) {
      newErrors.seniority = 'Seniority level is required';
    }
    
    if (values.expertise.length === 0) {
      newErrors.expertise = 'At least one expertise area is required';
    }
    
    if (!values.hourlyRate || values.hourlyRate <= 0) {
      newErrors.hourlyRate = 'Please enter a valid hourly rate';
    }
    
    if (!values.linkedInProfile) {
      newErrors.linkedInProfile = 'LinkedIn profile URL is required';
    } else if (!values.linkedInProfile.includes('linkedin.com/')) {
      newErrors.linkedInProfile = 'Please enter a valid LinkedIn URL';
    }
    
    if (!values.bio) {
      newErrors.bio = 'Professional bio is required';
    } else if (values.bio.length < 100) {
      newErrors.bio = 'Bio should be at least 100 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(values);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={4}>
        {/* Profile Details */}
        <Grid item xs={12} md={6}>
          <Card title="Profile Details" headerBg="primary">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.industry}>
                  <InputLabel id="industry-label">Industry</InputLabel>
                  <Select
                    labelId="industry-label"
                    id="industry"
                    name="industry"
                    value={values.industry}
                    label="Industry"
                    onChange={handleSelectChange}
                  >
                    {INDUSTRY_OPTIONS.map(option => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.industry && (
                    <FormHelperText>{errors.industry}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.seniority}>
                  <InputLabel id="seniority-label">Seniority Level</InputLabel>
                  <Select
                    labelId="seniority-label"
                    id="seniority"
                    name="seniority"
                    value={values.seniority}
                    label="Seniority Level"
                    onChange={handleSelectChange}
                  >
                    {SENIORITY_OPTIONS.map(option => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.seniority && (
                    <FormHelperText>{errors.seniority}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="hourlyRate"
                  name="hourlyRate"
                  label="Hourly Rate"
                  type="number"
                  value={values.hourlyRate}
                  onChange={handleRateChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyIcon />
                      </InputAdornment>
                    ),
                  }}
                  error={!!errors.hourlyRate}
                  helperText={errors.hourlyRate}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="linkedInProfile"
                  name="linkedInProfile"
                  label="LinkedIn Profile URL"
                  value={values.linkedInProfile}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkedInIcon />
                      </InputAdornment>
                    ),
                  }}
                  error={!!errors.linkedInProfile}
                  helperText={errors.linkedInProfile}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>
        
        {/* Expertise and Bio */}
        <Grid item xs={12} md={6}>
          <Card title="Expertise & Bio" headerBg="primary">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Areas of Expertise
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap',
                      gap: 0.5,
                      mb: 1
                    }}
                  >
                    {values.expertise.map(exp => (
                      <Chip
                        key={exp}
                        label={exp}
                        onDelete={() => handleDeleteExpertise(exp)}
                        color="primary"
                        size="small"
                      />
                    ))}
                  </Box>
                  <TextField
                    fullWidth
                    id="newExpertise"
                    name="newExpertise"
                    label="Add Expertise (Press Enter)"
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    onKeyDown={handleExpertiseKeyDown}
                    error={!!errors.expertise}
                    helperText={errors.expertise}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="bio"
                  name="bio"
                  label="Professional Bio"
                  multiline
                  rows={6}
                  value={values.bio}
                  onChange={handleChange}
                  error={!!errors.bio}
                  helperText={errors.bio || "A compelling bio that highlights your expertise and experience"}
                />
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          colorVariant="primary"
          size="large"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </Button>
      </Box>
    </Box>
  );
};

export default ProfessionalProfileForm; 