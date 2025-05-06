import axios from 'axios';

// Define API_URL with explicit port 5000 to match what the browser is using
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('authService API_URL initialized as:', API_URL);

export const testConnection = async () => {
  // Simplified test connection - doesn't respect test mode anymore since it's only used for diagnostics
  try {
    // Ensure API URL is correct
    let baseUrl = API_URL;
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4); // Remove /api for the test endpoint
    }
    
    const testUrl = `${baseUrl}/test`;
    console.log('Testing server connection at:', testUrl);
    
    const response = await axios.get(testUrl);
    console.log('Server test response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Server test error:', error);
    throw error;
  }
};

export const login = async (credentials) => {
  console.log('Login function called with:', credentials);
  
  if (!credentials.email || !credentials.password) {
    throw new Error('Email and password are required');
  }

  // Removed test mode check - we don't need to disable tests here anymore
  
  try {
    // Ensure we have the correct URL format
    let baseUrl = API_URL;
    if (!baseUrl.includes('/api')) {
      baseUrl = `${baseUrl}/api`;
    }
    
    // Proceeding directly to login without any test connections
    console.log('Proceeding directly to login with API');
    const loginUrl = `${baseUrl}/auth/login`;
    console.log('Login URL:', loginUrl);
    
    console.log('Attempting login with API');
    const response = await axios.post(loginUrl, credentials);
    console.log('Login successful - raw response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      hasData: !!response.data,
      dataKeys: Object.keys(response.data || {})
    });
    
    // Log the exact response structure for debugging
    console.log('Complete response data structure:', JSON.stringify(response.data, null, 2));
    
    // Standardize the response structure to match what the app expects
    let token, user;
    
    // Handle different response formats from the server
    if (response.data.data) {
      // If the data is nested in a data property
      console.log('Using nested data format (data.data)');
      token = response.data.data.token;
      user = response.data.data.user;
    } else {
      // Direct properties
      console.log('Using direct data format');
      token = response.data.token;
      user = response.data.user;
    }
    
    console.log('Extracted authentication data:', {
      hasToken: !!token,
      tokenType: typeof token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? token.substring(0, 10) + '...' : 'none',
      hasUser: !!user,
      userId: user?._id || 'missing'
    });
    
    if (!token) {
      console.error('No token found in response!', response.data);
      throw new Error('No authentication token received from server');
    }
    
    // Store token directly to verify it's being saved
    try {
      console.log('Attempting to store token in localStorage:', token ? token.substring(0, 10) + '...' : 'null/undefined');
      
      // First check if token already exists and if it's different
      const existingToken = localStorage.getItem('token');
      if (existingToken) {
        console.log('Found existing token in localStorage:', existingToken.substring(0, 10) + '...');
        
        if (existingToken === token) {
          console.log('New token matches existing token, no need to update');
        } else {
          console.log('Updating token in localStorage - different from existing token');
          localStorage.setItem('token', token);
        }
      } else {
        console.log('No existing token, storing new token in localStorage');
        localStorage.setItem('token', token);
      }
      
      // Always ensure we have userId and isLoggedIn flags set
      if (user && user._id) {
        localStorage.setItem('userId', user._id);
      }
      localStorage.setItem('isLoggedIn', 'true');
      
      // Check immediately if token was stored
      const storedToken = localStorage.getItem('token');
      console.log('Token storage check - token in localStorage:', 
                 storedToken ? storedToken.substring(0, 10) + '...' : 'missing/null');
    } catch (storageError) {
      console.error('Error storing token in localStorage:', storageError);
    }
    
    return {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user
      }
    };
  } catch (error) {
    console.error('Login failed:', error);
    
    // Create a standardized error object
    let errorMessage = 'Login failed. Please check your credentials.';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      errorMessage = error.response.data?.message || 
                    error.response.data?.error?.message || 
                    `Server error: ${error.response.status}`;
      console.error('Server response error:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please try again later.';
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message;
      console.error('Request setup error:', error.message);
    }
    
    // Rethrow with better message
    throw new Error(errorMessage);
  }
};

export const register = async (userData) => {
  try {
    // Ensure we have the correct URL format
    let baseUrl = API_URL;
    if (!baseUrl.includes('/api')) {
      baseUrl = `${baseUrl}/api`;
    }
    
    const registerUrl = `${baseUrl}/auth/register`;
    console.log('Registering user at:', registerUrl);
    
    const response = await axios.post(registerUrl, userData);
    console.log('Registration successful:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Register error:', error);
    
    // Create a standardized error object
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.response) {
      errorMessage = error.response.data?.message || 
                    error.response.data?.error?.message || 
                    `Server error: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'No response from server. Please try again later.';
    } else {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('userId');
  localStorage.removeItem('isLoggedIn');
  console.log('User logged out, auth data cleared from localStorage');
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage');
      return null;
    }
    
    // Ensure we have the correct URL format
    let baseUrl = API_URL;
    if (!baseUrl.includes('/api')) {
      baseUrl = `${baseUrl}/api`;
    }
    
    const userUrl = `${baseUrl}/auth/me`;
    console.log('Fetching current user from:', userUrl);
    
    const response = await axios.get(userUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data && response.data.success) {
      // Return the user data from the response
      return response.data.data.user;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}; 