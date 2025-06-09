import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

// Mobile-first responsive component wrapper
export const MobileContainer = ({ children, maxWidth = "lg", sx = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box
      sx={{
        px: isMobile ? 1 : 3,
        py: isMobile ? 2 : 4,
        maxWidth: maxWidth,
        mx: 'auto',
        width: '100%',
        ...sx
      }}
    >
      {children}
    </Box>
  );
};

// Mobile-responsive dialog/modal wrapper
export const MobileDialog = ({ children, open, onClose, title, fullScreen = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.modal,
        display: open ? 'flex' : 'none',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        p: isMobile ? 0 : 2,
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: isMobile ? 0 : 1,
          width: isMobile ? '100%' : 'auto',
          height: isMobile && fullScreen ? '100%' : 'auto',
          maxWidth: isMobile ? '100%' : 600,
          maxHeight: isMobile ? '100%' : '90vh',
          overflow: 'auto',
          p: isMobile ? 2 : 3,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </Box>
    </Box>
  );
};

// Mobile-responsive grid system
export const MobileGrid = ({ children, spacing = 2 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: spacing,
        width: '100%'
      }}
    >
      {children}
    </Box>
  );
};

// Mobile-responsive card component
export const MobileCard = ({ children, sx = {} }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: isMobile ? 2 : 3,
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        ...sx
      }}
    >
      {children}
    </Box>
  );
};

export default {
  MobileContainer,
  MobileDialog,
  MobileGrid,
  MobileCard
};