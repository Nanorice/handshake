import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import { getAuthToken, getUserData } from '../../utils/authUtils';
import UpdateRoleButton from './UpdateRoleButton';
import ProfileSaveButton from './ProfileSaveButton';

// Define API_URL with explicit port 5000 to match the server
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('ProfessionalPublicProfileSetup API_URL initialized as:', API_URL);

// Use the full URL including the server address and port
const API_BASE = `${API_URL}/api/professionalprofiles`;
console.log('ProfessionalPublicProfileSetup component loaded with API_BASE:', API_BASE);

const defaultProfile = (userData) => ({
  name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
  title: userData.title || '',
  bio: userData.bio || '',
  expertise: userData.expertise || '',
  profilePicture: userData.profilePicture || '',
  email: userData.email || '',
});

// Make this a memoized component
const ProfessionalPublicProfileSetup = memo(({ onSave }) => {
  // Add a ref to track if we've already fetched data
  const hasFetchedRef = useRef(false);
  const saveInProgressRef = useRef(false);
  
  const user = getUserData();
  const defaultValues = defaultProfile(user || {});
  
  // Initialize with defaults
  const [profile, setProfile] = useState(defaultValues);
  const [preview, setPreview] = useState(defaultValues);
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [fetchFailed, setFetchFailed] = useState(false);
  
  const isRoleProfessional = user?.role === 'professional';

  // Listen for update events from other components
  useEffect(() => {
    const handleProfileUpdated = (event) => {
      console.log('🔔 Received profileUpdated event:', event.detail);
      if (event.detail?.profile) {
        console.log('Updating state with event data');
        setProfile(event.detail.profile);
        setPreview(event.detail.profile);
      }
    };
    
    // Add event listener
    window.addEventListener('professionalProfileUpdated', handleProfileUpdated);
    
    // Cleanup
    return () => {
      window.removeEventListener('professionalProfileUpdated', handleProfileUpdated);
    };
  }, []);

  // Add loading timeout effect
  useEffect(() => {
    if (loading) {
      // If still loading after 5 seconds, show extended UI
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading]);

  // Memoize the handlers to prevent unnecessary re-renders
  const handleChange = useCallback((field) => (e) => {
    const updated = { ...profile, [field]: e.target.value };
    setProfile(updated);
    setPreview(updated);
  }, [profile]);

  const handleCloseSnackbar = useCallback(() => 
    setSnackbar(prev => ({ ...prev, open: false })), []);

  // Fetch profile from backend on mount
  useEffect(() => {
    console.log('Component mounted - INITIAL RENDER');
    
    // CRITICAL: Only fetch once during the entire component lifecycle
    if (hasFetchedRef.current) {
      console.log('Skipping fetch - already fetched once in this session');
      setLoading(false); // Ensure loading is cleared even if we skip fetch
      return;
    }
    
    let isMounted = true;
    
    const fetchProfile = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      console.log('⏳ Loading state set to TRUE');
      
      try {
        // First load from localStorage as a quick fallback
        loadLocalOrDefault();
        
        const token = getAuthToken();
        if (!token) {
          console.warn('No auth token available - using local data only');
          setLoading(false);
          console.log('⏳ No token: Loading state set to FALSE');
          return;
        }
        
        const requestUrl = `${API_BASE}/me`;
        console.log('🔄 Fetching profile from:', requestUrl);
        
        // Mark as fetched immediately to prevent double fetches
        hasFetchedRef.current = true;
        
        const res = await fetch(requestUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log(`🔄 Profile API response status: ${res.status}`);
        
        if (res.status === 401) {
          console.warn('Unauthorized - auth token may be invalid');
          if (isMounted) {
            setFetchFailed(true);
            setLoading(false);
            console.log('⏳ Auth error: Loading state set to FALSE');
          }
          return;
        }
        
        const data = await res.json();
        console.log('🔄 Profile API response data:', data);
        
        if (isMounted) {
          if (data.success && data.data && data.data.profile) {
            const serverProfile = data.data.profile;
            console.log('Success response, using server data:', serverProfile);
            mergeProfileData(serverProfile);
          } else {
            console.log('Success response but no profile data, keeping local fallback');
          }
          setLoading(false);
          console.log('⏳ Fetch complete: Loading state set to FALSE');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        if (isMounted) {
          setFetchFailed(true);
          setLoading(false);
          console.log('⏳ Fetch error: Loading state set to FALSE');
        }
      }
    };
    
    // Helper to load local data or use defaults
    const loadLocalOrDefault = () => {
      // Only execute if component is still mounted
      if (!isMounted) return;
      
      try {
        const savedProfile = localStorage.getItem('professionalPublicProfile');
        if (savedProfile) {
          const localProfile = JSON.parse(savedProfile);
          console.log('Using locally saved profile:', localProfile);
          setProfile(localProfile);
          setPreview(localProfile);
        } else {
          console.log('No local profile, using default profile data');
          const defaultData = defaultProfile(user || {});
          setProfile(defaultData);
          setPreview(defaultData);
        }
      } catch (localErr) {
        console.error('Error loading local profile:', localErr);
        const defaultData = defaultProfile(user || {});
        setProfile(defaultData);
        setPreview(defaultData);
      }
      
      // Always ensure loading is turned off
      setLoading(false);
    };
    
    // Helper to merge server and local data
    const mergeProfileData = (serverProfile) => {
      // Only execute if component is still mounted
      if (!isMounted) return;
      
      try {
        // Try to get local data for merging
        const savedProfile = localStorage.getItem('professionalPublicProfile');
        let localProfile = null;
        if (savedProfile) {
          localProfile = JSON.parse(savedProfile);
        }
        
        // Create a merged profile that prioritizes server data but fills gaps with local data
        let mergedProfile = { ...serverProfile };
        
        // If we have local data, use it to fill in missing fields
        if (localProfile) {
          // For each field shown in the UI, use local data if server data is missing
          ['name', 'title', 'bio', 'expertise'].forEach(field => {
            if (!mergedProfile[field] && localProfile[field]) {
              mergedProfile[field] = localProfile[field];
            }
          });
        }
        
        setProfile(mergedProfile);
        setPreview(mergedProfile);
      } catch (err) {
        console.error('Error merging profile data:', err);
        setProfile(serverProfile);
        setPreview(serverProfile);
      }
    };
    
    // Only fetch if professional role and haven't fetched before
    if (isRoleProfessional && !hasFetchedRef.current) {
      console.log('Starting profile fetch (first and only attempt)');
      // Ensure we attempt to fetch - don't mark as fetched yet
      fetchProfile().catch(err => {
        console.error('Unhandled fetch error:', err);
        if (isMounted) {
          loadLocalOrDefault();
          setLoading(false);
          console.log('⏳ Unhandled error: Loading state set to FALSE');
        }
      });
    } else {
      if (!isRoleProfessional) {
        console.log('Not a professional role, skipping fetch');
      } else {
        console.log('Already fetched once, not fetching again');
      }
      setLoading(false);
      console.log('⏳ Skip condition: Loading state set to FALSE');
    }
    
    return () => {
      console.log('Component unmounting - cleanup');
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  // Handle save - memoized version
  const handleSave = useCallback(async () => {
    // Prevent multiple concurrent save attempts
    if (saveInProgressRef.current) {
      console.log('Save already in progress, ignoring this request');
      return;
    }
    
    saveInProgressRef.current = true;
    
    try {
      // Use the environment-aware API_BASE instead of hardcoded localhost
      const requestUrl = API_BASE;
      console.log('Saving profile to:', requestUrl);
      console.log('Profile data being saved:', JSON.stringify(profile, null, 2));
      
      // Save profile data to localStorage for persistence
      try {
        localStorage.setItem('professionalPublicProfile', JSON.stringify(profile));
        console.log('✅ Saved profile to localStorage');
      } catch (localErr) {
        console.error('Error saving to localStorage:', localErr);
      }
      
      const token = getAuthToken();
      if (!token) {
        setSnackbar({ 
          open: true, 
          message: 'Profile saved locally only (not logged in)', 
          severity: 'warning' 
        });
        saveInProgressRef.current = false;
        return;
      }
      
      console.log('📤 Sending profile data to server with token:', token.substring(0, 10) + '...');
      
      // Make sure we have all required fields
      const fieldsToSend = { ...profile };
      
      // If rate is not set, default to 0
      if (fieldsToSend.rate === undefined) {
        fieldsToSend.rate = 0;
      }
      
      // Ensure industries and skills are arrays
      if (!Array.isArray(fieldsToSend.industries)) {
        fieldsToSend.industries = [];
      }
      
      if (!Array.isArray(fieldsToSend.skills)) {
        fieldsToSend.skills = [];
      }
      
      // Log the exact data being sent
      console.log('📤 Final data being sent:', JSON.stringify(fieldsToSend, null, 2));
      
      // Try both PUT and POST methods if needed
      let res;
      
      try {
        console.log('Attempting PUT request first');
        res = await fetch(requestUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fieldsToSend),
        });
        
        console.log(`PUT response status: ${res.status}`);
        
        // If PUT failed, try POST
        if (res.status === 404) {
          console.log('PUT failed with 404, trying POST instead');
          res = await fetch(requestUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fieldsToSend),
          });
          console.log(`POST response status: ${res.status}`);
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      }
      
      if (!res.ok) {
        console.error(`Error saving profile: Server returned ${res.status}`);
        
        // Handle specific error cases
        if (res.status === 401) {
          setSnackbar({ 
            open: true, 
            message: 'Authentication error - please log in again', 
            severity: 'error' 
          });
        } else {
          let errorText = '';
          try {
            const errorData = await res.json();
            errorText = errorData.error?.message || 'Unknown server error';
          } catch (e) {
            errorText = 'Unable to parse error response';
          }
          
          setSnackbar({ 
            open: true, 
            message: `Server error (${res.status}) while saving profile: ${errorText}`, 
            severity: 'error' 
          });
        }
        saveInProgressRef.current = false;
        return;
      }
      
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        setSnackbar({ 
          open: true, 
          message: 'Invalid response from server', 
          severity: 'error' 
        });
        saveInProgressRef.current = false;
        return;
      }
      
      console.log('📥 Save profile API response data:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        setSnackbar({ 
          open: true, 
          message: 'Profile saved successfully to server!', 
          severity: 'success' 
        });
        
        // Dispatch a custom event for profile update that other components can listen for
        const profileUpdateEvent = new CustomEvent('professionalProfileUpdated', {
          detail: {
            profile: fieldsToSend,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(profileUpdateEvent);
        console.log('📢 Dispatched professionalProfileUpdated event');
        
        // Store the returned profile data to ensure we're in sync with server
        if (data.data && data.data.profile) {
          console.log('✅ Updating local state with server response data');
          setProfile(data.data.profile);
          setPreview(data.data.profile);
          // Also update localStorage
          localStorage.setItem('professionalPublicProfile', JSON.stringify(data.data.profile));
        }
      } else {
        console.error('Server returned success: false', data.error);
        setSnackbar({ 
          open: true, 
          message: data.error?.message || 'Failed to save profile to server', 
          severity: 'error' 
        });
      }
    } catch (err) {
      console.error('Network or parsing error saving profile:', err);
      setSnackbar({ 
        open: true, 
        message: `Network error saving profile: ${err.message}`, 
        severity: 'error' 
      });
    } finally {
      saveInProgressRef.current = false;
    }
  }, [profile]);

  // Update the loading render
  if (loading) {
    return (
      <Paper sx={{ p: 3, my: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Loading Your Profile...
          </Typography>
          {loadingTimeout && (
            <>
              <Typography variant="body2" color="text.secondary" paragraph>
                This is taking longer than expected.
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  // Force loading to end and use default profile
                  setLoading(false);
                  const defaultData = defaultProfile(user || {});
                  setProfile(defaultData);
                  setPreview(defaultData);
                }}
                sx={{ mt: 1 }}
              >
                Skip Loading
              </Button>
            </>
          )}
        </Box>
      </Paper>
    );
  }
  
  if (!isRoleProfessional) {
    return (
      <Paper sx={{ p: 3, my: 2 }}>
        <Typography variant="h5" gutterBottom>
          Professional Role Required
        </Typography>
        <Typography paragraph>
          Your account is currently set as a job seeker. To create a professional profile,
          you need to update your role to "professional".
        </Typography>
        <Box sx={{ mt: 2 }}>
          <UpdateRoleButton />
        </Box>
      </Paper>
    );
  }

  return (
    <Grid container spacing={4}>
      {/* Edit Form */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Public Profile Setup
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TextField
            label="Full Name"
            value={profile?.name || ''}
            onChange={handleChange('name')}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Title/Position"
            value={profile?.title || ''}
            onChange={handleChange('title')}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Bio"
            value={profile?.bio || ''}
            onChange={handleChange('bio')}
            fullWidth
            margin="normal"
            multiline
            rows={4}
          />
          <TextField
            label="Expertise (comma separated)"
            value={profile?.expertise || ''}
            onChange={handleChange('expertise')}
            fullWidth
            margin="normal"
          />
          {/* Add more fields as needed */}
          <ProfileSaveButton 
            onClick={handleSave} 
            sx={{ mt: 2 }}
            label="Save Public Profile"
          />
        </Paper>
      </Grid>
      {/* Live Preview */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, minHeight: 300 }}>
          <Typography variant="h6" gutterBottom>
            Public Profile Preview
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar src={preview?.profilePicture} sx={{ width: 64, height: 64, mr: 2 }} />
            <Box>
              <Typography variant="h6">{preview?.name || 'Name'}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {preview?.title || 'Title/Position'}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ mb: 1 }}>
            {preview?.bio || 'Bio goes here.'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <b>Expertise:</b> {preview?.expertise || 'None listed'}
          </Typography>
        </Paper>
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
});

export default ProfessionalPublicProfileSetup; 