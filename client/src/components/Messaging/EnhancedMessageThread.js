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
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { getCurrentUserId } from '../../utils/authUtils';
import { ThemeContext } from '../../contexts/ThemeContext';
import socketService from '../../services/socketService';
import MessageComposer from './MessageComposer';
import 'react-chat-elements/dist/main.css';
import { MessageList, ChatItem, MessageBox } from 'react-chat-elements';

const EnhancedMessageThread = ({ 
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

  // Format messages for react-chat-elements
  const formattedMessages = messages.map(message => {
    const isCurrentUser = message.sender?._id === currentUserId;
    const hasAttachments = message.attachments && message.attachments.length > 0;
    const attachmentData = hasAttachments ? message.attachments[0] : null;
    
    // Base message props
    const props = {
      id: message._id || message.tempId,
      position: isCurrentUser ? 'right' : 'left',
      type: 'text',
      text: message.content,
      date: new Date(message.createdAt),
      title: isCurrentUser ? 'You' : `${message.sender?.firstName || 'User'} ${message.sender?.lastName || ''}`,
      focus: false,
      status: message.isLocal ? 'waiting' : 'sent',
      notch: true,
      avatar: !isCurrentUser ? message.sender?.profile?.profilePicture : null
    };
    
    // If there's an image attachment, show it as an image message
    if (hasAttachments && attachmentData?.type?.startsWith('image/')) {
      return {
        ...props,
        type: 'photo',
        data: {
          uri: attachmentData.url || attachmentData.preview,
          status: {
            click: true,
            loading: 0,
          }
        }
      };
    }
    
    // If there's a file attachment, include it as a download link
    if (hasAttachments && !attachmentData?.type?.startsWith('image/')) {
      return {
        ...props,
        type: 'file',
        data: {
          name: attachmentData.name,
          size: attachmentData.size,
          uri: attachmentData.url || '',
          status: {
            click: true,
            loading: 0,
          }
        }
      };
    }
    
    return props;
  });
  
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
        borderRadius: 0,
        overflow: 'hidden'
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
              {otherUserTyping ? (
                <span style={{ fontStyle: 'italic' }}>typing...</span>
              ) : (
                otherUser?.profile?.title || 'User'
              )}
            </Typography>
          </Box>
          <IconButton edge="end" color="inherit">
            <MoreVertIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Messages area */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 1,
          bgcolor: darkMode ? 'background.default' : 'grey.100',
          '& .rce-mbox-right': {
            backgroundColor: theme.palette.primary.main,
            color: 'white'
          },
          '& .rce-mbox-left': {
            backgroundColor: darkMode ? theme.palette.background.paper : theme.palette.grey[200],
            color: darkMode ? theme.palette.text.primary : theme.palette.text.primary,
            border: darkMode ? `1px solid ${theme.palette.divider}` : 'none'
          },
          '& .rce-mbox-right-notch': {
            fill: theme.palette.primary.main
          },
          '& .rce-mbox-left-notch': {
            fill: darkMode ? theme.palette.background.paper : theme.palette.grey[200]
          },
          '& .rce-mbox-time': {
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
          },
          '& .rce-mbox-time-left': {
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
          },
          '& .rce-container-mlist': {
            backgroundColor: darkMode ? theme.palette.background.default : theme.palette.grey[100] 
          },
          '& .rce-mbox': {
            boxShadow: darkMode ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.1)'
          }
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
          <MessageList
            className='message-list'
            lockable={false}
            toBottomHeight={'100%'}
            dataSource={formattedMessages}
          />
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

export default EnhancedMessageThread; 