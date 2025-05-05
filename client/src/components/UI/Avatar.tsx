import React from 'react';
import { 
  Avatar as MuiAvatar, 
  AvatarProps as MuiAvatarProps,
  styled
} from '@mui/material';

// Extended props interface
interface AvatarProps extends MuiAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

// Determine the size in pixels
const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

// Status color map
const statusColorMap = {
  online: '#10B981', // green
  offline: '#9CA3AF', // gray
  busy: '#EF4444', // red
  away: '#F59E0B', // amber
};

// Styled Avatar component
const StyledAvatar = styled(MuiAvatar, {
  shouldForwardProp: (prop) => !['size', 'status'].includes(prop as string),
})<AvatarProps>(({ size = 'md' }) => ({
  width: sizeMap[size],
  height: sizeMap[size],
  fontSize: size === 'xl' ? '1.5rem' : 
            size === 'lg' ? '1.25rem' : 
            size === 'md' ? '1rem' : 
            size === 'sm' ? '0.875rem' : 
            '0.75rem',
  fontWeight: 600,
  position: 'relative',
  fontFamily: '"Inter", sans-serif',
  backgroundColor: '#4F46E5', // Secondary color from design system
  color: '#FFFFFF',
  border: '2px solid #FFFFFF',
  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05)',
}));

// Styled status indicator
const StatusIndicator = styled('div', {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status: AvatarProps['status'] }>(({ status }) => ({
  position: 'absolute',
  bottom: '0',
  right: '0',
  width: '25%',
  height: '25%',
  minWidth: '8px',
  minHeight: '8px',
  maxWidth: '12px',
  maxHeight: '12px',
  borderRadius: '50%',
  border: '2px solid #FFFFFF',
  backgroundColor: status ? statusColorMap[status] : 'transparent',
  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05)',
}));

// We need to get initials from name if no image is provided
const getInitials = (name: string): string => {
  if (!name) return '';
  
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ 
  size = 'md',
  status,
  alt,
  src,
  children,
  ...props 
}) => {
  // If children are provided, use them
  // If not and alt is provided, generate initials from alt
  // Otherwise, use the default MUI behavior
  let avatarContent = children;
  if (!avatarContent && alt && !src) {
    avatarContent = getInitials(alt);
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <StyledAvatar
        size={size}
        alt={alt}
        src={src}
        {...props}
      >
        {avatarContent}
      </StyledAvatar>
      {status && <StatusIndicator status={status} />}
    </div>
  );
};

export default Avatar; 