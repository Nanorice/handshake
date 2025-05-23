import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getMyInvitations } from '../services/invitationService';

const InvitationContext = createContext();

/**
 * Hook to use the invitation context
 * @returns {Object} Invitation context methods and state
 */
export const useInvitation = () => {
  const context = useContext(InvitationContext);
  if (!context) {
    throw new Error('useInvitation must be used within an InvitationProvider');
  }
  return context;
};

/**
 * Provider component for invitation context
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 */
export const InvitationProvider = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [invitations, setInvitations] = useState({
    sent: [],
    received: [],
    all: [],
    loading: false,
    error: null
  });
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Refresh all invitations
   * This increments a key to trigger a global refresh
   */
  const refreshInvitations = useCallback(() => {
    setRefreshKey(key => key + 1);
  }, []);

  /**
   * Load invitations based on type and status
   * @param {Object} options Filter options
   * @param {string} options.type Type of invitations ('sent', 'received', 'all')
   * @param {string} options.status Status filter ('pending', 'accepted', 'declined', 'all')
   * @returns {Promise<Array>} Promise that resolves to array of invitations
   */
  const loadInvitations = useCallback(async (options = {}) => {
    const { type = 'all', status } = options;
    
    try {
      setInvitations(prev => ({
        ...prev,
        loading: true,
        error: null
      }));
      
      const params = {};
      if (type !== 'all') params.type = type;
      if (status) params.status = status;
      
      const result = await getMyInvitations(params);
      
      if (result.success && result.data) {
        // Update the specific type's invitations
        setInvitations(prev => ({
          ...prev,
          [type]: result.data.invitations || [],
          loading: false
        }));
        
        // Also update the all array if we're loading all
        if (type === 'all') {
          setInvitations(prev => ({
            ...prev,
            all: result.data.invitations || []
          }));
        }
        
        // Count unread pending invitations
        if (type === 'received' && !status) {
          const pendingCount = (result.data.invitations || [])
            .filter(inv => inv.status === 'pending')
            .length;
          
          setUnreadCount(pendingCount);
        }
        
        return result.data.invitations || [];
      } else {
        setInvitations(prev => ({
          ...prev,
          loading: false,
          error: 'No invitations found'
        }));
        return [];
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      setInvitations(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Could not load invitations'
      }));
      return [];
    }
  }, []);

  // Load invitations on mount and when refresh key changes
  useEffect(() => {
    // Load all invitations first
    loadInvitations({ type: 'all' });
    
    // Then load sent and received separately
    loadInvitations({ type: 'sent' });
    loadInvitations({ type: 'received' });
    
    // Set up periodic refresh
    const intervalId = setInterval(() => {
      loadInvitations({ type: 'received' });
    }, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [loadInvitations, refreshKey]);

  return (
    <InvitationContext.Provider
      value={{
        invitations,
        refreshKey,
        unreadCount,
        refreshInvitations,
        loadInvitations
      }}
    >
      {children}
    </InvitationContext.Provider>
  );
};

export default InvitationProvider; 