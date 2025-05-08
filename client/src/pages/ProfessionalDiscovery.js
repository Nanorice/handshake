import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs, 
  Link as MuiLink,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  LocationOn, 
  Business, 
  School, 
  FilterList, 
  MessageOutlined, 
  CalendarMonth 
} from '@mui/icons-material';
import { getProfessionals, requestMatch, sendCoffeeChatInvite } from '../services/professionalService';

const industries = [
  'All',
  'Technology',
  'Finance',
  'Marketing',
  'Design',
  'Human Resources',
  'E-commerce',
  'Healthcare',
  'Education'
];

const experienceLevels = [
  { value: '', label: 'Any Experience' },
  { value: 'entry', label: 'Entry Level (0-3 years)' },
  { value: 'mid', label: 'Mid Level (3-7 years)' },
  { value: 'senior', label: 'Senior Level (7+ years)' }
];

const ProfessionalDiscovery = () => {
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    industry: 'All',
    experienceLevel: ''
  });
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [matchMessage, setMatchMessage] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [matchRequestLoading, setMatchRequestLoading] = useState(false);
  const [dialogType, setDialogType] = useState('match'); // 'match' or 'coffeechat'
  const [dialogTab, setDialogTab] = useState(0);

  useEffect(() => {
    loadProfessionals();
  }, [filters]);

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      console.log('Loading professionals with filters:', filters);
      
      // Add detailed logging
      console.log('Current user auth token:', localStorage.getItem('token'));
      console.log('User data in localStorage:', localStorage.getItem('userData'));
      
      const data = await getProfessionals(filters);
      
      // Log the raw response and structure to help debug
      console.log('Professionals API raw response data:', data);
      console.log('Type of data:', typeof data);
      console.log('Keys in data object:', Object.keys(data));
      
      // Handle different possible data structures
      let professionalsList = [];
      
      if (data) {
        // Case 1: data.professionals exists directly
        if (data.professionals && Array.isArray(data.professionals)) {
          professionalsList = data.professionals;
          console.log('Using data.professionals directly');
        } 
        // Case 2: data.data.professionals
        else if (data.data && data.data.professionals && Array.isArray(data.data.professionals)) {
          professionalsList = data.data.professionals;
          console.log('Using data.data.professionals');
        }
        // Case 3: response is an array itself
        else if (Array.isArray(data)) {
          professionalsList = data;
          console.log('Data is an array itself');
        }
        // Case 4: Mock data for testing when nothing is found
        else {
          console.warn('Could not find professionals array in response, using mock data');
          professionalsList = [
            {
              _id: 'mock1',
              firstName: 'Test',
              lastName: 'Professional',
              email: 'testpro@example.com',
              profileImage: 'https://ui-avatars.com/api/?name=Test+Professional&background=random',
              role: 'professional',
              userType: 'professional',
              profile: {
                title: 'Test Professional',
                skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
                rate: 100,
                industries: ['Technology', 'Education']
              }
            }
          ];
        }
      }
      
      if (professionalsList.length > 0) {
        console.log(`Found ${professionalsList.length} professionals`);
        setProfessionals(professionalsList);
        setError(null);
      } else {
        console.warn('No professionals found in API response');
        console.warn('Response structure:', JSON.stringify(data));
        setProfessionals([]);
        setError('No professionals found matching your criteria.');
      }
    } catch (error) {
      console.error('Error loading professionals:', error);
      setError('Failed to load professionals. Please try again later.');
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkUserLoggedIn = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Please log in to continue',
        severity: 'warning'
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return false;
    }
    return true;
  };

  const handleOpenMatchDialog = (professional, type = 'match') => {
    if (!checkUserLoggedIn()) return;
    
    setSelectedProfessional(professional);
    setDialogType(type);
    setOpenDialog(true);
    setMatchMessage('');
    setDialogTab(0);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProfessional(null);
    setDialogType('match');
  };

  const handleMatchRequest = async () => {
    if (!selectedProfessional || !matchMessage.trim()) {
      return;
    }

    try {
      setMatchRequestLoading(true);
      // Get user data from localStorage for the request
      const userDataJson = localStorage.getItem('userData');
      const userData = userDataJson ? JSON.parse(userDataJson) : {};
      
      const result = await requestMatch(selectedProfessional.id, {
        message: matchMessage,
        userId: userData.id
      });
      
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Match request sent successfully!',
        severity: 'success'
      });
      
      // Navigate to matches page after successful request
      setTimeout(() => {
        navigate('/matches');
      }, 2000);
    } catch (error) {
      console.error('Error requesting match:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send match request. Please try again.',
        severity: 'error'
      });
    } finally {
      setMatchRequestLoading(false);
    }
  };

  const handleCoffeeChatInvite = async () => {
    if (!selectedProfessional || !matchMessage.trim()) {
      return;
    }

    try {
      setMatchRequestLoading(true);
      
      const result = await sendCoffeeChatInvite(selectedProfessional.id, matchMessage);
      
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: 'Coffee chat invitation sent successfully!',
        severity: 'success'
      });
      
      // Navigate to mailbox page after successful invite
      setTimeout(() => {
        navigate('/mailbox');
      }, 2000);
    } catch (error) {
      console.error('Error sending coffee chat invite:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send coffee chat invitation. Please try again.',
        severity: 'error'
      });
    } finally {
      setMatchRequestLoading(false);
    }
  };

  const handleDialogAction = () => {
    if (dialogType === 'match') {
      handleMatchRequest();
    } else if (dialogType === 'coffeechat') {
      handleCoffeeChatInvite();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const handleTabChange = (event, newValue) => {
    setDialogTab(newValue);
    setDialogType(newValue === 0 ? 'match' : 'coffeechat');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" color="inherit">
            Home
          </MuiLink>
          <Typography color="text.primary">Find Professionals</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Find the Perfect Match for Your Coffee Chat
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse through our curated list of professionals and find the perfect mentor for your career goals.
        </Typography>
      </Box>

      {/* Filters */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4, 
          border: '1px solid #e0e0e0',
          borderRadius: 2
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              name="searchTerm"
              label="Search"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              placeholder="Search by name, title, company, or skills"
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              name="industry"
              select
              label="Industry"
              value={filters.industry}
              onChange={handleFilterChange}
              fullWidth
              variant="outlined"
            >
              {industries.map((industry) => (
                <MenuItem key={industry} value={industry}>
                  {industry}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              name="experienceLevel"
              select
              label="Experience Level"
              value={filters.experienceLevel}
              onChange={handleFilterChange}
              fullWidth
              variant="outlined"
            >
              {experienceLevels.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined" 
              fullWidth 
              startIcon={<FilterList />}
              onClick={() => loadProfessionals()}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Typography color="error">{error}</Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={loadProfessionals}>
            Retry
          </Button>
        </Paper>
      ) : professionals.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Typography variant="h6">No professionals found</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your filters or search terms
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setFilters({
            searchTerm: '',
            industry: 'All',
            experienceLevel: ''
          })}>
            Clear Filters
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {professionals.map((professional) => (
            <Grid item xs={12} sm={6} md={4} key={professional._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={professional.profileImage || `https://ui-avatars.com/api/?name=${professional.firstName}+${professional.lastName}&background=random`}
                  alt={`${professional.firstName} ${professional.lastName}`}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {professional.firstName} {professional.lastName}
                  </Typography>
                  
                  {professional.profile && (
                    <>
                      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        {professional.profile.title || 'Professional'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Business fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {professional.profile.company || 'Freelancer'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationOn fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {professional.profile.location || 'Remote'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ my: 2 }}>
                        {professional.profile.industries && professional.profile.industries.slice(0, 2).map((industry, index) => (
                          <Chip 
                            key={index} 
                            label={industry} 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {professional.profile.bio ? 
                          (professional.profile.bio.length > 120 ? 
                            `${professional.profile.bio.substring(0, 120)}...` : 
                            professional.profile.bio
                          ) : 
                          'No bio provided.'
                        }
                      </Typography>
                    </>
                  )}
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    startIcon={<MessageOutlined />}
                    onClick={() => handleOpenMatchDialog(professional, 'match')}
                  >
                    Connect
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small"
                    color="primary"
                    startIcon={<CalendarMonth />}
                    onClick={() => handleOpenMatchDialog(professional, 'coffeechat')}
                    sx={{ ml: 1 }}
                  >
                    Request Chat
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Match Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Tabs value={dialogTab} onChange={handleTabChange}>
            <Tab label="Connect" />
            <Tab label="Coffee Chat" />
          </Tabs>
        </DialogTitle>
        <DialogContent>
          {selectedProfessional && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={selectedProfessional.profilePicture}
                  alt={`${selectedProfessional.firstName} ${selectedProfessional.lastName}`}
                  sx={{ width: 64, height: 64, mr: 2 }}
                />
                <Box>
                  <Typography variant="h6">
                    {selectedProfessional.firstName} {selectedProfessional.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedProfessional.title} at {selectedProfessional.company}
                  </Typography>
                </Box>
              </Box>
              
              <DialogContentText>
                {dialogType === 'match' ? (
                  "Send a personalized message to introduce yourself and explain why you'd like to connect."
                ) : (
                  "Invite this professional for a coffee chat. Include what you'd like to discuss and any specific questions you have."
                )}
              </DialogContentText>
              
              <TextField
                autoFocus
                margin="dense"
                id="message"
                label="Message"
                multiline
                rows={4}
                fullWidth
                value={matchMessage}
                onChange={(e) => setMatchMessage(e.target.value)}
                placeholder={dialogType === 'match' 
                  ? "Hi! I'm interested in connecting with you because..." 
                  : "I'd love to schedule a coffee chat to discuss..."}
              />
              
              {dialogType === 'coffeechat' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    What happens next?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    1. Send your invitation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    2. Professional will propose available time slots
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    3. Confirm a time slot and complete payment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    4. Join your scheduled coffee chat!
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleDialogAction} 
            variant="contained" 
            disabled={!matchMessage.trim() || matchRequestLoading}
          >
            {matchRequestLoading ? (
              <CircularProgress size={24} />
            ) : (
              dialogType === 'match' ? 'Send Request' : 'Send Invitation'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfessionalDiscovery; 