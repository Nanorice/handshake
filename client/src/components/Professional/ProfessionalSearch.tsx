import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Autocomplete,
  Chip,
  Paper,
  SelectChangeEvent,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Button from '../UI/Button';
import ProfessionalCard from './ProfessionalCard';

// Sample industry and seniority options (same as in the profile form)
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

// Sample expertise options
const EXPERTISE_OPTIONS = [
  'JavaScript',
  'React',
  'Node.js',
  'Python',
  'Machine Learning',
  'Product Management',
  'UX Design',
  'Marketing Strategy',
  'Sales',
  'Business Development',
  'Leadership',
  'Finance',
  'Accounting',
  'Legal',
  'Healthcare',
  'Education'
];

// Professional interface
interface Professional {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  industry: string;
  seniority: string;
  expertise: string[];
  hourlyRate: number;
  bio: string;
  isVerified: boolean;
  rating: number;
  totalSessions: number;
}

// Filter state interface
interface FilterState {
  searchQuery: string;
  industry: string;
  seniority: string;
  expertiseAreas: string[];
  priceRange: [number, number];
  minRating: number;
}

interface ProfessionalSearchProps {
  onLoadProfessionals: (filters: FilterState) => Promise<Professional[]>;
  onRequestChat?: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

const ProfessionalSearch: React.FC<ProfessionalSearchProps> = ({
  onLoadProfessionals,
  onRequestChat,
  onViewProfile
}) => {
  // Initial filter state
  const initialFilters: FilterState = {
    searchQuery: '',
    industry: '',
    seniority: '',
    expertiseAreas: [],
    priceRange: [0, 200],
    minRating: 0
  };

  // State
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load professionals on initial render and when filters change
  useEffect(() => {
    const fetchProfessionals = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const results = await onLoadProfessionals(filters);
        setProfessionals(results);
      } catch (err) {
        setError('Failed to load professionals. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchProfessionals();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [filters, onLoadProfessionals]);

  // Handle text search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: e.target.value
    }));
  };

  // Handle select field changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle expertise multi-select
  const handleExpertiseChange = (_: any, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      expertiseAreas: values
    }));
  };

  // Handle price range slider
  const handlePriceRangeChange = (_: any, newValue: number | number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: newValue as [number, number]
    }));
  };

  // Handle rating slider
  const handleRatingChange = (_: any, newValue: number | number[]) => {
    setFilters(prev => ({
      ...prev,
      minRating: newValue as number
    }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <Box>
      {/* Search and Filter Section */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          backgroundColor: 'background.paper' 
        }}
      >
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Find Professionals
        </Typography>
        
        <Grid container spacing={3}>
          {/* Search Input */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="searchQuery"
              name="searchQuery"
              placeholder="Search by name, expertise, or keyword..."
              value={filters.searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          {/* Industry Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="industry-label">Industry</InputLabel>
              <Select
                labelId="industry-label"
                id="industry"
                name="industry"
                value={filters.industry}
                label="Industry"
                onChange={handleSelectChange}
              >
                <MenuItem value="">All Industries</MenuItem>
                {INDUSTRY_OPTIONS.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Seniority Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="seniority-label">Seniority Level</InputLabel>
              <Select
                labelId="seniority-label"
                id="seniority"
                name="seniority"
                value={filters.seniority}
                label="Seniority Level"
                onChange={handleSelectChange}
              >
                <MenuItem value="">All Levels</MenuItem>
                {SENIORITY_OPTIONS.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Price Range Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom>
              Price Range ($/hour)
            </Typography>
            <Box sx={{ px: 1 }}>
              <Slider
                value={filters.priceRange}
                onChange={handlePriceRangeChange}
                valueLabelDisplay="auto"
                min={0}
                max={200}
                step={5}
              />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                mt: 1
              }}>
                <Typography variant="caption" color="text.secondary">
                  ${filters.priceRange[0]}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ${filters.priceRange[1]}+
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          {/* Rating Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" gutterBottom>
              Minimum Rating
            </Typography>
            <Box sx={{ px: 1 }}>
              <Slider
                value={filters.minRating}
                onChange={handleRatingChange}
                valueLabelDisplay="auto"
                min={0}
                max={5}
                step={0.5}
                marks={[
                  { value: 0, label: '0' },
                  { value: 5, label: '5' }
                ]}
              />
            </Box>
          </Grid>
          
          {/* Expertise Areas */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              id="expertiseAreas"
              options={EXPERTISE_OPTIONS}
              value={filters.expertiseAreas}
              onChange={handleExpertiseChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip 
                    label={option} 
                    {...getTagProps({ index })} 
                    color="primary"
                    size="small"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Expertise Areas"
                  placeholder="Select expertise"
                />
              )}
            />
          </Grid>
          
          {/* Filter Actions */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              colorVariant="outline" 
              size="medium"
              onClick={handleResetFilters}
              sx={{ mr: 2 }}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Results Section */}
      <Box>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            py: 8
          }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="error">
              {error}
            </Typography>
          </Box>
        ) : professionals.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography>
              No professionals found matching your criteria. Try adjusting your filters.
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Found {professionals.length} professionals
            </Typography>
            
            <Grid container spacing={3}>
              {professionals.map(professional => (
                <Grid item xs={12} sm={6} md={4} key={professional.id}>
                  <ProfessionalCard
                    professional={professional}
                    onRequestChat={onRequestChat}
                    onViewProfile={onViewProfile}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ProfessionalSearch; 