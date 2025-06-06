import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { 
  Fab, 
  Badge, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { 
  Message as MessageIcon, 
  Close as CloseIcon 
} from '@mui/icons-material';

const SimpleChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Debug logging
  console.log('[SimpleChatBubble] Component rendering...', { user: !!user, isOpen });

  // Don't render if user is not authenticated
  if (!user) {
    console.log('[SimpleChatBubble] No user found, not rendering');
    return null;
  }

  console.log('[SimpleChatBubble] User found, rendering chat bubble');

  const handleOpenFullChat = () => {
    navigate('/messages');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={() => setIsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          width: 60,
          height: 60,
        }}
      >
        <Badge 
          badgeContent={0} 
          color="error"
          overlap="circular"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MessageIcon sx={{ fontSize: 28 }} />
        </Badge>
      </Fab>

      {/* Simple Dialog */}
      <Dialog 
        open={isOpen} 
        onClose={() => setIsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '500px',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Messages</Typography>
            <IconButton 
              onClick={() => setIsOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            py={4}
            gap={2}
          >
            <MessageIcon 
              sx={{ 
                fontSize: 64, 
                color: 'text.secondary',
                opacity: 0.5 
              }} 
            />
            <Typography variant="h6" color="text.secondary">
              Quick Chat Preview
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              This is a simplified chat bubble. Click below to open the full messaging experience with all your conversations.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setIsOpen(false)} 
            color="inherit"
          >
            Close
          </Button>
          <Button 
            onClick={handleOpenFullChat}
            variant="contained"
            color="primary"
            size="large"
            fullWidth
          >
            Open Full Messages
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SimpleChatBubble; 