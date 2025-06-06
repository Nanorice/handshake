import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useSnackbar } from 'notistack';
import socketService from '../services/socketService';
import { fetchApi } from '../services/api';
import { getCurrentUserId } from '../utils/authUtils';

const MessageContext = createContext();

// OPTIMIZED: Simplified message state management
const initialState = {
  threads: {},
  activeThreadId: null,
  loading: false,
  unreadCounts: {},
  totalUnreadCount: 0,
  error: null,
  connectionStatus: 'disconnected'
};

// OPTIMIZED: Simplified reducer without complex deduplication
function messageReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };

    case 'LOAD_THREADS':
      return {
        ...state,
        threads: action.payload.reduce((acc, thread) => {
          acc[thread._id] = thread;
          return acc;
        }, {}),
        loading: false
      };

    case 'SET_ACTIVE_THREAD':
      return { ...state, activeThreadId: action.payload };

    case 'UPDATE_THREAD_MESSAGES':
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.payload.threadId]: {
            ...state.threads[action.payload.threadId],
            messages: action.payload.messages
          }
        }
      };

    // OPTIMIZED: Direct message addition without complex deduplication
    case 'ADD_MESSAGE':
      const { threadId, message } = action.payload;
      const thread = state.threads[threadId];
      
      if (!thread) {
        console.warn(`[MessageProvider] Thread ${threadId} not found for new message`);
        return state;
      }

      // Simple duplicate check - only check if message ID already exists
      const messageExists = thread.messages?.some(m => m._id === message._id);
      if (messageExists) {
        return state; // Skip if already exists
      }

      const updatedMessages = [...(thread.messages || []), message];
      
      return {
        ...state,
        threads: {
          ...state.threads,
          [threadId]: {
            ...thread,
            messages: updatedMessages,
            lastMessage: message,
            updatedAt: new Date().toISOString()
          }
        }
      };

    case 'UPDATE_UNREAD_COUNTS':
      const counts = action.payload;
      // Calculate total from threads' unread counts
      const totalUnread = Object.values(state.threads).reduce((sum, thread) => {
        const threadUnread = thread.unreadCount?.get?.(getCurrentUserId()) || 0;
        return sum + threadUnread;
      }, 0);
      
      return {
        ...state,
        unreadCounts: counts,
        totalUnreadCount: totalUnread
      };

    case 'MARK_THREAD_READ':
      const threadToMarkRead = action.payload;
      const newUnreadCounts = { ...state.unreadCounts };
      delete newUnreadCounts[threadToMarkRead];
      
      const newTotalUnread = Object.values(newUnreadCounts).reduce((sum, count) => sum + count, 0);
      
      return {
        ...state,
        unreadCounts: newUnreadCounts,
        totalUnreadCount: newTotalUnread
      };

    case 'CREATE_NEW_THREAD':
      const newThread = action.payload;
      return {
        ...state,
        threads: {
          ...state.threads,
          [newThread._id]: newThread
        }
      };

    default:
      return state;
  }
}

