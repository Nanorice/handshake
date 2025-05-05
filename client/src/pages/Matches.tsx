import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Box,
  CircularProgress,
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);

interface Professional {
  _id: string;
  industry: string;
  seniority: string;
  expertise: string[];
  hourlyRate: number;
  bio: string;
  isAnonymous: boolean;
}

const Matches: React.FC = () => {
  const [preferences, setPreferences] = useState({
    industry: '',
    seniority: '',
    budget: '',
    topics: '',
  });
  const [matches, setMatches] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/matches', {
        ...preferences,
        budget: parseFloat(preferences.budget),
        topics: preferences.topics.split(',').map(topic => topic.trim()),
      });
      setMatches(response.data);
    } catch (err) {
      setError('Failed to find matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChat = async (professionalId: string) => {
    try {
      const response = await axios.post('/api/coffee-chats', {
        professionalId,
        duration: 30, // Default 30-minute session
        scheduledTime: new Date(), // This should be replaced with a proper date picker
        preferences: {
          industry: preferences.industry,
          seniority: preferences.seniority,
          topics: preferences.topics.split(',').map(topic => topic.trim()),
        },
      });

      const stripe = await stripePromise;
      if (stripe) {
        await stripe.confirmCardPayment(response.data.clientSecret);
      }
    } catch (err) {
      setError('Failed to schedule chat. Please try again.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Find Your Perfect Match
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Industry"
                value={preferences.industry}
                onChange={(e) => setPreferences({ ...preferences, industry: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Seniority Level"
                value={preferences.seniority}
                onChange={(e) => setPreferences({ ...preferences, seniority: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget ($/hour)"
                type="number"
                value={preferences.budget}
                onChange={(e) => setPreferences({ ...preferences, budget: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Topics (comma-separated)"
                value={preferences.topics}
                onChange={(e) => setPreferences({ ...preferences, topics: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Find Matches'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={3}>
        {matches.map((professional) => (
          <Grid item xs={12} sm={6} md={4} key={professional._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {professional.isAnonymous ? 'Anonymous Professional' : 'Professional'}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {professional.industry} • {professional.seniority}
                </Typography>
                <Typography variant="body2" paragraph>
                  {professional.bio}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {professional.expertise.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
                <Typography variant="h6" color="primary">
                  ${professional.hourlyRate}/hour
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleScheduleChat(professional._id)}
                >
                  Schedule Chat
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Matches; 