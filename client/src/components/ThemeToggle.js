import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { IconButton, Tooltip, Box } from '@mui/material';
import { Brightness7, Brightness4 } from '@mui/icons-material';

const ThemeToggle = ({ variant = 'default', size = 'medium' }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  if (variant === 'animated') {
    return (
      <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
        <Box
          onClick={toggleTheme}
          sx={{
            position: 'relative',
            width: size === 'small' ? 40 : 48,
            height: size === 'small' ? 20 : 24,
            backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
            '&:hover': {
              backgroundColor: isDarkMode ? '#4b5563' : '#d1d5db',
              transform: 'scale(1.05)',
            },
          }}
        >
          {/* Toggle Slider */}
          <Box
            sx={{
              position: 'absolute',
              width: size === 'small' ? 16 : 20,
              height: size === 'small' ? 16 : 20,
              backgroundColor: '#ffffff',
              borderRadius: '50%',
              transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
              transform: isDarkMode 
                ? `translateX(${size === 'small' ? '20px' : '24px'})` 
                : 'translateX(0px)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Icon inside the slider */}
            {isDarkMode ? (
              <Brightness4 sx={{ fontSize: size === 'small' ? '10px' : '12px', color: '#374151' }} />
            ) : (
              <Brightness7 sx={{ fontSize: size === 'small' ? '10px' : '12px', color: '#f59e0b' }} />
            )}
          </Box>
          
          {/* Background Icons */}
          <Box
            sx={{
              position: 'absolute',
              left: '4px',
              opacity: isDarkMode ? 0 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            <Brightness7 sx={{ fontSize: size === 'small' ? '10px' : '12px', color: '#f59e0b' }} />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              right: '4px',
              opacity: isDarkMode ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          >
            <Brightness4 sx={{ fontSize: size === 'small' ? '10px' : '12px', color: '#ffffff' }} />
          </Box>
        </Box>
      </Tooltip>
    );
  }

  // Default Material-UI style toggle
  return (
    <Tooltip title={`Toggle ${isDarkMode ? 'light' : 'dark'} mode`}>
      <IconButton 
        onClick={toggleTheme} 
        color="inherit"
        size={size}
        sx={{
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {isDarkMode ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle; 