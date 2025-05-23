/**
 * Simplified Invitation Service
 * 
 * This service provides direct, reliable methods for working with invitations,
 * with cleaner error handling and fewer dependencies.
 */

import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';

// Define API URL
const API_URL = getApiBaseUrl() || 'http://localhost:5000/api';

/**
 * Create the API client with authentication headers
 * @returns {Object} Axios instance with auth headers
 */
const createAuthClient = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('No authentication token found');
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
 * Get a specific invitation by ID
 * @param {string} id - The invitation ID
 * @returns {Promise} - Promise with the invitation
 */
export const getSimpleInvitation = async (id) => {
  try {
    const client = createAuthClient();
    const response = await client.get(`/simple-invitations/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting invitation:', error);
    
    const errorMessage = 
      error.response?.data?.message || 
      'Error fetching invitation';
    
    throw new Error(errorMessage);
  }
};

/**
 * Respond to an invitation (accept/decline) with simplified error handling
 * @param {string} id - The invitation ID
 * @param {string} status - The response status ('accepted' or 'declined')
 * @param {string} responseMessage - Optional response message
 * @returns {Promise} - Promise with the response
 */
export const simpleRespondToInvitation = async (id, status, responseMessage = '') => {
  console.log(`Simple invitation response - ID: ${id}, Status: ${status}`);
  
  try {
    const client = createAuthClient();
    
    // Check token before proceeding
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }
    
    const responseData = {
      status,
      ...(responseMessage ? { responseMessage } : {})
    };
    
    const response = await client.put(`/simple-invitations/${id}/respond`, responseData);
    return response.data;
  } catch (error) {
    console.error('Error responding to invitation:', error);
    
    // Create a clean error object
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      'Error responding to invitation';
    
    throw new Error(errorMessage);
  }
}; 