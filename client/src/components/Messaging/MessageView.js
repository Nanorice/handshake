import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  IconButton, 
  Paper, 
  Avatar,
  AppBar, 
  Toolbar, 
  useTheme,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  Send as SendIcon, 
  ArrowBack as ArrowBackIcon,
  Circle as CircleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useMessages } from './MessageProvider';

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Message item component
const MessageItem = ({ message, isOwnMessage }) => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  // Format date
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 2
      }}
    >
      {!isOwnMessage && (
        <Avatar
          sx={{ 
            width: 28, 
            height: 28, 
            mr: 1, 
            bgcolor: theme.palette.secondary.main,
            alignSelf: 'flex-end',
            mb: 0.5
          }}
        >
          {message.sender?.firstName?.charAt(0) || '?'}
        </Avatar>
      )}
      <Box
        sx={{
          maxWidth: '70%',
          backgroundColor: isOwnMessage 
            ? darkMode ? '#2563EB' : '#2563EB' // Primary blue from design guide
            : darkMode ? theme.palette.grey[800] : theme.palette.grey[200],
          color: isOwnMessage 
            ? 'white'
            : theme.palette.text.primary,
          borderRadius: 2,
          borderTopLeftRadius: !isOwnMessage ? 0 : 2,
          borderTopRightRadius: isOwnMessage ? 0 : 2,
          px: 2,
          py: 1,
          position: 'relative',
          opacity: message.pending ? 0.7 : 1
        }}
      >
        <Typography variant="body1">{message.content}</Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            textAlign: 'right',
            color: isOwnMessage 
              ? 'rgba(255, 255, 255, 0.7)' 
              : darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            mt: 0.5
          }}
        >
          {formatTime(message.createdAt)}
          {message.pending && ' • Sending...'}
        </Typography>
      </Box>
    </Box>
  );
};

const MessageView = ({ threadId, onBack, currentUserId, otherParticipant }) => {
  const { messages, loading, error, socketConnected, sendMessage, refreshMessages } = useMessages();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // This function runs when the component first mounts
  useEffect(() => {
    // Log currentUserId for debugging
    console.log('[MessageView] Component mounted with currentUserId:', currentUserId);
    
    // Log message format details when messages change
    if (messages?.length > 0) {
      const sampleMessage = messages[0];
      console.log('[MessageView] Sample message format:', {
        id: sampleMessage._id,
        sender: sampleMessage.sender,
        senderType: typeof sampleMessage.sender,
        threadId: sampleMessage.threadId || sampleMessage.thread,
        content: sampleMessage.content?.substring(0, 30)
      });
    }
  }, [currentUserId, messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    sendMessage(messageText);
  };

  const getParticipantName = () => {
    if (!otherParticipant) return 'Chat';
    return `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim();
  };

  const getParticipantAvatar = () => {
    const name = getParticipantName();
    return (
      <Avatar 
        sx={{ bgcolor: theme.palette.secondary.main }}
        src={otherParticipant?.profile?.profilePicture || null}
      >
        {getInitials(name)}
      </Avatar>
    );
  };

  // If no thread is selected
  if (!threadId) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          height: '100%',
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: darkMode ? theme.palette.background.paper : theme.palette.grey[100]
        }}
      >
        <Typography variant="h6" color="textSecondary">
          Select a conversation to start chatting.
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        backgroundColor: darkMode ? theme.palette.background.default : theme.palette.grey[50]
      }}
    >
      {/* Header */}
      <AppBar 
        position="static" 
        color="default" 
        elevation={1}
        sx={{ backgroundColor: darkMode ? theme.palette.background.paper : theme.palette.primary.main }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon sx={{ color: darkMode ? theme.palette.text.primary : theme.palette.common.white }} />
          </IconButton>
          
          {getParticipantAvatar()}
          
          <Typography 
            variant="h6" 
            sx={{ 
              ml: 2, 
              flexGrow: 1,
              color: darkMode ? theme.palette.text.primary : theme.palette.common.white 
            }}
          >
            {getParticipantName()}
          </Typography>
          
          {/* Connection status indicator */}
          <Chip
            size="small"
            icon={<CircleIcon fontSize="small" sx={{ color: socketConnected ? 'success.main' : 'error.main' }} />}
            label={socketConnected ? "Connected" : "Reconnecting..."}
            color={socketConnected ? "success" : "error"}
            variant="outlined"
            sx={{ 
              mr: 1,
              color: darkMode ? theme.palette.text.primary : theme.palette.common.white,
              borderColor: darkMode ? theme.palette.text.primary : theme.palette.common.white
            }}
          />
          
          {/* Refresh button */}
          <IconButton 
            onClick={refreshMessages} 
            disabled={loading}
            color="inherit"
            size="small"
            sx={{ color: darkMode ? theme.palette.text.primary : theme.palette.common.white }}
          >
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Messages container */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 2,
          backgroundColor: darkMode ? theme.palette.background.default : theme.palette.common.white,
          // Scrollbar styling
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: darkMode ? theme.palette.grey[800] : theme.palette.grey[200],
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: darkMode ? theme.palette.grey[600] : theme.palette.grey[400],
            borderRadius: '4px',
          }
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={40} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="textSecondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message) => {
            // Fix sender comparison logic with more detailed checks
            const isOwn = (() => {
              // Check if directly comparing IDs works
              if (message.sender === currentUserId) return true;
              
              // Check object format with _id property
              if (message.sender && message.sender._id === currentUserId) return true;
              
              // Check sender.id format (some APIs use id instead of _id)
              if (message.sender && message.sender.id === currentUserId) return true;
              
              // Additional logging for debugging
              console.log(`[MessageView] Message sender check: `, { 
                messageId: message._id,
                messageSender: typeof message.sender === 'object' ? message.sender : message.sender,
                currentUserId: currentUserId
              });
              
              return false;
            })();
            
            return (
              <MessageItem
                key={message._id}
                message={message}
                isOwnMessage={isOwn}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Message input */}
      <Box 
        component="form"
        onSubmit={handleSendMessage}
        sx={{ 
          p: 2, 
          backgroundColor: darkMode ? theme.palette.background.paper : theme.palette.grey[200], 
          borderTop: `1px solid ${darkMode ? theme.palette.divider : theme.palette.grey[300]}`,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={loading}
          sx={{ 
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              backgroundColor: darkMode ? theme.palette.grey[800] : theme.palette.common.white,
            },
          }}
        />
        <IconButton 
          type="submit" 
          color="primary" 
          disabled={!newMessage.trim() || loading}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default MessageView; 