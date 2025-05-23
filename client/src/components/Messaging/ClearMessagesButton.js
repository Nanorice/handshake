import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Button component to clear all message data from localStorage
 * Useful for debugging and resetting state when issues occur
 */
const ClearMessagesButton = () => {
  const [open, setOpen] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const clearMessages = () => {
    try {
      // Clear main message storage
      localStorage.removeItem('handshake_threads');
      localStorage.removeItem('handshake_messages');
      
      // Clear any per-thread message storage
      try {
        const keys = Object.keys(localStorage);
        const messageKeys = keys.filter(k => k.startsWith('messages_'));
        messageKeys.forEach(key => {
          localStorage.removeItem(key);
        });
      } catch (storageError) {
        console.error('Error clearing per-thread messages:', storageError);
        // Continue with other operations even if this fails
      }
      
      console.log('Cleared message data from localStorage');
      setCleared(true);
      
      // Reset cleared state after 3 seconds
      setTimeout(() => {
        setCleared(false);
        handleClose();
      }, 3000);
      
      // Refresh the page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 3500);
    } catch (err) {
      console.error('Error clearing message data:', err);
      // Still close the dialog even if there was an error
      setTimeout(() => {
        handleClose();
      }, 1000);
    }
  };

  return (
    <>
      <Tooltip title="Clear messages data">
        <IconButton
          color="warning"
          onClick={handleOpen}
          size="small"
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'warning.light',
            }
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="clear-messages-dialog-title"
      >
        <DialogTitle id="clear-messages-dialog-title">
          {cleared ? "Messages Cleared!" : "Clear Messages Data?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {cleared 
              ? "All message data has been cleared from local storage. You may need to refresh the page to see the changes."
              : "This will clear all message data from local storage. This action cannot be undone and is only recommended for troubleshooting issues."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {!cleared && (
            <>
              <Button onClick={handleClose} color="primary">
                Cancel
              </Button>
              <Button onClick={clearMessages} color="warning">
                Clear Messages
              </Button>
            </>
          )}
          {cleared && (
            <Button onClick={handleClose} color="primary">
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClearMessagesButton; 