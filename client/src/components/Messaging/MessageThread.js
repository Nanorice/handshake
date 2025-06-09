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
  Divider,
  Collapse
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Description as FileIcon,
  Reply as ReplyIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { getCurrentUserId } from '../../utils/authUtils';
import { ThemeContext } from '../../contexts/ThemeContext';
import socketService from '../../services/socketService';
import MessageComposer from './MessageComposer';
import { saveScrollPosition, restoreScrollPosition } from '../../utils/scrollPositionManager';

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

// ReplyPreview component to show the original message being replied to
const ReplyPreview = ({ originalMessage, darkMode }) => {
  if (!originalMessage) return null;
  
  return (
    <Box
      sx={{
        display: 'flex',
        p: 1,
        borderRadius: 1,
        bgcolor: darkMode ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241, 245, 249, 0.7)',
        borderLeft: '3px solid',
        borderLeftColor: 'primary.main',
        mb: 1,
        maxWidth: '90%'
      }}
    >
      <Box sx={{ ml: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {originalMessage.sender?.firstName || 'User'}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: darkMode ? 'grey.300' : 'grey.700' }}>
          {originalMessage.content?.length > 60 
            ? originalMessage.content.substring(0, 60) + '...' 
            : originalMessage.content}
        </Typography>
      </Box>
    </Box>
  );
};

