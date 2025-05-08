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
import Messaging from './pages/Messaging';
import ProfessionalDiscovery from './pages/ProfessionalDiscovery';
import Matches from './pages/Matches';
import CoffeeChats from './pages/CoffeeChats';
import RegisterProfessional from './pages/RegisterProfessional';
import RegisterSeeker from './pages/RegisterSeeker';
import MessageNotifications from './components/Messaging/MessageNotifications';
import AdminDashboard from './pages/AdminDashboard';
import MessagingTest from './pages/MessagingTest';
import SimpleChat from './pages/SimpleChat';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeContext } from './contexts/ThemeContext';
import { getCurrentUserId, getUserType } from './utils/authUtils';
import socketService from './services/socketService';
import ProfessionalPublicProfileSetup from './components/Profile/ProfessionalPublicProfileSetup';

// Helper function for direct auth check
function checkDirectAuth() {
  const token = localStorage.getItem('token');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return !!token || isLoggedIn;
}

// AppRoutes component that has access to AuthContext
function AppRoutes() {
  const [notifications, setNotifications] = useState([]);
  const { isAuthenticated, refreshAuthState } = useAuth();
  
  // Ensure auth state is synchronized
  useEffect(() => {
    const directAuth = checkDirectAuth();
    if (directAuth !== isAuthenticated) {
      console.log('Auth state mismatch detected in AppRoutes, refreshing context');
      refreshAuthState();
    }
  }, [isAuthenticated, refreshAuthState]);

  // Listen for message notifications
  useEffect(() => {
    if (checkDirectAuth()) {
      const token = localStorage.getItem('token');
      if (token) {
        // Initialize socket connection
        socketService.connect(token);
        
        // Set up listener for message notifications
        socketService.onMessageNotification((data) => {
          const { message, thread } = data;
          
          // Skip notifications for the current user's messages
          if (message.sender._id === getCurrentUserId()) {
            return;
          }
          
          // Create a notification
          const notification = {
            id: Date.now().toString(),
            threadId: thread._id,
            senderName: `${message.sender.firstName} ${message.sender.lastName}`,
            senderAvatar: message.sender.profilePicture || null,
            preview: message.content || '',
            hasAttachments: message.attachments && message.attachments.length > 0
          };
          
          setNotifications(prev => [notification, ...prev].slice(0, 5)); // Keep last 5
        });
      }
    }
    
    return () => {
      // Clean up
      socketService.removeListener('message-notification');
    };
  }, []);

  // Handle notification dismiss
  const handleDismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  // Handle navigation to a thread
  const handleNavigateToThread = (threadId) => {
    // This gets handled by the component
  };

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={!checkDirectAuth() ? <Home /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!checkDirectAuth() ? <LoginForm /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={!checkDirectAuth() ? <RegisterForm /> : <Navigate to="/dashboard" replace />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={checkDirectAuth() ? <><Navbar /><Dashboard /></> : <Navigate to="/login" state={{ from: '/dashboard' }} replace />} />
        <Route path="/profile" element={checkDirectAuth() ? <><Navbar /><Profile /></> : <Navigate to="/login" replace />} />
        <Route path="/profile-setup" element={checkDirectAuth() ? <><Navbar /><Profile /></> : <Navigate to="/login" replace />} />
        <Route path="/messaging" element={checkDirectAuth() ? <><Navbar /><Messaging /></> : <Navigate to="/login" replace />} />
        <Route path="/search" element={checkDirectAuth() ? <><Navbar /><ProfessionalDiscovery /></> : <Navigate to="/login" replace />} />
        <Route path="/matches" element={checkDirectAuth() ? <><Navbar /><Matches /></> : <Navigate to="/login" replace />} />
        <Route path="/coffee-chats" element={checkDirectAuth() ? <><Navbar /><CoffeeChats /></> : <Navigate to="/login" replace />} />
        <Route path="/professionals" element={checkDirectAuth() ? <><Navbar /><ProfessionalDiscovery /></> : <Navigate to="/login" replace />} />
        <Route path="/register/professional" element={checkDirectAuth() ? <><Navbar /><RegisterProfessional /></> : <Navigate to="/login" replace />} />
        <Route path="/register/seeker" element={checkDirectAuth() ? <><Navbar /><RegisterSeeker /></> : <Navigate to="/login" replace />} />
        <Route path="/test" element={checkDirectAuth() ? <><Navbar /><MessagingTest /></> : <Navigate to="/login" replace />} />
        <Route path="/simple-chat" element={checkDirectAuth() ? <><Navbar /><SimpleChat /></> : <Navigate to="/login" replace />} />
        <Route path="/admin" element={checkDirectAuth() ? <><Navbar /><AdminDashboard /></> : <Navigate to="/login" replace />} />
        <Route path="/public-profile-setup" element={checkDirectAuth() && getUserType() === 'professional' ? <><Navbar /><ProfessionalPublicProfileSetup /></> : <Navigate to="/login" replace />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Message Notifications */}
      {checkDirectAuth() && (
        <MessageNotifications 
          notifications={notifications} 
          onDismiss={handleDismissNotification}
          onNavigate={handleNavigateToThread}
        />
      )}
    </>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  // Create theme based on dark mode preference
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2563EB', // Blue-600 from design system
        dark: '#1D4ED8',
        light: '#DBEAFE',
      },
      secondary: {
        main: '#4F46E5', // Indigo-600 from design system
        dark: '#4338CA',
        light: '#E0E7FF',
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
            default: '#0F172A', // Slate-900 for dark mode
            paper: '#1E293B',   // Slate-800 for dark mode
          }
        : {
            default: '#F8FAFC', // Gray-50 from design system
            paper: '#FFFFFF',
          },
      text: darkMode
        ? {
            primary: '#F1F5F9', // Slate-100 for dark mode
            secondary: '#94A3B8', // Slate-400 for dark mode
          }
        : {
            primary: '#1E293B', // Gray-800 from design system
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
            background: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
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
            <Router>
              <AppRoutes />
            </Router>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App; 