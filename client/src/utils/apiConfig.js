/**
 * Central configuration for API endpoints
 * This file should be imported whenever an API URL is needed
 */

// Define the API URL with environment variable fallback
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper to get the base URL with /api prefix
export const getApiBaseUrl = () => {
  return API_URL.includes('/api') ? API_URL : `${API_URL}/api`;
};

// Helper to get the Socket.io connection URL (without /api prefix)
export const getSocketUrl = () => {
  // Socket.io should connect to the root server, not the /api path
  return API_URL;
};

// Helper to construct full API URLs
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // Make sure the endpoint starts with / if it doesn't already
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${formattedEndpoint}`;
};

// Log configuration once when the file is first imported
console.log('API configuration initialized:', {
  API_URL,
  baseUrl: getApiBaseUrl(),
  socketUrl: getSocketUrl()
}); 