import axios from 'axios';
import { getAuthToken } from '../utils/authUtils';
import { getApiBaseUrl } from '../utils/apiConfig';

// Get the API base URL
const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization header to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401/403 errors
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.error('Authentication error:', error.response.status);
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      
      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch API function that mimics the fetch API but uses axios
 * @param {string} url - The endpoint URL (relative to API base)
 * @param {Object} options - Request options (method, headers, body, etc.)
 * @returns {Promise} - Returns the response data
 */
export const fetchApi = async (url, options = {}) => {
  try {
    const {
      method = 'GET',
      headers = {},
      body,
      ...restOptions
    } = options;

    const config = {
      method: method.toLowerCase(),
      url,
      headers: {
        ...headers
      },
      ...restOptions
    };

    // Add body as data for axios
    if (body) {
      if (typeof body === 'string') {
        config.data = JSON.parse(body);
      } else {
        config.data = body;
      }
    }

    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export default apiClient; 