import React, { useState } from 'react';
import { Button, Snackbar, Alert, Box, Typography, Paper } from '@mui/material';
import { updateUserRole, getUserData, setAuthToken } from '../../utils/authUtils';

// Define API_URL with explicit port 5000 to match the server
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('UpdateRoleButton API_URL initialized as:', API_URL);

const UpdateRoleButton = () => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const user = getUserData();
  const currentRole = user?.role || 'unknown';
  const userEmail = user?.email || '';
  
  const handleUpdateRole = async () => {
    setLoading(true);
    
    try {
      // Try using the new endpoint that provides a new token
      if (userEmail) {
        try {
          console.log('Using token refresh endpoint to update role');
          
          // Create the full URL to the token refresh endpoint
          const tokenUrl = `${API_URL}/api/direct-update-role-and-token`;
          console.log('Making request to:', tokenUrl);
          
          const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              email: userEmail, 
              role: 'professional' 
            })
          });
          
          console.log('Token update response status:', response.status);
          const data = await response.json();
          console.log('Token update response data:', data);
          
          if (data.success && data.user && data.token) {
            // Update the user data in localStorage
            const currentUserData = getUserData();
            const updatedUserData = {
              ...currentUserData,
              role: 'professional'
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            
            // Save the new token
            setAuthToken(data.token);
            console.log('New token saved with updated role');
            
            setSnackbar({
              open: true,
              message: 'Your role has been updated to professional! Authentication token has been refreshed.',
              severity: 'success'
            });
            return;
          }
          
          // If token endpoint failed with an error, show it
          if (!data.success && data.error) {
            setSnackbar({
              open: true,
              message: typeof data.error === 'string' ? data.error : 'Failed to update role',
              severity: 'error'
            });
            return;
          }
        } catch (err) {
          console.error('Error using token refresh endpoint:', err);
          // Fall back to direct endpoint if token refresh fails
        }
      }
      
      // Try using the direct endpoint as fallback
      if (userEmail) {
        try {
          console.log('Using direct endpoint to update role');
          
          // Create the full URL to the direct endpoint
          const directUrl = `${API_URL}/api/direct-update-role`;
          console.log('Making request to:', directUrl);
          
          const response = await fetch(directUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              email: userEmail, 
              role: 'professional' 
            })
          });
          
          console.log('Direct update response status:', response.status);
          const data = await response.json();
          console.log('Direct update response data:', data);
          
          if (data.success && data.user) {
            // Update the user data in localStorage
            const currentUserData = getUserData();
            const updatedUserData = {
              ...currentUserData,
              role: 'professional'
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            
            setSnackbar({
              open: true,
              message: 'Your role has been updated, but you need to log out and log back in to access professional features.',
              severity: 'warning'
            });
            return;
          }
          
          // If direct endpoint failed with an error, show it
          if (!data.success && data.error) {
            setSnackbar({
              open: true,
              message: typeof data.error === 'string' ? data.error : 'Failed to update role',
              severity: 'error'
            });
            return;
          }
        } catch (err) {
          console.error('Error using direct endpoint:', err);
          // Fall back to debug endpoint if direct fails
        }
      }
      
      // Try using the debug endpoint as fallback
      if (userEmail) {
        try {
          console.log('Using debug endpoint to update role');
          
          // Create the full URL to the debug endpoint
          const debugUrl = `${API_URL}/api/debug/update-user-role`;
          console.log('Making request to:', debugUrl);
          
          const response = await fetch(debugUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              email: userEmail, 
              role: 'professional' 
            })
          });
          
          console.log('Debug update response status:', response.status);
          const data = await response.json();
          console.log('Debug update response data:', data);
          
          if (data.user) {
            // Update the user data in localStorage
            const currentUserData = getUserData();
            const updatedUserData = {
              ...currentUserData,
              role: 'professional'
            };
            localStorage.setItem('userData', JSON.stringify(updatedUserData));
            
            setSnackbar({
              open: true,
              message: 'Your role has been updated, but you need to log out and log back in to access professional features.',
              severity: 'warning'
            });
            return;
          }
        } catch (err) {
          console.error('Error using debug endpoint:', err);
        }
      }
      
      setSnackbar({
        open: true,
        message: 'Failed to update your role. Please try logging out and logging back in.',
        severity: 'error'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error updating role',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
  
  return (
    <>
      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Current User Info
        </Typography>
        <Typography variant="body2">
          <strong>Email:</strong> {userEmail || 'Not available'}
        </Typography>
        <Typography variant="body2">
          <strong>Role:</strong> {currentRole}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>ID:</strong> {user?._id || 'Not available'}
        </Typography>
      </Paper>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleUpdateRole}
        disabled={loading || currentRole === 'professional' || !userEmail}
        fullWidth
      >
        {loading ? 'Updating...' : currentRole === 'professional' ? 'Already Professional' : 'Change Role to Professional'}
      </Button>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        After updating your role, please refresh the page to access professional features.
      </Typography>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UpdateRoleButton; 