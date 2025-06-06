import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Box,
  IconButton,
  Typography,
  Slide,
  Grow,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Close, Minimize } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import CompactThreadList from './CompactThreadList';
import CompactMessageView from './CompactMessageView';
import { MessageProvider, useMessages } from './MessageProvider';
import messageService from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';

const FloatingWindow = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: '80px',
  right: '20px',
  width: '360px',
  height: '500px',
  zIndex: 1300,
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 16px 64px rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
  resize: 'none !important',
  userSelect: 'none',
  '&::-webkit-resizer': {
    display: 'none !important',
  },
  '&::after': {
    display: 'none !important',
  },
  '&:hover::-webkit-resizer': {
    display: 'none !important',
  },
  
  [theme.breakpoints.down('sm')]: {
    width: 'calc(100vw - 40px)',
    height: '70vh',
    bottom: '20px',
    right: '20px',
    left: '20px',
  },
}));

const WindowHeader = styled(Box)(({ theme }) => ({
  padding: '12px 16px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50],
}));

const WindowContent = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

// Message thread container with provider
const MessageThreadContainer = React.memo(({ thread, currentUserId, onBack }) => {
  const { messages, loading, sendMessage } = useMessages();
  
  return (
    <CompactMessageView
      thread={thread}
      messages={messages}
      loading={loading}
      onSendMessage={sendMessage}
      onBack={onBack}
      currentUserId={currentUserId}
    />
  );
});

const FloatingChatWindow = ({ 
  isOpen, 
  onClose, 
  onMinimize 
}) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showThreadList, setShowThreadList] = useState(true);
  
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load threads when window opens
  useEffect(() => {
    if (isOpen && currentUser) {
      loadThreads();
    }
  }, [isOpen, currentUser]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const fetchedThreads = await messageService.getThreads();
      setThreads(fetchedThreads || []);
    } catch (error) {
      console.error('Error loading threads:', error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleThreadSelect = useCallback((threadId) => {
    const selected = threads.find(t => t._id === threadId);
    if (selected) {
      setSelectedThread(selected);
      setSelectedThreadId(threadId);
      setShowThreadList(false);
    }
  }, [threads]);

  const handleBackToThreads = useCallback(() => {
    setShowThreadList(true);
    setSelectedThread(null);
    setSelectedThreadId(null);
  }, []);

  const handleClose = () => {
    // Reset state when closing
    setShowThreadList(true);
    setSelectedThread(null);
    setSelectedThreadId(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Grow in={isOpen} timeout={300}>
      <FloatingWindow elevation={8}>
        <WindowHeader>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            {!showThreadList && selectedThread ? (
              (() => {
                const otherParticipant = selectedThread.participants?.find(p => p._id !== currentUser?._id);
                return otherParticipant ? 
                  `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() : 
                  'Unknown User';
              })()
            ) : (
              'Messages'
            )}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onMinimize && (
              <IconButton size="small" onClick={onMinimize} sx={{ p: 0.5 }}>
                <Minimize fontSize="small" />
              </IconButton>
            )}
            <IconButton size="small" onClick={handleClose} sx={{ p: 0.5 }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </WindowHeader>

        <WindowContent>
          {showThreadList ? (
            <CompactThreadList
              threads={threads}
              loading={loading}
              selectedThreadId={selectedThreadId}
              onThreadSelect={handleThreadSelect}
              currentUserId={currentUser?._id}
            />
          ) : (
            selectedThread && selectedThreadId && (
              <MessageProvider
                key={`floating-${selectedThreadId}`}
                threadId={selectedThreadId}
                userId={currentUser?._id}
              >
                <MessageThreadContainer
                  thread={selectedThread}
                  currentUserId={currentUser?._id}
                  onBack={handleBackToThreads}
                />
              </MessageProvider>
            )
          )}
        </WindowContent>
      </FloatingWindow>
    </Grow>
  );
};

export default FloatingChatWindow; 