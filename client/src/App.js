import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from './contexts/ThemeContext';
import socketService from './services/socketService';
import { getCurrentUserId, getUserType } from './utils/authUtils';

// Import components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
// import Messaging from './pages/Messaging'; // Old messaging page
import MessagingPage from './pages/MessagingPage'; // New messaging page
import ProfessionalDiscovery from './pages/ProfessionalDiscovery';
import Matches from './pages/Matches';
import CoffeeChats from './pages/CoffeeChats';
import RegisterProfessional from './pages/RegisterProfessional';
import RegisterSeeker from './pages/RegisterSeeker';
import ProfessionalLanding from './pages/ProfessionalLanding';
import MessageNotifications from './components/Messaging/MessageNotifications';
import InvitationNotifications from './components/Invitation/InvitationNotifications';
import AdminDashboard from './pages/AdminDashboard';
import MessagingTest from './pages/MessagingTest';
import SimpleChat from './pages/SimpleChat';
import PublicProfileSetupPage from './pages/PublicProfileSetupPage';
import DirectTester from './components/DirectTester';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { InvitationProvider, useInvitation } from './contexts/InvitationContext';
import SimpleInvitationPage from './pages/SimpleInvitationPage';
import { MessageProvider } from './contexts/MessageProvider';
import { GlobalMessageProvider } from './contexts/GlobalMessageContext';


// Helper function for direct auth check
function checkDirectAuth() {
  const token = localStorage.getItem('token');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return !!token || isLoggedIn;
}

