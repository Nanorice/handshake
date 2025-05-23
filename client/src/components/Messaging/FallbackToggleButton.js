import React from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Tooltip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

/**
 * FallbackToggleButton component allows users to manually switch between
 * react-chat-elements and our custom fallback components
 */
const FallbackToggleButton = ({ 
  useFallbackComponents, 
  setUseFallbackComponents,
  darkMode = false
}) => {
  const [open, setOpen] = React.useState(false);
  
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  const handleToggle = () => {
    const newValue = !useFallbackComponents;
    setUseFallbackComponents(newValue);
    
    // Save preference to localStorage
    localStorage.setItem('messaging_use_fallback', newValue ? 'true' : 'false');
    
    // Close dialog
    handleClose();
  };
  
  return (
    <>
      <Tooltip title="Messaging Display Options">
        <IconButton 
          size="small" 
          onClick={handleOpen}
          sx={{ 
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)'
          }}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Messaging Display Options</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, pt: 1 }}>
            <Typography variant="body2" gutterBottom>
              If you're experiencing display issues with messages, try switching to our alternative display mode.
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={useFallbackComponents}
                  onChange={handleToggle}
                  color="primary"
                />
              }
              label="Use alternative display components"
            />
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              {useFallbackComponents 
                ? "Currently using alternative display mode"
                : "Currently using standard display mode"}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleToggle} variant="contained">
            {useFallbackComponents ? 'Switch to Standard' : 'Switch to Alternative'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FallbackToggleButton; 