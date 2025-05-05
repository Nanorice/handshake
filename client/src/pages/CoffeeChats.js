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
  Paper
} from '@mui/material';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import CoffeeChatCard from '../components/CoffeeChat/CoffeeChatCard';
import InfoIcon from '@mui/icons-material/Info';
import EventIcon from '@mui/icons-material/Event';

// Import mock data for development
import { MOCK_COFFEE_CHATS } from '../mockData';

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
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  // Fetch coffee chats from API (using mock data for now)
  useEffect(() => {
    const fetchCoffeeChats = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        // const response = await axios.get('/api/coffee-chats');
        // setCoffeeChats(response.data);
        
        // Using mock data for now
        setTimeout(() => {
          setCoffeeChats(MOCK_COFFEE_CHATS);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching coffee chats:', error);
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
      // In a real app, this would be an API call
      // await axios.post(`/api/coffee-chats/${currentChatId}/feedback`, reviewData);
      
      console.log('Review submitted:', {
        chatId: currentChatId,
        ...reviewData
      });
      
      // Update the local state to reflect the change
      setCoffeeChats(prev => 
        prev.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, hasReview: true } 
            : chat
        )
      );
      
      // Close the dialog and reset the form
      setReviewDialogOpen(false);
      setCurrentChatId(null);
      setReviewData({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
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
  const handleCancelChat = (chatId) => {
    console.log('Cancel chat:', chatId);
    // In a real app, this would update the status via API
  };

  const handleRescheduleChat = (chatId) => {
    console.log('Reschedule chat:', chatId);
    // In a real app, this would open a reschedule dialog
  };

  const handleJoinMeeting = (link) => {
    window.open(link, '_blank');
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
          <Typography>Loading your coffee chats...</Typography>
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
              sx={{ mt: 2 }}
            >
              Find Professionals
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {upcomingChats.map(chat => (
              <Grid item xs={12} md={6} key={chat.id}>
                <CoffeeChatCard
                  coffeeChat={chat}
                  onCancel={handleCancelChat}
                  onReschedule={handleRescheduleChat}
                  onJoinMeeting={handleJoinMeeting}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>
      
      {/* Past Coffee Chats Tab */}
      <TabPanel value={tabValue} index={1}>
        {isLoading ? (
          <Typography>Loading your coffee chats...</Typography>
        ) : pastChats.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No past coffee chats
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your completed and cancelled coffee chats will appear here.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {pastChats.map(chat => (
              <Grid item xs={12} md={6} key={chat.id}>
                <CoffeeChatCard
                  coffeeChat={chat}
                  isPast={true}
                  onLeaveReview={!chat.hasReview ? handleLeaveReview : null}
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
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography gutterBottom>How was your experience?</Typography>
            <Rating
              name="rating"
              value={reviewData.rating}
              onChange={handleRatingChange}
              size="large"
            />
          </Box>
          <TextField
            autoFocus
            name="comment"
            label="Your feedback"
            multiline
            rows={4}
            fullWidth
            value={reviewData.comment}
            onChange={handleReviewChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitReview} variant="contained">
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CoffeeChats; 