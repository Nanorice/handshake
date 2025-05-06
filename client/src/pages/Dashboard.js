import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import { CalendarMonth, Message, Person, Favorite, Event } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuthToken } from '../utils/authUtils';

// Define API_URL with explicit port 5000 to match what the browser is using
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('Dashboard API_URL initialized as:', API_URL);

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    userType: ''
  });
  const [loading, setLoading] = useState(true);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [activityData, setActivityData] = useState({
    pendingRequests: 0,
    totalMatches: 0,
    completedMeetings: 0,
    profileViews: 0
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [tokenStatus, setTokenStatus] = useState({
    exists: false,
    value: null
  });

  useEffect(() => {
    console.log('Dashboard component loaded');
    
    // Check if user is authenticated using our helper
    const token = getAuthToken();
    const isExplicitlyLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    console.log('Dashboard auth check:', { 
      hasToken: !!token, 
      isExplicitlyLoggedIn,
      isAuthenticated: !!(token || isExplicitlyLoggedIn),
      tokenPreview: token ? token.substring(0, 10) + '...' : 'none'
    });
    
    // Update token status state
    setTokenStatus({
      exists: !!token,
      value: token ? `${token.substring(0, 10)}...` : null
    });
    
    // IMPORTANT: Now require a token to be present, not just isLoggedIn flag
    if (!token) {
      console.log('No token found, redirecting to login');
      // Clear any potentially stale login state
      localStorage.removeItem('isLoggedIn');
      navigate('/login');
      return;
    } else {
      console.log('Authentication found, user can access dashboard');
    }

    // Get user data from localStorage
    try {
      const userDataJson = localStorage.getItem('userData');
      console.log('Dashboard userData from localStorage:', userDataJson ? 'Found user data' : 'No user data');
      
      if (userDataJson) {
        const parsedUserData = JSON.parse(userDataJson);
        console.log('Dashboard parsed userData:', parsedUserData ? 'Successfully parsed' : 'Parse failed');
        
        setUserData({
          firstName: parsedUserData.firstName || 'User',
          lastName: parsedUserData.lastName || 'Name',
          userType: parsedUserData.userType || 'professional'
        });
      } else {
        // Fallback mock data if no user data found
        console.log('No user data found, using fallback data');
        setUserData({
          firstName: 'User',
          lastName: 'Name',
          userType: 'professional'
        });
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
      // Fallback to default values
      setUserData({
        firstName: 'User',
        lastName: 'Name',
        userType: 'professional'
      });
    }
    
    setLoading(false);
    
    // Fetch upcoming meetings and activity data
    fetchDashboardData();
  }, [navigate]);
  
  const fetchDashboardData = async () => {
    setDataLoading(true);
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No auth token found for API requests');
        
        // Check token state again and update
        setTokenStatus({
          exists: false,
          value: null
        });
        
        throw new Error('No auth token found');
      }
      
      // Update token status
      setTokenStatus({
        exists: true,
        value: token.substring(0, 10) + '...'
      });
      
      // Log the API URL to diagnose the issue
      console.log('Using API_URL:', API_URL);
      
      // Ensure API_URL has the correct format
      // Parse the API URL to ensure the structure is correct
      let baseUrl = API_URL;
      if (!baseUrl.includes('/api')) {
        baseUrl = `${baseUrl}/api`;
      }
      console.log('Normalized baseUrl:', baseUrl);
      
      // Fetch upcoming sessions
      try {
        // Construct the full URL carefully
        const sessionsUrl = `${baseUrl}/sessions/upcoming`;
        console.log('Fetching upcoming sessions from:', sessionsUrl);
        
        // Get a fresh token for this request
        const requestToken = getAuthToken();
        if (!requestToken) {
          console.warn('Token missing for sessions request');
          throw new Error('No authentication token available');
        }
        
        const sessionsResponse = await axios.get(sessionsUrl, {
          headers: {
            'Authorization': `Bearer ${requestToken}`
          }
        });
        
        if (sessionsResponse.data && sessionsResponse.data.success) {
          setUpcomingMeetings(sessionsResponse.data.data.sessions || []);
        }
      } catch (error) {
        console.error('Error fetching upcoming sessions:', error);
        setUpcomingMeetings([]);
      }
      
      // Fetch activity metrics
      try {
        // Construct the full URL carefully
        const statsUrl = `${baseUrl}/users/stats`;
        console.log('Fetching user stats from:', statsUrl);
        
        // Get a fresh token for this request
        const requestToken = getAuthToken();
        if (!requestToken) {
          console.warn('Token missing for stats request');
          throw new Error('No authentication token available');
        }
        
        const statsResponse = await axios.get(statsUrl, {
          headers: {
            'Authorization': `Bearer ${requestToken}`
          }
        });
        
        if (statsResponse.data && statsResponse.data.success) {
          setActivityData(statsResponse.data.data || {
            pendingRequests: 0,
            totalMatches: 0,
            completedMeetings: 0,
            profileViews: 0
          });
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setActivityData({
          pendingRequests: 0,
          totalMatches: 0,
          completedMeetings: 0,
          profileViews: 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Add a manual logout function
  const handleLogout = () => {
    console.log('Manual logout requested');
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userId');
    localStorage.removeItem('isLoggedIn');
    // Force navigation to login
    navigate('/login');
  };

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Loading...</Typography></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Debug information - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <Alert 
          severity={tokenStatus.exists ? "info" : "warning"} 
          sx={{ mb: 2 }}
          action={
            !tokenStatus.exists ? (
              <Button color="inherit" size="small" onClick={handleLogout}>
                Go to Login
              </Button>
            ) : null
          }
        >
          <Typography variant="body2">
            Token status: {tokenStatus.exists ? `Found (${tokenStatus.value})` : 'Missing!'}
          </Typography>
        </Alert>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {userData.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your Handshake account
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Quick actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<Person />}
                  onClick={() => {
                    console.log('Navigating to profile page');
                    navigate('/profile');
                  }}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 1.5 }}
                >
                  Edit Profile
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Tooltip title="View all your scheduled and past coffee chats" placement="top" arrow>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    startIcon={<Event />}
                    onClick={() => {
                      console.log('Navigating to coffee chats page');
                      navigate('/coffee-chats');
                    }}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 1.5 }}
                  >
                    Schedule History
                  </Button>
                </Tooltip>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="contained"
                  color="primary" 
                  fullWidth
                  startIcon={<Message />}
                  onClick={() => {
                    console.log('Navigating to messaging page');
                    navigate('/messaging');
                  }}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 1.5, mb: 1 }}
                >
                  Conversations
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<Favorite />}
                  onClick={() => {
                    console.log('Navigating to professionals discovery page');
                    navigate('/professionals');
                  }}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 1.5 }}
                >
                  Discover
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Upcoming meetings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Upcoming Coffee Chats
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<Event />}
                onClick={() => {
                  console.log('Navigating to coffee chats from header button');
                  navigate('/coffee-chats');
                }}
              >
                View All Schedules
              </Button>
            </Box>
            
            {dataLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress size={30} />
              </Box>
            ) : upcomingMeetings.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {upcomingMeetings.map((meeting, index) => (
                  <React.Fragment key={meeting.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar alt={meeting.professional?.name || 'User'} src={meeting.professional?.profileImage} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={meeting.professional?.name || 'Professional'}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {meeting.professional?.title || 'Professional'} 
                              {meeting.professional?.company ? ` at ${meeting.professional.company}` : ''}
                            </Typography>
                            {` — ${new Date(meeting.scheduledAt).toLocaleDateString()} at ${new Date(meeting.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                          </>
                        }
                      />
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => {
                          console.log(`Joining meeting with ${meeting.professional?.name}`);
                          // Open Zoom link or other meeting platform
                          if (meeting.meetingLink) {
                            window.open(meeting.meetingLink, '_blank');
                          } else {
                            alert('Meeting link not available yet');
                          }
                        }}
                      >
                        Join Meeting
                      </Button>
                    </ListItem>
                    {index < upcomingMeetings.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary">You have no upcoming meetings</Typography>
                <Button 
                  variant="text" 
                  color="primary"
                  sx={{ mt: 1 }}
                  onClick={() => navigate('/professionals')}
                >
                  Find professionals to connect with
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Activity summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Activity Summary
            </Typography>
            
            {dataLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h5" component="div">
                        {activityData.pendingRequests}
                      </Typography>
                      <Typography color="text.secondary">
                        Pending Requests
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h5" component="div">
                        {activityData.totalMatches}
                      </Typography>
                      <Typography color="text.secondary">
                        Total Matches
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h5" component="div">
                        {activityData.completedMeetings}
                      </Typography>
                      <Typography color="text.secondary">
                        Completed Meetings
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h5" component="div">
                        {activityData.profileViews}
                      </Typography>
                      <Typography color="text.secondary">
                        Profile Views
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 