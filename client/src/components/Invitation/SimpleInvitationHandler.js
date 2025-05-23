import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import { simpleRespondToInvitation } from '../../services/simpleInvitationService';

/**
 * A simplified component for responding to invitations
 * with minimal dependencies and better error handling
 */
const SimpleInvitationHandler = ({ 
  invitationId, 
  onSuccess,
  onError,
  initialStatus = 'pending'
}) => {
  const [status, setStatus] = useState('accepted');
  const [responseMessage, setResponseMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleRespond = async () => {
    if (!invitationId) {
      setError('No invitation ID provided');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`Responding to invitation ${invitationId} with status: ${status}`);
      
      const result = await simpleRespondToInvitation(
        invitationId,
        status,
        responseMessage
      );
      
      console.log('Response successful:', result);
      
      setSuccess(true);
      setSnackbar({
        open: true,
        message: `Invitation ${status === 'accepted' ? 'accepted' : 'declined'} successfully`,
        severity: 'success'
      });
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Error responding to invitation:', err);
      
      setError(err.message || 'Failed to respond to invitation');
      setSnackbar({
        open: true,
        message: err.message || 'Failed to respond to invitation',
        severity: 'error'
      });
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  if (initialStatus !== 'pending') {
    return (
      <Alert severity="info">
        This invitation has already been {initialStatus}.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Respond to Invitation
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Choose your response:
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant={status === 'accepted' ? 'contained' : 'outlined'}
            color="success"
            onClick={() => setStatus('accepted')}
            fullWidth
          >
            Accept
          </Button>
          <Button
            variant={status === 'declined' ? 'contained' : 'outlined'}
            color="error"
            onClick={() => setStatus('declined')}
            fullWidth
          >
            Decline
          </Button>
        </Box>
        
        <TextField
          label="Response Message (optional)"
          value={responseMessage}
          onChange={(e) => setResponseMessage(e.target.value)}
          multiline
          rows={3}
          fullWidth
          placeholder={status === 'accepted' 
            ? "I'm looking forward to our meeting!" 
            : "Sorry, I'm unable to meet at this time."}
        />
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Invitation {status === 'accepted' ? 'accepted' : 'declined'} successfully!
        </Alert>
      )}
      
      <Button
        variant="contained"
        onClick={handleRespond}
        disabled={loading || success}
        fullWidth
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : `Submit Response`}
      </Button>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default SimpleInvitationHandler; 