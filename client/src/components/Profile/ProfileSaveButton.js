import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

/**
 * Enhanced save button component with loading state
 * 
 * @param {Object} props Component props
 * @param {Function} props.onClick Function to call when the button is clicked
 * @param {String} props.label Button label text
 * @param {String} props.variant Button variant (contained, outlined, text)
 * @param {String} props.color Button color (primary, secondary, success, etc)
 * @param {Object} props.sx Additional MUI styles
 */
const ProfileSaveButton = ({ 
  onClick, 
  label = 'Save Profile', 
  variant = 'contained', 
  color = 'primary',
  sx = {} 
}) => {
  const [saving, setSaving] = useState(false);
  
  const handleClick = async () => {
    if (saving) return;
    
    setSaving(true);
    
    try {
      await onClick();
    } finally {
      // Add a small delay to show the saving state
      setTimeout(() => {
        setSaving(false);
      }, 500);
    }
  };
  
  return (
    <Button
      variant={variant}
      color={color}
      onClick={handleClick}
      disabled={saving}
      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
      sx={{ 
        minWidth: '150px',
        ...sx 
      }}
    >
      {saving ? 'Saving...' : label}
    </Button>
  );
};

export default ProfileSaveButton; 