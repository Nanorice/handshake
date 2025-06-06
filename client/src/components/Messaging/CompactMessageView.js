import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
  Divider
} from '@mui/material';
import { Send, ArrowBack } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const MessageContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const MessagesArea = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: '8px',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.divider,
    borderRadius: '2px',
  },
}));

const MessageBubble = styled(Paper)(({ theme, isOwn }) => ({
  padding: '8px 12px',
  margin: '2px 0',
  maxWidth: '220px',
  minWidth: 'fit-content',
  width: 'auto',
  backgroundColor: isOwn 
    ? theme.palette.primary.main 
    : theme.palette.mode === 'dark' 
      ? theme.palette.grey[800] 
      : theme.palette.grey[100],
  color: isOwn 
    ? theme.palette.primary.contrastText 
    : theme.palette.text.primary,
  borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  display: 'inline-block',
}));

const ComposerArea = styled(Box)(({ theme }) => ({
  padding: '8px',
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'flex-end',
  gap: '8px',
}));

const CompactMessageView = ({ 
  thread, 
  messages = [], 
  loading = false, 
  onSendMessage, 
  onBack,
  currentUserId 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);

  const otherParticipant = thread?.participants?.find(p => p._id !== currentUserId);
  const participantName = otherParticipant ? 
    `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() : 
    'Unknown User';

  const scrollToBottom = (force = false) => {
    if (messagesAreaRef.current) {
      if (force) {
        // Force scroll to bottom with multiple attempts
        const scrollToEnd = () => {
          messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
        };
        scrollToEnd();
        requestAnimationFrame(scrollToEnd);
        setTimeout(scrollToEnd, 50);
      } else {
        // Only scroll if user is near bottom
        const { scrollTop, scrollHeight, clientHeight } = messagesAreaRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        if (isNearBottom) {
          messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
        }
      }
    }
  };

  // Always scroll to bottom when thread changes (force scroll)
  useEffect(() => {
    if (thread?._id && messagesAreaRef.current) {
      // Multiple attempts to ensure scroll to bottom
      const scrollToEnd = () => {
        if (messagesAreaRef.current) {
          messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
        }
      };
      
      // Immediate scroll
      scrollToEnd();
      
      // Delayed scroll to handle DOM updates
      setTimeout(scrollToEnd, 50);
      setTimeout(scrollToEnd, 150);
      setTimeout(scrollToEnd, 300);
    }
  }, [thread?._id]);

  // Scroll to bottom when messages are loaded for current thread
  useEffect(() => {
    if (messages.length > 0 && thread?._id && messagesAreaRef.current) {
      // Aggressive scroll to bottom for initial message load
      const forceScrollToBottom = () => {
        if (messagesAreaRef.current) {
          messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
        }
      };
      
      // Multiple immediate attempts
      forceScrollToBottom();
      requestAnimationFrame(forceScrollToBottom);
      setTimeout(forceScrollToBottom, 100);
      setTimeout(forceScrollToBottom, 300);
      setTimeout(forceScrollToBottom, 500);
    }
  }, [messages.length, thread?._id]);

  // Smart scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await onSendMessage(messageContent);
      // Force scroll to bottom after sending
      setTimeout(() => scrollToBottom(true), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!thread) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Select a conversation to start chatting
        </Typography>
      </Box>
    );
  }

  return (
    <MessageContainer>
      {/* Header */}
      <Box sx={{ 
        p: 1, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <IconButton size="small" onClick={onBack} sx={{ p: 0.5 }}>
          <ArrowBack fontSize="small" />
        </IconButton>
        <Avatar
          src={otherParticipant?.profileImage}
          sx={{ width: 28, height: 28 }}
        >
          {participantName.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.875rem' }}>
            {participantName}
          </Typography>
          {otherParticipant?.isOnline && (
            <Typography variant="caption" color="success.main" sx={{ fontSize: '0.7rem' }}>
              Active now
            </Typography>
          )}
        </Box>
      </Box>

      {/* Messages Area */}
      <MessagesArea ref={messagesAreaRef}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress size={20} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="textSecondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px', pb: 1 }}>
            {messages.map((message, index) => {
              // Enhanced sender detection
              const messageSenderId = message.senderId || message.sender?._id || message.sender;
              const isOwn = String(messageSenderId) === String(currentUserId);
              const showAvatar = !isOwn && (index === 0 || messages[index - 1].senderId !== message.senderId);
              
              // Debug log
              console.log('Message debug:', {
                messageId: message._id,
                messageSenderId,
                currentUserId,
                isOwn,
                content: message.content?.substring(0, 20)
              });
              
              return (
                <Box
                  key={message._id || index}
                  sx={{
                    display: 'flex',
                    flexDirection: isOwn ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '6px',
                    width: '100%'
                  }}
                >
                  {/* Avatar space */}
                  <Box sx={{ width: '24px', display: 'flex', justifyContent: 'center' }}>
                    {!isOwn && showAvatar && (
                      <Avatar
                        src={otherParticipant?.profileImage}
                        sx={{ width: 20, height: 20 }}
                      >
                        {participantName.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                  </Box>
                  
                  {/* Message content */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                      flex: 1,
                      maxWidth: 'calc(100% - 30px)'
                    }}
                  >
                    <MessageBubble isOwn={isOwn} elevation={0}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
                        {message.content}
                      </Typography>
                    </MessageBubble>
                    <Typography 
                      variant="caption" 
                      color="textSecondary" 
                      sx={{ 
                        fontSize: '0.65rem', 
                        mt: '2px',
                        mx: '6px'
                      }}
                    >
                      {formatTime(message.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </MessagesArea>

      {/* Composer */}
      <ComposerArea>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending}
          multiline
          maxRows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              fontSize: '0.875rem',
            }
          }}
        />
        <IconButton
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          size="small"
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '&:disabled': {
              backgroundColor: 'action.disabled',
            }
          }}
        >
          {sending ? <CircularProgress size={16} color="inherit" /> : <Send fontSize="small" />}
        </IconButton>
      </ComposerArea>
    </MessageContainer>
  );
};

export default CompactMessageView; 