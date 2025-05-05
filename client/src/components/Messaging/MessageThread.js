import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Avatar, 
  CircularProgress,
  AppBar,
  Toolbar,
  useTheme,
  IconButton,
  ImageList,
  ImageListItem,
  Link,
  Card,
  CardMedia,
  Divider
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Description as FileIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { getCurrentUserId } from '../../utils/authUtils';
import { ThemeContext } from '../../contexts/ThemeContext';
import socketService from '../../services/socketService';
import MessageComposer from './MessageComposer';

// MessageAttachment component to display file attachments
const MessageAttachment = ({ attachment, isCurrentUser, darkMode }) => {
  const isImage = attachment.type?.startsWith('image/');
  
  if (isImage && attachment.url) {
    return (
      <Card 
        elevation={0} 
        sx={{ 
          maxWidth: 250, 
          mb: 1, 
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardMedia
          component="img"
          image={attachment.url}
          alt={attachment.name || 'Image attachment'}
          sx={{ 
            height: 150,
            objectFit: 'cover'
          }}
        />
      </Card>
    );
  }
  
  // Display other file types
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1,
        mb: 1,
        borderRadius: 1,
        bgcolor: 'action.hover',
        maxWidth: 250,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <FileIcon sx={{ mr: 1 }} />
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Typography variant="body2" noWrap>
          {attachment.name || 'File attachment'}
        </Typography>
        {attachment.size && (
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(attachment.size)}
          </Typography>
        )}
      </Box>
      {attachment.url && (
        <IconButton 
          size="small" 
          component="a" 
          href={attachment.url} 
          download={attachment.name}
          target="_blank"
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

// Helper to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

// Replace the Message component completely with this version supporting attachments
const Message = ({ message, isCurrentUser, darkMode }) => {
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasContent = message.content && message.content.trim() !== '';
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
        }}
      >
        {/* Attachments */}
        {hasAttachments && (
          <Box 
            sx={{ 
              mb: hasContent ? 1 : 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
            }}
          >
            {message.attachments.map((attachment, index) => (
              <MessageAttachment 
                key={`${message._id || message.tempId}-attachment-${index}`}
                attachment={attachment}
                isCurrentUser={isCurrentUser}
                darkMode={darkMode}
              />
            ))}
          </Box>
        )}
        
        {/* Text content */}
        {hasContent && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: isCurrentUser
                ? 'primary.main' 
                : darkMode ? 'background.paper' : 'grey.200',
              color: isCurrentUser ? 'white' : 'text.primary',
              opacity: message.isLocal ? 0.7 : 1
            }}
          >
            <Typography>{message.content}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const MessageThread = ({ 
  thread,
  messages,
  onSendMessage,
  onBack,
  loading,
  error,
  isMobile = false,
  darkMode = false
}) => {
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = getCurrentUserId();
  const otherUser = thread?.otherParticipant;
  const theme = useTheme();

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup socket listeners for typing indicators
  useEffect(() => {
    if (!thread) return;

    // Listen for typing events
    socketService.onTyping(({ threadId, userId }) => {
      if (threadId === thread._id && userId !== currentUserId) {
        setOtherUserTyping(true);
      }
    });

    socketService.onTypingStopped(({ threadId, userId }) => {
      if (threadId === thread._id && userId !== currentUserId) {
        setOtherUserTyping(false);
      }
    });

    // Cleanup listeners
    return () => {
      socketService.removeListener('typing');
      socketService.removeListener('typing-stopped');
    };
  }, [thread, currentUserId]);

  // Helper to get a date string for messages
  const getMessageDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = (messageText, attachments = []) => {
    // Call the parent component's onSendMessage function with text and attachments
    onSendMessage(messageText, attachments);
  };
  
  const handleTypingStart = () => {
    if (thread) {
      socketService.sendTyping(thread._id);
    }
  };
  
  const handleTypingStop = () => {
    if (thread) {
      socketService.sendTypingStopped(thread._id);
    }
  };
  
  if (!thread) {
    return (
      <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Select a conversation to start messaging
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: darkMode ? 'background.default' : 'background.paper',
        borderRadius: 0
      }}
    >
      {/* Thread header */}
      <AppBar 
        position="static" 
        color="default" 
        elevation={0}
        sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: darkMode ? 'background.paper' : 'background.default'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Avatar 
            src={otherUser?.profile?.profilePicture} 
            alt={otherUser?.firstName}
            sx={{ mr: 1 }}
          >
            {otherUser?.firstName?.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" noWrap>
              {otherUser?.firstName} {otherUser?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {otherUser?.profile?.title || 'User'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages area */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 2,
          bgcolor: darkMode ? 'background.default' : 'grey.100'
        }}
      >
        {loading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={30} />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ p: 2 }}>
            {error}
          </Typography>
        ) : (
          // Direct render of messages without complex grouping
          <Box>
            {messages.map((message, index) => {
              const isCurrentUser = message.sender?._id === currentUserId;
              const showSender = !isCurrentUser && (index === 0 || 
                  messages[index-1]?.sender?._id !== message.sender?._id);
              
              return (
                <Box 
                  key={message._id || message.tempId || `msg-${index}-${Date.now()}`}
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                    mb: 2,
                    mt: 1
                  }}
                >
                  {/* Show sender name for messages not from current user */}
                  {showSender && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5 }}>
                      {message.sender?.firstName || 'User'} {message.sender?.lastName || ''}
                    </Typography>
                  )}
                  
                  {/* Message content */}
                  <Message 
                    message={message} 
                    isCurrentUser={isCurrentUser}
                    darkMode={darkMode}
                  />
                  
                  {/* Message timestamp */}
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ mt: 0.5, mx: 1 }}
                  >
                    {message.isLocal ? 'Sending...' : 
                      formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
        
        {/* Typing indicator */}
        {otherUserTyping && (
          <Box sx={{ display: 'flex', pl: 2, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {`${otherUser?.firstName || 'User'} is typing...`}
            </Typography>
          </Box>
        )}
        
        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Message input using MessageComposer component */}
      <MessageComposer 
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        darkMode={darkMode}
        placeholder="Type a message..."
      />
    </Paper>
  );
};

export default MessageThread; 