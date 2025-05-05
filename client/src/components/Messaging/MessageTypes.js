import React, { useState, useContext } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  useTheme
} from '@mui/material';
import { 
  CalendarMonth, 
  CheckCircle, 
  PendingActions, 
  Schedule, 
  Edit, 
  Payment, 
  Done 
} from '@mui/icons-material';
import { 
  proposeTimeSlots, 
  suggestAlternativeTimeSlots, 
  confirmTimeSlot, 
  confirmAndPay 
} from '../../services/professionalService';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Invite Message
export const InviteMessage = ({ message, onTimeProposal }) => {
  const { status, inviteId } = message.metadata || {};
  const isFromUser = message.sentBy === 'user';
  const theme = useTheme();

  const handleProposeTime = () => {
    onTimeProposal(message.threadId, inviteId);
  };

  return (
    <Card
      sx={{
        backgroundColor: isFromUser 
          ? 'primary.main' 
          : theme.palette.mode === 'dark' ? 'background.default' : 'background.paper',
        color: isFromUser ? 'white' : 'inherit',
        borderRadius: 2,
        width: '100%',
        border: theme.palette.mode === 'dark' && !isFromUser ? `1px solid ${theme.palette.divider}` : 'none'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PendingActions sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Coffee Chat Invitation
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message.content}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={status === 'pending' ? 'Pending' : status}
            color={status === 'pending' ? 'warning' : 'success'}
            size="small"
          />
          {!isFromUser && status === 'pending' && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={handleProposeTime}
              startIcon={<Schedule />}
            >
              Propose Times
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Time Proposal Message
export const TimeProposalMessage = ({ message, onSuggestAlternative, onConfirmTime }) => {
  const { timeSlots, status, inviteId } = message.metadata || {};
  const isFromUser = message.sentBy === 'user';
  const theme = useTheme();

  return (
    <Card
      sx={{
        backgroundColor: isFromUser 
          ? 'primary.main' 
          : theme.palette.mode === 'dark' ? 'background.default' : 'background.paper',
        color: isFromUser ? 'white' : 'inherit',
        borderRadius: 2,
        width: '100%',
        border: theme.palette.mode === 'dark' && !isFromUser ? `1px solid ${theme.palette.divider}` : 'none'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Schedule sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Proposed Time Slots
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message.content}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          {timeSlots && timeSlots.map((slot, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 1, 
                p: 1, 
                borderRadius: 1, 
                backgroundColor: isFromUser 
                  ? 'rgba(255,255,255,0.1)' 
                  : theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.3)
                    : 'rgba(0,0,0,0.05)'
              }}
            >
              <Typography variant="body2">
                {new Date(slot.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {slot.time}
              </Typography>
              {!isFromUser && (
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => onConfirmTime(message.threadId, inviteId, slot)}
                >
                  Select This Time
                </Button>
              )}
            </Box>
          ))}
        </Box>
        
        {!isFromUser && status === 'proposed' && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => onSuggestAlternative(message.threadId, inviteId)}
            startIcon={<Edit />}
          >
            Suggest Alternative Times
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to get alpha color
const alpha = (color, value) => {
  return color + Math.round(value * 255).toString(16).padStart(2, '0');
};

// Time Suggestion Message (from seeker)
export const TimeSuggestionMessage = ({ message, onConfirmTime }) => {
  const { timeSlots, status, inviteId } = message.metadata || {};
  const isFromUser = message.sentBy === 'user';
  const theme = useTheme();

  return (
    <Card
      sx={{
        backgroundColor: isFromUser 
          ? 'primary.main' 
          : theme.palette.mode === 'dark' ? 'background.default' : 'background.paper',
        color: isFromUser ? 'white' : 'inherit',
        borderRadius: 2,
        width: '100%',
        border: theme.palette.mode === 'dark' && !isFromUser ? `1px solid ${theme.palette.divider}` : 'none'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Edit sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Suggested Alternative Times
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message.content}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          {timeSlots && timeSlots.map((slot, index) => (
            <Box 
              key={index} 
              sx={{ 
                mb: 1, 
                p: 1, 
                borderRadius: 1, 
                backgroundColor: isFromUser 
                  ? 'rgba(255,255,255,0.1)' 
                  : theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.3)
                    : 'rgba(0,0,0,0.05)'
              }}
            >
              <Typography variant="body2">
                {new Date(slot.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {slot.time}
              </Typography>
              {!isFromUser && (
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => onConfirmTime(message.threadId, inviteId, slot)}
                >
                  Confirm This Time
                </Button>
              )}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// Time Confirmation Message
export const TimeConfirmationMessage = ({ message, onProceedToPayment }) => {
  const { selectedTimeSlot, status, inviteId } = message.metadata || {};
  const isFromUser = message.sentBy === 'user';
  const theme = useTheme();

  return (
    <Card
      sx={{
        backgroundColor: isFromUser 
          ? 'primary.main' 
          : theme.palette.mode === 'dark' ? 'background.default' : 'background.paper',
        color: isFromUser ? 'white' : 'inherit',
        borderRadius: 2,
        width: '100%',
        border: theme.palette.mode === 'dark' && !isFromUser ? `1px solid ${theme.palette.divider}` : 'none'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CheckCircle color="success" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Time Confirmed
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message.content}
        </Typography>
        
        {selectedTimeSlot && (
          <Box 
            sx={{ 
              mb: 2, 
              p: 1.5, 
              borderRadius: 1, 
              backgroundColor: isFromUser 
                ? 'rgba(255,255,255,0.1)' 
                : theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.paper, 0.3)
                  : 'rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <CalendarMonth fontSize="large" color="primary" sx={{ mb: 1 }} />
            <Typography variant="body2" fontWeight="bold" align="center">
              {new Date(selectedTimeSlot.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
            <Typography variant="body1" fontWeight="bold" align="center" sx={{ mb: 1 }}>
              {selectedTimeSlot.time}
            </Typography>
            
            {!isFromUser && status === 'confirmed' && (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => onProceedToPayment(message.threadId, inviteId, selectedTimeSlot)}
                startIcon={<Payment />}
              >
                Proceed to Payment
              </Button>
            )}
          </Box>
        )}
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color={isFromUser ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>
            You can reschedule up to 24 hours before the meeting
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Payment Confirmation Message
export const PaymentConfirmationMessage = ({ message }) => {
  const { selectedTimeSlot, paymentStatus, paymentId } = message.metadata || {};
  const isFromUser = message.sentBy === 'user';
  const theme = useTheme();

  return (
    <Card
      sx={{
        backgroundColor: isFromUser 
          ? 'primary.main' 
          : theme.palette.mode === 'dark' ? 'background.default' : 'background.paper',
        color: isFromUser ? 'white' : 'inherit',
        borderRadius: 2,
        width: '100%',
        border: theme.palette.mode === 'dark' && !isFromUser ? `1px solid ${theme.palette.divider}` : 'none'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Done color="success" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Payment Confirmed
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {message.content}
        </Typography>
        
        {selectedTimeSlot && (
          <Box 
            sx={{ 
              mb: 2, 
              p: 1.5, 
              borderRadius: 1, 
              backgroundColor: isFromUser 
                ? 'rgba(255,255,255,0.1)' 
                : theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.paper, 0.3)
                  : 'rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <CalendarMonth fontSize="large" color="primary" sx={{ mb: 1 }} />
            <Typography variant="body2" fontWeight="bold" align="center">
              {new Date(selectedTimeSlot.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
            <Typography variant="body1" fontWeight="bold" align="center">
              {selectedTimeSlot.time}
            </Typography>
            
            <Divider sx={{ width: '100%', my: 1 }} />
            
            <Typography variant="body2" align="center" sx={{ mb: 0.5 }}>
              Payment ID: <span style={{ fontWeight: 'bold' }}>{paymentId}</span>
            </Typography>
            <Typography variant="body2" align="center">
              Status: <Chip label={paymentStatus} color="success" size="small" />
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CalendarMonth />}
          >
            Add to Calendar
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Time Slot Dialog
export const TimeSlotDialog = ({ 
  open, 
  onClose, 
  onSubmit, 
  title = "Propose Time Slots",
  submitLabel = "Propose Times",
  threadId,
  inviteId,
  actionType // 'propose', 'suggest', or 'confirm'
}) => {
  const [timeSlots, setTimeSlots] = useState([
    { date: new Date(), time: '9:00 AM' }
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { date: new Date(), time: '9:00 AM' }]);
  };

  const handleRemoveTimeSlot = (index) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleDateChange = (index, newDate) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index].date = newDate;
    setTimeSlots(newTimeSlots);
  };

  const handleTimeChange = (index, event) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index].time = event.target.value;
    setTimeSlots(newTimeSlots);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let result;
      
      // Format time slots
      const formattedTimeSlots = timeSlots.map(slot => ({
        date: slot.date.toISOString(),
        time: slot.time
      }));
      
      switch (actionType) {
        case 'propose':
          result = await proposeTimeSlots(threadId, inviteId, formattedTimeSlots, message);
          break;
        case 'suggest':
          result = await suggestAlternativeTimeSlots(threadId, inviteId, formattedTimeSlots, message);
          break;
        case 'confirm':
          // In this case we should only have one time slot
          result = await confirmTimeSlot(threadId, inviteId, formattedTimeSlots[0], message);
          break;
        default:
          throw new Error('Invalid action type');
      }
      
      onSubmit(result);
    } catch (error) {
      console.error('Error submitting time slots:', error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ mb: 3, mt: 1 }}>
            <TextField
              label="Message"
              multiline
              rows={2}
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
            />
          </Box>
          
          {timeSlots.map((slot, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={5}>
                  <DatePicker
                    label="Date"
                    value={slot.date}
                    onChange={(newDate) => handleDateChange(index, newDate)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={5}>
                  <FormControl fullWidth>
                    <InputLabel>Time</InputLabel>
                    <Select
                      value={slot.time}
                      label="Time"
                      onChange={(e) => handleTimeChange(index, e)}
                    >
                      {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map((time) => (
                        <MenuItem key={time} value={time}>{time}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={2}>
                  {timeSlots.length > 1 && (
                    <Button 
                      color="error" 
                      onClick={() => handleRemoveTimeSlot(index)}
                    >
                      Remove
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Box>
          ))}
          
          {actionType !== 'confirm' && (
            <Button 
              variant="outlined" 
              onClick={handleAddTimeSlot} 
              sx={{ mt: 1 }}
            >
              Add Another Time Slot
            </Button>
          )}
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Payment Dialog
export const PaymentDialog = ({ 
  open, 
  onClose, 
  onSubmit, 
  threadId,
  inviteId,
  selectedTimeSlot
}) => {
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails({
      ...paymentDetails,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await confirmAndPay(threadId, inviteId, selectedTimeSlot, paymentDetails);
      onSubmit(result);
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const isFormValid = () => {
    return (
      paymentDetails.cardNumber.length >= 16 &&
      paymentDetails.cardholderName.trim() !== '' &&
      paymentDetails.expiryDate.length >= 5 &&
      paymentDetails.cvv.length >= 3
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Complete Payment</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Confirm Coffee Chat Booking
          </Typography>
          
          {selectedTimeSlot && (
            <Box 
              sx={{ 
                p: 2, 
                borderRadius: 1, 
                backgroundColor: 'background.default',
                mb: 3
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                Date and Time:
              </Typography>
              <Typography variant="body1">
                {new Date(selectedTimeSlot.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {selectedTimeSlot.time}
              </Typography>
            </Box>
          )}
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Payment Information
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="cardNumber"
                label="Card Number"
                value={paymentDetails.cardNumber}
                onChange={handleInputChange}
                fullWidth
                placeholder="1234 5678 9012 3456"
                inputProps={{ maxLength: 19 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="cardholderName"
                label="Cardholder Name"
                value={paymentDetails.cardholderName}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="expiryDate"
                label="Expiry Date (MM/YY)"
                value={paymentDetails.expiryDate}
                onChange={handleInputChange}
                placeholder="MM/YY"
                inputProps={{ maxLength: 5 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                name="cvv"
                label="CVV"
                value={paymentDetails.cvv}
                onChange={handleInputChange}
                type="password"
                inputProps={{ maxLength: 4 }}
                fullWidth
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Payment Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Coffee Chat Session (60 min)</Typography>
              <Typography variant="body2" fontWeight="bold">$50.00</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Service Fee</Typography>
              <Typography variant="body2" fontWeight="bold">$5.00</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">Total</Typography>
              <Typography variant="subtitle2" fontWeight="bold">$55.00</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || !isFormValid()}
        >
          {loading ? <CircularProgress size={24} /> : "Complete Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 