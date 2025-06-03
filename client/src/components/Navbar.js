import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Container,
  useTheme,
  alpha,
  Badge,
  Tooltip,
  Chip
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ChatIcon from '@mui/icons-material/Chat';
import EmailIcon from '@mui/icons-material/Email';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import { getUserType } from '../utils/authUtils';
import { getInvitationNotifications } from '../services/invitationService';

// Add direct check function similar to App.js
const checkDirectAuth = () => {
  const token = localStorage.getItem('token');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return !!token || isLoggedIn;
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const { user, isAuthenticated, logout, refreshAuthState } = useAuth();
  const [directlyAuthenticated, setDirectlyAuthenticated] = useState(checkDirectAuth());
  const [anchorEl, setAnchorEl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadInvitations, setUnreadInvitations] = useState(0);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: ''
  });
  const userType = getUserType();
  const isProfessional = userType === 'professional';

  // Check direct auth status when route changes
  useEffect(() => {
    const currentAuthState = checkDirectAuth();
    setDirectlyAuthenticated(currentAuthState);
    
    // If there's a mismatch between direct auth check and context state, refresh context
    if (currentAuthState !== isAuthenticated) {
      console.log('Auth state mismatch detected in Navbar, refreshing context');
      refreshAuthState();
    }
  }, [location.pathname, isAuthenticated, refreshAuthState]);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setUserData({
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });
      setIsAdmin(user.userType === 'admin');
    } else {
      setUserData({ firstName: '', lastName: '' });
      setIsAdmin(false);
    }
  }, [user]);

  // Setup socket notification listener
  useEffect(() => {
    if (directlyAuthenticated) {
      const token = localStorage.getItem('token');
      if (token) {
        // Ensure socket is connected
        if (!socketService.isSocketConnected()) {
          socketService.connect(token);
        }
        
        // Listen for message notifications
        const handleMessageNotification = (data) => {
          console.log('Message notification received in Navbar:', data);
          setUnreadMessages(prevCount => {
            const newCount = prevCount + 1;
            console.log(`Updated unread messages count: ${prevCount} → ${newCount}`);
            return newCount;
          });
        };
        
        // Listen for invitation notifications
        const handleInvitationNotification = (data) => {
          console.log('Invitation notification received in Navbar:', data);
          setUnreadInvitations(prevCount => {
            const newCount = prevCount + 1;
            console.log(`Updated unread invitations count: ${prevCount} → ${newCount}`);
            return newCount;
          });
        };
        
        socketService.onMessageNotification(handleMessageNotification);
        socketService.onInvitationNotification(handleInvitationNotification);
        
        // Check for pending invitations
        fetchUnreadInvitations();
        
        // Clean up listener when component unmounts
        return () => {
          socketService.removeListener('message-notification');
          socketService.removeListener('invitation-notification');
        };
      }
    }
  }, [directlyAuthenticated]);

  // Fetch unread invitations count
  const fetchUnreadInvitations = async () => {
    try {
      const result = await getInvitationNotifications();
      if (result.success && result.data) {
        setUnreadInvitations(result.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching invitation notifications:', error);
    }
  };

  // Reset unread counts when navigating to respective pages
  useEffect(() => {
    if (location.pathname === '/messages') {
      setUnreadMessages(0);
    } else if (location.pathname === '/dashboard' || location.pathname === '/coffee-chats') {
      setUnreadInvitations(0);
    }
  }, [location.pathname]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    console.log('Logging out from Navbar');
    handleClose();
    logout();
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        background: 'transparent', 
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, isProfessional ? 0.2 : 0.1)}`,
        backdropFilter: 'blur(8px)',
        color: theme.palette.text.primary
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ px: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              component={Link} 
              to="/" 
              sx={{ 
                textDecoration: 'none', 
                color: theme.palette.primary.main,
                fontWeight: 700,
                letterSpacing: '0.5px',
                mr: 1
              }}
            >
              Handshake
            </Typography>
            {isProfessional && (
              <Chip
                label="Pro"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff'
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

            {!directlyAuthenticated && (
              <>
                <Button 
                  color="primary" 
                  component={Link} 
                  to="/register"
                  variant="text"
                  sx={{ 
                    fontWeight: 500, 
                    textTransform: 'none',
                    fontSize: '0.95rem'
                  }}
                >
                  Register
                </Button>
                <Button 
                  color="primary" 
                  component={Link} 
                  to="/login"
                  variant="contained"
                  disableElevation
                  sx={{ 
                    fontWeight: 500, 
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    borderRadius: '6px',
                    px: 2
                  }}
                >
                  Login
                </Button>
              </>
            )}
            {directlyAuthenticated && (
              <>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/dashboard"
                  sx={{ 
                    fontWeight: 500, 
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    ...(isProfessional && location.pathname === '/dashboard' && { 
                      color: theme.palette.primary.main,
                      borderBottom: `2px solid ${theme.palette.primary.main}`,
                      borderRadius: 0,
                      paddingBottom: '4px'
                    })
                  }}
                >
                  Dashboard
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/matches"
                  sx={{ 
                    fontWeight: 500, 
                    textTransform: 'none',
                    fontSize: '0.95rem'
                  }}
                >
                  Matches
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/coffee-chats"
                  sx={{ 
                    fontWeight: 500, 
                    textTransform: 'none',
                    fontSize: '0.95rem'
                  }}
                  startIcon={<CalendarMonth />}
                >
                  Schedule History
                </Button>
                <Tooltip title="Messages">
                  <IconButton 
                    color="inherit" 
                    component={Link} 
                    to="/messages"
                  >
                    <Badge badgeContent={unreadMessages} color="error">
                      <ChatIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <IconButton
                  color="primary"
                  component={Link}
                  to="/dashboard"
                  sx={{ 
                    fontSize: '0.95rem',
                    position: 'relative'
                  }}
                  aria-label="Coffee Chat Invitations"
                >
                  <Badge badgeContent={unreadInvitations} color="error">
                    <EmailIcon />
                  </Badge>
                </IconButton>
              </>
            )}
            {isAdmin && (
              <Button 
                color="inherit" 
                component={Link} 
                to="/admin"
                sx={{ 
                  fontWeight: 500, 
                  textTransform: 'none',
                  fontSize: '0.95rem'
                }}
              >
                Admin
              </Button>
            )}

            {/* Dark Mode Toggle */}
            <Tooltip title={`Toggle ${isDarkMode ? 'light' : 'dark'} mode`}>
              <IconButton 
                onClick={toggleTheme} 
                color="inherit" 
                sx={{ 
                  ...(isProfessional && {
                    color: isDarkMode ? '#fff' : theme.palette.primary.main
                  })
                }}
              >
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>

            {directlyAuthenticated && (
              <IconButton
                size="small"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="primary"
                sx={{ 
                  ml: 1,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  p: 0.75
                }}
              >
                <AccountCircle />
              </IconButton>
            )}
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                elevation: 2,
                sx: { mt: 1.5, minWidth: 180 }
              }}
            >
              <MenuItem component={Link} to="/profile" onClick={handleClose}>Profile</MenuItem>
              {userType === 'professional' && (
                <MenuItem component={Link} to="/public-profile-setup" onClick={handleClose}>
                  Public Profile
                </MenuItem>
              )}
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 