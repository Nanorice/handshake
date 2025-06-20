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
  Chip,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ChatIcon from '@mui/icons-material/Chat';
import EmailIcon from '@mui/icons-material/Email';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import LocalCafe from '@mui/icons-material/LocalCafe';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import { getUserType } from '../utils/authUtils';
import { getInvitationNotifications } from '../services/invitationService';
import NotificationCenter from './NotificationCenter';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadInvitations, setUnreadInvitations] = useState(0);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: ''
  });
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Hide text, show icons only
  const isExtraSmall = useMediaQuery(theme.breakpoints.down('sm')); // Show hamburger menu
  
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

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    console.log('Logging out from Navbar');
    handleClose();
    handleMobileMenuClose();
    logout();
  };

  // Navigation items for authenticated users
  const navItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      show: directlyAuthenticated
    },
    {
      text: 'Find Professionals',
      icon: <LocalCafe />,
      path: '/professionals',
      show: directlyAuthenticated
    },
    {
      text: 'Schedule History',
      icon: <CalendarMonth />,
      path: '/coffee-chats',
      show: directlyAuthenticated
    },
    {
      text: 'Messages',
      icon: <Badge badgeContent={unreadMessages} color="error"><ChatIcon /></Badge>,
      path: '/messages',
      show: directlyAuthenticated
    },
    {
      text: 'Admin',
      icon: <AdminPanelSettingsIcon />,
      path: '/admin',
      show: isAdmin
    }
  ];

  // Desktop/Tablet Navigation (md and up)
  const renderDesktopNav = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
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
              fontSize: '0.95rem',
              ...(isMobile && { minWidth: 'auto', px: 1 })
            }}
          >
            {isMobile ? 'Join' : 'Register'}
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
              px: isMobile ? 1.5 : 2
            }}
          >
            Login
          </Button>
        </>
      )}
      
      {directlyAuthenticated && navItems.map((item) => 
        item.show && (
          <Tooltip key={item.path} title={isMobile ? item.text : ''}>
            {isMobile ? (
              <IconButton 
                color="inherit" 
                component={Link} 
                to={item.path}
                sx={{ 
                  ...(isProfessional && location.pathname === item.path && { 
                    color: theme.palette.primary.main
                  })
                }}
              >
                {item.icon}
              </IconButton>
            ) : (
              <Button 
                color="inherit" 
                component={Link} 
                to={item.path}
                sx={{ 
                  fontWeight: 500, 
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  ...(isProfessional && location.pathname === item.path && { 
                    color: theme.palette.primary.main,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                    borderRadius: 0,
                    paddingBottom: '4px'
                  })
                }}
                startIcon={item.path !== '/messages' ? item.icon : undefined}
              >
                {item.path === '/messages' ? (
                  <Badge badgeContent={unreadMessages} color="error">
                    <ChatIcon sx={{ mr: 1 }} />
                  </Badge>
                ) : null}
                {item.text}
              </Button>
            )}
          </Tooltip>
        )
      )}

      {/* Notification Center - only for authenticated users */}
      {directlyAuthenticated && <NotificationCenter />}

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

      {/* User Menu */}
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
    </Box>
  );

  // Mobile Navigation (sm and below)
  const renderMobileNav = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Dark Mode Toggle */}
      <Tooltip title={`Toggle ${isDarkMode ? 'light' : 'dark'} mode`}>
        <IconButton 
          onClick={toggleTheme} 
          color="inherit" 
          size="small"
        >
          {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Tooltip>
      
      {/* Hamburger Menu */}
      <IconButton
        color="inherit"
        onClick={handleMobileMenuToggle}
        edge="end"
      >
        <MenuIcon />
      </IconButton>
    </Box>
  );

  return (
    <>
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
                  mr: 1,
                  fontSize: isExtraSmall ? '1.1rem' : '1.25rem'
                }}
              >
                Handshake
              </Typography>
              {isProfessional && !isExtraSmall && (
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
            
            {/* Responsive Navigation */}
            {isExtraSmall ? renderMobileNav() : renderDesktopNav()}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Desktop User Menu */}
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
        <MenuItem component={Link} to="/profile" onClick={handleClose}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          Profile
        </MenuItem>
        {userType === 'professional' && (
          <MenuItem component={Link} to="/public-profile-setup" onClick={handleClose}>
            <ListItemIcon><WorkOutlineIcon fontSize="small" /></ListItemIcon>
            Public Profile
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        PaperProps={{
          sx: { 
            width: 280,
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <Box sx={{ pt: 2 }}>
          {/* User Info Header */}
          {directlyAuthenticated && (
            <Box sx={{ px: 2, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AccountCircle sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {userData.firstName} {userData.lastName}
                  </Typography>
                  {isProfessional && (
                    <Chip
                      label="Professional"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        backgroundColor: theme.palette.primary.main,
                        color: '#fff'
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          )}

          <List>
            {/* Navigation Items */}
            {!directlyAuthenticated ? (
              <>
                <ListItem button component={Link} to="/register" onClick={handleMobileMenuClose}>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Register" />
                </ListItem>
                <ListItem button component={Link} to="/login" onClick={handleMobileMenuClose}>
                  <ListItemIcon><AccountCircle /></ListItemIcon>
                  <ListItemText primary="Login" />
                </ListItem>
              </>
            ) : (
              <>
                {navItems.map((item) => 
                  item.show && (
                    <ListItem 
                      key={item.path}
                      button 
                      component={Link} 
                      to={item.path} 
                      onClick={handleMobileMenuClose}
                      sx={{
                        ...(location.pathname === item.path && {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          borderRight: `3px solid ${theme.palette.primary.main}`
                        })
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItem>
                  )
                )}
                
                <Divider sx={{ my: 1 }} />
                
                {/* Profile Items */}
                <ListItem button component={Link} to="/profile" onClick={handleMobileMenuClose}>
                  <ListItemIcon><PersonIcon /></ListItemIcon>
                  <ListItemText primary="Profile" />
                </ListItem>
                
                {userType === 'professional' && (
                  <ListItem button component={Link} to="/public-profile-setup" onClick={handleMobileMenuClose}>
                    <ListItemIcon><WorkOutlineIcon /></ListItemIcon>
                    <ListItemText primary="Public Profile" />
                  </ListItem>
                )}
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem button onClick={handleLogout}>
                  <ListItemIcon><LogoutIcon /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar; 