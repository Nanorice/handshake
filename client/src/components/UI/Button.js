import React from 'react';
import { Button as MuiButton } from '@mui/material';

// A simplified Button component that wraps MUI Button
const Button = ({ 
  children, 
  colorVariant = 'primary', 
  size = 'medium',
  ...props 
}) => {
  // Map our custom variants to MUI variants and colors
  const getMuiProps = () => {
    switch (colorVariant) {
      case 'primary':
        return { variant: 'contained', color: 'primary' };
      case 'secondary':
        return { variant: 'contained', color: 'secondary' };
      case 'success':
        return { variant: 'contained', color: 'success' };
      case 'error':
        return { variant: 'contained', color: 'error' };
      case 'outline':
        return { variant: 'outlined', color: 'primary' };
      case 'text':
        return { variant: 'text', color: 'primary' };
      default:
        return { variant: 'contained', color: 'primary' };
    }
  };

  const muiProps = getMuiProps();

  return (
    <MuiButton
      size={size}
      {...muiProps}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button; 