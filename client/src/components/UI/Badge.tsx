import React from 'react';
import { 
  Box, 
  BoxProps, 
  styled 
} from '@mui/material';

// Badge variants
type BadgeVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
type BadgeSize = 'small' | 'medium' | 'large';

// Extended props interface
interface BadgeProps extends BoxProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  pill?: boolean;
  outlined?: boolean;
}

// Badge color configurations
const badgeColors = {
  primary: {
    bg: '#EBF5FF',
    text: '#2563EB',
    border: '#BFDBFE',
  },
  secondary: {
    bg: '#EEF2FF',
    text: '#4F46E5',
    border: '#C7D2FE',
  },
  success: {
    bg: '#ECFDF5',
    text: '#059669',
    border: '#A7F3D0',
  },
  error: {
    bg: '#FEF2F2',
    text: '#DC2626',
    border: '#FECACA',
  },
  warning: {
    bg: '#FFFBEB',
    text: '#D97706',
    border: '#FDE68A',
  },
  info: {
    bg: '#F0F9FF',
    text: '#0284C7',
    border: '#BAE6FD',
  },
};

// Badge size configurations
const badgeSizes = {
  small: {
    px: '0.5rem',
    py: '0.125rem',
    fontSize: '0.75rem',
  },
  medium: {
    px: '0.75rem',
    py: '0.25rem',
    fontSize: '0.875rem',
  },
  large: {
    px: '1rem',
    py: '0.375rem',
    fontSize: '1rem',
  },
};

// Styled Box component for the badge
const StyledBadge = styled(Box, {
  shouldForwardProp: (prop) => 
    !['variant', 'pill', 'outlined', 'badgeSize'].includes(prop as string)
})<BadgeProps & { badgeSize?: BadgeSize }>(({ 
  theme, 
  variant = 'primary', 
  pill = false,
  outlined = false,
  badgeSize = 'medium'
}) => {
  const colors = badgeColors[variant];
  const size = badgeSizes[badgeSize];
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: pill ? '9999px' : '0.375rem',
    fontWeight: 500,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    
    // Apply size
    padding: `${size.py} ${size.px}`,
    fontSize: size.fontSize,
    
    // Styling based on outlined vs filled
    ...(outlined
      ? {
          backgroundColor: 'transparent',
          color: colors.text,
          border: `1px solid ${colors.border}`,
        }
      : {
          backgroundColor: colors.bg,
          color: colors.text,
          border: 'none',
        }),
  };
});

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  pill = false,
  outlined = false,
  ...props 
}) => {
  return (
    <StyledBadge
      variant={variant}
      badgeSize={size}
      pill={pill}
      outlined={outlined}
      {...props}
    >
      {children}
    </StyledBadge>
  );
};

export default Badge; 