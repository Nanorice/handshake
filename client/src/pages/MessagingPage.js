import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Grid, 
  Box, 
  Paper, 
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import NewThreadList from '../components/Messaging/NewThreadList';
import MessageThread from '../components/Messaging/MessageThread';
import { MessageProvider, useMessages } from '../components/Messaging/MessageProvider';
import messageService from '../services/messageService';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';

// Create a stable component that won't re-render unnecessarily
const MessageThreadContainer = React.memo(({ thread, currentUserId, isMobile, darkMode }) => {
  const { messages, loading: messagesLoading, error: messagesError, sendMessage } = useMessages();
  
  // Use callback to ensure this function doesn't change on re-renders
  const handleBack = useCallback(() => {
    if (isMobile) {
      window.history.back(); // Use browser history instead of state updates
    }
  }, [isMobile]);
  
  return (
    <MessageThread
      thread={thread}
      messages={messages}
      onSendMessage={sendMessage}
      onBack={handleBack}
      loading={messagesLoading}
      error={messagesError}
      isMobile={isMobile}
      darkMode={darkMode}
    />
  );
});

const MessagingPage = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedThreadFull, setSelectedThreadFull] = useState(null);
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  console.log('[MessagingPage] Rendering. currentUser:', currentUser);
  
  // Memoize thread selection handler to prevent recreation on re-renders
  const handleThreadSelect = useCallback((threadId) => {
    console.log(`[MessagingPage] Thread selected: ${threadId}`);
    const selected = threads.find(t => t._id === threadId);
    
    if (selected) {
      setSelectedThreadFull(selected);
      setSelectedThreadId(threadId);
      console.log(`[MessagingPage] Full selected thread data:`, selected);
    } else {
      console.warn(`[MessagingPage] Could not find thread data for ID: ${threadId}`);
      setSelectedThreadFull(null);
      setSelectedThreadId(null);
    }
  }, [threads]);
  
  // Use memoized values that only update when dependencies change
  const showThreadList = useMemo(() => !isMobile || !selectedThreadId, [isMobile, selectedThreadId]);
  const showMessageView = useMemo(() => !isMobile || selectedThreadId, [isMobile, selectedThreadId]);
  
  // Use a stable ID for the message provider key - it should NOT change between renders
  // but should be unique for this thread to ensure a new provider is created when thread changes
  const messageProviderKey = useMemo(() => 
    selectedThreadId ? `thread-${selectedThreadId}` : 'no-thread',
    [selectedThreadId]
  );
  
  useEffect(() => {
    console.log('[MessagingPage] useEffect [currentUser] triggered. currentUser:', currentUser);

    const loadThreads = async () => {
      console.log('[MessagingPage] loadThreads called.');
      try {
        const fetchedThreads = await messageService.getThreads();
        console.log('[MessagingPage] Fetched threads from service:', fetchedThreads);
        setThreads(fetchedThreads || []);
        setError(null);
      } catch (err) {
        console.error('Error loading threads:', err);
        setError('Failed to load conversations');
        setThreads([]);
      } finally {
        setLoading(false);
        console.log('[MessagingPage] loadThreads finally block. setLoading(false).');
      }
    };
    
    if (currentUser) {
      console.log('[MessagingPage] currentUser is available, calling setLoading(true) and loadThreads().');
      setLoading(true);
      loadThreads();
    } else {
      console.log('[MessagingPage] currentUser is NOT available, calling setThreads([]) and setLoading(false).');
      setThreads([]);
      setLoading(false);
    }
  }, [currentUser]);
  
  useEffect(() => {
    if (currentUser && !socketService.isSocketConnected()) {
      console.log('[MessagingPage] Socket not connected, connecting...');
      socketService.connect();
    }
    return () => {
      if (socketService.isSocketConnected()) {
        // Optionally disconnect or leave rooms if user logs out or page is left
        // For now, let socketService handle its own lifecycle on user logout via AuthContext potentially.
      }
    };
  }, [currentUser]);
  
  return (
    <Box sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      <Grid container sx={{ height: '100%' }}>
        {showThreadList && (
          <Grid item xs={12} md={4} lg={3} sx={{ 
            height: '100%', 
            borderRight: 1, 
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <NewThreadList
              threads={threads}
              loading={loading}
              error={error}
              selectedThreadId={selectedThreadId}
              currentUserId={currentUser?._id}
              onThreadSelect={handleThreadSelect}
            />
          </Grid>
        )}
        
        {showMessageView && (
          <Grid item xs={12} md={8} lg={9} sx={{ height: '100%' }}>
            {selectedThreadId && selectedThreadFull && currentUser?._id ? (
              <MessageProvider
                key={messageProviderKey}
                threadId={selectedThreadId}
                userId={currentUser._id}
              >
                <MessageThreadContainer 
                  thread={selectedThreadFull}
                  currentUserId={currentUser._id}
                  isMobile={isMobile}
                  darkMode={theme.palette.mode === 'dark'}
                />
              </MessageProvider>
            ) : (
              <Paper 
                elevation={0} 
                sx={{ 
                  padding: 4, 
                  height: '100%',
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[50]
                }}
              >
                <Typography variant="h6" color="textSecondary">
                  Select a conversation to start chatting.
                </Typography>
              </Paper>
            )}
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MessagingPage; 