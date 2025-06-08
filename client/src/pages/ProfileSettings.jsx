import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import FileUpload from '../components/FileUpload/FileUpload';
import axios from 'axios';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProfileSettings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userFiles, setUserFiles] = useState({
    profilePhoto: null,
    cv: null
  });

  // Get current user data
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user info
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Decode token to get user ID (basic decode - in production use proper JWT library)
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.userId;

      if (!userId) {
        throw new Error('Invalid token format');
      }

      setCurrentUser({ id: userId });

      // Load file information
      const fileResponse = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/files/info/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (fileResponse.data) {
        setUserFiles({
          profilePhoto: fileResponse.data.profilePhoto.hasFile ? fileResponse.data.profilePhoto : null,
          cv: fileResponse.data.cv.hasFile ? fileResponse.data.cv : null
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleUploadSuccess = (fileType) => (fileData) => {
    setSuccess(`${fileType === 'profilePhoto' ? 'Profile photo' : 'CV'} uploaded successfully!`);
    
    // Update the local state
    setUserFiles(prev => ({
      ...prev,
      [fileType]: {
        hasFile: true,
        ...fileData,
        uploadDate: new Date().toISOString()
      }
    }));

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUploadError = (fileType) => (errorMessage) => {
    setError(`Failed to upload ${fileType === 'profilePhoto' ? 'profile photo' : 'CV'}: ${errorMessage}`);
    setTimeout(() => setError(null), 5000);
  };

  const handleDeleteSuccess = (fileType) => () => {
    setSuccess(`${fileType === 'profilePhoto' ? 'Profile photo' : 'CV'} deleted successfully!`);
    
    // Update the local state
    setUserFiles(prev => ({
      ...prev,
      [fileType]: null
    }));

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Profile Settings
      </Typography>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile settings tabs">
            <Tab label="Profile Photo" />
            <Tab label="CV/Resume" />
            <Tab label="File Management" />
          </Tabs>
        </Box>

        {/* Profile Photo Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Profile Photo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload a professional profile photo that will be visible to other users. 
            Recommended size: 400x400 pixels or larger.
          </Typography>
          
          <FileUpload
            type="profilePhoto"
            userId={currentUser?.id}
            currentFile={userFiles.profilePhoto}
            onUploadSuccess={handleUploadSuccess('profilePhoto')}
            onUploadError={handleUploadError('profilePhoto')}
            onDeleteSuccess={handleDeleteSuccess('profilePhoto')}
            maxSize={5 * 1024 * 1024} // 5MB for images
          />
        </TabPanel>

        {/* CV Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            CV/Resume
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload your CV or resume in PDF or Word format. This will be accessible to 
            professionals you connect with during networking sessions.
          </Typography>
          
          <FileUpload
            type="cv"
            userId={currentUser?.id}
            currentFile={userFiles.cv}
            onUploadSuccess={handleUploadSuccess('cv')}
            onUploadError={handleUploadError('cv')}
            onDeleteSuccess={handleDeleteSuccess('cv')}
            maxSize={10 * 1024 * 1024} // 10MB for documents
          />
        </TabPanel>

        {/* File Management Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            File Management
          </Typography>
          
          <Grid container spacing={3}>
            {/* Profile Photo Status */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Profile Photo
                </Typography>
                {userFiles.profilePhoto ? (
                  <Box>
                    <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                      ✓ Uploaded
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      File: {userFiles.profilePhoto.originalName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded: {new Date(userFiles.profilePhoto.uploadDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="warning.main">
                    ⚠ No profile photo uploaded
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* CV Status */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  CV/Resume
                </Typography>
                {userFiles.cv ? (
                  <Box>
                    <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                      ✓ Uploaded
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      File: {userFiles.cv.originalName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded: {new Date(userFiles.cv.uploadDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="warning.main">
                    ⚠ No CV/resume uploaded
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Storage Info */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Storage Information
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Profile photos: Maximum 5MB, formats: JPG, PNG, GIF, WebP
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • CV/Resume: Maximum 10MB, formats: PDF, Word (.doc, .docx)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Files are securely stored and only accessible to you and your connections
          </Typography>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ProfileSettings;