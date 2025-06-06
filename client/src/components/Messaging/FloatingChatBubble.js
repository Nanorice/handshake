import React from 'react';
import { Badge, IconButton, Box } from '@mui/material';
import { Chat, ChatBubbleOutline } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledChatBubble = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 1300,
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const ChatButton = styled(IconButton)(({ theme }) => ({
  width: '48px',
  height: '48px',
  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#ffffff',
  color: theme.palette.primary.main,
  border: `2px solid ${theme.palette.primary.main}`,
  boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#3d3d3d' : '#f5f5f5',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  }
}));

const FloatingChatBubble = ({ 
  onClick, 
  unreadCount = 0, 
  isOpen = false 
}) => {
  return (
    <StyledChatBubble>
      <Badge 
        badgeContent={unreadCount > 0 ? unreadCount : null}
        color="error"
        overlap="circular"
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.75rem',
            height: '18px',
            minWidth: '18px',
            border: '2px solid white',
          }
        }}
      >
        <ChatButton
          onClick={onClick}
          aria-label="Open chat"
          size="medium"
        >
          <ChatBubbleOutline sx={{ fontSize: '24px' }} />
        </ChatButton>
      </Badge>
    </StyledChatBubble>
  );
};

export default FloatingChatBubble; 