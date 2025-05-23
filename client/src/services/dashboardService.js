import { createAuthClient } from '../utils/apiClient';
import { getMyInvitations } from './invitationService';

/**
 * Get comprehensive dashboard statistics
 * Combines data from multiple endpoints for the dashboard
 * @returns {Promise} Promise with the dashboard stats
 */
export const getDashboardStats = async () => {
  try {
    // Create authenticated API client
    const client = createAuthClient();
    
    // 1. Get user stats from the backend
    const statsResponse = await client.get('/users/stats');
    
    if (!statsResponse.data.success) {
      throw new Error(statsResponse.data.error?.message || 'Failed to fetch statistics');
    }
    
    // 2. Get invitation counts directly
    const pendingInvitationsResponse = await getMyInvitations({ type: 'received', status: 'pending' });
    const sentInvitationsResponse = await getMyInvitations({ type: 'sent' });
    const acceptedInvitationsResponse = await getMyInvitations({ status: 'accepted' });
    
    // Calculate real metrics
    const pendingRequests = pendingInvitationsResponse.success 
      ? pendingInvitationsResponse.data.invitations.length 
      : 0;
      
    const totalMatches = acceptedInvitationsResponse.success 
      ? acceptedInvitationsResponse.data.invitations.length 
      : 0;
    
    // Calculate total sent invitations (including all statuses)
    const totalSentInvitations = sentInvitationsResponse.success 
      ? sentInvitationsResponse.data.invitations.length 
      : 0;
    
    // Combine with server stats, preferring real data over server data
    const combinedStats = {
      ...statsResponse.data.data,
      pendingRequests,
      totalMatches,
      totalSentInvitations, // Include the sent invitations count
      completedMeetings: statsResponse.data.data?.completedMeetings || 0
    };
    
    return {
      success: true,
      data: combinedStats
    };
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    
    // Return a basic error response
    return {
      success: false,
      error: {
        message: error.message || 'Failed to fetch dashboard statistics'
      }
    };
  }
};

/**
 * Get summary of invitation statistics
 * @returns {Promise} Promise with invitation counts
 */
export const getInvitationStats = async () => {
  try {
    // Get different types of invitations
    const pendingReceived = await getMyInvitations({ type: 'received', status: 'pending' });
    const pendingSent = await getMyInvitations({ type: 'sent', status: 'pending' });
    const accepted = await getMyInvitations({ status: 'accepted' });
    const declined = await getMyInvitations({ status: 'declined' });
    
    // Calculate counts
    const stats = {
      pendingReceived: pendingReceived.success ? pendingReceived.data.invitations.length : 0,
      pendingSent: pendingSent.success ? pendingSent.data.invitations.length : 0,
      accepted: accepted.success ? accepted.data.invitations.length : 0,
      declined: declined.success ? declined.data.invitations.length : 0,
      total: 0
    };
    
    // Calculate total
    stats.total = stats.pendingReceived + stats.pendingSent + stats.accepted + stats.declined;
    
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error fetching invitation statistics:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Failed to fetch invitation statistics'
      }
    };
  }
}; 