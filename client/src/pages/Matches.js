import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Box,
  CircularProgress,
  Button,
  Tabs,
  Tab,
  Avatar,
  Divider,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Breadcrumbs,
  Link as MuiLink,
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Check as CheckIcon, 
  Close as CloseIcon, 
  Schedule as ScheduleIcon, 
  MoreVert as MoreVertIcon,
  Chat as ChatIcon, 
  CalendarMonth as CalendarIcon,
  VideoCall as VideoCallIcon,
  Email as EmailIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { getUserMatches } from '../services/professionalService';

const Matches = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'message', 'schedule', 'cancel'
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      setSnackbar({
        open: true,
        message: 'Please log in to view your matches',
        severity: 'warning'
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }
    
    loadMatches();
  }, [navigate]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await getUserMatches();
      setMatches(data.matches);
      setError(null);
    } catch (error) {
      console.error('Error loading matches:', error);
      setError('Failed to load your matches. Please try again later.');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event, matchId) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveMatchId(matchId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveMatchId(null);
  };

  const handleActionClick = (type, match) => {
    setSelectedMatch(match);
    setDialogType(type);
    setOpenDialog(true);
    handleMenuClose();
    
    if (type === 'message') {
      setMessageText('');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMatch(null);
    setMessageText('');
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    // In a real app, you would call an API to send the message
    setSnackbar({
      open: true,
      message: 'Message sent successfully!',
      severity: 'success'
    });
    
    handleCloseDialog();
  };

  const handleScheduleMeeting = () => {
    // In a real app, you would handle scheduling logic
    setSnackbar({
      open: true,
      message: 'Meeting scheduled successfully!',
      severity: 'success'
    });
    
    handleCloseDialog();
  };

  const handleCancelMatch = () => {
    // In a real app, you would call an API to cancel the match
    setSnackbar({
      open: true,
      message: 'Match request canceled',
      severity: 'info'
    });
    
    handleCloseDialog();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const filteredMatches = tabValue === 0 
    ? matches 
    : matches.filter(match => 
        tabValue === 1 
          ? match.status === 'pending' 
          : match.status === 'accepted'
      );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" color="inherit">
            Home
          </MuiLink>
          <Typography color="text.primary">My Matches</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Your Coffee Chat Matches
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your match requests and coffee chat sessions with professionals.
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ '& .MuiTab-root': { fontWeight: 500 } }}
        >
          <Tab label="All Matches" />
          <Tab label="Pending" />
          <Tab label="Accepted" />
        </Tabs>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#FEF2F2', color: '#B91C1C' }}>
          <Typography variant="h6">{error}</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={loadMatches}
          >
            Try Again
          </Button>
        </Paper>
      ) : filteredMatches.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {tabValue === 0 
              ? "You don't have any matches yet" 
              : tabValue === 1 
                ? "You don't have any pending match requests" 
                : "You don't have any accepted matches"}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {tabValue === 0 
              ? "Connect with professionals to start meaningful conversations" 
              : tabValue === 1 
                ? "Your pending match requests will appear here" 
                : "Once professionals accept your requests, they'll appear here"}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/professionals')}
          >
            Find Professionals
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredMatches.map((match) => (
            <Grid item xs={12} sm={6} md={4} key={match.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {/* Status Indicator */}
                <Chip 
                  label={match.status === 'pending' ? 'Pending' : 'Accepted'} 
                  color={match.status === 'pending' ? 'warning' : 'success'} 
                  size="small"
                  icon={match.status === 'pending' ? <ScheduleIcon /> : <CheckIcon />}
                  sx={{ 
                    position: 'absolute', 
                    top: 12, 
                    right: 12,
                    fontWeight: 500
                  }}
                />
                
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    src={match.professional.profilePicture} 
                    alt={`${match.professional.firstName} ${match.professional.lastName}`}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6" component="h2">
                      {match.professional.firstName} {match.professional.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {match.professional.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {match.professional.company}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider />
                
                <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Expertise:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {match.professional.expertise.map((expertise, index) => (
                      <Chip 
                        key={index} 
                        label={expertise} 
                        size="small" 
                      />
                    ))}
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Requested:</strong> {new Date(match.requestedAt).toLocaleDateString()}
                  </Typography>
                  
                  {match.status === 'accepted' && match.scheduledAt && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Scheduled:</strong> {new Date(match.scheduledAt).toLocaleString()}
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                  {match.status === 'pending' ? (
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => handleActionClick('cancel', match)}
                    >
                      Cancel Request
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<CalendarIcon />}
                      onClick={() => handleActionClick('schedule', match)}
                    >
                      Schedule
                    </Button>
                  )}
                  
                  <IconButton 
                    aria-label="more options" 
                    onClick={(e) => handleMenuOpen(e, match.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {activeMatchId && (
          <>
            <MenuItem onClick={() => handleActionClick('message', matches.find(m => m.id === activeMatchId))}>
              <ListItemIcon>
                <ChatIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Send Message</ListItemText>
            </MenuItem>
            
            {matches.find(m => m.id === activeMatchId)?.status === 'accepted' && (
              <MenuItem onClick={() => handleActionClick('schedule', matches.find(m => m.id === activeMatchId))}>
                <ListItemIcon>
                  <CalendarIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Schedule Meeting</ListItemText>
              </MenuItem>
            )}
            
            {matches.find(m => m.id === activeMatchId)?.status === 'accepted' && (
              <MenuItem onClick={() => window.open('https://zoom.us/start/videomeeting', '_blank')}>
                <ListItemIcon>
                  <VideoCallIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Start Zoom Meeting</ListItemText>
              </MenuItem>
            )}
            
            <MenuItem onClick={() => window.open(`mailto:${matches.find(m => m.id === activeMatchId)?.professional.email}`)}>
              <ListItemIcon>
                <EmailIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Email Professional</ListItemText>
            </MenuItem>
            
            <Divider />
            
            <MenuItem 
              onClick={() => handleActionClick('cancel', matches.find(m => m.id === activeMatchId))}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon sx={{ color: 'error.main' }}>
                <CancelIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                {matches.find(m => m.id === activeMatchId)?.status === 'pending' 
                  ? 'Cancel Request' 
                  : 'Remove Match'}
              </ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Dialogs */}
      <Dialog open={openDialog && dialogType === 'message'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Send a Message</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            {selectedMatch && (
              <>
                <Avatar 
                  src={selectedMatch.professional.profilePicture} 
                  alt={`${selectedMatch.professional.firstName} ${selectedMatch.professional.lastName}`}
                  sx={{ width: 40, height: 40, mr: 2 }}
                />
                <Typography>
                  {selectedMatch.professional.firstName} {selectedMatch.professional.lastName}
                </Typography>
              </>
            )}
          </Box>
          
          <TextField
            autoFocus
            label="Message"
            fullWidth
            multiline
            rows={4}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage} 
            color="primary" 
            variant="contained" 
            disabled={!messageText.trim()}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={openDialog && dialogType === 'schedule'} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule a Meeting</DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            Choose a time that works for both of you. The professional will receive a notification of your preferred time.
          </DialogContentText>
          
          {selectedMatch && (
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={selectedMatch.professional.profilePicture} 
                alt={`${selectedMatch.professional.firstName} ${selectedMatch.professional.lastName}`}
                sx={{ width: 40, height: 40, mr: 2 }}
              />
              <Box>
                <Typography>
                  {selectedMatch.professional.firstName} {selectedMatch.professional.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedMatch.professional.title}
                </Typography>
              </Box>
            </Box>
          )}
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Available Time Slots:
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {selectedMatch && selectedMatch.professional.availability.map((slot, index) => (
              <Grid item xs={12} key={index}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1">
                    {slot.day}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {slot.timeSlots.map((time, i) => (
                      <Chip
                        key={i}
                        label={time}
                        clickable
                        color="primary"
                        variant="outlined"
                        onClick={() => {
                          // In a real app, you would handle time selection
                          console.log(`Selected time: ${slot.day} at ${time}`);
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          <TextField
            label="Add a note (optional)"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            placeholder="Any special topics you'd like to discuss?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleScheduleMeeting} color="primary" variant="contained">
            Confirm Schedule
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={openDialog && dialogType === 'cancel'} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedMatch?.status === 'pending' ? 'Cancel Match Request?' : 'Remove Match?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedMatch?.status === 'pending' 
              ? 'Are you sure you want to cancel your match request with '
              : 'Are you sure you want to remove your match with '}
            {selectedMatch?.professional.firstName} {selectedMatch?.professional.lastName}? 
            {selectedMatch?.status === 'pending' 
              ? ' The professional will not be notified.'
              : ' This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            No, Keep It
          </Button>
          <Button onClick={handleCancelMatch} color="error" variant="contained">
            Yes, {selectedMatch?.status === 'pending' ? 'Cancel Request' : 'Remove Match'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Matches; 