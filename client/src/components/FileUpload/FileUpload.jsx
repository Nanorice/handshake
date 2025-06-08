import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  GetApp,
  Photo,
  Description
} from '@mui/icons-material';
import axios from 'axios';

const FileUpload = ({
  type = 'profilePhoto', // 'profilePhoto' or 'cv'
  userId,
  currentFile = null,
  onUploadSuccess,
  onUploadError,
  onDeleteSuccess,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Default accepted types based on file type
  const defaultAcceptedTypes = {
    profilePhoto: {
      accept: 'image/*',
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      description: 'Images (JPG, PNG, GIF, WebP)'
    },
    cv: {
      accept: '.pdf,.doc,.docx',
      types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      description: 'PDF or Word documents'
    }
  };

  const fileConfig = acceptedTypes || defaultAcceptedTypes[type];

  const validateFile = (file) => {
    if (file.size > maxSize) {
      throw new Error(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    if (!fileConfig.types.includes(file.type)) {
      throw new Error(`Please select a valid file type: ${fileConfig.description}`);
    }

    return true;
  };

  const handleFileUpload = async (file) => {
    try {
      setError(null);
      setUploading(true);
      setUploadProgress(0);

      validateFile(file);

      const formData = new FormData();
      formData.append(type, file);
      if (userId) {
        formData.append('userId', userId);
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/files/upload/${type === 'profilePhoto' ? 'profile-photo' : 'cv'}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      if (response.data.success) {
        setUploadProgress(100);
        onUploadSuccess?.(response.data.file);
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Upload failed';
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDeleteFile = async () => {
    if (!currentFile?.fileId) return;

    try {
      setError(null);
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/files/file/${currentFile.fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          data: { userId }
        }
      );

      if (response.data.success) {
        onDeleteSuccess?.();
      } else {
        throw new Error(response.data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('File delete error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Delete failed';
      setError(errorMessage);
    }
  };

  const handleDownload = () => {
    if (currentFile?.fileId) {
      const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/files/file/${currentFile.fileId}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const getFileIcon = () => {
    return type === 'profilePhoto' ? <Photo /> : <Description />;
  };

  const getFileTypeLabel = () => {
    return type === 'profilePhoto' ? 'Profile Photo' : 'CV/Resume';
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 500 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {getFileTypeLabel()}
      </Typography>

      {/* Current File Display */}
      {currentFile && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getFileIcon()}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" fontWeight="bold">
                  {currentFile.originalName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uploaded: {new Date(currentFile.uploadDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={handleDownload} color="primary" title="Download">
                  <GetApp />
                </IconButton>
                <IconButton onClick={handleDeleteFile} color="error" title="Delete">
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card
        sx={{
          border: dragOver ? '2px dashed #1976d2' : '2px dashed #e0e0e0',
          backgroundColor: dragOver ? '#f5f5f5' : 'transparent',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CloudUpload sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            {currentFile ? `Replace ${getFileTypeLabel()}` : `Upload ${getFileTypeLabel()}`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Drag and drop your file here, or click to browse
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Accepted formats: {fileConfig.description}
            <br />
            Maximum size: {Math.round(maxSize / 1024 / 1024)}MB
          </Typography>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={fileConfig.accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Uploading... {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;