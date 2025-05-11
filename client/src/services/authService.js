import axios from 'axios';

// Define API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
console.log('authService API_URL initialized as:', API_URL);

// Function to test server connection
export const testServerConnection = async () => {
  try {
    const response = await axios.get(`${API_URL}/test`);
    console.log('Server connection test successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Server connection test failed:', error);
    throw error;
  }
};

/**
 * Login user
 * @param {Object} credentials - User login credentials (email, password)
 * @returns {Promise} - Promise with the login response
 */
export const login = async (credentials) => {
  try {
    // Ensure we have the correct URL format
    let baseUrl = API_URL;
    if (!baseUrl.includes('/api')) {
      baseUrl = `${baseUrl}/api`;
    }
    
    const loginUrl = `${baseUrl}/auth/login`;
    console.log('Login URL:', loginUrl);
    
    const response = await axios.post(loginUrl, credentials);
    console.log('Login response status:', response.status);
    
    // Extract token and user data
    const { token, user } = response.data.data;
    
    // Store authentication data in localStorage
    if (token) {
      localStorage.setItem('token', token);
      if (user) {
        localStorage.setItem('userId', user._id);
      }
      localStorage.setItem('isLoggedIn', 'true');
    }
    
    return {
      success: true,
      message: 'Login successful',
      data: { token, user }
    };
  } catch (error) {
    console.error('Login error:', error);
    
    let errorMessage = 'Login failed. Please check your credentials.';
    if (error.response) {
      errorMessage = error.response.data?.error?.message || 
                    error.response.data?.message || 
                    `Server error: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'No response from server. Please try again later.';
    } else {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise} - Promise with the registration response
 */
export const register = async (userData) => {
  try {
    // Ensure we have the correct URL format
    let baseUrl = API_URL;
    if (!baseUrl.includes('/api')) {
      baseUrl = `${baseUrl}/api`;
    }
    
    const registerUrl = `${baseUrl}/auth/register`;
    console.log('Registering user at:', registerUrl);
    console.log('With data:', JSON.stringify(userData, null, 2));
    
    const response = await axios.post(registerUrl, userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Registration response status:', response.status);
    console.log('Registration response data:', JSON.stringify(response.data, null, 2));
    
    // Extract token and user data from response
    const token = response.data?.data?.token;
    const user = response.data?.data?.user;
    
    // Store authentication data in localStorage
    if (token) {
      localStorage.setItem('token', token);
      if (user) {
        localStorage.setItem('userId', user._id);
        localStorage.setItem('userData', JSON.stringify(user));
      }
      localStorage.setItem('isLoggedIn', 'true');
    }
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    
    let errorMessage = 'Registration failed. Please try again.';
    if (error.response) {
      errorMessage = error.response.data?.error?.message || 
                    error.response.data?.message || 
                    `Server error: ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'No response from server. Please try again later.';
    } else {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Logout current user
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  localStorage.removeItem('userId');
  localStorage.removeItem('isLoggedIn');
};

/**
 * Get current user profile
 * @returns {Promise} - Promise with the current user data
 */
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    
    // Ensure we have the correct URL format
    let baseUrl = API_URL;
    if (!baseUrl.includes('/api')) {
      baseUrl = `${baseUrl}/api`;
    }
    
    const userUrl = `${baseUrl}/auth/me`;
    const response = await axios.get(userUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data && response.data.success) {
      return response.data.data.user;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}; 