import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Stack,
  Rating
} from '@mui/material';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import Avatar from '../UI/Avatar';
import Button from '../UI/Button';

interface ProfessionalCardProps {
  professional: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    industry: string;
    seniority: string;
    expertise: string[];
    hourlyRate: number;
    bio: string;
    isVerified: boolean;
    rating: number;
    totalSessions: number;
  };
  onRequestChat?: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  professional,
  onRequestChat,
  onViewProfile
}) => {
  const {
    id,
    firstName,
    lastName,
    profilePicture,
    industry,
    seniority,
    expertise,
    hourlyRate,
    bio,
    isVerified,
    rating,
    totalSessions
  } = professional;

  // Truncate bio if it's too long
  const truncatedBio = bio.length > 150 
    ? `${bio.substring(0, 150)}...` 
    : bio;

  return (
    <Card 
      elevation={2}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Verification badge */}
      {isVerified && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 2
          }}
        >
          <Badge variant="success" pill>
            Verified
          </Badge>
        </Box>
      )}

      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          src={profilePicture} 
          alt={`${firstName} ${lastName}`} 
          size="lg"
        />
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {firstName} {lastName}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {seniority} • {industry}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Rating 
              value={rating} 
              precision={0.5} 
              readOnly 
              size="small" 
            />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {rating.toFixed(1)} ({totalSessions} sessions)
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />
      
      <Box sx={{ p: 2, flexGrow: 1 }}>
        <Typography variant="body2" paragraph>
          {truncatedBio}
        </Typography>
        
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
          Expertise
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {expertise.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="primary" size="small">
              {skill}
            </Badge>
          ))}
          {expertise.length > 3 && (
            <Typography variant="body2" color="text.secondary">
              +{expertise.length - 3} more
            </Typography>
          )}
        </Stack>
      </Box>
      
      <Box sx={{ 
        p: 2, 
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography variant="h6" color="primary" fontWeight={600}>
          ${hourlyRate}/hour
        </Typography>
        <Box>
          <Button 
            colorVariant="outline" 
            size="small" 
            onClick={() => onViewProfile?.(id)}
            sx={{ mr: 1 }}
          >
            View Profile
          </Button>
          <Button 
            colorVariant="primary" 
            size="small"
            onClick={() => onRequestChat?.(id)}
          >
            Request Chat
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default ProfessionalCard; 