import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Stack,
  IconButton
} from '@mui/material';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import Avatar from '../UI/Avatar';
import Button from '../UI/Button';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import VideocamIcon from '@mui/icons-material/Videocam';

// Status types must match the backend enum
type CoffeeChatStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface CoffeeChatCardProps {
  coffeeChat: {
    id: string;
    status: CoffeeChatStatus;
    scheduledTime: string;
    duration: number;
    price: number;
    professional: {
      id: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
      industry: string;
      seniority: string;
    };
    preferences: {
      topics: string[];
    };
    zoomLink?: string;
  };
  onJoinMeeting?: (link: string) => void;
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onLeaveReview?: (id: string) => void;
}

const CoffeeChatCard: React.FC<CoffeeChatCardProps> = ({
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

  // Define status badge properties
  const getStatusBadge = () => {
    switch(status) {
      case 'pending':
        return { variant: 'warning' as const, label: 'Pending' };
      case 'confirmed':
        return { variant: 'primary' as const, label: 'Confirmed' };
      case 'completed':
        return { variant: 'success' as const, label: 'Completed' };
      case 'cancelled':
        return { variant: 'error' as const, label: 'Cancelled' };
      default:
        return { variant: 'info' as const, label: 'Unknown' };
    }
  };

  const statusBadge = getStatusBadge();

  // Determine which action buttons to show based on status
  const renderActionButtons = () => {
    switch(status) {
      case 'pending':
        return (
          <>
            <Button 
              colorVariant="error" 
              size="small"
              onClick={() => onCancel?.(id)}
            >
              Cancel
            </Button>
          </>
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
                colorVariant="success" 
                size="small"
                onClick={() => onJoinMeeting?.(zoomLink)}
                startIcon={<VideocamIcon />}
              >
                Join Meeting
              </Button>
            ) : (
              <>
                <Button 
                  colorVariant="error" 
                  size="small"
                  onClick={() => onCancel?.(id)}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button 
                  colorVariant="secondary" 
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
            colorVariant="primary" 
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
    <Card 
      elevation={2}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={professional.profilePicture} 
            alt={`${professional.firstName} ${professional.lastName}`} 
            size="md"
          />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Coffee Chat with {professional.firstName}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {professional.seniority} • {professional.industry}
            </Typography>
          </Box>
        </Box>
        <Badge variant={statusBadge.variant} pill>
          {statusBadge.label}
        </Badge>
      </Box>

      <Divider />
      
      <Box sx={{ p: 2, flexGrow: 1 }}>
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
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {preferences.topics.map((topic) => (
            <Badge key={topic} variant="primary" size="small">
              {topic}
            </Badge>
          ))}
        </Stack>
      </Box>
      
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" color="primary" fontWeight={600}>
          ${price.toFixed(2)}
        </Typography>
        <Box>
          {renderActionButtons()}
        </Box>
      </Box>
    </Card>
  );
};

export default CoffeeChatCard; 