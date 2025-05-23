import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
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
import { saveScrollPosition, restoreScrollPosition } from '../../utils/scrollPositionManager';

/**
 * SafeMessageList component wraps react-chat-elements MessageList with safety checks
 */
const SafeMessageList = React.memo(({ dataSource, darkMode = false }) => {
  const [hasError, setHasError] = useState(false);
  
  // Ensure dataSource is a valid array with required props
  const safeDataSource = useMemo(() => {
    if (!Array.isArray(dataSource)) {
      console.warn('Invalid dataSource provided to SafeMessageList:', dataSource);
      return [];
    }
    
    // Filter out any invalid items and ensure all required properties exist
    return dataSource.filter(item => {
      if (!item || typeof item !== 'object') return false;
      
      // Ensure minimum required props for MessageList
      const hasRequiredProps = item.id && item.position && item.type && (item.date instanceof Date);
      
      if (!hasRequiredProps) {
        console.warn('Message item missing required properties:', item);
        return false;
      }
      
      // Make sure key property exists
      if (!item.key) {
        item.key = `message-${item.id}-${Date.now()}`;
      }
      
      return true;
    }).map(item => ({
      ...item,
      // Ensure these properties always exist and have valid values
      key: item.key || `message-${item.id}-${Date.now()}`,
      position: ['left', 'right'].includes(item.position) ? item.position : 'left',
      type: item.type || 'text',
      text: item.text || '',
      title: item.title || '',
      date: item.date instanceof Date ? item.date : new Date(),
      // Set defaults for optional properties
      focus: !!item.focus,
      status: item.status || 'sent',
      notch: item.notch !== false,
      avatar: item.avatar || null,
      forwarded: !!item.forwarded,
      // If type is photo or file, ensure data object is properly structured
      ...(item.type === 'photo' && item.data 
          ? { 
              data: { 
                uri: item.data.uri || '', 
                status: { click: true, loading: 0 } 
              } 
            } 
          : {}),
      ...(item.type === 'file' && item.data 
          ? { 
              data: { 
                name: item.data.name || 'File', 
                size: item.data.size || 0,
                uri: item.data.uri || '',
                status: { click: true, loading: 0 } 
              } 
            } 
          : {})
    }));
  }, [dataSource]);
  
  // Render empty state if no valid items
  if (!safeDataSource.length) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">No messages yet</Typography>
      </Box>
    );
  }
  
  // If we've had an error, use our custom component instead
  if (hasError) {
    console.log('Using CustomMessageList fallback due to previous error');
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Typography variant="body2" color="error">
          Error displaying messages. (Fallback failed)
        </Typography>
      </Box>
    );
  }
  
  try {
    // Wrap in an additional div to isolate the component
    return (
      <div className="safe-message-list-wrapper">
        <MessageList
          className='message-list'
          lockable={false}
          toBottomHeight={'100%'}
          dataSource={safeDataSource}
          referance={null} // Explicitly set to null to prevent unintended behaviors
        />
      </div>
    );
  } catch (error) {
    console.error('Error rendering MessageList:', error);
    setHasError(true);
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Typography variant="body2" color="error">
          Could not display messages.
        </Typography>
      </Box>
    );
  }
});

