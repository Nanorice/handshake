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

const CoffeeChatCard = ({
  chat,
  onJoinMeeting,
  onCancel,
  onReschedule,
  onReview
}) => {
  if (!chat) {
    return null;
  }

  const {
    id,
    status = 'pending',
    scheduledAt,
    duration = 30,
    price = 0,
    professional = {},
    topics = [],
    meetingLink,
    hasReview = false
  } = chat;

  // Format date and time
  const scheduledTime = scheduledAt ? new Date(scheduledAt) : new Date();
  
  const formattedDate = scheduledTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = scheduledTime.toLocaleTimeString('en-US', {
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
            onClick={() => onCancel?.()}
          >
            Cancel
          </Button>
        );
      case 'confirmed':
        const now = new Date();
        // Show join button only 5 minutes before the scheduled time
        const showJoinButton = scheduledTime.getTime() - now.getTime() <= 5 * 60 * 1000;
        
        return (
          <>
            {showJoinButton && meetingLink ? (
              <Button 
                variant="contained"
                color="success" 
                size="small"
                onClick={() => onJoinMeeting?.()}
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
                  onClick={() => onCancel?.()}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained"
                  color="secondary" 
                  size="small"
                  onClick={() => onReschedule?.()}
                >
                  Reschedule
                </Button>
              </>
            )}
          </>
        );
      case 'completed':
        return !hasReview ? (
          <Button 
            variant="contained"
            color="primary" 
            size="small"
            onClick={() => onReview?.()}
          >
            Leave Review
          </Button>
        ) : (
          <Chip 
            label="Reviewed" 
            color="success"
            size="small"
          />
        );
      case 'cancelled':
        return (
          <Chip 
            label="Cancelled" 
            color="error"
            size="small"
          />
        );
      default:
        return null;
    }
  };

  const professionalName = professional?.name || 
                           `${professional?.firstName || ''} ${professional?.lastName || ''}`.trim() || 
                           'Professional';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2, flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={professional?.profileImage} 
              alt={professionalName} 
            />
            <Box>
              <Typography variant="h6">
                Coffee Chat with {professionalName.split(' ')[0]}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {professional?.title || professional?.position || ''} 
                {professional?.company ? ` • ${professional.company}` : ''}
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
        
        {topics && topics.length > 0 && (
          <>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Discussion Topics
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {topics.map((topic, index) => (
                <Chip key={index} label={topic} size="small" />
              ))}
            </Box>
          </>
        )}
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Typography variant="h6" color="primary" fontWeight={600}>
          ${typeof price === 'number' ? price.toFixed(2) : '0.00'}
        </Typography>
        <Box>
          {renderActionButtons()}
        </Box>
      </CardActions>
    </Card>
  );
};

export default CoffeeChatCard; 