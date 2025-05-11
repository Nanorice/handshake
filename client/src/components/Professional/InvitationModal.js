import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { addHours } from 'date-fns';
import { sendInvitation } from '../../services/invitationService';

const InvitationModal = ({ professional, open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    proposedDate: addHours(new Date(), 24), // Default to tomorrow
    duration: 30,
    topic: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateChange = (newDate) => {
    setFormData(prev => ({
      ...prev,
      proposedDate: newDate
    }));
  };
  
  const validateForm = () => {
    if (!formData.topic.trim()) {
      setError('Please enter a topic for the meeting');
      return false;
    }
    
    if (!formData.proposedDate) {
      setError('Please select a date and time');
      return false;
    }
    
    // Check if date is in the future
    if (formData.proposedDate <= new Date()) {
      setError('Please select a future date and time');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare the invitation data
      const invitationData = {
        receiverId: professional._id,
        message: formData.message,
        sessionDetails: {
          proposedDate: formData.proposedDate.toISOString(),
          duration: parseInt(formData.duration),
          topic: formData.topic
        }
      };
      
      // Send the invitation
      const response = await sendInvitation(invitationData);
      
      // Call onSuccess with the response data
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      // Close the modal
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Request Meeting with {professional?.firstName} {professional?.lastName}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="subtitle1">
            Send a meeting request to connect and discuss your career goals.
          </Typography>
          
          <TextField
            label="Meeting Topic"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            fullWidth
            required
            placeholder="e.g., Career advice in software engineering"
          />
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Proposed Date & Time"
              value={formData.proposedDate}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} fullWidth required />}
              minDateTime={new Date()}
            />
          </LocalizationProvider>
          
          <TextField
            label="Duration (minutes)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 15, max: 120, step: 15 }}
          />
          
          <TextField
            label="Message (optional)"
            name="message"
            value={formData.message}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
            placeholder="Introduce yourself and explain why you'd like to meet"
          />
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Send Request"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvitationModal; 