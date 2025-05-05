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
  Tooltip
} from '@mui/material';
import { CalendarMonth, Message, Person, Favorite, Event } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    userType: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Dashboard component loaded');
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const isExplicitlyLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    console.log('Dashboard auth check:', { 
      hasToken: !!token, 
      isExplicitlyLoggedIn,
      isAuthenticated: !!(token || isExplicitlyLoggedIn)
    });
    
    if (!token && !isExplicitlyLoggedIn) {
      console.log('No authentication found, redirecting to login');
      navigate('/login');
      return;
    } else {
      console.log('Authentication found, user can access dashboard');
    }

    // Get user data from localStorage
    try {
      const userDataJson = localStorage.getItem('userData');
      console.log('Dashboard userData from localStorage:', userDataJson);
      
      if (userDataJson) {
        const parsedUserData = JSON.parse(userDataJson);
        console.log('Dashboard parsed userData:', parsedUserData);
        
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
  }, [navigate]);

  const upcomingMeetings = [
    {
      id: 1,
      name: 'Sarah Johnson',
      position: 'Software Engineer',
      company: 'Google',
      date: '2023-09-15',
      time: '14:00',
      avatar: '/assets/avatar-1.jpg'
    },
    {
      id: 2,
      name: 'Michael Chen',
      position: 'Product Manager',
      company: 'Microsoft',
      date: '2023-09-18',
      time: '10:30',
      avatar: '/assets/avatar-2.jpg'
    }
  ];

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Loading...</Typography></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
            {upcomingMeetings.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {upcomingMeetings.map((meeting, index) => (
                  <React.Fragment key={meeting.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar alt={meeting.name} src={meeting.avatar} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={meeting.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {meeting.position} at {meeting.company}
                            </Typography>
                            {` — ${new Date(meeting.date).toLocaleDateString()} at ${meeting.time}`}
                          </>
                        }
                      />
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => {
                          console.log(`Joining meeting with ${meeting.name}`);
                          // In a real app this would open the meeting
                          alert(`Meeting with ${meeting.name} will open in a video call`);
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
              <Typography color="text.secondary">You have no upcoming meetings</Typography>
            )}
          </Paper>
        </Grid>

        {/* Activity summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Activity Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h5" component="div">
                      5
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
                      12
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
                      3
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
                      8
                    </Typography>
                    <Typography color="text.secondary">
                      Profile Views
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 