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
  Message as MessageIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Component to display message notifications
 * 
 * @param {Object} props
 * @param {Array} props.notifications - List of notification objects
 * @param {Function} props.onDismiss - Function to call when a notification is dismissed
 * @param {Function} props.onNavigate - Function to call when navigating to a conversation
 */
const MessageNotifications = ({ notifications = [], onDismiss, onNavigate }) => {
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
        onNavigate(currentNotification.threadId);
      } else {
        // Default navigation
        navigate(`/messaging?thread=${currentNotification.threadId}`);
      }
    }
  };

  if (!currentNotification) {
    return null;
  }

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        severity="info"
        sx={{ width: '100%', cursor: 'pointer' }}
        icon={<MessageIcon />}
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
            {currentNotification.senderName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" component="span">
              {currentNotification.senderName || 'User'}
            </Typography>
            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
              {currentNotification.hasAttachments 
                ? 'Sent you an attachment' 
                : currentNotification.preview}
            </Typography>
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default MessageNotifications; 