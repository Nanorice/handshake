import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  Snackbar, 
  Alert,
  Typography,
  Box,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const NotificationContext = createContext();

/**
 * Hook to use the notification context
 * @returns {Object} Notification context methods and state
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

/**
 * Provider component for notification context
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  /**
   * Add a new notification
   * @param {Object} notification Notification data
   * @param {string} notification.type Type of notification ('success', 'error', 'info', 'warning')
   * @param {string} notification.message Message to display
   * @param {string} notification.title Optional title
   * @param {number} notification.duration Duration in ms, defaults to 6000ms
   */
  const addNotification = useCallback((notification) => {
    const id = Date.now();
    setNotifications(prev => [
      ...prev,
      {
        id,
        type: notification.type || 'info',
        message: notification.message,
        title: notification.title,
        severity: notification.severity || 'info',
        duration: notification.duration || 6000
      }
    ]);

    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 6000);
    }

    return id;
  }, []);

  /**
   * Remove a notification by ID
   * @param {number} id The notification ID to remove
   */
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  /**
   * Remove all notifications
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Render the actual notifications as Snackbars
  const notificationElements = notifications.map((notification) => (
    <Snackbar
      key={notification.id}
      open={true}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        severity={notification.severity}
        sx={{ minWidth: '300px', width: '100%' }}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => removeNotification(notification.id)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {notification.title && (
          <Typography variant="subtitle2" component="div" fontWeight="bold">
            {notification.title}
          </Typography>
        )}
        <Box sx={{ mt: notification.title ? 0.5 : 0 }}>
          {notification.message}
        </Box>
      </Alert>
    </Snackbar>
  ));

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications
      }}
    >
      {children}
      {notificationElements}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 