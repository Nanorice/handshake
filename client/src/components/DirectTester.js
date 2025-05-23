import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert,
  Divider,
  Grid
} from '@mui/material';
import { testRespondToInvitation } from '../services/invitationService';
import { getAuthToken } from '../utils/authUtils';
import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';

/**
 * A simple component to directly test invitation responses
 */
const DirectTester = () => {
  const [invitationId, setInvitationId] = useState('68224d2ab99fbeb0ae2d9130');
  const [status, setStatus] = useState('accepted');
  const [loading, setLoading] = useState(false);
  const [directLoading, setDirectLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testEmail, setTestEmail] = useState('prof.test@gmail.com');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Check if user is authenticated
  useEffect(() => {
    const token = getAuthToken();
    setIsAuthenticated(!!token);
  }, []);
  
  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    // Check authentication before making API call
    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated. Please log in again.');
      setLoading(false);
      return;
    }
    
    try {
      const response = await testRespondToInvitation(invitationId, status);
      setResult(response);
    } catch (err) {
      console.error('Direct test error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle test login
  const handleTestLogin = async () => {
    setLoginLoading(true);
    setError(null);
    
    try {
      const baseUrl = getApiBaseUrl();
      const response = await axios.post(`${baseUrl}/invitations/test-login`, {
        email: testEmail
      });
      
      if (response.data.success) {
        // Save auth data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        
        // Update state
        setIsAuthenticated(true);
        setResult({
          message: `Test login successful as ${response.data.user.email}`,
          user: response.data.user
        });
        
        console.log('Test login successful, token set in localStorage');
      }
    } catch (err) {
      console.error('Test login error:', err);
      setError(`Login error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoginLoading(false);
    }
  };
  
  // Handle direct database update
  const handleDirectUpdate = async () => {
    setDirectLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const baseUrl = getApiBaseUrl();
      console.log('Making direct-update request to bypass all business logic');
      
      const response = await axios.post(`${baseUrl}/invitations/direct-update`, {
        invitationId,
        status
      });
      
      setResult({
        message: 'Direct database update successful',
        details: response.data
      });
    } catch (err) {
      console.error('Direct update error:', err);
      setError(`Direct update error: ${err.response?.data?.message || err.message}`);
    } finally {
      setDirectLoading(false);
    }
  };
  
  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Direct Invitation Tester
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This tool bypasses the normal invitation flow and directly updates an invitation's status.
      </Typography>
      
      {!isAuthenticated && (
        <Alert severity="error" sx={{ mb: 2 }}>
          You are not authenticated. Please use the test login below.
        </Alert>
      )}
      
      {/* Test Login Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Login
        </Typography>
        
        <TextField
          label="Test Email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          fullWidth
          margin="normal"
          helperText="Try prof.test@gmail.com or seeker.test@gmail.com"
        />
        
        <Button 
          variant="contained" 
          onClick={handleTestLogin} 
          disabled={loginLoading}
          color="secondary"
          fullWidth
          sx={{ mt: 1 }}
        >
          {loginLoading ? <CircularProgress size={24} /> : 'Test Login'}
        </Button>
      </Box>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Invitation Test Section */}
      <Typography variant="h6" gutterBottom>
        Invitation Response Test
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Invitation ID"
          value={invitationId}
          onChange={(e) => setInvitationId(e.target.value)}
          fullWidth
          margin="normal"
        />
        
        <TextField
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          helperText="Use 'accepted' or 'declined'"
          fullWidth
          margin="normal"
        />
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Button 
            variant="contained" 
            onClick={handleTest} 
            disabled={loading || !isAuthenticated}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Test API Response'}
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button 
            variant="contained" 
            onClick={handleDirectUpdate} 
            disabled={directLoading}
            color="warning"
            fullWidth
          >
            {directLoading ? <CircularProgress size={24} /> : 'Direct DB Update'}
          </Button>
        </Grid>
      </Grid>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
        The Direct DB Update option bypasses all business logic and directly updates the MongoDB document.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {result && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {result.message || 'Operation successful'}
          </Alert>
          
          <Typography variant="subtitle2">Response:</Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.100', overflow: 'auto' }}>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

export default DirectTester; 