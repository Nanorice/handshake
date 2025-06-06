import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const GlobalMessageContext = createContext({
  // Unread message state
  unreadCount: 0,
  setUnreadCount: () => {},
  
  // Floating chat widget state
  isFloatingChatOpen: false,
  setIsFloatingChatOpen: () => {},
  
  // Open chat windows state
  openChats: [],
  addOpenChat: () => {},
  removeOpenChat: () => {},
  minimizedChats: [],
  minimizeChat: () => {},
  maximizeChat: () => {},
  
  // Recent conversations for floating widget
  recentConversations: [],
  setRecentConversations: () => {},
  
  // Socket connection for real-time updates
  socket: null,
  isConnected: false,
});

export const useGlobalMessage = () => {
  const context = useContext(GlobalMessageContext);
  if (!context) {
    throw new Error('useGlobalMessage must be used within a GlobalMessageProvider');
  }
  return context;
};

export const GlobalMessageProvider = ({ children }) => {
  // Core state
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const [openChats, setOpenChats] = useState([]);
  const [minimizedChats, setMinimizedChats] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);
  
  // Socket state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const { user, isAuthenticated } = useAuth();

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      
      if (token && !socket) {
        console.log('[GlobalMessage] Initializing socket connection...');
        
        const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
          auth: { token },
          transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
          console.log('[GlobalMessage] Socket connected');
          setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
          console.log('[GlobalMessage] Socket disconnected');
          setIsConnected(false);
        });

        // Listen for new messages to update unread count
        newSocket.on('new-message', (data) => {
          console.log('[GlobalMessage] New message received:', data);
          
          // Only increment if the message is not from the current user
          if (data.sender._id !== user._id) {
            setUnreadCount(prev => prev + 1);
            
            // Show browser notification if supported
            showBrowserNotification(data);
          }
        });

        // Listen for message read events to decrease unread count
        newSocket.on('message-read', (data) => {
          console.log('[GlobalMessage] Messages marked as read:', data);
          setUnreadCount(prev => Math.max(0, prev - (data.readCount || 1)));
        });

        // Listen for unread count updates from server
        newSocket.on('unread-count-update', (data) => {
          console.log('[GlobalMessage] Unread count update:', data);
          setUnreadCount(data.unreadCount || 0);
        });

        setSocket(newSocket);
      }
    }

    // Cleanup socket on unmount or when user logs out
    return () => {
      if (socket) {
        console.log('[GlobalMessage] Cleaning up socket connection');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user]);

  // Fetch initial unread count when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUnreadCount();
      fetchRecentConversations();
    } else {
      // Reset state when user logs out
      setUnreadCount(0);
      setRecentConversations([]);
      setOpenChats([]);
      setMinimizedChats([]);
      setIsFloatingChatOpen(false);
    }
  }, [isAuthenticated, user]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('[GlobalMessage] Error fetching unread count:', error);
    }
  };

  const fetchRecentConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/conversations?limit=10&sort=lastActivity', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('[GlobalMessage] Error fetching recent conversations:', error);
    }
  };

  // Browser notification function
  const showBrowserNotification = (messageData) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const senderName = messageData.sender ? 
        `${messageData.sender.firstName} ${messageData.sender.lastName}` : 
        'Someone';
      
      new Notification(`New message from ${senderName}`, {
        body: messageData.content ? messageData.content.substring(0, 100) : 'New message',
        icon: '/favicon.ico',
        tag: messageData.threadId,
        requireInteraction: false,
      });
    }
  };

  // Request notification permission
  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('[GlobalMessage] Notification permission:', permission);
      });
    }
  }, []);

  // Chat window management functions
  const addOpenChat = useCallback((conversation) => {
    const maxOpenChats = 3; // LinkedIn-style limit
    
    setOpenChats(prev => {
      // Check if chat is already open
      if (prev.find(chat => chat._id === conversation._id)) {
        return prev;
      }
      
      // If we're at the limit, remove the oldest chat
      if (prev.length >= maxOpenChats) {
        const newChats = prev.slice(1); // Remove first (oldest)
        return [...newChats, conversation];
      }
      
      return [...prev, conversation];
    });
    
    // Remove from minimized if it was minimized
    setMinimizedChats(prev => prev.filter(id => id !== conversation._id));
  }, []);

  const removeOpenChat = useCallback((conversationId) => {
    setOpenChats(prev => prev.filter(chat => chat._id !== conversationId));
    setMinimizedChats(prev => prev.filter(id => id !== conversationId));
  }, []);

  const minimizeChat = useCallback((conversationId) => {
    setMinimizedChats(prev => {
      if (!prev.includes(conversationId)) {
        return [...prev, conversationId];
      }
      return prev;
    });
  }, []);

  const maximizeChat = useCallback((conversationId) => {
    setMinimizedChats(prev => prev.filter(id => id !== conversationId));
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((threadId, messageCount = 1) => {
    if (socket && isConnected) {
      socket.emit('mark-messages-read', { threadId, messageCount });
    }
  }, [socket, isConnected]);

  const contextValue = {
    // Unread message state
    unreadCount,
    setUnreadCount,
    
    // Floating chat widget state
    isFloatingChatOpen,
    setIsFloatingChatOpen,
    
    // Open chat windows state
    openChats,
    addOpenChat,
    removeOpenChat,
    minimizedChats,
    minimizeChat,
    maximizeChat,
    
    // Recent conversations
    recentConversations,
    setRecentConversations,
    fetchRecentConversations,
    
    // Socket connection
    socket,
    isConnected,
    
    // Utility functions
    fetchUnreadCount,
    requestNotificationPermission,
    markAsRead,
  };

  return (
    <GlobalMessageContext.Provider value={contextValue}>
      {children}
    </GlobalMessageContext.Provider>
  );
}; 