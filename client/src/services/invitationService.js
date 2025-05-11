import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig';

// Define API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Create the API client with authentication headers
 * @returns {Object} Axios instance with auth headers
 */
const createAuthClient = () => {
  const token = localStorage.getItem('token');
  
  return axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
};

/**
 * Send an invitation to a professional
 * @param {Object} invitationData - The invitation data
 * @returns {Promise} - Promise with the invitation response
 */
export const sendInvitation = async (invitationData) => {
  try {
    const client = createAuthClient();
    const response = await client.post('/invitations', invitationData);
    return response.data;
  } catch (error) {
    console.error('Error sending invitation:', error);
    throw new Error(
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      'Error sending invitation'
    );
  }
};

/**
 * Get all invitations for the current user
 * @param {Object} params - Query parameters (status, type)
 * @returns {Promise} - Promise with the invitations
 */
export const getMyInvitations = async (params = {}) => {
  try {
    const client = createAuthClient();
    const response = await client.get('/invitations', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting invitations:', error);
    throw new Error(
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      'Error fetching invitations'
    );
  }
};

/**
 * Get a specific invitation by ID
 * @param {string} id - The invitation ID
 * @returns {Promise} - Promise with the invitation
 */
export const getInvitation = async (id) => {
  try {
    const client = createAuthClient();
    const response = await client.get(`/invitations/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting invitation:', error);
    throw new Error(
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      'Error fetching invitation'
    );
  }
};

/**
 * Respond to an invitation (accept/decline)
 * @param {string} id - The invitation ID
 * @param {Object} responseData - The response data (status, responseMessage)
 * @returns {Promise} - Promise with the response
 */
export const respondToInvitation = async (id, responseData) => {
  try {
    const client = createAuthClient();
    const response = await client.put(`/invitations/${id}/respond`, responseData);
    return response.data;
  } catch (error) {
    console.error('Error responding to invitation:', error);
    throw new Error(
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      'Error responding to invitation'
    );
  }
};

/**
 * Cancel an invitation (sender only)
 * @param {string} id - The invitation ID
 * @returns {Promise} - Promise with the response
 */
export const cancelInvitation = async (id) => {
  try {
    const client = createAuthClient();
    const response = await client.put(`/invitations/${id}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    throw new Error(
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      'Error cancelling invitation'
    );
  }
}; 