// Import any necessary modules here
import { API_URL, getApiBaseUrl, getApiUrl } from './apiConfig';

// Synchronous local storage wrapper to avoid race conditions
const TokenStorage = {
  getToken: () => {
    const token = localStorage.getItem('token');
    console.log('[TokenStorage.getToken] Attempting to get token. Found:', token ? token.substring(0, 20) + '...' : 'NULL');
    return token;
  },
  setToken: (token) => {
    console.log('[TokenStorage.setToken] Attempting to set token:', token ? token.substring(0, 20) + '...' : 'NULL or empty string');
    if (!token) {
      console.warn('[TokenStorage.setToken] Aborted: Token is null or empty.');
      return false;
    }
    try {
      localStorage.setItem('token', token);
      const retrievedToken = localStorage.getItem('token');
      console.log('[TokenStorage.setToken] Token set. Verification - Retrieved:', retrievedToken ? retrievedToken.substring(0, 20) + '...' : 'NULL after setting!');
      if (retrievedToken === token) {
        console.log('[TokenStorage.setToken] Verification successful.');
        return true;
      } else {
        console.error('[TokenStorage.setToken] VERIFICATION FAILED! Token in localStorage does not match token argument after setItem.', { originalToken: token, retrievedToken });
        return false;
      }
    } catch (e) {
      console.error('[TokenStorage.setToken] Failed to set token due to exception:', e);
      return false;
    }
  },
  removeToken: () => {
    console.log('[TokenStorage.removeToken] Removing token from localStorage.');
    localStorage.removeItem('token');
  },
  debugToken: () => {
    const token = localStorage.getItem('token');
    console.log('Token debug:', {
      exists: !!token,
      preview: token ? `${token.substring(0, 10)}...` : 'none'  
    });
    return token;
  }
};

// Log the API URL from the imported config
console.log('authUtils using API_URL:', API_URL);

// Get the JWT token from localStorage
export const getAuthToken = () => {
  // console.log('[authUtils.js] getAuthToken called, retrieving via TokenStorage.getToken()');
  // The detailed log is now inside TokenStorage.getToken itself
  return TokenStorage.getToken();
};

// Set the JWT token in localStorage
export const setAuthToken = (token) => {
  return TokenStorage.setToken(token);
};

// Remove the JWT token from localStorage
export const removeAuthToken = () => {
  TokenStorage.removeToken();
};

// Check if the user is authenticated
export const isAuthenticated = () => {
  // Use TokenStorage to get token
  const token = TokenStorage.getToken();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  // For debugging
  if (isLoggedIn && !token) {
    console.warn('isAuthenticated found isLoggedIn=true but no token - inconsistent state');
  }
  
  // Token presence is the primary indicator of authentication
  return !!token;
};

// Get the current user's ID
export const getCurrentUserId = () => {
  return localStorage.getItem('userId');
};

// Store user data in local storage
export const setUserData = (data) => {
  if (!data) return;

  const { user, token } = data;
  
  if (token) {
    // Use our TokenStorage wrapper instead of direct localStorage access
    const tokenSaved = TokenStorage.setToken(token);
    console.log('Token saved to localStorage:', tokenSaved ? 'Success' : 'Failed');
  }
  
  if (user) {
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('userId', user._id);
    console.log('User data saved to localStorage');
  }
  
  // Set explicit login state
  localStorage.setItem('isLoggedIn', 'true');
};

// Get user data from localStorage
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data from localStorage:', error);
    return null;
  }
};

// Get user role/type from token
export const getUserType = () => {
  const userData = getUserData();
  return userData ? userData.userType : null;
};

// Check if user is admin
export const isAdmin = () => {
  return localStorage.getItem('isAdmin') === 'true';
};

// Clear auth data (logout)
export const clearAuth = () => {
  console.log('Clearing all auth data from localStorage');
  TokenStorage.removeToken();
  localStorage.removeItem('userData');
  localStorage.removeItem('userId');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('isLoggedIn');
};

// Logout user
export const logout = () => {
  console.log('Logging out user, clearing auth data');
  TokenStorage.removeToken();
  localStorage.removeItem('userData');
  localStorage.removeItem('userId');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('isLoggedIn');
};