const EnhancedMessageThread = ({ 
  thread,
  messages = [], // Default to empty array
  onSendMessage,
  onBack,
  loading,
  error,
  isMobile = false,
  darkMode = false
}) => {
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const currentUserId = getCurrentUserId();
  const otherUser = thread?.otherParticipant;
  const theme = useTheme();

  // Ensure messages is always an array
  const messagesArray = Array.isArray(messages) ? messages : [];

  // Preserve scroll position between renders
  useEffect(() => {
    if (thread?._id) {
      // Attempt to restore the scroll position
      const containerId = 'enhanced-message-container';
      // Delay restore to ensure messages are rendered
      setTimeout(() => {
        const restored = restoreScrollPosition(containerId, thread._id);
        if (!restored && messagesArray.length > 0) {
          // If we couldn't restore position, scroll to bottom
          scrollToBottom();
        }
      }, 100);
      
      // Save scroll position on unmount
      return () => {
        saveScrollPosition(containerId, thread._id);
      };
    }
  }, [thread?._id, messagesArray.length]);

  // Save scroll position periodically
  useEffect(() => {
    if (!thread?._id) return;
    
    const saveScrollInterval = setInterval(() => {
      saveScrollPosition('enhanced-message-container', thread._id);
    }, 5000);
    
    return () => {
      clearInterval(saveScrollInterval);
    };
  }, [thread?._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messagesArray]);

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
  
  // Fix the scrolling behavior to be smarter about when to scroll
  const scrollToBottom = () => {
    try {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end' 
        });
      }
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  };
  
  // Smarter auto-scrolling that only scrolls when appropriate
  useEffect(() => {
    // Only auto-scroll if user is already near the bottom or if we sent the message
    const shouldAutoScroll = () => {
      if (!messagesEndRef.current) return false;
      
      // Get the message container element (scrollable parent)
      const scrollContainer = messagesEndRef.current.parentElement;
      if (!scrollContainer) return false;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Check if the last message is from the current user
      const lastMessage = messagesArray[messagesArray.length - 1];
      const isFromCurrentUser = lastMessage?.sender?._id === currentUserId;
      
      // Auto-scroll if:
      // 1. User is already near bottom (within 300px)
      // 2. The last message is from the current user (we just sent it)
      return distanceFromBottom < 300 || isFromCurrentUser;
    };
    
    // Only scroll if we have messages and should auto-scroll
    if (messagesArray.length > 0 && shouldAutoScroll()) {
      scrollToBottom();
    }
  }, [messagesArray, currentUserId]);
  
  const handleSendMessage = (messageText, attachments = []) => {
    // Call the parent component's onSendMessage function with text and attachments
    if (typeof onSendMessage === 'function') {
      onSendMessage(messageText, attachments);
    }
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
  const formattedMessages = React.useMemo(() => {
    // Defensive check
    if (!Array.isArray(messagesArray) || messagesArray.length === 0) {
      return [];
    }
    
    try {
      return messagesArray.map(message => {
        // Skip invalid messages
        if (!message) return null;
        
        const isCurrentUser = message.sender && message.sender._id === currentUserId;
        const hasAttachments = message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0;
        const attachmentData = hasAttachments ? message.attachments[0] : null;
        
        // Generate a unique ID for key
        const uniqueId = message._id || message.tempId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        // Base message props
        const props = {
          id: uniqueId,
          key: `message-${uniqueId}`, // Explicitly add a unique key
          position: isCurrentUser ? 'right' : 'left',
          type: 'text',
          text: message.content || '',
          date: message.createdAt ? new Date(message.createdAt) : new Date(),
          title: isCurrentUser ? 'You' : `${message.sender?.firstName || 'User'} ${message.sender?.lastName || ''}`,
          focus: false,
          status: message.isLocal ? 'waiting' : 'sent',
          notch: true,
          avatar: !isCurrentUser ? message.sender?.profile?.profilePicture : null
        };
        
        // If there's an image attachment, show it as an image message
        if (hasAttachments && attachmentData && attachmentData.type && attachmentData.type.startsWith('image/')) {
          return {
            ...props,
            type: 'photo',
            data: {
              uri: attachmentData.url || attachmentData.preview || '',
              status: {
                click: true,
                loading: 0,
              }
            }
          };
        }
        
        // If there's a file attachment, include it as a download link
        if (hasAttachments && attachmentData && attachmentData.type && !attachmentData.type.startsWith('image/')) {
          return {
            ...props,
            type: 'file',
            data: {
              name: attachmentData.name || 'File',
              size: attachmentData.size || 0,
              uri: attachmentData.url || '',
              status: {
                click: true,
                loading: 0,
              }
            }
          };
        }
        
        return props;
      }).filter(Boolean); // Remove null entries
    } catch (error) {
      console.error('Error formatting messages:', error);
      return []; // Return empty array on error
    }
  }, [messagesArray, currentUserId]);
  
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
            alt={otherUser?.firstName || ''}
            sx={{ mr: 1 }}
          >
            {otherUser?.firstName?.charAt(0) || '?'}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" noWrap>
              {otherUser?.firstName || 'User'} {otherUser?.lastName || ''}
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
        id="enhanced-message-container"
        ref={containerRef}
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
        data-thread-id={thread?._id || 'no-thread'}
        onScroll={() => {
          // Save scroll position on manual scroll
          if (thread?._id) {
            saveScrollPosition('enhanced-message-container', thread._id);
          }
        }}
      >
        {loading && (!Array.isArray(messagesArray) || messagesArray.length === 0) ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={30} />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ p: 2 }}>
            {typeof error === 'string' ? error : (error?.message || 'Unknown error')}
          </Typography>
        ) : (
          <SafeMessageList dataSource={formattedMessages} darkMode={darkMode} />
        )}
        
        {/* Element to scroll to */}
        <div ref={messagesEndRef} id="enhanced-messages-end-ref" />
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