// AppRoutes component that has access to AuthContext
function AppRoutes() {
  const [messageNotifications, setMessageNotifications] = useState([]);
  const [invitationNotifications, setInvitationNotifications] = useState([]);
  const { isAuthenticated, refreshAuthState } = useAuth();
  const { addNotification } = useNotification();
  const { refreshInvitations } = useInvitation();
  
  // Ensure auth state is synchronized
  useEffect(() => {
    const directAuth = checkDirectAuth();
    if (directAuth !== isAuthenticated) {
      console.log('Auth state mismatch detected in AppRoutes, refreshing context');
      refreshAuthState();
    }
  }, [isAuthenticated, refreshAuthState]);

  // Listen for message and invitation notifications
  useEffect(() => {
    if (checkDirectAuth()) {
      const token = localStorage.getItem('token');
      if (token) {
        // Initialize socket connection
        socketService.connect(token);
        
        // Set up listener for message notifications
        socketService.onMessageNotification((data) => {
          try {
            // Comprehensive validation of message notification data
            if (!data) {
              console.warn('Empty message notification received');
              return;
            }
            
            console.log('Notification structure check:', {
              hasTopLevelThreadId: !!data.threadId,
              hasMessage: !!data.message,
              hasThread: !!data.thread,
              messageThreadId: data.message?.threadId
            });
            
            // Check for basic required fields
            if (!data.message) {
              console.warn('Invalid message notification: missing message data', data);
              return;
            }
            
            const { message } = data;
            
            // Extract threadId from any of the possible locations
            const threadId = data.threadId || 
                          (data.thread && data.thread._id) || 
                          message.threadId;
            
            if (!threadId) {
              console.error('Cannot process notification: No threadId available from any source', data);
              return;
            }
            
            // Extract and normalize sender information
            let senderId = null;
            let senderName = 'Unknown User';
            let senderAvatar = null;
            
            if (message.sender) {
              if (typeof message.sender === 'string') {
                // Handle case where sender is just a string
                senderId = message.sender;
                senderName = message.sender === 'User' ? 'Unknown User' : message.sender;
              } else if (typeof message.sender === 'object') {
                // Object format - extract ID and name safely
                senderId = message.sender._id || message.sender.id || null;
                
                // Try multiple possible name formats
                if (message.sender.firstName) {
                  senderName = message.sender.lastName ? 
                    `${message.sender.firstName} ${message.sender.lastName}`.trim() : 
                    message.sender.firstName;
                } else if (message.sender.name) {
                  senderName = message.sender.name;
                }
                
                // Try multiple possible avatar formats
                senderAvatar = message.sender.profilePicture || 
                              message.sender.profileImage || 
                              message.sender.avatar || 
                              null;
              }
            }
            
            // Fallback for missing sender ID
            if (!senderId) {
              console.warn('Message notification missing valid sender ID:', message);
              senderId = 'unknown';
            }
            
            // Skip notifications for the current user's messages
            const currentUserId = getCurrentUserId();
            if (senderId === currentUserId) {
              console.log('Skipping notification for own message');
              return;
            }
            
            // Create a notification with safe property access
            const notification = {
              id: Date.now().toString(),
              threadId,
              senderName,
              senderAvatar,
              preview: message.content || '',
              hasAttachments: message.attachments && message.attachments.length > 0
            };
            
            setMessageNotifications(prev => [notification, ...prev].slice(0, 5)); // Keep last 5
          } catch (error) {
            console.error('Error processing message notification:', error);
          }
        });
      }
    }
    
    return () => {
      // Clean up
      socketService.removeListener('message-notification');
    };
  }, []);

  // Handle message notification dismiss
  const handleDismissMessageNotification = (id) => {
    setMessageNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // Handle invitation notification dismiss
  const handleDismissInvitationNotification = (id) => {
    setInvitationNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // Handle navigation to a thread
  const handleNavigateToThread = (threadId) => {
    // This gets handled by the component
  };
  
  // Handle navigation to invitations
  const handleNavigateToInvitation = (invitationId) => {
    // This gets handled by the component
  };

  // Add socket.io invitation notification handler
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token && isAuthenticated) {
      // Ensure socket is connected
      if (!socketService.isSocketConnected()) {
        socketService.connect(token);
      }
      
      const handleInvitationNotification = (data) => {
        console.log('Invitation notification received:', data);
        
        // Validate data structure
        if (!data || !data.sender || !data.invitation) {
          console.warn('Received invalid invitation notification data:', data);
          return;
        }
        
        // Skip if this is a notification about the current user's action
        if (data.sender && data.sender._id === getCurrentUserId()) {
          return;
        }
        
        // Safely access required properties
        const invitation = data.invitation || {};
        const sender = data.sender || {};
        const receiver = data.receiver || {};
        
        // Create a notification for the UI notification list
        const notification = {
          id: Date.now().toString(),
          type: data.type || 'unknown',
          invitationId: invitation._id || 'unknown',
          senderName: sender ? `${sender.firstName || 'Unknown'} ${sender.lastName || ''}` : 'Unknown User',
          receiverName: receiver ? `${receiver.firstName || 'Unknown'} ${receiver.lastName || ''}` : 'Unknown User',
          senderAvatar: sender?.profileImage || null,
          receiverAvatar: receiver?.profileImage || null,
          timestamp: new Date().toISOString()
        };
        
        setInvitationNotifications(prev => [notification, ...prev].slice(0, 5));
        
        // Show global notification toast with validation
        if (data.type === 'invitation_accepted' && sender) {
          addNotification({
            severity: 'success',
            title: 'Invitation Accepted',
            message: `${sender.firstName || 'Someone'} ${sender.lastName || ''} accepted your invitation for a coffee chat.`,
            duration: 8000
          });
        } else if (data.type === 'invitation_declined' && sender) {
          addNotification({
            severity: 'info',
            title: 'Invitation Declined',
            message: `${sender.firstName || 'Someone'} ${sender.lastName || ''} declined your invitation for a coffee chat.`,
            duration: 8000
          });
        }
        
        // Refresh invitations globally
        refreshInvitations();
      };
      
      // Set up invitation notification listener
      socketService.onInvitationNotification(handleInvitationNotification);
      
      return () => {
        socketService.removeListener('invitation-notification');
      };
    }
  }, [isAuthenticated, addNotification, refreshInvitations]);

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={!checkDirectAuth() ? <Home /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!checkDirectAuth() ? <LoginForm /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!checkDirectAuth() ? <RegisterForm /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register/professional" element={!checkDirectAuth() ? <RegisterProfessional /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register/seeker" element={!checkDirectAuth() ? <RegisterSeeker /> : <Navigate to="/dashboard" replace />} />
        <Route path="/for-professionals" element={!checkDirectAuth() ? <ProfessionalLanding /> : <Navigate to="/dashboard" replace />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={checkDirectAuth() ? <><Navbar /><Dashboard /></> : <Navigate to="/login" state={{ from: '/dashboard' }} replace />} />
        <Route path="/profile" element={checkDirectAuth() ? <><Navbar /><Profile /></> : <Navigate to="/login" replace />} />
        <Route path="/profile-setup" element={checkDirectAuth() ? <><Navbar /><Profile /></> : <Navigate to="/login" replace />} />
        {/* <Route path="/messaging" element={checkDirectAuth() ? <><Navbar /><Messaging /></> : <Navigate to="/login" replace />} /> */}
        <Route path="/messages" element={checkDirectAuth() ? <><Navbar /><MessagingPage /></> : <Navigate to="/login" state={{ from: '/messages' }} replace />} />
        <Route path="/search" element={checkDirectAuth() ? <><Navbar /><ProfessionalDiscovery /></> : <Navigate to="/login" replace />} />
        <Route path="/matches" element={checkDirectAuth() ? <><Navbar /><Matches /></> : <Navigate to="/login" replace />} />
        <Route path="/coffee-chats" element={checkDirectAuth() ? <><Navbar /><CoffeeChats /></> : <Navigate to="/login" replace />} />
        <Route path="/professionals" element={checkDirectAuth() ? <><Navbar /><ProfessionalDiscovery /></> : <Navigate to="/login" replace />} />
        <Route path="/test" element={checkDirectAuth() ? <><Navbar /><MessagingTest /></> : <Navigate to="/login" replace />} />
        <Route path="/simple-chat" element={checkDirectAuth() ? <><Navbar /><SimpleChat /></> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={checkDirectAuth() ? <><Navbar /><AdminDashboard /></> : <Navigate to="/login" replace />} />
        <Route path="/direct-test" element={checkDirectAuth() ? <><Navbar /><DirectTester /></> : <Navigate to="/login" replace />} />
        <Route path="/simple-invitation/:id" element={checkDirectAuth() ? <><Navbar /><SimpleInvitationPage /></> : <Navigate to="/login" replace />} />
        <Route 
          path="/public-profile-setup" 
          element={
            checkDirectAuth() && getUserType() === 'professional' ? (
              <>
                <Navbar />
                {/* Use React.memo to ensure component is only rendered once */}
                {React.createElement(PublicProfileSetupPage, { key: 'profile-setup-singleton' })}
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Message Notifications */}
      {checkDirectAuth() && (
        <MessageNotifications 
          notifications={messageNotifications} 
          onDismiss={handleDismissMessageNotification}
          onNavigate={handleNavigateToThread}
        />
      )}
      
      {/* Invitation Notifications */}
      {checkDirectAuth() && (
        <InvitationNotifications
          notifications={invitationNotifications}
          onDismiss={handleDismissInvitationNotification}
          onNavigate={handleNavigateToInvitation}
        />
      )}
      

    </>
  );
}

// Material-UI Theme Provider Component
const MuiThemeWrapper = ({ children }) => {
  const customTheme = useTheme();
  
  const muiTheme = createTheme({
    palette: {
      mode: customTheme.isDarkMode ? 'dark' : 'light',
      primary: {
        main: customTheme.accent,
        light: customTheme.accentHover,
        dark: customTheme.isDarkMode ? '#1a6929' : '#0a58ca',
        contrastText: '#ffffff'
      },
      secondary: {
        main: customTheme.textSecondary,
        light: customTheme.isDarkMode ? '#9ca3af' : '#6b7280',
        dark: customTheme.isDarkMode ? '#6b7280' : '#4b5563',
        contrastText: customTheme.isDarkMode ? '#ffffff' : '#000000'
      },
      background: {
        default: customTheme.bg,
        paper: customTheme.cardBg
      },
      text: {
        primary: customTheme.text,
        secondary: customTheme.textSecondary
      },
      divider: customTheme.border,
      error: {
        main: '#f85149',
        light: '#ff7b7b',
        dark: '#da3633',
        contrastText: '#ffffff'
      },
      warning: {
        main: '#d29922',
        light: '#f5c542',
        dark: '#b8860b',
        contrastText: '#000000'
      },
      success: {
        main: customTheme.isDarkMode ? '#238636' : '#2da44e',
        light: customTheme.isDarkMode ? '#2ea043' : '#4caf50',
        dark: customTheme.isDarkMode ? '#1a6929' : '#1e7e34',
        contrastText: '#ffffff'
      }
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: customTheme.cardBg,
            backgroundImage: 'none'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: customTheme.cardBg,
            border: `1px solid ${customTheme.border}`,
            boxShadow: customTheme.components.card.shadow
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: customTheme.inputBg,
              '& fieldset': {
                borderColor: customTheme.inputBorder
              },
              '&:hover fieldset': {
                borderColor: customTheme.textSecondary
              },
              '&.Mui-focused fieldset': {
                borderColor: customTheme.inputFocus
              }
            }
          }
        }
      }
    }
  });

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GlobalMessageProvider>
          <NotificationProvider>
            <InvitationProvider>
              <MessageProvider>
                <MuiThemeWrapper>
                  <Router>
                    <AppRoutes />
                  </Router>
                </MuiThemeWrapper>
              </MessageProvider>
            </InvitationProvider>
          </NotificationProvider>
        </GlobalMessageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;