// Update user role
export const updateUserRole = async (role) => {
  try {
    console.log('Updating user role to:', role);
    const token = getAuthToken();
    
    // Ensure we have the correct URL format
    let baseUrl = API_URL;
    if (!baseUrl.includes('/api')) {
      baseUrl = `${baseUrl}/api`;
    }
    
    const updateRoleUrl = `${baseUrl}/auth/update-role`;
    console.log('Making update role request to:', updateRoleUrl);
    
    const response = await fetch(updateRoleUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    });
    
    console.log('Update role response status:', response.status);
    
    const data = await response.json();
    console.log('Update role response data:', data);
    
    if (data.success) {
      // Update local storage with the updated user data
      localStorage.setItem('userData', JSON.stringify(data.data.user));
      console.log('User role updated successfully:', data.data.user.role);
      return { success: true, user: data.data.user };
    } else {
      console.error('Failed to update user role:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: { message: 'Network error updating user role' } };
  }
};

// Debug authentication state - can be called from any component
export const debugAuthState = () => {
  const token = localStorage.getItem('token');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userData = localStorage.getItem('userData');
  const userId = localStorage.getItem('userId');
  
  const authState = {
    isAuthenticated: !!token || isLoggedIn,
    hasToken: !!token,
    isExplicitlyLoggedIn: isLoggedIn,
    hasUserData: !!userData,
    hasUserId: !!userId
  };
  
  console.log('Current auth state:', authState);
  
  if (token) {
    // Log token type to help debug
    const isJWT = token.startsWith('ey');
    const isTemp = token.startsWith('temp_') || token.startsWith('mock_');
    
    console.log('Token analysis:', {
      isJWT,
      isTemp,
      length: token.length,
      preview: token.substring(0, 10) + '...'
    });
  }
  
  return authState;
};

// Get user display name with fallback logic
export const getUserDisplayName = () => {
  try {
    const userData = getUserData();
    if (!userData) return 'User';
    
    console.log('[authUtils] Getting display name from userData:', {
      preferredName: userData.preferredName,
      firstName: userData.firstName, 
      name: userData.name,
      email: userData.email
    });
    
    // Enhanced priority logic:
    // 1. Preferred name (highest priority)
    // 2. First name
    // 3. Extract first name from full name
    // 4. Email username (fallback)
    // 5. "User" (final fallback)
    if (userData.preferredName && userData.preferredName.trim()) {
      console.log('[authUtils] Using preferredName:', userData.preferredName.trim());
      return userData.preferredName.trim();
    }
    
    // Try to get name from firstName (second priority)
    if (userData.firstName && userData.firstName.trim()) {
      console.log('[authUtils] Using firstName:', userData.firstName.trim());
      return userData.firstName.trim();
    }
    
    // Try to extract first name from full name
    if (userData.name && userData.name.trim()) {
      const extractedFirstName = userData.name.trim().split(' ')[0];
      console.log('[authUtils] Extracted from name:', extractedFirstName);
      return extractedFirstName;
    }
    
    // Try to extract from email username
    if (userData.email && userData.email.trim()) {
      const emailUsername = userData.email.split('@')[0];
      console.log('[authUtils] Using email username:', emailUsername);
      return emailUsername;
    }
    
    // Final fallback - never show userType
    console.log('[authUtils] Using final fallback: User');
    return 'User';
  } catch (error) {
    console.error('[authUtils] Error getting user display name:', error);
    return 'User';
  }
};

// Update user data in localStorage and throughout the app
export const updateUserProfile = (profileData) => {
  try {
    const currentUserData = getUserData() || {};
    
    // Merge the new profile data with existing user data
    const updatedUserData = {
      ...currentUserData,
      ...profileData,
      // Ensure name fields are properly set
      firstName: profileData.firstName || profileData.name?.split(' ')[0] || currentUserData.firstName,
      lastName: profileData.lastName || profileData.name?.split(' ').slice(1).join(' ') || currentUserData.lastName,
      name: profileData.name || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()
    };
    
    // Save to localStorage
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    
    console.log('[authUtils] User profile updated in localStorage:', updatedUserData);
    
    return true;
  } catch (error) {
    console.error('[authUtils] Error updating user profile:', error);
    return false;
  }
}; 