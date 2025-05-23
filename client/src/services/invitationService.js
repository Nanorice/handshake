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
  
  return axios.create({
    baseURL: API_URL,
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
    const token = localStorage.getItem('token');
    console.log(`Auth token prefix: ${token ? token.substring(0, 10) + '...' : 'none'}`);
    
    const client = createAuthClient();
    console.log(`Calling API to respond to invitation ${id} with status: ${responseData.status}`);
    
    // Add retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`API call attempt ${attempts}/${maxAttempts}`);
        
        const response = await client.put(`/invitations/${id}/respond`, responseData);
        console.log(`API call succeeded on attempt ${attempts}`);
        return response.data;
      } catch (retryError) {
        console.error(`Attempt ${attempts} failed:`, retryError);
        lastError = retryError;
        
        // Only retry on network errors or 500s
        if (!retryError.response || retryError.response.status === 500) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          // Don't retry for 4xx errors
          break;
        }
      }
    }
    
    // If we get here, all attempts failed
    console.error('All retry attempts failed');
    throw lastError;
  } catch (error) {
    console.error('Error details from API:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Special handling for common errors
    if (error.response?.status === 500) {
      console.error('Server error detected, trying alternative approach');
      
      try {
        // Try a simplified request without responseMessage
        const client = createAuthClient();
        const simplifiedData = { status: responseData.status };
        const response = await client.put(`/invitations/${id}/respond`, simplifiedData);
        return response.data;
      } catch (fallbackError) {
        console.error('Fallback approach also failed:', fallbackError);
      }
    }
    
    // Create a more descriptive error with all relevant information
    const errorMessage = 
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      'Error responding to invitation';
    
    const enhancedError = new Error(errorMessage);
    enhancedError.status = error.response?.status;
    enhancedError.originalError = error;
    enhancedError.responseData = error.response?.data;
    
    throw enhancedError;
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

/**
 * Get chat thread for an accepted invitation
 * @param {string} invitationId - The invitation ID
 * @returns {Promise} - Promise with the chat thread
 */
export const getInvitationChatThread = async (invitationId) => {
  try {
    const client = createAuthClient();
    const response = await client.get(`/invitations/${invitationId}/chat`);
    return response.data;
  } catch (error) {
    console.error('Error getting invitation chat thread:', error);
    throw new Error(
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      'Error retrieving chat thread'
    );
  }
};

/**
 * Unlock chat for a specific invitation (after payment is processed)
 * @param {string} invitationId - The invitation ID
 * @returns {Promise} - Promise with the unlock response
 */
export const unlockInvitationChat = async (invitationId) => {
  try {
    const client = createAuthClient();
    const response = await client.post(`/invitations/${invitationId}/unlock-chat`);
    return response.data;
  } catch (error) {
    console.error('Error unlocking invitation chat:', error);
    throw new Error(
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      'Error unlocking chat'
    );
  }
};

/**
 * Get pending invitation notifications for current user
 * @returns {Promise} - Promise with the notifications
 */
export const getInvitationNotifications = async () => {
  try {
    const client = createAuthClient();
    const response = await client.get('/notifications/invitations');
    return response.data;
  } catch (error) {
    console.error('Error getting invitation notifications:', error);
    throw new Error(
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      'Error fetching notifications'
    );
  }
};

/**
 * Mark an invitation notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise} - Promise with the response
 */
export const markInvitationNotificationRead = async (notificationId) => {
  try {
    const client = createAuthClient();
    const response = await client.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error(
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      'Error updating notification'
    );
  }
};

/**
 * Direct test method to respond to an invitation - bypasses complex logic
 * @param {string} invitationId - The invitation ID
 * @param {string} status - The status to set ('accepted' or 'declined')
 * @returns {Promise} - Promise with the response
 */
export const testRespondToInvitation = async (invitationId, status) => {
  try {
    console.log(`DIRECT TEST: Responding to invitation ${invitationId} with status ${status}`);
    
    const client = createAuthClient();
    const response = await client.post('/invitations/test-respond', {
      invitationId,
      status
    });
    
    console.log('Direct test response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in direct test response:', error);
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Error in direct test response'
    );
  }
};

/**
 * Remove an invitation (professional only, for cleaning up accepted invitations)
 * @param {string} id - The invitation ID
 * @returns {Promise} - Promise with the response
 */
export const removeInvitation = async (id) => {
  try {
    const client = createAuthClient();
    const response = await client.put(`/invitations/${id}/remove`);
    return response.data;
  } catch (error) {
    console.error('Error removing invitation:', error);
    throw new Error(
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      'Error removing invitation'
    );
  }
}; 