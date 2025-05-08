// Synchronous local storage wrapper to avoid race conditions
const TokenStorage = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => {
    if (!token) return false;
    try {
      localStorage.setItem('token', token);
      // Verify it was set correctly
      return localStorage.getItem('token') === token;
    } catch (e) {
      console.error('Failed to set token:', e);
      return false;
    }
  },
  removeToken: () => localStorage.removeItem('token'),
  debugToken: () => {
    const token = localStorage.getItem('token');
    console.log('Token debug:', {
      exists: !!token,
      preview: token ? `${token.substring(0, 10)}...` : 'none'  
    });
    return token;
  }
};

// Define API_URL with explicit port 5000 to match the server
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('authUtils API_URL initialized as:', API_URL);

// Get the JWT token from localStorage
export const getAuthToken = () => {
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