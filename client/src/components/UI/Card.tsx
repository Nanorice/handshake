import React from 'react';
import { 
  Paper, 
  PaperProps, 
  Box,
  Typography,
  styled
} from '@mui/material';

// Extended props interface
interface CardProps extends PaperProps {
  title?: string;
  subtitle?: string;
  elevation?: number;
  headerBg?: 'primary' | 'secondary' | 'success' | 'error' | 'default';
  noPadding?: boolean;
}

// Styled Paper component for the card
const StyledCard = styled(Paper, {
  shouldForwardProp: (prop) => 
    !['headerBg', 'noPadding'].includes(prop as string)
})<CardProps>(({ theme, noPadding }) => ({
  borderRadius: '0.75rem',
  overflow: 'hidden',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  padding: noPadding ? 0 : '1.5rem',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

// Styled header component
const CardHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'bg'
})<{ bg?: CardProps['headerBg'] }>(({ theme, bg }) => ({
  padding: '1rem 1.5rem',
  borderBottom: '1px solid',
  borderColor: theme.palette.divider,
  marginBottom: '1rem',
  marginLeft: '-1.5rem',
  marginRight: '-1.5rem',
  marginTop: '-1.5rem',
  
  ...(bg === 'primary' && {
    backgroundColor: '#2563EB',
    color: '#FFF',
    borderColor: '#2563EB'
  }),
  
  ...(bg === 'secondary' && {
    backgroundColor: '#4F46E5',
    color: '#FFF',
    borderColor: '#4F46E5'
  }),
  
  ...(bg === 'success' && {
    backgroundColor: '#059669',
    color: '#FFF',
    borderColor: '#059669'
  }),
  
  ...(bg === 'error' && {
    backgroundColor: '#DC2626',
    color: '#FFF',
    borderColor: '#DC2626'
  }),
  
  ...(bg === 'default' && {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
  }),
}));

// Styled content component
const CardContent = styled(Box)(({ theme }) => ({
  padding: 0,
}));

const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  subtitle,
  headerBg,
  elevation = 2,
  noPadding = false,
  ...props 
}) => {
  // If noPadding is true, we need to make sure children handle their own padding
  return (
    <StyledCard 
      elevation={elevation} 
      noPadding={noPadding}
      {...props}
    >
      {(title || subtitle) && (
        <CardHeader bg={headerBg}>
          {title && (
            <Typography variant="h6" component="h2" fontWeight={600}>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color={headerBg ? 'inherit' : 'text.secondary'}>
              {subtitle}
            </Typography>
          )}
        </CardHeader>
      )}
      
      <CardContent>
        {children}
      </CardContent>
    </StyledCard>
  );
};

export default Card; 