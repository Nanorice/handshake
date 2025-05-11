import axios from 'axios';
import { API_URL, getApiBaseUrl } from './apiConfig';

/**
 * Tests API connectivity to verify server routes are working
 * @param {string} endpoint - The API endpoint to test (e.g., '/api/matches')
 * @returns {Promise<Object>} - Test result with status and message
 */
export const testApiEndpoint = async (endpoint) => {
  try {
    // Make sure the endpoint starts with /api if not already included
    const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const token = localStorage.getItem('token');
    
    // Build the full URL with proper formatting
    const fullUrl = `${API_URL}${apiEndpoint}`.replace(/\/+/g, '/').replace(':/', '://');
    console.log(`Testing API endpoint: ${fullUrl}`);
    
    const response = await axios.get(fullUrl, {
      headers: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    });
    
    return {
      success: true,
      status: response.status,
      message: 'API endpoint is reachable',
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 'Unknown',
      message: error.message,
      error: error.response?.data || error
    };
  }
}; 