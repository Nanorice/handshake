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
import { setUserData, getAuthToken } from '../../utils/authUtils';
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

  const attemptLogin = async () => {
    if (!validateForm()) return;

    setIsLoggingIn(true);
    setErrors({});

    try {
      const response = await login(formData);
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data;

        if (!token || !userData || !userData._id) {
          console.error('Login response missing token, user data, or user ID', response.data);
          setSnackbarMessage('Login failed: Invalid server response.');
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
          setIsLoggingIn(false);
          return;
        }
        
        console.log('Login successful, preparing to store auth data:', { 
          userIdToStore: userData._id,
          tokenLength: token.length,
          tokenStartsWith: token.substring(0, 10)
        });

        // Use the centralized setUserData utility
        setUserData({ user: userData, token });
        
        console.log('Auth data stored via setUserData. Checking localStorage:', {
          token: getAuthToken()?.substring(0, 10) + '...',
          userData: !!localStorage.getItem('userData'),
          userId: localStorage.getItem('userId'),
          isLoggedIn: localStorage.getItem('isLoggedIn')
        });
        
        setSnackbarMessage('Login successful! Redirecting to dashboard...');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        
        setTimeout(() => {
          refreshAuthState(); 
          navigate('/dashboard');
        }, 1000);
        
      } else {
        console.error('Login failed:', response.message || 'Unknown error');
        setSnackbarMessage(response.message || 'Login failed. Please check your credentials and try again.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error('Login attempt error:', error);
      setSnackbarMessage(error.message || 'An unexpected error occurred during login.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  // Check if already authenticated
  useEffect(() => {
    if (getAuthToken()) {
      console.log('User already authenticated, redirecting to dashboard.');
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <Paper 
      elevation={4} 
      sx={{
        padding: { xs: 3, md: 5 },
        maxWidth: 480,
        width: '100%',
        margin: 'auto',
        mt: { xs: 4, md: 8 },
        borderRadius: 2,
        boxShadow: '0px 10px 30px -5px rgba(0,0,0,0.1)'
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold">
        Sign In
      </Typography>
      <Typography variant="body2" color="textSecondary" align="center" mb={4}>
        Welcome back! Please enter your credentials.
      </Typography>
      <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); attemptLogin(); }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sx={{ textAlign: 'right' }}>
            <Link href="#" variant="body2">
              Forgot password?
            </Link>
          </Grid>
          <Grid item xs={12}>
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              color="primary" 
              disabled={isLoggingIn}
              size="large"
              sx={{ 
                py: 1.5,
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              {isLoggingIn ? 'Signing In...' : 'Sign In'}
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Typography variant="body2" align="center" sx={{ mt: 4 }}>
        Don't have an account? <Link href="/register" fontWeight="bold">Sign Up</Link>
      </Typography>
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default LoginForm; 