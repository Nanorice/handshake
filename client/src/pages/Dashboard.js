import React, { useEffect, useState, useCallback } from 'react';
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
  Alert,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { Message, Person, Event, BugReport, Email, Notifications, WorkOutline, LocalCafe } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuthToken, getUserData, getUserType, debugAuthState, getUserDisplayName } from '../utils/authUtils';
import { debugApiConnection } from '../services/professionalService';
import { getApiBaseUrl } from '../utils/apiConfig';
import InvitationList from '../components/Invitation/InvitationList';
import { getDashboardStats, getInvitationStats } from '../services/dashboardService';
import { useTheme } from '../contexts/ThemeContext';

// Define API_URL with explicit port 5000 to match the server
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('Dashboard API_URL initialized as:', API_URL);

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ firstName: 'User', lastName: '', userType: 'professional' });
  const [userDisplayName, setUserDisplayName] = useState('User');
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [activityData, setActivityData] = useState({
    pendingRequests: 0,
    totalMatches: 0,
    completedMeetings: 0,
    profileViews: 0
  });
  const [invitationStats, setInvitationStats] = useState({
    pending: 0,
    accepted: 0,
    sent: 0
  });
  const [tokenStatus, setTokenStatus] = useState({ exists: false, value: null });
  const [invitationTab, setInvitationTab] = useState(0);
  
  // Debug state
  const [debugResult, setDebugResult] = useState(null);
  const theme = useTheme();
  const isProfessional = getUserType() === 'professional';

  const testApiConnection = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      console.log('Testing API connection to:', baseUrl);
      
      const response = await axios.get(`${baseUrl}/test`, {
        timeout: 5000
      });
      
      console.log('API Test Response:', response.data);
      setDebugResult({ success: true, data: response.data });
    } catch (error) {
      console.error('API Test Error:', error);
      setDebugResult({ success: false, error: error.message });
    }
  };

  // Function to fetch fresh user data from API
  const fetchFreshUserData = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log('[Dashboard] No token available for API call');
        return null;
      }

      const baseUrl = getApiBaseUrl();
      const profileUrl = `${baseUrl}/auth/profile`;
      console.log('[Dashboard] 🔄 Fetching fresh user data from API:', profileUrl);

      const response = await axios.get(profileUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        const freshUserData = response.data.data;
        console.log('[Dashboard] ✅ Fresh user data fetched:', {
          name: freshUserData.name,
          firstName: freshUserData.firstName,
          lastName: freshUserData.lastName,
          email: freshUserData.email
        });

        // Update localStorage with fresh data
        localStorage.setItem('userData', JSON.stringify(freshUserData));
        console.log('[Dashboard] 💾 Updated localStorage with fresh API data');

        return freshUserData;
      } else {
        console.log('[Dashboard] ❌ API returned unsuccessful response:', response.data);
        return null;
      }
    } catch (error) {
      console.error('[Dashboard] ❌ Error fetching fresh user data:', error);
      return null;
    }
  }, []);

  const refreshUserDisplayName = useCallback(async () => {
    try {
      console.log('[Dashboard] 🔄 Refreshing user display name...');
      
      // First try to get fresh data from API
      const freshUserData = await fetchFreshUserData();
      let userData = freshUserData;
      
      // If API fails, fall back to localStorage
      if (!userData) {
        console.log('[Dashboard] 📱 API failed, falling back to localStorage');
        userData = getUserData();
      }
      
      let displayName = 'User'; // Default fallback
      
      if (userData) {
        console.log('[Dashboard] 📋 Processing user data for display name:', {
          preferredName: userData.preferredName,
          firstName: userData.firstName,
          name: userData.name,
          email: userData.email
        });
        
        // Enhanced priority order for display name:
        // 1. Preferred name (highest priority)
        // 2. First name
        // 3. Extract first name from full name
        // 4. Email username (fallback)
        // 5. "User" (final fallback)
        if (userData.preferredName && userData.preferredName.trim()) {
          displayName = userData.preferredName.trim();
        } else if (userData.firstName && userData.firstName.trim()) {
          displayName = userData.firstName.trim();
        } else if (userData.name && userData.name.trim()) {
          // Extract first name from full name
          displayName = userData.name.trim().split(' ')[0];
        } else if (userData.email && userData.email.trim()) {
          // Use email username as fallback (everything before @)
          displayName = userData.email.split('@')[0];
        } else {
          // Final fallback - use "User" instead of userType
          displayName = 'User';
        }
        
        console.log('[Dashboard] ✅ Final display name determined:', displayName);
      } else {
        console.log('[Dashboard] ⚠️ No user data available, using default');
      }
      
      setUserDisplayName(displayName);
      return displayName;
    } catch (error) {
      console.error('[Dashboard] ❌ Error refreshing display name:', error);
      setUserDisplayName('User');
      return 'User';
    }
  }, [fetchFreshUserData]);

  // Enhanced localStorage listener to detect changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userData' || e.key === null) {
        console.log('[Dashboard] localStorage userData changed, refreshing display name');
        refreshUserDisplayName();
      }
    };

    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom storage events (same tab updates)
    const handleCustomStorageUpdate = (event) => {
      console.log('[Dashboard] 🔔 Profile update event received');
      console.log('[Dashboard] Event detail:', event.detail);
      
      // Immediately refresh display name from API (not just localStorage)
      console.log('[Dashboard] 🔄 Auto-refreshing display name due to profile update...');
      refreshUserDisplayName();
      
      // If the event contains profile data, update our local state too
      if (event.detail && (event.detail.firstName || event.detail.name || event.detail.preferredName)) {
        console.log('[Dashboard] 📝 Updating local user data from profile update event');
        
        // Extract the best display name using the same priority logic
        let firstName = 'User';
        if (event.detail.preferredName && event.detail.preferredName.trim()) {
          firstName = event.detail.preferredName.trim();
        } else if (event.detail.firstName && event.detail.firstName.trim()) {
          firstName = event.detail.firstName.trim();
        } else if (event.detail.name && event.detail.name.trim()) {
          firstName = event.detail.name.trim().split(' ')[0];
        }
        
        const lastName = event.detail.lastName || 
                        (event.detail.name ? event.detail.name.split(' ').slice(1).join(' ') : '') || 
                        '';
        
        console.log('[Dashboard] 📝 Updating local state with:', { firstName, lastName });
        
        setUserData(prev => ({
          ...prev,
          firstName: firstName,
          lastName: lastName
        }));
        
        // Also immediately update the display name without waiting for API
        setUserDisplayName(firstName);
      }
    };

    window.addEventListener('userDataUpdated', handleCustomStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataUpdated', handleCustomStorageUpdate);
    };
  }, [refreshUserDisplayName]);

  // Enhanced useEffect with user data refresh and window focus listener
  useEffect(() => {
    console.log('Dashboard component loaded/remounted');
    
    // Always refresh display name when dashboard loads/remounts
    // This ensures we get fresh data when navigating back from profile
    setTimeout(() => {
      console.log('[Dashboard] 🔄 Auto-refreshing on component mount...');
      refreshUserDisplayName();
    }, 100);
    
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
        
        // Extract proper name from different possible fields
        const firstName = parsedUserData.firstName || 
                         parsedUserData.name?.split(' ')[0] || 
                         parsedUserData.email?.split('@')[0] || 
                         'User';
        const lastName = parsedUserData.lastName || 
                        (parsedUserData.name?.split(' ').slice(1).join(' ')) || 
                        '';
        
        setUserData({
          firstName: firstName,
          lastName: lastName,
          userType: parsedUserData.userType || parsedUserData.role || 'professional'
        });
      } else {
        // Try to get from auth context or API if localStorage is empty
        console.log('No localStorage data found');
        setUserData({
          firstName: 'User',
          lastName: '',
          userType: 'professional'
        });
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
      // Fallback to default values
      setUserData({
        firstName: 'User',
        lastName: '',
        userType: 'professional'
      });
    }
    
    // Refresh display name
    refreshUserDisplayName();
    
    setLoading(false);
    
    // Fetch upcoming meetings and activity data
    fetchDashboardData();

    // Add window focus listener to refresh data when user returns
    const handleWindowFocus = () => {
      console.log('[Dashboard] Window focused, refreshing user data');
      refreshUserDisplayName();
      fetchDashboardData();
    };

    window.addEventListener('focus', handleWindowFocus);
    
    // Cleanup
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [navigate, refreshUserDisplayName]);
  
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
      
      // Get the base URL with /api prefix
      const baseUrl = getApiBaseUrl();
      console.log('Using baseUrl from centralized config:', baseUrl);
      
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
      
      // Fetch activity metrics using our new service instead of the stats endpoint
      try {
        console.log('Fetching dashboard statistics');
        
        // Use the new dashboard service
        const dashboardStats = await getDashboardStats();
        
        if (dashboardStats.success) {
          setActivityData(dashboardStats.data);
          console.log('Dashboard stats loaded:', dashboardStats.data);
        } else {
          console.error('Error in dashboard stats:', dashboardStats.error);
          throw new Error(dashboardStats.error?.message);
        }
        
        // Get detailed invitation statistics
        const invStats = await getInvitationStats();
        if (invStats.success) {
          setInvitationStats(invStats.data);
          console.log('Invitation stats loaded:', invStats.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        // Set default values if API fails
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

  const handleInvitationTabChange = (event, newValue) => {
    setInvitationTab(newValue);
  };

  const handleInvitationAction = (invitation, action, result) => {
    console.log(`Invitation ${action}: `, invitation);
    // Refresh dashboard data after invitation action
    fetchDashboardData();
  };

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Loading...</Typography></Box>;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: theme.bg, 
      color: theme.text,
      padding: '32px 16px'
    }}>
      <Container maxWidth="lg">

      
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '12px' }}>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              margin: 0, 
              color: theme.text 
            }}>
              Welcome back, {userDisplayName}!
            </h1>
          </div>
          <p style={{ 
            fontSize: '16px', 
            margin: 0, 
            color: theme.textSecondary 
          }}>
            Here's what's happening with your Handshake account
          </p>
        </div>

      <Grid container spacing={4}>
        {/* Quick actions */}
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%',
              ...(isProfessional && {
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                boxShadow: `0 4px 12px rgba(${isProfessional ? '30, 64, 175' : '37, 99, 235'}, 0.1)`
              })
            }}
          >
            <Typography variant="h6" component="h2" sx={{ mb: 3, color: isProfessional ? theme.palette.primary.main : 'inherit' }}>
              Quick Actions
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Primary actions with higher visibility */}
              <Button 
                variant="contained"
                color="primary" 
                fullWidth
                startIcon={<LocalCafe />}
                onClick={() => navigate('/professionals')}
                sx={{ p: 1.5, borderRadius: 2 }}
              >
                Find Professionals
              </Button>
              
              <Button 
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<Message />}
                onClick={() => navigate('/messages')}
                sx={{ p: 1.5, borderRadius: 2 }}
              >
                Messages
              </Button>
              
              {/* Secondary actions */}
              <Box sx={{ 
                mt: 1, 
                pt: 2, 
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<Event />}
                  onClick={() => navigate('/coffee-chats')}
                  sx={{ p: 1.25, borderRadius: 2, justifyContent: 'flex-start' }}
                >
                  Coffee Chat Schedule
                </Button>
                
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<Person />}
                  onClick={() => navigate('/profile')}
                  sx={{ p: 1.25, borderRadius: 2, justifyContent: 'flex-start' }}
                >
                  Edit Profile
                </Button>
                
                {isProfessional && (
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    startIcon={<WorkOutline />}
                    onClick={() => navigate('/public-profile-setup')}
                    sx={{ p: 1.25, borderRadius: 2, justifyContent: 'flex-start' }}
                  >
                    Professional Profile
                  </Button>
                )}
              </Box>
            </Box>
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
                        {activityData.pendingRequests || invitationStats.pending || 0}
                      </Typography>
                      <Typography color="text.secondary">
                        Pending Invitations
                      </Typography>
                      {invitationStats.pending > 0 && (
                        <Button 
                          size="small" 
                          color="primary" 
                          sx={{ mt: 1, p: 0 }}
                          onClick={() => {
                            setInvitationTab(0); // Switch to Received tab
                            document.getElementById('invitation-section').scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          View all
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h5" component="div">
                        {activityData.totalMatches || invitationStats.accepted || 0}
                      </Typography>
                      <Typography color="text.secondary">
                        Accepted Connections
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h5" component="div">
                        {invitationStats.sent || 0}
                      </Typography>
                      <Typography color="text.secondary">
                        Outgoing Requests
                      </Typography>
                      {invitationStats.sent > 0 && (
                        <Button 
                          size="small" 
                          color="primary" 
                          sx={{ mt: 1, p: 0 }}
                          onClick={() => {
                            setInvitationTab(1); // Switch to Sent tab
                            document.getElementById('invitation-section').scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          View all
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h5" component="div">
                        {invitationStats.accepted || 0}
                      </Typography>
                      <Typography color="text.secondary">
                        Total Interactions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Connection Invitations - Modified section */}
        <Grid item xs={12} id="invitation-section">
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Email color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2">
                Coffee Chat Invitations
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {/* Left side - Invitation Tabs */}
              <Grid item xs={12} md={8}>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                  <Tabs 
                    value={invitationTab} 
                    onChange={handleInvitationTabChange} 
                    variant="fullWidth"
                    sx={{ backgroundColor: 'action.hover' }}
                  >
                    <Tab label="Received Invitations" />
                    <Tab label="Sent Invitations" />
                  </Tabs>
                  
                  <Box sx={{ p: 2, height: 350, overflow: 'auto' }}>
                    {invitationTab === 0 ? (
                      <InvitationList 
                        type="received" 
                        status="pending" 
                        onInvitationAction={handleInvitationAction}
                        sx={{ minHeight: 300 }}
                      />
                    ) : (
                      <InvitationList 
                        type="sent" 
                        status="all" 
                        onInvitationAction={handleInvitationAction}
                        sx={{ minHeight: 300 }}
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
              
              {/* Right side - Actions and Info */}
              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 2, height: 'calc(100% - 56px)' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {invitationTab === 0 ? "Pending Invitations" : "Sent Requests"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {invitationTab === 0 
                        ? "Here are invitations from seekers who want to connect with you. Review and respond to start making connections."
                        : "Track the status of invitations you've sent to professionals. Check back for responses."}
                    </Typography>
                    
                    <Button 
                      variant="contained" 
                      fullWidth
                      startIcon={<Person />}
                      onClick={() => navigate('/professionals')}
                      sx={{ mt: 2 }}
                    >
                      Find Professionals
                    </Button>
                    
                    {invitationTab === 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          ✓ Accept invitations that match your expertise
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          ✓ Provide feedback if you decline
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      </Container>
    </div>
  );
};

export default Dashboard; 