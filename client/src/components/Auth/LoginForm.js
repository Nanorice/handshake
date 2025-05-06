import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Alert,
  Snackbar,
  Link
} from '@mui/material';
import { login } from '../../services/authService';
import { setUserData, getAuthToken, setAuthToken } from '../../utils/authUtils';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = () => {
  const navigate = useNavigate();
  const { refreshAuthState } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Separated login logic into its own function
  const attemptLogin = async () => {
    console.log('attemptLogin function called directly');
    setIsLoggingIn(true);

    if (!validateForm()) {
      setSnackbarMessage('Please fix the errors in the form');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      console.log('Form validation failed');
      setIsLoggingIn(false);
      return;
    }

    console.log('Form validation passed, proceeding with login attempt');
    
    try {
      console.log('Attempting login with:', { email: formData.email, passwordLength: formData.password.length });
      
      // Using actual form credentials
      const credentials = {
        email: formData.email,
        password: formData.password
      };
      
      console.log('Sending login request with credentials:', { email: credentials.email });
      const response = await login(credentials);
      console.log('Login response received:', response);
      
      // Detailed logging of response structure
      console.log('Response structure check:', {
        hasSuccess: !!response?.success,
        hasData: !!response?.data,
        hasUser: !!response?.data?.user,
        hasToken: !!response?.data?.token,
        tokenType: typeof response?.data?.token,
        tokenPreview: response?.data?.token ? response.data.token.substring(0, 10) + '...' : 'none'
      });
      
      // Check if response is successful
      if (!response || !response.success) {
        throw new Error(response?.message || 'Login failed');
      }
      
      // Make sure we have the expected data structure
      if (!response.data || !response.data.user || !response.data.token) {
        throw new Error('Invalid response format from server');
      }
      
      // The response structure is now standardized between mock and real API
      const userData = response.data.user;
      const token = response.data.token;
      
      console.log('Login successful, storing auth data:', { 
        userIdToStore: userData._id,
        tokenLength: token.length,
        tokenStartsWith: token.substring(0, 10)
      });
      
      // IMPORTANT: Store token FIRST before other data
      // Use the setAuthToken function for consistent handling
      const tokenSaved = setAuthToken(token);
      console.log('Token saved successfully:', tokenSaved);
      
      // Store the remaining auth data in localStorage
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('userId', userData._id);
      localStorage.setItem('isLoggedIn', 'true');
      
      // Double check all data is properly saved
      console.log('Auth data stored. Checking localStorage:', {
        token: getAuthToken()?.substring(0, 10) + '...',
        userData: !!localStorage.getItem('userData'),
        userId: localStorage.getItem('userId'),
        isLoggedIn: localStorage.getItem('isLoggedIn')
      });
      
      // Show success message
      setSnackbarMessage('Login successful! Redirecting to dashboard...');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      
      // Add a small delay to ensure localStorage is updated before navigation
      // and verify token one more time before redirect
      setTimeout(() => {
        // Final check of token before navigation
        const finalToken = getAuthToken();
        console.log('Final token check before redirect:', finalToken ? 
          `Token exists (${finalToken.substring(0, 10)}...)` : 'Token still missing!');
        
        if (!finalToken) {
          console.warn('Warning: Token is still not in localStorage before redirect!');
          // Try setting it one more time
          setAuthToken(token);
        }
        
        // Force refresh the auth context state to recognize we're logged in
        refreshAuthState(); 
        
        // Use react-router for navigation instead of refreshing the page
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Login error details:', error);
      
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Original handleSubmit for form submission
  const handleSubmit = (e) => {
    console.log('Form onSubmit event triggered');
    e.preventDefault(); // Prevent the default form submission behavior
    
    try {
      // Set isLoggingIn state first 
      setIsLoggingIn(true);
      
      // Direct call to attemptLogin
      attemptLogin();
    } catch (error) {
      console.error('Error in form submission:', error);
      setIsLoggingIn(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography align="center">
                Don't have an account?{' '}
                <Link href="/register" underline="hover">
                  Register here
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginForm; 