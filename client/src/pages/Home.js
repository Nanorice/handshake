import React, { useState, useEffect, useContext } from 'react';
import { Container, Typography, Button, Box, Grid, Paper, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../contexts/ThemeContext';

const Home = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  const theme = useTheme();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  // Define theme-aware feature block styles
  const featureBlockStyles = {
    first: {
      bgcolor: darkMode ? 'primary.dark' : 'primary.light',
      color: darkMode ? 'white' : 'text.primary'
    },
    second: {
      bgcolor: darkMode ? 'secondary.dark' : 'secondary.light',
      color: darkMode ? 'white' : 'text.primary'
    },
    third: {
      bgcolor: darkMode ? 'success.dark' : 'success.light',
      color: darkMode ? 'white' : 'text.primary'
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h2" component="h1" gutterBottom>
              Welcome to Handshake
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Connect with professionals for meaningful coffee chats and career guidance.
            </Typography>
            <Box sx={{ mt: 4 }}>
              {isLoggedIn ? (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={() => navigate('/professionals')}
                    sx={{ mr: 2, py: 1.5, px: 4, fontSize: '1.1rem', fontWeight: 'bold' }}
                  >
                    Find Professionals
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="large"
                    onClick={() => navigate('/coffee-chats')}
                  >
                    View Coffee Chats
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    color="warning"
                    size="large"
                    onClick={() => navigate('/register')}
                    sx={{ mr: 2, py: 1.5, px: 4, fontSize: '1.1rem', fontWeight: 'bold' }}
                  >
                    Create an Account
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{ py: 1.5, px: 4, fontSize: '1.1rem', fontWeight: 'bold' }}
                  >
                    Login
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper 
                elevation={darkMode ? 4 : 1}
                sx={{ 
                  p: 3, 
                  ...featureBlockStyles.first
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Find Your Perfect Match
                </Typography>
                <Typography variant="body1">
                  Browse through our curated list of professionals and find the perfect mentor for your career goals.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/professionals')}
                >
                  Browse Professionals
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper 
                elevation={darkMode ? 4 : 1}
                sx={{ 
                  p: 3, 
                  ...featureBlockStyles.second
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Schedule Coffee Chats
                </Typography>
                <Typography variant="body1">
                  Book 1-on-1 coffee chats with industry experts and get personalized career advice.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper 
                elevation={darkMode ? 4 : 1}
                sx={{ 
                  p: 3, 
                  ...featureBlockStyles.third
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Build Your Network
                </Typography>
                <Typography variant="body1">
                  Expand your professional network and create meaningful connections in your industry.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 