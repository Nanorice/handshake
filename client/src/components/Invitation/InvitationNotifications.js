import React, { useState, useEffect } from 'react';
import { 
  Snackbar, 
  Alert, 
  Typography, 
  Box, 
  Avatar,
  IconButton
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Component to display invitation notifications
 * 
 * @param {Object} props
 * @param {Array} props.notifications - List of invitation notification objects
 * @param {Function} props.onDismiss - Function to call when a notification is dismissed
 * @param {Function} props.onNavigate - Function to call when navigating to invitations view
 */
const InvitationNotifications = ({ 
  notifications = [], 
  onDismiss, 
  onNavigate 
}) => {
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const navigate = useNavigate();

  // Show notification when new ones come in
  useEffect(() => {
    if (notifications.length > 0) {
      // Get the newest notification
      const newest = notifications[0];
      setCurrentNotification(newest);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [notifications]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    if (onDismiss && currentNotification) {
      onDismiss(currentNotification.id);
    }
  };

  const handleNavigate = () => {
    if (currentNotification) {
      setOpen(false);
      if (onDismiss) {
        onDismiss(currentNotification.id);
      }
      if (onNavigate) {
        onNavigate(currentNotification.invitationId);
      } else {
        // Default navigation to dashboard with invitations tab
        navigate('/dashboard');
      }
    }
  };

  if (!currentNotification) {
    return null;
  }

  // Determine notification content based on type
  const getNotificationContent = () => {
    const { type, senderName, receiverName } = currentNotification;
    
    switch (type) {
      case 'invitation_received':
        return `${senderName} invited you to a coffee chat`;
      case 'invitation_accepted':
        return `${receiverName} accepted your coffee chat invitation`;
      case 'invitation_declined':
        return `${receiverName} declined your coffee chat invitation`;
      case 'invitation_cancelled':
        return `Coffee chat with ${receiverName} was cancelled`;
      case 'invitation_expiring':
        return `Your invitation to ${receiverName} is about to expire`;
      default:
        return 'You have a new notification';
    }
  };

  // Determine notification severity based on type
  const getNotificationSeverity = () => {
    const { type } = currentNotification;
    
    switch (type) {
      case 'invitation_accepted':
        return 'success';
      case 'invitation_declined':
      case 'invitation_cancelled':
        return 'error';
      case 'invitation_expiring':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        severity={getNotificationSeverity()}
        sx={{ width: '100%', cursor: 'pointer' }}
        icon={<CalendarIcon />}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        onClick={handleNavigate}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={currentNotification.senderAvatar} 
            sx={{ width: 32, height: 32, mr: 1 }}
          >
            {currentNotification.senderName?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" component="span">
              Coffee Chat Notification
            </Typography>
            <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
              {getNotificationContent()}
            </Typography>
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default InvitationNotifications; 