export function MessageProvider({ children }) {
  const [state, dispatch] = useReducer(messageReducer, initialState);
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // OPTIMIZED: Direct message handler for immediate processing
  const handleNewMessage = useCallback((message) => {
    console.log('[MessageProvider] Received new message:', message);
    
    if (!message || !message.threadId) {
      console.warn('[MessageProvider] Invalid message received:', message);
      return;
    }

    // Add message immediately to state
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { threadId: message.threadId, message }
    });

    // Show notification if not in active thread
    if (state.activeThreadId !== message.threadId && message.sender?._id !== user?._id) {
      enqueueSnackbar(`New message from ${message.sender?.firstName || 'Someone'}`, {
        variant: 'info',
        autoHideDuration: 3000
      });
    }
  }, [state.activeThreadId, user?._id, enqueueSnackbar]);

  // OPTIMIZED: Direct notification handler
  const handleMessageNotification = useCallback((notification) => {
    console.log('[MessageProvider] Received notification:', notification);
    
    if (notification.unreadCounts) {
      dispatch({
        type: 'UPDATE_UNREAD_COUNTS',
        payload: notification.unreadCounts
      });
    }
  }, []);

  // Initialize socket connection when user is available
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const initializeSocket = async () => {
      try {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
        
        await socketService.connect();
        
        if (!isMounted) return;

        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });

        // OPTIMIZED: Register direct callbacks for immediate processing
        socketService.onNewMessage(handleNewMessage);
        socketService.onMessageNotification(handleMessageNotification);

        console.log('[MessageProvider] Socket service initialized successfully');
        
      } catch (error) {
        console.error('[MessageProvider] Failed to initialize socket:', error);
        if (isMounted) {
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'error' });
          dispatch({ type: 'SET_ERROR', payload: 'Failed to connect to messaging service' });
        }
      }
    };

    initializeSocket();

    return () => {
      isMounted = false;
      // Clean up socket listeners
      socketService.removeListener('new-message', handleNewMessage);
      socketService.removeListener('message-notification', handleMessageNotification);
    };
  }, [user, handleNewMessage, handleMessageNotification]);

  // Load threads when user is available
  useEffect(() => {
    if (!user) return;

    const loadThreads = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const response = await fetchApi('/messages/threads');
        
        if (response.threads) {
          dispatch({ type: 'LOAD_THREADS', payload: response.threads });
          
          // Load unread counts
          const unreadResponse = await fetchApi('/messages/unread-counts');
          if (unreadResponse.unreadCounts) {
            dispatch({ type: 'UPDATE_UNREAD_COUNTS', payload: unreadResponse.unreadCounts });
          }
        }
      } catch (error) {
        console.error('[MessageProvider] Failed to load threads:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load message threads' });
      }
    };

    loadThreads();
  }, [user]);

  // OPTIMIZED: Simplified message sending without complex queuing
  const sendMessage = useCallback(async (threadId, messageData) => {
    try {
      // Optimistic update - add message immediately to UI
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        sender: user,
        createdAt: new Date().toISOString(),
        threadId,
        status: 'sending'
      };

      dispatch({
        type: 'ADD_MESSAGE',
        payload: { threadId, message: optimisticMessage }
      });

      // Send via socket for immediate delivery
      await socketService.sendMessage(threadId, messageData);
      
      console.log('[MessageProvider] Message sent successfully');
      
    } catch (error) {
      console.error('[MessageProvider] Failed to send message:', error);
      enqueueSnackbar('Failed to send message', { variant: 'error' });
      throw error;
    }
  }, [user, enqueueSnackbar]);

  const loadThreadMessages = useCallback(async (threadId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetchApi(`/messages/threads/${threadId}/messages`);
      
      if (response.messages) {
        dispatch({
          type: 'UPDATE_THREAD_MESSAGES',
          payload: { threadId, messages: response.messages }
        });

        // Subscribe to this thread for real-time updates
        socketService.subscribeToThread(threadId, handleNewMessage);
      }
    } catch (error) {
      console.error('[MessageProvider] Failed to load thread messages:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load messages' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [handleNewMessage]);

  const markThreadAsRead = useCallback(async (threadId) => {
    try {
      await fetchApi(`/messages/threads/${threadId}/read`, { method: 'POST' });
      
      dispatch({ type: 'MARK_THREAD_READ', payload: threadId });
      
      // Emit socket event for real-time updates
      socketService.emitEvent('mark-thread-read', threadId);
      
    } catch (error) {
      console.error('[MessageProvider] Failed to mark thread as read:', error);
    }
  }, []);

  const createNewThread = useCallback(async (participantId, initialMessage) => {
    try {
      const response = await fetchApi('/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          initialMessage
        })
      });

      if (response.thread) {
        dispatch({ type: 'CREATE_NEW_THREAD', payload: response.thread });
        return response.thread;
      }
    } catch (error) {
      console.error('[MessageProvider] Failed to create thread:', error);
      enqueueSnackbar('Failed to create conversation', { variant: 'error' });
      throw error;
    }
  }, [enqueueSnackbar]);

  const setActiveThread = useCallback((threadId) => {
    // Unsubscribe from previous thread
    if (state.activeThreadId && state.activeThreadId !== threadId) {
      socketService.unsubscribeFromThread(state.activeThreadId);
    }

    dispatch({ type: 'SET_ACTIVE_THREAD', payload: threadId });

    // Mark thread as read when activated
    if (threadId && state.unreadCounts[threadId] > 0) {
      markThreadAsRead(threadId);
    }
  }, [state.activeThreadId, state.unreadCounts, markThreadAsRead]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...state,
    sendMessage,
    loadThreadMessages,
    markThreadAsRead,
    createNewThread,
    setActiveThread
  }), [
    state,
    sendMessage,
    loadThreadMessages,
    markThreadAsRead,
    createNewThread,
    setActiveThread
  ]);

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
} 