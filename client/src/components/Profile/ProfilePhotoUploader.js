import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Modal,
  Typography,
  Slider,
  Stack,
  IconButton,
  Avatar
} from '@mui/material';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import AvatarEditor from 'react-avatar-editor';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

const ProfilePhotoUploader = ({ initialImage, onSave, size = 120 }) => {
  const [image, setImage] = useState(initialImage || null);
  const [tempImage, setTempImage] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [rotate, setRotate] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setTempImage(file);
      setModalOpen(true);
      
      // Reset editing controls when a new file is selected
      setScale(1.2);
      setRotate(0);
    }
  };

  const handleScaleChange = (event, newValue) => {
    setScale(newValue);
  };

  const handleRotateLeft = () => {
    setRotate((prevRotate) => prevRotate - 90);
  };

  const handleRotateRight = () => {
    setRotate((prevRotate) => prevRotate + 90);
  };

  const handleSave = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImage(dataUrl);
      
      if (onSave) {
        // Convert to a file or blob if needed by the parent component
        canvas.toBlob((blob) => {
          onSave(blob, dataUrl);
        }, 'image/jpeg');
      }
      
      setModalOpen(false);
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box 
        sx={{ 
          position: 'relative', 
          width: size, 
          height: size,
          mb: 2
        }}
      >
        <Avatar
          src={image}
          alt="Profile"
          sx={{ 
            width: size, 
            height: size,
            cursor: 'pointer'
          }}
          onClick={triggerFileInput}
        />
        <IconButton
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            width: 36,
            height: 36
          }}
          onClick={triggerFileInput}
        >
          <AddAPhotoIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      
      <Button 
        variant="outlined" 
        onClick={triggerFileInput}
        sx={{ mb: 2 }}
      >
        Change Photo
      </Button>
      
      <Modal
        open={modalOpen}
        onClose={handleCancel}
        aria-labelledby="crop-photo-modal"
      >
        <Box sx={modalStyle}>
          <Typography id="crop-photo-modal" variant="h6" component="h2" mb={2}>
            Edit Profile Photo
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <AvatarEditor
              ref={editorRef}
              image={tempImage}
              width={250}
              height={250}
              border={50}
              borderRadius={125}
              color={[0, 0, 0, 0.6]}
              scale={scale}
              rotate={rotate}
            />
          </Box>
          
          <Stack spacing={2} direction="row" sx={{ mb: 2 }} alignItems="center">
            <Typography>Zoom:</Typography>
            <Slider
              value={scale}
              min={1}
              max={3}
              step={0.01}
              onChange={handleScaleChange}
              aria-labelledby="zoom-slider"
            />
          </Stack>
          
          <Stack spacing={2} direction="row" sx={{ mb: 3 }} justifyContent="center">
            <IconButton onClick={handleRotateLeft}>
              <RotateLeftIcon />
            </IconButton>
            <IconButton onClick={handleRotateRight}>
              <RotateRightIcon />
            </IconButton>
          </Stack>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>Save</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default ProfilePhotoUploader; 