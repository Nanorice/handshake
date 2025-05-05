import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Stack,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import VideocamIcon from '@mui/icons-material/Videocam';

// A simplified version of the CoffeeChatCard component
const CoffeeChatCard = ({
  coffeeChat,
  onJoinMeeting,
  onCancel,
  onReschedule,
  onLeaveReview
}) => {
  const {
    id,
    status,
    scheduledTime,
    duration,
    price,
    professional,
    preferences,
    zoomLink
  } = coffeeChat;

  // Format date and time
  const formattedDate = new Date(scheduledTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = new Date(scheduledTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Determine which action buttons to show based on status
  const renderActionButtons = () => {
    switch(status) {
      case 'pending':
        return (
          <Button 
            variant="contained"
            color="error" 
            size="small"
            onClick={() => onCancel?.(id)}
          >
            Cancel
          </Button>
        );
      case 'confirmed':
        const meetingTime = new Date(scheduledTime);
        const now = new Date();
        // Show join button only 5 minutes before the scheduled time
        const showJoinButton = meetingTime.getTime() - now.getTime() <= 5 * 60 * 1000;
        
        return (
          <>
            {showJoinButton && zoomLink ? (
              <Button 
                variant="contained"
                color="success" 
                size="small"
                onClick={() => onJoinMeeting?.(zoomLink)}
                startIcon={<VideocamIcon />}
              >
                Join Meeting
              </Button>
            ) : (
              <>
                <Button 
                  variant="contained"
                  color="error" 
                  size="small"
                  onClick={() => onCancel?.(id)}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained"
                  color="secondary" 
                  size="small"
                  onClick={() => onReschedule?.(id)}
                >
                  Reschedule
                </Button>
              </>
            )}
          </>
        );
      case 'completed':
        return (
          <Button 
            variant="contained"
            color="primary" 
            size="small"
            onClick={() => onLeaveReview?.(id)}
          >
            Leave Review
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={professional.profilePicture} 
              alt={`${professional.firstName} ${professional.lastName}`} 
            />
            <Box>
              <Typography variant="h6">
                Coffee Chat with {professional.firstName}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {professional.seniority} • {professional.industry}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={status.charAt(0).toUpperCase() + status.slice(1)} 
            color={
              status === 'confirmed' ? 'primary' : 
              status === 'completed' ? 'success' : 
              status === 'pending' ? 'warning' : 
              'error'
            }
            size="small"
          />
        </Box>

        <Divider sx={{ my: 1 }} />
        
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2">
              {formattedDate}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2">
              {formattedTime} ({duration} min)
            </Typography>
          </Box>
        </Stack>
        
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Discussion Topics
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {preferences.topics.map((topic) => (
            <Chip key={topic} label={topic} size="small" />
          ))}
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Typography variant="h6" color="primary" fontWeight={600}>
          ${price.toFixed(2)}
        </Typography>
        <Box>
          {renderActionButtons()}
        </Box>
      </CardActions>
    </Card>
  );
};

export default CoffeeChatCard; 