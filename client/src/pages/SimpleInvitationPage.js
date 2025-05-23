import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Alert,
  Button
} from '@mui/material';
import SimpleInvitationHandler from '../components/Invitation/SimpleInvitationHandler';
import { getSimpleInvitation } from '../services/simpleInvitationService';

/**
 * A simplified page for viewing and responding to invitations
 * This page uses the new simplified invitation API with better error handling
 */
const SimpleInvitationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  
  useEffect(() => {
    const fetchInvitation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!id) {
          setError('No invitation ID provided');
          setLoading(false);
          return;
        }
        
        const result = await getSimpleInvitation(id);
        
        if (result.success && result.data?.invitation) {
          setInvitation(result.data.invitation);
        } else {
          setError('Failed to load invitation details');
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError(err.message || 'Failed to load invitation');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvitation();
  }, [id]);
  
  const handleResponseSuccess = () => {
    // Reload the invitation data after successful response
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Invitation Details
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : invitation ? (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Meeting Request
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  From
                </Typography>
                <Typography variant="body1">
                  {invitation.sender?.firstName} {invitation.sender?.lastName}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Topic
                </Typography>
                <Typography variant="body1">
                  {invitation.sessionDetails?.topic || 'Not specified'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Proposed Date
                </Typography>
                <Typography variant="body1">
                  {invitation.sessionDetails?.proposedDate 
                    ? new Date(invitation.sessionDetails.proposedDate).toLocaleString() 
                    : 'Not specified'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1">
                  {invitation.sessionDetails?.duration 
                    ? `${invitation.sessionDetails.duration} minutes` 
                    : 'Not specified'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Message
                </Typography>
                <Typography variant="body1">
                  {invitation.message || 'No message provided'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: invitation.status === 'accepted' ? 'success.main' : 
                         invitation.status === 'declined' ? 'error.main' : 
                         invitation.status === 'cancelled' ? 'text.secondary' : 
                         'primary.main'
                }}>
                  {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                </Typography>
              </Box>
            </Box>
            
            <SimpleInvitationHandler 
              invitationId={invitation._id}
              initialStatus={invitation.status}
              onSuccess={handleResponseSuccess}
              onError={(err) => setError(err.message)}
            />
          </Box>
        ) : (
          <Alert severity="warning">
            Invitation not found
          </Alert>
        )}
        
        <Button 
          variant="outlined"
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Container>
  );
};

export default SimpleInvitationPage; 