import React, { useContext, useEffect, useState, useRef } from 'react';
import { Box, Grid, useMediaQuery, useTheme, Paper, Typography, CircularProgress, Button, AppBar, Toolbar, IconButton, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ThreadList from '../components/Messaging/ThreadList';
import EnhancedMessageThread from '../components/Messaging/EnhancedMessageThread';
import ClearMessagesButton from '../components/Messaging/ClearMessagesButton';
import ConnectionStatus from '../components/Messaging/ConnectionStatus';
import FallbackToggleButton from '../components/Messaging/FallbackToggleButton';
import { ThemeContext } from '../contexts/ThemeContext';
import useMessaging from '../hooks/useMessaging';
import { getAuthToken, getCurrentUserId } from '../utils/authUtils';
import MessageComposer from '../components/Messaging/MessageComposer';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

/**
 * ErrorBoundary to catch rendering errors
 */
class MessagingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Messaging component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            height: '80vh',
            gap: 2
          }}
        >
          <Typography variant="h6" color="error">
            Something went wrong with the messaging component.
          </Typography>
          <Typography variant="body1">
            {this.state.error?.message || "Unknown error"}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              // Try to set the fallback flag and then refresh
              try {
                localStorage.setItem('messaging_use_fallback', 'true');
              } catch (e) {
                console.error('Failed to set fallback flag:', e);
              }
              window.location.reload();
            }}
          >
            Try Alternative Mode
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Main Messaging Component
 */
const Messaging = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { themeMode } = useContext(ThemeContext) || { themeMode: false };
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Local state
  const [initialized, setInitialized] = useState(false);
  
  // State to determine whether to use fallback components
  const [useFallbackComponents, setUseFallbackComponents] = useState(() => {
    try {
      // Check if user has previously selected fallback mode
      return localStorage.getItem('messaging_use_fallback') === 'true';
    } catch (e) {
      console.error('Error reading fallback preference:', e);
      return false;
    }
  });
  
  // Get messaging state and functions from hook
  const messagesHook = useMessaging();
  
  // Extract values with defaults to prevent undefined errors
  const threads = Array.isArray(messagesHook?.threads) ? messagesHook.threads : [];
  const loading = messagesHook?.loading || false;
  const error = messagesHook?.error || null;
  const selectedThread = messagesHook?.selectedThread || null;
  const messages = Array.isArray(messagesHook?.messages) ? messagesHook.messages : [];
  
  // Functions with safety checks
  const handleSelectThread = (thread) => {
    if (typeof messagesHook?.setSelectedThread === 'function') {
      messagesHook.setSelectedThread(thread);
    } else {
      console.error('setSelectedThread is not available');
    }
  };
  
  const handleSendMessage = (text, attachments) => {
    if (typeof messagesHook?.sendMessage === 'function') {
      messagesHook.sendMessage(text, attachments);
    } else {
      console.error('sendMessage is not available');
    }
  };
  
  // Check authentication on component mount
  useEffect(() => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log('No valid token, redirecting to login');
        navigate('/login');
        return;
      }
      
      // Give a moment for hooks to initialize
      setTimeout(() => {
        setInitialized(true);
      }, 100);
    } catch (error) {
      console.error('Authentication check error:', error);
      navigate('/login');
    }
  }, [navigate]);
  
  // Safety check - don't render until we're initialized
  if (!initialized) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '80vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // If loading, show loading indicator
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '80vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          height: '80vh',
          gap: 2
        }}
      >
        <Typography variant="h6" color="error">
          Error loading messages
        </Typography>
        <Typography variant="body1">
          {error.message || "Unknown error"}
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => {
            // Try switching to fallback mode
            setUseFallbackComponents(true);
            localStorage.setItem('messaging_use_fallback', 'true');
            window.location.reload();
          }}
        >
          Try Alternative Mode
        </Button>
      </Box>
    );
  }
  
  // Mobile view - show either thread list or selected conversation
  if (isMobile) {
    return (
      <MessagingErrorBoundary>
        <Box sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {!selectedThread ? (
            <>
              <Box sx={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: 1 }}>
                <FallbackToggleButton 
                  useFallbackComponents={useFallbackComponents}
                  setUseFallbackComponents={setUseFallbackComponents}
                  darkMode={themeMode}
                />
                <ConnectionStatus />
              </Box>
              
              <ThreadList 
                threads={threads}
                onSelectThread={handleSelectThread}
                selectedThreadId={selectedThread?._id}
                loading={loading}
                error={error}
                darkMode={themeMode}
              />
            </>
          ) : (
            <>
              <Box sx={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: 1 }}>
                <FallbackToggleButton 
                  useFallbackComponents={useFallbackComponents}
                  setUseFallbackComponents={setUseFallbackComponents}
                  darkMode={themeMode}
                />
                <ConnectionStatus />
              </Box>
              
              <EnhancedMessageThread
                thread={selectedThread}
                messages={messages}
                onBack={() => handleSelectThread(null)}
                onSendMessage={handleSendMessage}
                loading={loading}
                error={error}
                isMobile
                darkMode={themeMode}
              />
            </>
          )}
        </Box>
      </MessagingErrorBoundary>
    );
  }
  
  // Desktop view - show both thread list and selected conversation
  return (
    <MessagingErrorBoundary>
      <Box sx={{ 
        height: 'calc(100vh - 64px)', 
        overflow: 'hidden',
        bgcolor: themeMode ? 'background.default' : 'grey.100',
        position: 'relative'
      }}>
        {/* Connection status indicator and fallback toggle - positioned at the top right */}
        <Box sx={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: 1 }}>
          <FallbackToggleButton 
            useFallbackComponents={useFallbackComponents}
            setUseFallbackComponents={setUseFallbackComponents}
            darkMode={themeMode}
          />
          <ConnectionStatus />
        </Box>
        
        <Grid container sx={{ height: '100%' }}>
          <Grid item xs={12} md={4} lg={3} 
            sx={{ 
              height: '100%', 
              borderRight: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            <ThreadList 
              threads={threads}
              selectedThreadId={selectedThread?._id}
              onSelectThread={handleSelectThread}
              loading={loading}
              error={error}
              darkMode={themeMode}
            />
            
            {/* Clear Messages Button - positioned at the bottom of the thread list */}
            <Box sx={{ 
              p: 1,
              mt: 'auto',
              zIndex: 10 
            }}>
              <ClearMessagesButton />
            </Box>
          </Grid>
          <Grid item xs={12} md={8} lg={9} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedThread ? (
              <EnhancedMessageThread
                thread={selectedThread}
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
                error={error}
                darkMode={themeMode}
              />
            ) : (
              <Paper 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: themeMode ? 'background.paper' : 'background.default'
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
    </MessagingErrorBoundary>
  );
};

export default Messaging; 