import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Breadcrumbs,
  Link as MuiLink,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Rating,
  TextField,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import CoffeeChatCard from '../components/CoffeeChat/CoffeeChatCard';
import InfoIcon from '@mui/icons-material/Info';
import EventIcon from '@mui/icons-material/Event';
import axios from 'axios';

// Define API_URL with explicit port 5000 to match what the browser is using
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('CoffeeChats API_URL initialized as:', API_URL);

// Tab panel component for the different sections
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`coffee-chat-tabpanel-${index}`}
      aria-labelledby={`coffee-chat-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CoffeeChats = () => {
  // State
  const [tabValue, setTabValue] = useState(0);
  const [coffeeChats, setCoffeeChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  // Fetch coffee chats from API
  useEffect(() => {
    const fetchCoffeeChats = async () => {
      setIsLoading(true);
      setApiError(null);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        // Ensure API_URL has the correct format
        let baseUrl = API_URL;
        if (!baseUrl.includes('/api')) {
          baseUrl = `${baseUrl}/api`;
        }
        console.log('Normalized baseUrl:', baseUrl);
        
        // Construct the full URL carefully
        const sessionsUrl = `${baseUrl}/sessions`;
        console.log('Fetching coffee chats from:', sessionsUrl);
        
        const response = await axios.get(sessionsUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.success) {
          setCoffeeChats(response.data.data.sessions || []);
        } else {
          setCoffeeChats([]);
        }
      } catch (error) {
        console.error('Error fetching coffee chats:', error);
        setApiError(
          error.response?.status === 404 
            ? 'This feature is not yet available. The API endpoint does not exist.'
            : 'Failed to load your coffee chats. Please try again.'
        );
        setCoffeeChats([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoffeeChats();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Open review dialog
  const handleLeaveReview = (chatId) => {
    setCurrentChatId(chatId);
    setReviewDialogOpen(true);
  };

  // Handle review input changes
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle rating change
  const handleRatingChange = (event, newValue) => {
    setReviewData(prev => ({
      ...prev,
      rating: newValue
    }));
  };

  // Submit review
  const handleSubmitReview = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(`${API_URL}/sessions/${currentChatId}/feedback`, 
        reviewData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.success) {
        // Update the local state to reflect the change
        setCoffeeChats(prev => 
          prev.map(chat => 
            chat.id === currentChatId 
              ? { ...chat, hasReview: true } 
              : chat
          )
        );
      }
      
      // Close the dialog and reset the form
      setReviewDialogOpen(false);
      setCurrentChatId(null);
      setReviewData({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  // Filter chats by status
  const upcomingChats = coffeeChats.filter(
    chat => ['pending', 'confirmed'].includes(chat.status)
  );
  
  const pastChats = coffeeChats.filter(
    chat => ['completed', 'cancelled'].includes(chat.status)
  );

  // Handle coffee chat actions
  const handleCancelChat = async (chatId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.put(`${API_URL}/sessions/${chatId}/status`, 
        { status: 'cancelled' },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.success) {
        // Update the local state to reflect the change
        setCoffeeChats(prev => 
          prev.map(chat => 
            chat.id === chatId 
              ? { ...chat, status: 'cancelled' } 
              : chat
          )
        );
      }
    } catch (error) {
      console.error('Error cancelling chat:', error);
      alert('Failed to cancel the session. Please try again.');
    }
  };

  const handleRescheduleChat = (chatId) => {
    // This would open a reschedule dialog in a real app
    alert('Reschedule functionality is not yet implemented');
  };

  const handleJoinMeeting = (link) => {
    if (link) {
      window.open(link, '_blank');
    } else {
      alert('Meeting link is not available.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" color="inherit">
            Home
          </MuiLink>
          <Typography color="text.primary">Coffee Chats</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Your Coffee Chats
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your scheduled coffee chats and view past sessions.
        </Typography>
      </Box>
      
      {/* Information Alert */}
      <Alert 
        severity="info" 
        icon={<InfoIcon />}
        sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EventIcon sx={{ mr: 1 }} />
          <Typography variant="body2">
            <strong>This is your schedule history page.</strong> When you confirm a time slot from the matches page, 
            your scheduled coffee chats will appear here. You can track all your upcoming and past meetings in one place.
          </Typography>
        </Box>
      </Alert>
      
      {/* API Error Alert */}
      {apiError && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
        >
          {apiError}
        </Alert>
      )}
      
      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="coffee chat tabs"
        >
          <Tab label={`Upcoming (${upcomingChats.length})`} />
          <Tab label={`Past (${pastChats.length})`} />
        </Tabs>
      </Box>
      
      {/* Upcoming Coffee Chats Tab */}
      <TabPanel value={tabValue} index={0}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : upcomingChats.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No upcoming coffee chats
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You don't have any scheduled coffee chats right now.
            </Typography>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 3, 
                backgroundColor: '#f5f9ff', 
                border: '1px dashed #4a90e2',
                borderRadius: 2 
              }}
            >
              <Typography variant="body2" align="center">
                To schedule a coffee chat: <br />
                1. Go to <MuiLink component={Link} to="/matches">Matches</MuiLink> <br />
                2. Find a professional you'd like to chat with <br />
                3. Click "Schedule" to select a time slot <br />
                4. Your confirmed schedules will appear here
              </Typography>
            </Paper>
            <Button 
              variant="contained" 
              color="primary"
              component={Link}
              to="/professionals"
            >
              Find Professionals
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {upcomingChats.map((chat) => (
              <Grid item xs={12} sm={6} md={4} key={chat.id}>
                <CoffeeChatCard 
                  chat={chat}
                  onCancel={() => handleCancelChat(chat.id)}
                  onReschedule={() => handleRescheduleChat(chat.id)}
                  onJoinMeeting={() => handleJoinMeeting(chat.meetingLink)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>
      
      {/* Past Coffee Chats Tab */}
      <TabPanel value={tabValue} index={1}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : pastChats.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No past coffee chats
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your completed or cancelled coffee chats will appear here.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {pastChats.map((chat) => (
              <Grid item xs={12} sm={6} md={4} key={chat.id}>
                <CoffeeChatCard 
                  chat={chat}
                  onReview={() => !chat.hasReview && handleLeaveReview(chat.id)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>
      
      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)}>
        <DialogTitle>Leave Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography gutterBottom>How was your experience?</Typography>
            <Rating
              name="rating"
              value={reviewData.rating}
              onChange={handleRatingChange}
              size="large"
              precision={0.5}
            />
          </Box>
          <TextField
            autoFocus
            label="Comments"
            name="comment"
            value={reviewData.comment}
            onChange={handleReviewChange}
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Share your experience and feedback about this coffee chat..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmitReview} color="primary" variant="contained">
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CoffeeChats; 