import React, { useContext } from 'react';
import { Box, Grid, useMediaQuery, useTheme, Paper, Typography } from '@mui/material';
import ThreadList from '../components/Messaging/ThreadList';
import EnhancedMessageThread from '../components/Messaging/EnhancedMessageThread';
import { ThemeContext } from '../contexts/ThemeContext';
import useMessaging from '../hooks/useMessaging';

const Messaging = () => {
  const {
    threads,
    selectedThread,
    messages,
    loading,
    error,
    setSelectedThread,
    sendMessage,
    createThread
  } = useMessaging();
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { darkMode } = useContext(ThemeContext);
  
  // Mobile view - show either thread list or selected conversation
  if (isMobile) {
    return (
      <Box sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {!selectedThread ? (
          <ThreadList 
            threads={threads}
            onSelectThread={setSelectedThread}
            onCreateThread={createThread}
            loading={loading}
            error={error}
            darkMode={darkMode}
          />
        ) : (
          <EnhancedMessageThread
            thread={selectedThread}
            messages={messages}
            onBack={() => setSelectedThread(null)}
            onSendMessage={sendMessage}
            loading={loading}
            error={error}
            isMobile
            darkMode={darkMode}
          />
        )}
      </Box>
    );
  }
  
  // Desktop view - show both thread list and selected conversation
  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', 
      overflow: 'hidden',
      bgcolor: darkMode ? 'background.default' : 'grey.100'
    }}>
      <Grid container sx={{ height: '100%' }}>
        <Grid item xs={12} md={4} lg={3} 
          sx={{ 
            height: '100%', 
            borderRight: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <ThreadList 
            threads={threads}
            selectedThreadId={selectedThread?._id}
            onSelectThread={setSelectedThread}
            onCreateThread={createThread}
            loading={loading}
            error={error}
            darkMode={darkMode}
          />
        </Grid>
        <Grid item xs={12} md={8} lg={9} sx={{ height: '100%' }}>
          {selectedThread ? (
            <EnhancedMessageThread
              thread={selectedThread}
              messages={messages}
              onSendMessage={sendMessage}
              loading={loading}
              error={error}
              darkMode={darkMode}
            />
          ) : (
            <Paper 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: darkMode ? 'background.paper' : 'background.default'
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Select a conversation to start messaging
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Messaging; 