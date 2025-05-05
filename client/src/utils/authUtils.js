// Get the JWT token from localStorage
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Set the JWT token in localStorage
export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove the JWT token from localStorage
export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

// Check if the user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  const isExplicitlyLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  console.log('Authentication check:', {
    hasToken: !!token,
    isExplicitlyLoggedIn,
    finalDecision: !!(token || isExplicitlyLoggedIn)
  });
  
  // Return true if either token exists or explicit login flag is set
  return !!(token || isExplicitlyLoggedIn);
};

// Get the current user's ID
export const getCurrentUserId = () => {
  // First try to get from a dedicated userId field
  const userId = localStorage.getItem('userId');
  if (userId) return userId;
  
  // If not available, try to get from userData
  try {
    const userDataJson = localStorage.getItem('userData');
    if (userDataJson) {
      const userData = JSON.parse(userDataJson);
      
      // If userData has an _id field
      if (userData._id) {
        return userData._id;
      }
      
      // If userData has an email field, try to extract ID from email
      if (userData.email) {
        // For test users, email is formatted like pro1@example.com or seeker5@example.com
        if (userData.email.includes('@example.com')) {
          const parts = userData.email.split('@');
          return parts[0]; // Return 'pro1' or 'seeker5'
        }
      }
      
      // If userData has a userType, generate a fallback ID
      if (userData.userType) {
        return `${userData.userType}_user`;
      }
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  
  // If all else fails, return a placeholder ID
  return 'current_user';
};

// Store user data in local storage
export const setUserData = (userData) => {
  console.log('Setting user data in localStorage:', userData);
  
  try {
    if (!userData || !userData._id) {
      console.warn('Warning: Attempted to save invalid user data', userData);
    }
    
    // Explicitly store userId for easier access
    if (userData && userData._id) {
      localStorage.setItem('userId', userData._id);
      console.log('User ID saved:', userData._id);
    }
    
    // Store the full userData object
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log('User data successfully saved to localStorage');
    
    // Verify data was stored correctly
    const savedData = localStorage.getItem('userData');
    console.log('Verification - userData retrieved:', savedData ? 'success' : 'failed');
  } catch (error) {
    console.error('Error saving user data to localStorage:', error);
  }
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
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('userId');
  localStorage.removeItem('isAdmin');
};

// Logout user
export const logout = () => {
  console.log('Logging out user, clearing auth data');
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('userId');
  localStorage.removeItem('isAdmin');
}; 