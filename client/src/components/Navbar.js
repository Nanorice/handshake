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
  Tooltip
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ChatIcon from '@mui/icons-material/Chat';
import { ThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { user, isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: ''
  });

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
    if (isAuthenticated) {
      const token = localStorage.getItem('token');
      if (token) {
        // Ensure socket is connected
        if (!socketService.isSocketConnected()) {
          socketService.connect(token);
        }
        
        // Listen for message notifications
        const handleMessageNotification = (data) => {
          console.log('Message notification received in Navbar:', data);
          setUnreadCount(prevCount => {
            const newCount = prevCount + 1;
            console.log(`Updated unread count: ${prevCount} → ${newCount}`);
            return newCount;
          });
        };
        
        socketService.onMessageNotification(handleMessageNotification);
        
        // Clean up listener when component unmounts
        return () => {
          socketService.removeListener('message-notification');
        };
      }
    }
  }, [isAuthenticated]);

  // Reset unread count when navigating to messaging
  useEffect(() => {
    if (location.pathname === '/messaging') {
      setUnreadCount(0);
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
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        backdropFilter: 'blur(8px)',
        color: theme.palette.text.primary
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ px: 0 }}>
          <Typography 
            variant="h6" 
            component={Link} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: theme.palette.primary.main,
              fontWeight: 700,
              letterSpacing: '0.5px'
            }}
          >
            Handshake
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              color="inherit" 
              component={Link} 
              to="/"
              sx={{ 
                fontWeight: 500, 
                textTransform: 'none',
                fontSize: '0.95rem'
              }}
            >
              Home
            </Button>
            
            {!isAuthenticated && (
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
            {isAuthenticated && (
              <>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/dashboard"
                  sx={{ 
                    fontWeight: 500, 
                    textTransform: 'none',
                    fontSize: '0.95rem'
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
                <IconButton
                  color="primary"
                  component={Link}
                  to="/messaging"
                  sx={{ 
                    fontSize: '0.95rem',
                    position: 'relative'
                  }}
                  aria-label="Messaging"
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <ChatIcon />
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
            <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
              <IconButton 
                color="inherit" 
                onClick={toggleDarkMode} 
                aria-label="toggle dark mode"
              >
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>

            {isAuthenticated && (
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