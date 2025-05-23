import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Chip, 
  Tooltip, 
  Badge,
  CircularProgress
} from '@mui/material';
import {
  SignalWifi4Bar as ConnectedIcon,
  SignalWifiOff as DisconnectedIcon,
  SignalWifiStatusbar4Bar as ReconnectingIcon,
  CloudQueue as CloudIcon
} from '@mui/icons-material';
import socketService from '../../services/socketService';

/**
 * ConnectionStatus component to show real-time connection status
 * 
 * @returns {JSX.Element} Connection status indicator
 */
const ConnectionStatus = () => {
  const [status, setStatus] = useState({
    isConnected: false,
    isReconnecting: false,
    connectionAttempts: 0,
    queuedMessages: 0
  });
  
  // Update status periodically
  useEffect(() => {
    const updateStatus = () => {
      try {
        const currentStatus = socketService.getConnectionStatus();
        // Add defensive checks to ensure all properties exist
        setStatus({
          isConnected: !!currentStatus?.isConnected,
          isReconnecting: !!currentStatus?.isReconnecting,
          connectionAttempts: currentStatus?.connectionAttempts || 0,
          queuedMessages: currentStatus?.queuedMessages || 0
        });
      } catch (error) {
        console.error('Error getting connection status:', error);
        // Use default offline status
        setStatus({
          isConnected: false,
          isReconnecting: false,
          connectionAttempts: 0,
          queuedMessages: 0
        });
      }
    };
    
    // Update immediately
    updateStatus();
    
    // Then update every 2 seconds
    const intervalId = setInterval(updateStatus, 2000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Determine chip color based on connection status
  const getChipColor = () => {
    if (status.isConnected) return 'success';
    if (status.isReconnecting) return 'warning';
    return 'error';
  };
  
  // Get icon based on connection status
  const getStatusIcon = () => {
    if (status.isConnected) return <ConnectedIcon fontSize="small" />;
    if (status.isReconnecting) return <ReconnectingIcon fontSize="small" />;
    return <DisconnectedIcon fontSize="small" />;
  };
  
  // Get status text
  const getStatusText = () => {
    if (status.isConnected) return 'Connected';
    if (status.isReconnecting) return `Reconnecting (${status.connectionAttempts})`;
    return 'Offline';
  };
  
  // Get tooltip text with more details
  const getTooltipText = () => {
    if (status.isConnected) {
      if (status.queuedMessages > 0) {
        return `Connected - Sending ${status.queuedMessages} queued message(s)`;
      }
      return 'Connected to real-time messaging service';
    }
    
    if (status.isReconnecting) {
      return `Attempting to reconnect (try ${status.connectionAttempts})`;
    }
    
    if (status.queuedMessages > 0) {
      return `Offline - ${status.queuedMessages} message(s) queued to send when connected`;
    }
    
    return 'Not connected to messaging service';
  };
  
  return (
    <Tooltip title={getTooltipText()} arrow>
      <Box>
        {status.queuedMessages > 0 ? (
          <Badge 
            badgeContent={status.queuedMessages} 
            color="primary"
            overlap="circular"
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <Chip 
              icon={getStatusIcon()} 
              label={getStatusText()}
              color={getChipColor()}
              size="small"
              variant="outlined"
              sx={{ borderRadius: 4 }}
            />
          </Badge>
        ) : (
          <Chip 
            icon={getStatusIcon()} 
            label={getStatusText()}
            color={getChipColor()}
            size="small"
            variant="outlined"
            sx={{ borderRadius: 4 }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default ConnectionStatus; 