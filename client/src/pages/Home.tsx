import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Handshake
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          Connect with professionals for meaningful coffee chats
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            component={Link}
            to="/matches"
            variant="contained"
            color="primary"
            size="large"
            sx={{ mr: 2 }}
          >
            Find Matches
          </Button>
          <Button
            component={Link}
            to="/profile"
            variant="outlined"
            color="primary"
            size="large"
          >
            Create Profile
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Home; 