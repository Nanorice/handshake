import React from 'react';
import { 
  Button as MuiButton, 
  ButtonProps as MuiButtonProps,
  styled
} from '@mui/material';

// Extended props interface
interface ButtonProps extends MuiButtonProps {
  colorVariant?: 'primary' | 'secondary' | 'success' | 'error' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
}

// Styled MUI Button component based on our design system
const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== 'colorVariant'
})<ButtonProps>(({ theme, colorVariant, size }) => ({
  borderRadius: '0.5rem',
  textTransform: 'none',
  fontWeight: 600,
  fontFamily: '"Inter", sans-serif',
  boxShadow: colorVariant === 'outline' || colorVariant === 'text' ? 'none' : theme.shadows[2],
  padding: size === 'large' ? '0.75rem 1.5rem' : 
           size === 'small' ? '0.25rem 0.75rem' : 
           '0.5rem 1rem',
  fontSize: size === 'large' ? '1rem' : 
            size === 'small' ? '0.875rem' : 
            '0.9375rem',
  
  // Custom styling based on our variant prop
  ...(colorVariant === 'primary' && {
    backgroundColor: '#2563EB', // Primary blue from design system
    color: '#FFF',
    '&:hover': {
      backgroundColor: '#1D4ED8', // Darker blue on hover
    },
  }),
  
  ...(colorVariant === 'secondary' && {
    backgroundColor: '#4F46E5', // Secondary indigo from design system
    color: '#FFF',
    '&:hover': {
      backgroundColor: '#4338CA', // Darker indigo on hover
    },
  }),
  
  ...(colorVariant === 'success' && {
    backgroundColor: '#059669', // Success green from design system
    color: '#FFF',
    '&:hover': {
      backgroundColor: '#047857', // Darker green on hover
    },
  }),
  
  ...(colorVariant === 'error' && {
    backgroundColor: '#DC2626', // Error red from design system
    color: '#FFF',
    '&:hover': {
      backgroundColor: '#B91C1C', // Darker red on hover
    },
  }),
  
  ...(colorVariant === 'outline' && {
    backgroundColor: 'transparent',
    borderColor: '#2563EB', // Primary blue
    color: '#2563EB',
    '&:hover': {
      backgroundColor: 'rgba(37, 99, 235, 0.04)', // Very light blue background on hover
    },
  }),
  
  ...(colorVariant === 'text' && {
    backgroundColor: 'transparent',
    color: '#2563EB', // Primary blue
    '&:hover': {
      backgroundColor: 'rgba(37, 99, 235, 0.04)', // Very light blue background on hover
    },
  }),
}));

// Our Button component
const Button: React.FC<ButtonProps> = ({ 
  children, 
  colorVariant = 'primary', 
  size = 'medium',
  ...props 
}) => {
  // Map our custom variants to MUI variants
  const getMuiVariant = () => {
    switch (colorVariant) {
      case 'primary':
      case 'secondary':
      case 'success':
      case 'error':
        return 'contained';
      case 'outline':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  return (
    <StyledButton
      variant={getMuiVariant()}
      size={size}
      colorVariant={colorVariant}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button; 