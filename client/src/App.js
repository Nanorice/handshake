import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

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
import MessageNotifications from './components/Messaging/MessageNotifications';
import InvitationNotifications from './components/Invitation/InvitationNotifications';
import AdminDashboard from './pages/AdminDashboard';
import MessagingTest from './pages/MessagingTest';
import SimpleChat from './pages/SimpleChat';
import PublicProfileSetupPage from './pages/PublicProfileSetupPage';
import DirectTester from './components/DirectTester';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeContext } from './contexts/ThemeContext';
import { getCurrentUserId, getUserType } from './utils/authUtils';
import socketService from './services/socketService';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { InvitationProvider, useInvitation } from './contexts/InvitationContext';
import SimpleInvitationPage from './pages/SimpleInvitationPage';

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

function App() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  
  // Check if user is a professional
  const isProfessional = localStorage.getItem('userData') ? 
    JSON.parse(localStorage.getItem('userData')).userType === 'professional' : false;

  // Create theme based on dark mode preference and user type
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        // Darker blue for professionals
        main: isProfessional ? '#1E40AF' : '#2563EB', // Professionals: Blue-800 vs Blue-600
        dark: isProfessional ? '#1E3A8A' : '#1D4ED8', // Professionals: Blue-900 vs Blue-700
        light: isProfessional ? '#BFDBFE' : '#DBEAFE', // Professionals: Blue-200 vs Blue-100
      },
      secondary: {
        main: isProfessional ? '#4338CA' : '#4F46E5', // Professionals: Darker indigo
        dark: isProfessional ? '#3730A3' : '#4338CA',
        light: isProfessional ? '#C7D2FE' : '#E0E7FF',
      },
      success: {
        main: '#059669', // Emerald-600 from design system
        dark: '#047857',
        light: '#ECFDF5',
      },
      error: {
        main: '#DC2626', // Red-600 from design system
        dark: '#B91C1C',
        light: '#FEF2F2',
      },
      warning: {
        main: '#D97706', // Amber-600
        dark: '#B45309',
        light: '#FFFBEB',
      },
      info: {
        main: '#0284C7', // Light Blue-600
        dark: '#0369A1',
        light: '#F0F9FF',
      },
      background: darkMode 
        ? {
            default: isProfessional ? '#0F1629' : '#0F172A', // Slightly darker for professionals
            paper: isProfessional ? '#1E2842' : '#1E293B',   // Slightly darker for professionals
          }
        : {
            default: isProfessional ? '#EFF6FF' : '#F8FAFC', // Light blue tint for professionals in light mode
            paper: '#FFFFFF',
          },
      text: darkMode
        ? {
            primary: '#F1F5F9', // Slate-100 for dark mode
            secondary: '#94A3B8', // Slate-400 for dark mode
          }
        : {
            primary: isProfessional ? '#1E3A8A' : '#1E293B', // Darker blue text for professionals
            secondary: '#64748B', // Gray-500
          },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 8
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: darkMode 
              ? isProfessional 
                ? 'rgba(15, 22, 41, 0.8)' // Darker for professionals
                : 'rgba(15, 23, 42, 0.8)' 
              : isProfessional
                ? 'rgba(239, 246, 255, 0.8)' // Light blue tint for professionals
                : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
          }
        }
      }
    }
  });

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <AuthProvider>
            <NotificationProvider>
              <InvitationProvider>
                <Router>
                  <AppRoutes />
                </Router>
              </InvitationProvider>
            </NotificationProvider>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App;