// Replace the Message component completely with this version supporting attachments and replies
const Message = ({ message, isCurrentUser, darkMode, allMessages, onReply }) => {
  const hasAttachments = message.attachments && message.attachments.length > 0;
  
  // CRITICAL FIX: Ensure content is always a string and trim any trailing spaces
  const messageContent = message.content || '';
  const safeContent = typeof messageContent === 'string' ? messageContent.trim() : String(messageContent || '').trim();
  const hasContent = safeContent !== '';
  
  // Debug: Log content details to identify spacing issues
  if (isCurrentUser && safeContent) {
    console.log('Message content debug:', {
      raw: JSON.stringify(messageContent),
      safe: JSON.stringify(safeContent),
      length: safeContent.length,
      ends: `"${safeContent.slice(-5)}"`,
      chars: safeContent.split('').map(c => c.charCodeAt(0))
    });
  }
  
  const isReply = message.messageType === 'reply' && message.replyTo;
  
  // Find the original message if this is a reply
  const originalMessage = isReply && allMessages
    ? allMessages.find(msg => msg._id === message.replyTo?._id || message.replyTo)
    : null;
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      {!isCurrentUser && (
        <Avatar 
          src={message.sender?.profile?.profilePicture} 
          alt={message.sender?.firstName || "User"}
          sx={{ width: 32, height: 32, mr: 1, mt: 1 }}
        />
      )}
      
      <Box
        sx={{
          maxWidth: '70%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
        }}
      >
        {/* Reply action button */}
        <IconButton
          size="small"
          onClick={() => onReply(message)}
          sx={{
            position: 'absolute',
            right: isCurrentUser ? undefined : -24,
            left: isCurrentUser ? -24 : undefined,
            top: 0,
            opacity: 0,
            transition: 'opacity 0.2s',
            '&:hover': {
              opacity: 1,
              backgroundColor: 'rgba(0,0,0,0.04)'
            },
            bgcolor: 'background.paper',
            width: 20,
            height: 20,
            boxShadow: 1
          }}
        >
          <ReplyIcon sx={{ fontSize: 12 }} />
        </IconButton>
        
        {/* Original message preview if this is a reply */}
        {isReply && originalMessage && (
          <ReplyPreview originalMessage={originalMessage} darkMode={darkMode} />
        )}
        
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
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              backgroundColor: isCurrentUser
                ? 'primary.main' 
                : darkMode ? 'background.paper' : 'grey.200',
              color: isCurrentUser ? 'white' : 'text.primary',
              opacity: message.isLocal ? 0.7 : 1,
              width: 'fit-content',
              maxWidth: '100%',
              ':hover': {
                '& .reply-button': {
                  opacity: 0.7
                }
              }
            }}
          >
            <Typography 
              variant="body2"
              sx={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                margin: 0,
                lineHeight: 1.3,
                padding: 0,
                fontSize: '0.9rem'
              }}
            >
              {safeContent}
            </Typography>
          </Box>
        )}
        
        {/* Time */}
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            textAlign: isCurrentUser ? 'right' : 'left',
            mt: 0.5,
            color: darkMode ? 'grey.500' : 'grey.600',
            fontSize: '0.7rem'
          }}
        >
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </Typography>
      </Box>
      
      {isCurrentUser && (
        <Avatar 
          src={message.sender?.profile?.profilePicture} 
          alt={message.sender?.firstName || "User"}
          sx={{ width: 32, height: 32, ml: 1, mt: 1 }}
        />
      )}
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
  const [replyTo, setReplyTo] = useState(null);
  const messagesEndRef = useRef(null);
  const currentUserId = getCurrentUserId();
  const otherUser = thread?.otherParticipant;
  const theme = useTheme();
  const containerRef = useRef(null);

  // Preserve scroll position between renders and HMR updates
  useEffect(() => {
    if (thread?._id) {
      // Attempt to restore the scroll position
      const containerId = 'message-thread-container';
      // Delay restore to ensure messages are rendered
      setTimeout(() => {
        const restored = restoreScrollPosition(containerId, thread._id);
        if (!restored && messages.length > 0) {
          // If we couldn't restore position, scroll to bottom
          scrollToBottom();
        }
      }, 100);
      
      // Save scroll position on unmount
      return () => {
        saveScrollPosition('message-thread-container', thread._id);
      };
    }
  }, [thread?._id]);

  // Save scroll position periodically
  useEffect(() => {
    if (!thread?._id) return;
    
    const saveScrollInterval = setInterval(() => {
      saveScrollPosition('message-thread-container', thread._id);
    }, 5000);
    
    return () => {
      clearInterval(saveScrollInterval);
    };
  }, [thread?._id]);

  // Optimized scroll management to prevent jumping
  useEffect(() => {
    // Only auto-scroll if appropriate, with debouncing to prevent rapid scrolling
    const shouldScrollToBottom = () => {
      if (!messagesEndRef.current) return false;
      
      // Get the message container element (parent of messagesEndRef)
      const messageContainer = messagesEndRef.current.parentElement;
      if (!messageContainer) return false;
      
      const { scrollTop, scrollHeight, clientHeight } = messageContainer;
      
      // Calculate distance from bottom
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Get the last message and check if it's from current user
      const lastMessage = messages[messages.length - 1];
      const isLastMessageFromCurrentUser = lastMessage?.sender?._id === currentUserId || 
                                         lastMessage?.sender === currentUserId;
      
      // Auto-scroll if user is already near the bottom (within 200px - reduced for better UX)
      // or if the new message is from the current user (we just sent it)
      return distanceFromBottom < 200 || isLastMessageFromCurrentUser;
    };
    
    // Use requestAnimationFrame for smoother scrolling
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        if (shouldScrollToBottom()) {
          scrollToBottom();
        } else {
          // If not auto-scrolling, restore saved position
          restoreScrollPosition('message-thread-container', thread._id);
        }
      });
    }
  }, [messages, currentUserId, thread?._id]);

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

    // Mark thread as read when opened
    if (thread._id) {
      socketService.markThreadRead(thread._id);
    }

    return () => {
      setOtherUserTyping(false);
    };
  }, [thread, currentUserId]);

  // Format date for message groups
  const getMessageDate = (timestamp) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Optimized scroll to bottom - prevents jumping during re-renders
  const scrollToBottom = () => {
    try {
      if (messagesEndRef.current) {
        // Use immediate scroll for better performance and less jumping
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'auto', // Changed from 'smooth' to 'auto' for instant scroll
          block: 'end'
        });
      }
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  };

  // Handle send message
  const handleSendMessage = (messageText, attachments = [], replyToId = null) => {
    onSendMessage(messageText, attachments, replyToId);
    setReplyTo(null); // Clear reply state after sending
  };

  // Handle typing indicators
  const handleTypingStart = () => {
    if (thread?._id) {
      socketService.sendTyping(thread._id);
    }
  };

  const handleTypingStop = () => {
    if (thread?._id) {
      socketService.sendTypingStopped(thread._id);
    }
  };
  
  // Handle reply to message
  const handleReplyToMessage = (message) => {
    setReplyTo(message);
  };
  
  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyTo(null);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      bgcolor: darkMode ? 'background.default' : 'grey.50'
    }}>
      {/* Header */}
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar variant="dense">
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          
          <Avatar 
            src={otherUser?.profile?.profilePicture} 
            alt={otherUser?.firstName || "User"}
            sx={{ width: 36, height: 36, mr: 1.5 }}
          />
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1">
              {otherUser?.firstName} {otherUser?.lastName}
            </Typography>
            
            {otherUserTyping ? (
              <Typography variant="caption" color="text.secondary">
                Typing...
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                {otherUser?.userType === 'professional' ? 'Professional' : 'Seeker'}
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Messages */}
      <Box 
        id="message-thread-container"
        ref={containerRef}
        sx={{ 
          flexGrow: 1, 
          p: 2, 
          overflowY: 'auto', 
          display: 'flex',
          flexDirection: 'column'
        }}
        data-thread-id={thread?._id || 'no-thread'}
        onScroll={() => {
          // Save scroll position on manual scroll
          if (thread?._id) {
            saveScrollPosition('message-thread-container', thread._id);
          }
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error">
              {typeof error === 'string' ? error : 'An error occurred loading messages'}
            </Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          // Messages list
          messages.map((message, index) => (
            <Message 
              key={message._id || `local-${index}`} 
              message={message}
              isCurrentUser={
                message.sender === currentUserId || 
                message.sender?._id === currentUserId ||
                (typeof message.sender === 'object' && message.sender._id === currentUserId)
              }
              darkMode={darkMode}
              allMessages={messages}
              onReply={handleReplyToMessage}
            />
          ))
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} id="messages-end-ref" />
      </Box>
      
      {/* Composer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <MessageComposer 
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          darkMode={darkMode}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
        />
      </Box>
    </Box>
  );
};

export default MessageThread; 