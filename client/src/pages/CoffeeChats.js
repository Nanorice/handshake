import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Button,
  Box,
  Tabs,
  Tab,
  Breadcrumbs,
  Link as MuiLink,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Rating,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import CoffeeChatCard from '../components/CoffeeChat/CoffeeChatCard';
import InfoIcon from '@mui/icons-material/Info';
import EventIcon from '@mui/icons-material/Event';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';
import { getMyInvitations, unlockInvitationChat, getInvitationChatThread } from '../services/invitationService';

// Define API_URL with explicit port 5000 to match the server
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
  const [invitationChats, setInvitationChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [currentInvitationId, setCurrentInvitationId] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [chatUnlockStatus, setChatUnlockStatus] = useState({
    success: false,
    error: null
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
        
        // Get the base URL with /api prefix
        const baseUrl = getApiBaseUrl();
        console.log('Using baseUrl from centralized config:', baseUrl);
        
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
        
        // Fetch invitation-based chats
        await fetchInvitationBasedChats();
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
  
  // Fetch invitation-based coffee chats
  const fetchInvitationBasedChats = async () => {
    try {
      // Get all completed/accepted invitations
      const result = await getMyInvitations({ status: 'accepted' });
      
      if (result.success && result.data) {
        // Transform invitations to coffee chat format
        const chats = result.data.invitations.map(invitation => ({
          id: invitation._id, // Use invitation ID as the chat ID
          invitationId: invitation._id, // Store original invitation ID
          status: invitation.status === 'accepted' ? 'completed' : invitation.status,
          scheduledAt: invitation.sessionDetails?.proposedDate,
          duration: invitation.sessionDetails?.duration || 30,
          price: 0, // Invitations don't have a price in this context
          professional: {
            firstName: invitation.sender?.firstName || invitation.receiver?.firstName,
            lastName: invitation.sender?.lastName || invitation.receiver?.lastName,
            profileImage: invitation.sender?.profileImage || invitation.receiver?.profileImage,
            title: invitation.sender?.title || invitation.receiver?.title,
            company: invitation.sender?.company || invitation.receiver?.company
          },
          topics: [invitation.sessionDetails?.topic] || ['Coffee Chat'],
          meetingLink: invitation.meetingLink || null,
          hasReview: !!invitation.hasReview,
          chatUnlocked: !!invitation.chatUnlocked
        }));
        
        setInvitationChats(chats);
      }
    } catch (error) {
      console.error('Error fetching invitation-based chats:', error);
    }
  };

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
        
        // Also update invitation chats if applicable
        setInvitationChats(prev => 
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
  
  // Open unlock chat dialog
  const handleUnlockChat = (invitationId) => {
    setCurrentInvitationId(invitationId);
    setChatUnlockStatus({ success: false, error: null });
    setUnlockDialogOpen(true);
  };
  
  // Process chat unlock
  const handleProcessUnlock = async () => {
    if (!currentInvitationId) return;
    
    setPaymentProcessing(true);
    
    try {
      const result = await unlockInvitationChat(currentInvitationId);
      
      if (result.success) {
        setChatUnlockStatus({ 
          success: true, 
          error: null 
        });
        
        // Update the invitation chat in state
        setInvitationChats(prev => 
          prev.map(chat => 
            chat.invitationId === currentInvitationId 
              ? { ...chat, chatUnlocked: true } 
              : chat
          )
        );
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          setUnlockDialogOpen(false);
          setCurrentInvitationId(null);
          setPaymentProcessing(false);
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to unlock chat');
      }
    } catch (error) {
      console.error('Error unlocking chat:', error);
      setChatUnlockStatus({
        success: false,
        error: error.message || 'Failed to process payment. Please try again.'
      });
      setPaymentProcessing(false);
    }
  };
  
  // Open chat for an invitation
  const handleOpenChat = async (invitationId) => {
    try {
      const result = await getInvitationChatThread(invitationId);
      
      if (result.success && result.data.threadId) {
        // Navigate to chat with the thread ID
        window.location.href = `/messaging?thread=${result.data.threadId}`;
      } else {
        throw new Error(result.message || 'Could not find chat thread');
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      alert('Could not open chat. Please try again.');
    }
  };

  // Filter chats by status
  const upcomingChats = [...coffeeChats, ...invitationChats].filter(
    chat => ['pending', 'confirmed'].includes(chat.status)
  );
  
  const pastChats = [...coffeeChats, ...invitationChats].filter(
    chat => ['completed', 'cancelled'].includes(chat.status)
  );

  // Handle coffee chat actions
  const handleRescheduleChat = (chatId) => {
    // Implementation for reschedule
    console.log('Reschedule chat', chatId);
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
          Manage your upcoming and past coffee chat sessions
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="coffee chat tabs"
        >
          <Tab label="Upcoming Sessions" id="coffee-chat-tab-0" />
          <Tab label="Past Sessions" id="coffee-chat-tab-1" />
        </Tabs>
      </Box>

      {/* Loading/Error State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {apiError && !isLoading && (
        <Alert severity="warning" sx={{ my: 4 }}>
          {apiError}
        </Alert>
      )}

      {/* Upcoming Sessions */}
      <TabPanel value={tabValue} index={0}>
        {!isLoading && !apiError && upcomingChats.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Upcoming Sessions
            </Typography>
            <Typography color="text.secondary" paragraph>
              You don't have any upcoming coffee chats scheduled
            </Typography>
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
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {upcomingChats.map((chat) => (
              <Grid item xs={12} md={6} lg={4} key={chat.id}>
                <CoffeeChatCard
                  chat={chat}
                  onJoinMeeting={() => handleJoinMeeting(chat.meetingLink)}
                  onCancel={() => {/* handle cancel */}}
                  onReschedule={() => handleRescheduleChat(chat.id)}
                  isInvitationBased={!!chat.invitationId}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Past Sessions */}
      <TabPanel value={tabValue} index={1}>
        {!isLoading && !apiError && pastChats.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Past Sessions
            </Typography>
            <Typography color="text.secondary" paragraph>
              Your completed coffee chats will appear here
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {pastChats.map((chat) => (
              <Grid item xs={12} md={6} lg={4} key={chat.id}>
                <CoffeeChatCard
                  chat={chat}
                  onReview={() => handleLeaveReview(chat.id)}
                  isInvitationBased={!!chat.invitationId}
                  onUnlockChat={handleUnlockChat}
                  onOpenChat={handleOpenChat}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)}>
        <DialogTitle>Leave a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              How was your coffee chat experience?
            </Typography>
            <Rating
              name="rating"
              value={reviewData.rating}
              onChange={handleRatingChange}
              size="large"
              sx={{ mt: 1 }}
            />
          </Box>
          <TextField
            autoFocus
            margin="dense"
            id="comment"
            name="comment"
            label="Your feedback"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={reviewData.comment}
            onChange={handleReviewChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitReview} variant="contained" color="primary">
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Unlock Chat Dialog */}
      <Dialog 
        open={unlockDialogOpen} 
        onClose={() => !paymentProcessing && setUnlockDialogOpen(false)}
      >
        <DialogTitle>Unlock Chat Access</DialogTitle>
        <DialogContent>
          {chatUnlockStatus.success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Chat unlocked successfully! You can now continue the conversation.
            </Alert>
          ) : chatUnlockStatus.error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {chatUnlockStatus.error}
            </Alert>
          ) : (
            <>
              <Typography variant="body1" paragraph>
                Unlocking chat access allows you to continue the conversation with your coffee chat partner after your session.
              </Typography>
              <Typography variant="body1" paragraph>
                For this demo, chat unlocking is free. In a production environment, this would typically require a small fee.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {!chatUnlockStatus.success && (
            <>
              <Button 
                onClick={() => setUnlockDialogOpen(false)}
                disabled={paymentProcessing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleProcessUnlock} 
                variant="contained" 
                color="primary"
                disabled={paymentProcessing}
              >
                {paymentProcessing ? (
                  <CircularProgress size={24} />
                ) : (
                  'Unlock Chat Access'
                )}
              </Button>
            </>
          )}
          {chatUnlockStatus.success && (
            <Button onClick={() => setUnlockDialogOpen(false)}>
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CoffeeChats; 