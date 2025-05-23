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
  Avatar,
  Tooltip
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import VideocamIcon from '@mui/icons-material/Videocam';
import ChatIcon from '@mui/icons-material/Chat';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

const CoffeeChatCard = ({
  chat,
  onJoinMeeting,
  onCancel,
  onReschedule,
  onReview,
  onOpenChat,
  onUnlockChat,
  isInvitationBased = false
}) => {
  if (!chat) {
    return null;
  }

  const {
    // id not used but kept for future use
    status = 'pending',
    scheduledAt,
    duration = 30,
    // price not used but kept for future reference
    professional = {},
    topics = [],
    meetingLink,
    hasReview = false,
    chatUnlocked = false,
    invitationId = null
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

  // Determine if chat is in the past
  const isPastChat = new Date() > scheduledTime;

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
                onClick={() => onJoinMeeting?.(meetingLink)}
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
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!hasReview && (
              <Button 
                variant="contained"
                color="primary" 
                size="small"
                onClick={() => onReview?.()}
              >
                Leave Review
              </Button>
            )}
            {isInvitationBased && invitationId && (
              chatUnlocked ? (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<ChatIcon />}
                  onClick={() => onOpenChat?.(invitationId)}
                >
                  Open Chat
                </Button>
              ) : (
                <Tooltip title="Unlock chat to continue communication">
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    startIcon={<LockIcon />}
                    onClick={() => onUnlockChat?.(invitationId)}
                  >
                    Unlock Chat
                  </Button>
                </Tooltip>
              )
            )}
            {hasReview && !isInvitationBased && (
              <Chip 
                label="Reviewed" 
                color="success"
                size="small"
              />
            )}
          </Box>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isInvitationBased && (
              <Tooltip title="Invitation-based coffee chat">
                <Chip 
                  label="Invitation" 
                  color="primary" 
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            )}
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

        {isInvitationBased && chatUnlocked && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <LockOpenIcon fontSize="small" color="success" sx={{ mr: 1 }} />
            <Typography variant="body2" color="success.main">
              Chat unlocked - continue messaging after the meeting
            </Typography>
          </Box>
        )}
      </CardContent>
      <CardActions sx={{ px: 2, py: 1, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
        {renderActionButtons()}
      </CardActions>
    </Card>
  );
};

export default CoffeeChatCard; 