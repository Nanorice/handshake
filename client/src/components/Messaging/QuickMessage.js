import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  IconButton,
  Popover,
  useTheme,
  useMediaQuery 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const QuickMessage = ({ threadId, onSendMessage, darkMode }) => {
  const [message, setMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Call parent handler
    if (onSendMessage) {
      onSendMessage(message.trim());
    }
    
    // Clear input
    setMessage('');
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji.native);
    setAnchorEl(null);
  };

  const handleOpenEmojiPicker = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseEmojiPicker = () => {
    setAnchorEl(null);
  };

  const openFileUpload = () => {
    // Placeholder for file upload functionality
    alert('File upload functionality will be implemented soon!');
  };
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        mb: 2, 
        bgcolor: darkMode ? 'background.paper' : 'background.default',
        borderRadius: 2
      }}
    >
      <Typography variant="h6" gutterBottom>
        Quick Message
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton size="small" onClick={handleOpenEmojiPicker} sx={{ mr: 1 }}>
          <InsertEmoticonIcon />
        </IconButton>
        
        <IconButton size="small" onClick={openFileUpload} sx={{ mr: 1 }}>
          <AttachFileIcon />
        </IconButton>
        
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          multiline
          maxRows={4}
          variant="outlined"
          size="small"
          sx={{ mr: 1 }}
        />
        <Button 
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={handleSendMessage}
          disabled={!message.trim()}
          sx={{ 
            height: isMobile ? '40px' : '45px',
            minWidth: isMobile ? '64px' : '80px'
          }}
        >
          {!isMobile && 'Send'}
        </Button>
      </Box>

      {/* Emoji Picker */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseEmojiPicker}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Picker 
          data={data} 
          onEmojiSelect={handleEmojiClick}
          theme={darkMode ? 'dark' : 'light'} 
          set="native"
        />
      </Popover>
    </Paper>
  );
};

export default QuickMessage; 