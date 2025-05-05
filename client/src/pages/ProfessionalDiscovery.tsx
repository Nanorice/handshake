import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs, 
  Link as MuiLink,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import ProfessionalSearch from '../components/Professional/ProfessionalSearch';
import TimeSlotPicker from '../components/CoffeeChat/TimeSlotPicker';
import Button from '../components/UI/Button';

// Mock data for demonstration
import { MOCK_PROFESSIONALS, MOCK_TIME_SLOTS } from '../mockData';

const ProfessionalDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string | null>(null);

  // Handle professional filter changes and loading
  const handleLoadProfessionals = async (filters: any) => {
    // In a real app, this would be an API call using the filters
    console.log('Filters applied:', filters);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return MOCK_PROFESSIONALS;
  };

  // Handle requesting a coffee chat
  const handleRequestChat = (professionalId: string) => {
    setSelectedProfessionalId(professionalId);
    setIsBookingDialogOpen(true);
  };

  // Handle viewing a professional's profile
  const handleViewProfile = (professionalId: string) => {
    navigate(`/professionals/${professionalId}`);
  };

  // Handle selecting a time slot
  const handleSelectTimeSlot = (slotId: string) => {
    setSelectedTimeSlotId(slotId);
  };

  // Handle booking confirmation
  const handleConfirmBooking = () => {
    if (selectedProfessionalId && selectedTimeSlotId) {
      // In a real app, this would create a booking
      console.log('Booking confirmed:', {
        professionalId: selectedProfessionalId,
        timeSlotId: selectedTimeSlotId
      });
      
      // Redirect to payment or confirmation page
      navigate('/booking-success');
    }
    
    setIsBookingDialogOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink component={Link} to="/" color="inherit">
            Home
          </MuiLink>
          <Typography color="text.primary">Find Professionals</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Find the Perfect Match for Your Coffee Chat
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse through our curated list of professionals and find the perfect mentor for your career goals.
        </Typography>
      </Box>
      
      {/* Professional Search Component */}
      <ProfessionalSearch 
        onLoadProfessionals={handleLoadProfessionals}
        onRequestChat={handleRequestChat}
        onViewProfile={handleViewProfile}
      />
      
      {/* Booking Dialog */}
      <Dialog 
        open={isBookingDialogOpen} 
        onClose={() => setIsBookingDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight={600}>
            Request Coffee Chat
          </Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            Select a time slot that works for you. The professional will be notified and can accept or suggest alternatives.
          </Typography>
          
          <TimeSlotPicker
            timeSlots={MOCK_TIME_SLOTS}
            onSelectTimeSlot={handleSelectTimeSlot}
            selectedSlotId={selectedTimeSlotId || undefined}
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            colorVariant="outline" 
            onClick={() => setIsBookingDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            colorVariant="primary"
            onClick={handleConfirmBooking}
            disabled={!selectedTimeSlotId}
          >
            Confirm Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfessionalDiscovery; 