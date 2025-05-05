import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid,
  Paper,
  styled
} from '@mui/material';
import Card from '../UI/Card';
import Button from '../UI/Button';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Time slot interface
interface TimeSlot {
  id: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface TimeSlotPickerProps {
  timeSlots: TimeSlot[];
  onSelectTimeSlot: (slotId: string) => void;
  selectedSlotId?: string;
}

// Styled components
const SlotPaper = styled(Paper, {
  shouldForwardProp: (prop) => 
    !['isSelected', 'isAvailable'].includes(prop as string)
})<{ 
  isSelected?: boolean;
  isAvailable: boolean;
}>(({ theme, isSelected, isAvailable }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  cursor: isAvailable ? 'pointer' : 'not-allowed',
  border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
  borderColor: isSelected 
    ? theme.palette.primary.main 
    : isAvailable 
      ? theme.palette.divider 
      : theme.palette.divider,
  backgroundColor: isAvailable 
    ? isSelected 
      ? alpha(theme.palette.primary.main, 0.1)
      : theme.palette.background.paper
    : theme.palette.action.disabledBackground,
  opacity: isAvailable ? 1 : 0.7,
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: isAvailable 
      ? isSelected 
        ? alpha(theme.palette.primary.main, 0.15)
        : alpha(theme.palette.primary.main, 0.05)
      : theme.palette.action.disabledBackground,
    transform: isAvailable ? 'translateY(-2px)' : 'none',
    boxShadow: isAvailable ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
  },
  '&:active': {
    transform: isAvailable ? 'translateY(0)' : 'none',
    backgroundColor: isAvailable 
      ? alpha(theme.palette.primary.main, 0.2)
      : theme.palette.action.disabledBackground,
  },
}));

// Helper function to get alpha color
function alpha(color: string, value: number) {
  return color + Math.round(value * 255).toString(16).padStart(2, '0');
}

// Group time slots by day
const groupSlotsByDay = (slots: TimeSlot[]) => {
  const grouped: Record<string, TimeSlot[]> = {};
  
  slots.forEach(slot => {
    if (!grouped[slot.date]) {
      grouped[slot.date] = [];
    }
    grouped[slot.date].push(slot);
  });
  
  return grouped;
};

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  timeSlots,
  onSelectTimeSlot,
  selectedSlotId
}) => {
  const groupedSlots = groupSlotsByDay(timeSlots);
  const dates = Object.keys(groupedSlots);
  // Track clicked animation state
  const [clickedSlotId, setClickedSlotId] = useState<string | null>(null);

  // Format the date for display
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle slot click with animation
  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.isAvailable) return;
    
    setClickedSlotId(slot.id);
    onSelectTimeSlot(slot.id);
    
    // Reset animation after a short delay
    setTimeout(() => {
      setClickedSlotId(null);
    }, 300);
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Select a Time Slot
      </Typography>
      
      {dates.length === 0 ? (
        <Typography>No available time slots</Typography>
      ) : (
        dates.map((date) => (
          <Box key={date} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              {formatDateHeader(date)}
            </Typography>
            
            <Grid container spacing={2}>
              {groupedSlots[date].map((slot) => (
                <Grid item xs={12} sm={6} md={4} key={slot.id}>
                  <SlotPaper
                    isSelected={selectedSlotId === slot.id}
                    isAvailable={slot.isAvailable}
                    onClick={() => handleSlotClick(slot)}
                    sx={{
                      transform: clickedSlotId === slot.id ? 'scale(0.95)' : 'scale(1)',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 1
                    }}>
                      <AccessTimeIcon 
                        fontSize="small" 
                        color={slot.isAvailable ? "primary" : "disabled"} 
                        sx={{ mr: 1 }} 
                      />
                      <Typography 
                        variant="subtitle2"
                        color={!slot.isAvailable ? "text.disabled" : "text.primary"}
                      >
                        {slot.startTime} - {slot.endTime}
                      </Typography>
                    </Box>
                    
                    {!slot.isAvailable && (
                      <Typography variant="caption" color="error">
                        Unavailable
                      </Typography>
                    )}
                    
                    {selectedSlotId === slot.id && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="primary.main" fontWeight={600}>
                          Selected
                        </Typography>
                      </Box>
                    )}
                  </SlotPaper>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  );
};

export default TimeSlotPicker; 