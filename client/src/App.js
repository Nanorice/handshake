import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import CoffeeChats from './pages/CoffeeChats';
import RegisterProfessional from './pages/RegisterProfessional';
import RegisterSeeker from './pages/RegisterSeeker';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import AdminDashboard from './pages/AdminDashboard';
import ProfessionalDiscovery from './pages/ProfessionalDiscovery';
import Dashboard from './pages/Dashboard';
import Messaging from './pages/Messaging';
import MessagingTest from './pages/MessagingTest';
import SimpleChat from './pages/SimpleChat';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeContext } from './contexts/ThemeContext';
import { getCurrentUserId, isAuthenticated } from './utils/authUtils';
import socketService from './services/socketService';
import MessageNotifications from './components/Messaging/MessageNotifications';

function App() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [notifications, setNotifications] = useState([]);

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

  // Listen for message notifications
  useEffect(() => {
    if (isAuthenticated()) {
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
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <AuthProvider>
            <Router>
              {isAuthenticated() && <Navbar />}
              <Routes>
                {/* Public routes */}
                <Route path="/" element={!isAuthenticated() ? <Home /> : <Navigate to="/dashboard" />} />
                <Route path="/login" element={!isAuthenticated() ? <LoginForm /> : <Navigate to="/dashboard" />} />
                <Route path="/register" element={!isAuthenticated() ? <RegisterForm /> : <Navigate to="/dashboard" />} />
                
                {/* Protected routes - modified to ensure dashboard accessibility */}
                <Route 
                  path="/dashboard" 
                  element={
                    localStorage.getItem('token') || localStorage.getItem('isLoggedIn') === 'true' ? 
                    <Dashboard /> : 
                    <Navigate to="/login" state={{ from: '/dashboard' }} />
                  } 
                />
                <Route path="/profile" element={isAuthenticated() ? <Profile /> : <Navigate to="/login" />} />
                <Route path="/profile-setup" element={isAuthenticated() ? <Profile /> : <Navigate to="/login" />} />
                <Route path="/messaging" element={isAuthenticated() ? <Messaging /> : <Navigate to="/login" />} />
                <Route path="/search" element={isAuthenticated() ? <ProfessionalDiscovery /> : <Navigate to="/login" />} />
                <Route path="/matches" element={isAuthenticated() ? <Matches /> : <Navigate to="/login" />} />
                <Route path="/coffee-chats" element={isAuthenticated() ? <CoffeeChats /> : <Navigate to="/login" />} />
                <Route path="/professionals" element={isAuthenticated() ? <ProfessionalDiscovery /> : <Navigate to="/login" />} />
                <Route path="/register/professional" element={isAuthenticated() ? <RegisterProfessional /> : <Navigate to="/login" />} />
                <Route path="/register/seeker" element={isAuthenticated() ? <RegisterSeeker /> : <Navigate to="/login" />} />
                <Route path="/test" element={isAuthenticated() ? <MessagingTest /> : <Navigate to="/login" />} />
                <Route path="/simple-chat" element={isAuthenticated() ? <SimpleChat /> : <Navigate to="/login" />} />
                <Route path="/admin" element={isAuthenticated() ? <AdminDashboard /> : <Navigate to="/login" />} />
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
              
              {/* Message Notifications */}
              {isAuthenticated() && (
                <MessageNotifications 
                  notifications={notifications} 
                  onDismiss={handleDismissNotification}
                  onNavigate={handleNavigateToThread}
                />
              )}
            </Router>
          </AuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App; 