import axios from 'axios';
import { getApiBaseUrl } from './apiConfig';
import { getAuthToken } from './authUtils';

// Define API URL
const API_URL = getApiBaseUrl();

/**
 * Create an authenticated API client with the JWT token
 * @returns {Object} Axios instance with auth headers
 */
export const createAuthClient = () => {
  const token = getAuthToken();
  
  if (!token) {
    console.warn('No authentication token found when creating API client');
  }
  
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
};

/**
 * Make an authenticated GET request
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise} - Promise with the response
 */
export const authGet = async (endpoint, params = {}) => {
  const client = createAuthClient();
  return client.get(endpoint, { params });
};

/**
 * Make an authenticated POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @returns {Promise} - Promise with the response
 */
export const authPost = async (endpoint, data = {}) => {
  const client = createAuthClient();
  return client.post(endpoint, data);
};

/**
 * Make an authenticated PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body
 * @returns {Promise} - Promise with the response
 */
export const authPut = async (endpoint, data = {}) => {
  const client = createAuthClient();
  return client.put(endpoint, data);
};

/**
 * Make an authenticated DELETE request
 * @param {string} endpoint - API endpoint
 * @returns {Promise} - Promise with the response
 */
export const authDelete = async (endpoint) => {
  const client = createAuthClient();
  return client.delete(endpoint);
}; 