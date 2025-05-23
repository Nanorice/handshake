import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Cancel as CancelIcon,
  TimerOutlined as TimerIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { 
  getMyInvitations, 
  respondToInvitation, 
  cancelInvitation,
  testRespondToInvitation
} from '../../services/invitationService';
import { useInvitation } from '../../contexts/InvitationContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

/**
 * Component to display and manage invitations
 * @param {Object} props Component props
 * @param {string} props.type Type of invitations to display ('sent', 'received', 'all')
 * @param {string} props.status Status filter ('pending', 'accepted', 'declined', 'all')
 * @param {Function} props.onInvitationAction Callback when invitation is acted upon
 * @param {Object} props.sx Additional MUI styling
 */
const InvitationList = ({ 
  type = 'received', 
  status = 'pending', 
  onInvitationAction = null,
  sx = {} 
}) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [responseDialog, setResponseDialog] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [responseAction, setResponseAction] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // Use global contexts
  const { refreshKey } = useInvitation();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  
  // Define snackbar state locally since we're transitioning to the global notification system
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query params
      const params = {};
      if (type !== 'all') params.type = type;
      if (status !== 'all') params.status = status;
      
      console.log('Fetching invitations with params:', params);
      const result = await getMyInvitations(params);
      
      if (result.success && result.data) {
        setInvitations(result.data.invitations || []);
      } else {
        setInvitations([]);
        setError('No invitations found');
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      setError(`Error: ${error.message || 'Could not load invitations'}`);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
    
    // Refresh the list every minute to update expiration times
    const intervalId = setInterval(() => {
      loadInvitations();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [type, status, refreshKey]); // Added refreshKey to dependencies

  const handleOpenResponse = (invitation, action) => {
    setSelectedInvitation(invitation);
    setResponseAction(action);
    setResponseMessage('');
    setResponseDialog(true);
  };

  const handleCloseResponse = () => {
    setResponseDialog(false);
    setSelectedInvitation(null);
  };

  const handleOpenCancelDialog = (invitation) => {
    setSelectedInvitation(invitation);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setSelectedInvitation(null);
  };

  const handleSendResponse = async () => {
    if (!selectedInvitation) return;
    
    try {
      // Disable buttons and show loading (added for UX polish)
      setResponseDialog(false);
      setLoading(true);
      
      console.log(`Sending response ${responseAction} for invitation: ${selectedInvitation._id}`);
      
      // Try multiple times with standard method
      let result = null;
      let success = false;
      
      try {
        // First attempt with full data
        console.log('ATTEMPT 1: Full response with message');
        result = await respondToInvitation(
          selectedInvitation._id, 
          { 
            status: responseAction,
            responseMessage: responseMessage.trim() || undefined
          }
        );
        success = true;
      } catch (firstError) {
        console.error('First attempt failed:', firstError);
        
        try {
          // Second attempt with simplified data
          console.log('ATTEMPT 2: Simplified response without message');
          result = await respondToInvitation(
            selectedInvitation._id, 
            { status: responseAction }
          );
          success = true;
        } catch (secondError) {
          console.error('Second attempt failed:', secondError);
          
          try {
            // Final attempt using direct test method
            console.log('ATTEMPT 3: Using direct test method');
            result = await testRespondToInvitation(
              selectedInvitation._id,
              responseAction
            );
            success = true;
          } catch (finalError) {
            console.error('All attempts failed:', finalError);
            throw finalError;
          }
        }
      }
      
      if (success) {
        console.log('Response successful:', result);
        
        // Show success notification using global context
        addNotification({
          severity: 'success',
          message: `Invitation ${responseAction === 'accepted' ? 'accepted' : 'declined'} successfully`,
          duration: 5000
        });
        
        // Also add to local snackbar for backward compatibility
        setSnackbar({
          open: true,
          message: `Invitation ${responseAction === 'accepted' ? 'accepted' : 'declined'} successfully`,
          severity: 'success'
        });
        
        // Refresh the list
        loadInvitations();
        
        // Call callback if provided
        if (onInvitationAction) {
          onInvitationAction(selectedInvitation, responseAction, result);
        }
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        response: error.response?.data
      });
      
      // Show error notification using global context
      addNotification({
        severity: 'error',
        message: `Error: ${error.message || 'Failed to respond to invitation'}`,
        duration: 6000
      });
      
      // Also add to local snackbar for backward compatibility
      setSnackbar({
        open: true,
        message: `Error: ${error.message || 'Failed to respond to invitation'}`,
        severity: 'error'
      });
    } finally {
      handleCloseResponse();
      setLoading(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!selectedInvitation) return;
    
    try {
      // Disable buttons and show loading (added for UX polish)
      setCancelDialogOpen(false);
      setLoading(true);
      
      const result = await cancelInvitation(selectedInvitation._id);
      
      // Show success notification using global context
      addNotification({
        severity: 'success',
        message: 'Invitation cancelled successfully',
        duration: 5000
      });
      
      // Also add to local snackbar for backward compatibility
      setSnackbar({
        open: true,
        message: 'Invitation cancelled successfully',
        severity: 'success'
      });
      
      // Refresh the list
      loadInvitations();
      
      // Call callback if provided
      if (onInvitationAction) {
        onInvitationAction(selectedInvitation, 'cancelled', result);
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      
      // Show error notification using global context
      addNotification({
        severity: 'error',
        message: `Error: ${error.message || 'Failed to cancel invitation'}`,
        duration: 6000
      });
      
      // Also add to local snackbar for backward compatibility
      setSnackbar({
        open: true,
        message: `Error: ${error.message || 'Failed to cancel invitation'}`,
        severity: 'error'
      });
    } finally {
      handleCloseCancelDialog();
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No date specified';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isExpired = (invitation) => {
    if (!invitation.sessionDetails?.proposedDate) return false;
    
    const proposedDate = new Date(invitation.sessionDetails.proposedDate);
    const now = new Date();
    
    // Consider invitation expired if proposed date is in the past
    return proposedDate < now;
  };

  const getTimeRemaining = (invitation) => {
    if (!invitation.sessionDetails?.proposedDate) return null;
    
    const proposedDate = new Date(invitation.sessionDetails.proposedDate);
    const now = new Date();
    
    if (proposedDate < now) {
      return 'Expired';
    }
    
    const diffMs = proposedDate - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h remaining`;
    } else if (diffHours > 0) {
      return `${diffHours}h remaining`;
    } else {
      return 'Less than 1 hour remaining';
    }
  };

  const handleUseSimplifiedFlow = (invitation) => {
    if (invitation && invitation._id) {
      navigate(`/simple-invitation/${invitation._id}`);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, ...sx }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      </Paper>
    );
  }

  if (error && invitations.length === 0) {
    return (
      <Paper sx={{ p: 3, ...sx }}>
        <Typography color="error" align="center">{error}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="outlined" onClick={loadInvitations}>
            Retry
          </Button>
        </Box>
      </Paper>
    );
  }

  if (invitations.length === 0) {
    return (
      <Paper sx={{ p: 3, ...sx }}>
        <Typography align="center" color="text.secondary">
          {type === 'sent' 
            ? 'You have not sent any invitations yet.' 
            : 'You have no invitations.'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={sx}>
      <List>
        {invitations.map((invitation) => {
          const expired = isExpired(invitation) && invitation.status === 'pending';
          const timeRemaining = getTimeRemaining(invitation);
          
          return (
            <React.Fragment key={invitation._id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  expired ? (
                    <Chip 
                      label="Expired" 
                      color="default"
                      size="small"
                    />
                  ) : type === 'received' && invitation.status === 'pending' ? (
                    <Box>
                      <Button
                        variant="outlined"
                        color="success"
                        size="small"
                        startIcon={<CheckIcon />}
                        onClick={() => handleOpenResponse(invitation, 'accepted')}
                        sx={{ mr: 1 }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CloseIcon />}
                        onClick={() => handleOpenResponse(invitation, 'declined')}
                      >
                        Decline
                      </Button>
                      <Tooltip title="Use simplified flow">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleUseSimplifiedFlow(invitation)}
                          sx={{ ml: 1 }}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : type === 'sent' && invitation.status === 'pending' ? (
                    <IconButton 
                      color="error" 
                      size="small" 
                      onClick={() => handleOpenCancelDialog(invitation)}
                      aria-label="Cancel invitation"
                    >
                      <CancelIcon />
                    </IconButton>
                  ) : (
                    <Chip 
                      label={invitation.status} 
                      color={
                        invitation.status === 'accepted' ? 'success' : 
                        invitation.status === 'declined' ? 'error' : 
                        invitation.status === 'cancelled' ? 'default' : 
                        'primary'
                      }
                      size="small"
                    />
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar>
                    {type === 'sent' ? (
                      invitation.receiver?.profileImage ? (
                        <img src={invitation.receiver.profileImage} alt="Receiver" />
                      ) : (
                        <PersonIcon />
                      )
                    ) : (
                      invitation.sender?.profileImage ? (
                        <img src={invitation.sender.profileImage} alt="Sender" />
                      ) : (
                        <PersonIcon />
                      )
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      {type === 'sent' 
                        ? `To: ${invitation.receiver?.firstName} ${invitation.receiver?.lastName}` 
                        : `From: ${invitation.sender?.firstName} ${invitation.sender?.lastName}`}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography variant="body2" component="span" color="text.primary">
                        {invitation.sessionDetails?.topic || 'Coffee Chat'}
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(invitation.sessionDetails?.proposedDate)}
                        </Typography>
                      </Box>
                      {timeRemaining && invitation.status === 'pending' && (
                        <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                          <TimerIcon fontSize="small" sx={{ mr: 0.5, color: expired ? 'error.main' : 'text.secondary' }} />
                          <Typography variant="body2" color={expired ? 'error.main' : 'text.secondary'}>
                            {timeRemaining}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {invitation.message || 'No message provided'}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          );
        })}
      </List>

      {/* Response Dialog */}
      <Dialog open={responseDialog} onClose={handleCloseResponse}>
        <DialogTitle>
          {responseAction === 'accepted' ? 'Accept Invitation' : 'Decline Invitation'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {responseAction === 'accepted' 
              ? 'You are about to accept this invitation.' 
              : 'You are about to decline this invitation.'}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Response Message (optional)"
            fullWidth
            multiline
            rows={3}
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            placeholder={responseAction === 'accepted' 
              ? "I'm looking forward to our meeting!" 
              : "Sorry, I'm unable to meet at this time."}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResponse}>Cancel</Button>
          <Button 
            onClick={handleSendResponse} 
            variant="contained" 
            color={responseAction === 'accepted' ? 'success' : 'error'}
          >
            {responseAction === 'accepted' ? 'Accept' : 'Decline'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
        <DialogTitle>Cancel Invitation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to cancel this invitation?
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for cancellation (optional)"
            fullWidth
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="I need to reschedule for another time..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>No, Keep It</Button>
          <Button 
            onClick={handleCancelInvitation} 
            variant="contained" 
            color="error"
          >
            Yes, Cancel Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications (local) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InvitationList; 