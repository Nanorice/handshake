import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socketService from '../../services/socketService';
import messageService from '../../services/messageService';
import { saveScrollPosition, restoreScrollPosition } from '../../utils/scrollPositionManager';

// Create context
const MessageContext = createContext(null);

// Custom hook to use the message context
export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export const MessageProvider = ({ children, threadId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(socketService.isSocketConnected());

  // Normalize message format for consistency
  const normalizeMessage = useCallback((message) => {
    if (!message) return null;
    
    // Clone to avoid mutating original
    const normalized = { ...message };
    
    // Ensure message has an ID
    if (!normalized._id) {
      normalized._id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Normalize sender format
    if (normalized.sender === undefined || normalized.sender === null) {
      normalized.sender = { _id: 'unknown' };
    } else if (typeof normalized.sender === 'string') {
      normalized.sender = { _id: normalized.sender };
    }
    
    // Ensure timestamp
    if (!normalized.createdAt) {
      normalized.createdAt = normalized.timestamp || new Date().toISOString();
    }
    
    return normalized;
  }, []);

  // Load initial messages
  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Reset state when thread changes
    setMessages([]);
    setLoading(true);
    setError(null);

    console.log(`[MessageProvider] Loading initial messages for thread: ${threadId}`);
    
    messageService.getMessages(threadId)
      .then(initialMessages => {
        if (Array.isArray(initialMessages)) {
          const normalizedMessages = initialMessages
            .map(normalizeMessage)
            .filter(Boolean)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            
          setMessages(normalizedMessages);
          console.log(`[MessageProvider] Loaded ${normalizedMessages.length} messages for thread: ${threadId}`);
        } else {
          console.warn(`[MessageProvider] Expected array of messages but got:`, initialMessages);
          setMessages([]);
        }
      })
      .catch(err => {
        console.error('[MessageProvider] Error loading messages:', err);
        setError('Failed to load messages');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [threadId, normalizeMessage]);

  // Track socket connection status
  useEffect(() => {
    const handleSocketConnect = () => {
      console.log('[MessageProvider] Socket connected');
      setSocketConnected(true);
    };

    const handleSocketDisconnect = () => {
      console.log('[MessageProvider] Socket disconnected');
      setSocketConnected(false);
    };

    // Set up socket connection status listeners
    socketService.on('connect', handleSocketConnect);
    socketService.on('disconnect', handleSocketDisconnect);

    // Initialize state
    setSocketConnected(socketService.isSocketConnected());

    return () => {
      socketService.off('connect', handleSocketConnect);
      socketService.off('disconnect', handleSocketDisconnect);
    };
  }, []);

  // Handle socket connection and message subscription for current thread
  useEffect(() => {
    if (!threadId || !userId) return;

    console.log(`[MessageProvider DEBUG] Setting up effect for thread: ${threadId}, userId: ${userId}`);

    // Message handler for the current thread
    const handleNewMessage = (message) => {
      console.log(`🔍 [MessageProvider DEBUG] handleNewMessage called with:`, {
        hasMessage: !!message,
        messageId: message?._id,
        threadId: message?.threadId,
        content: message?.content?.substring(0, 30),
        sender: message?.sender,
        currentThreadId: threadId,
        timestamp: new Date().toISOString()
      });
      
      if (!message) {
        console.error('[MessageProvider] Received undefined message');
        return;
      }

      // Check if the message belongs to the current thread
      // Handle all possible threadId formats
      const messageThreadId = message.threadId || 
                             (message.thread && message.thread._id) || 
                             (message.thread && typeof message.thread === 'string' ? message.thread : null);
      
      // Log threadId check for debugging
      console.log(`[MessageProvider DEBUG] Message threadId check: `, {
        messageThreadId,
        currentThreadId: threadId,
        match: messageThreadId === threadId
      });
      
      if (!messageThreadId || messageThreadId !== threadId) {
        console.log(`[MessageProvider] Message is for a different thread (${messageThreadId}), ignoring`);
        return;
      }
      
      const normalizedMessage = normalizeMessage(message);
      if (!normalizedMessage) return;
      
      console.log(`[MessageProvider DEBUG] Adding normalized message to state:`, normalizedMessage);
      
      // Force component update with the new message - using function to ensure we have the latest state
      setMessages(prevMessages => {
        // Check if message already exists in the array
        const exists = prevMessages.some(m => m._id === normalizedMessage._id);
        
        if (exists) {
          console.log(`[MessageProvider] Message ${normalizedMessage._id} already exists, not adding`);
          return prevMessages;
        }
        
        console.log(`[MessageProvider DEBUG] Adding new message ID: ${normalizedMessage._id} to state. Previous count: ${prevMessages.length}`);
        
        // Add the new message and sort by timestamp
        const updatedMessages = [...prevMessages, normalizedMessage].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        console.log(`[MessageProvider DEBUG] New messages count: ${updatedMessages.length}`);
        return updatedMessages;
      });
    };

    // Create a direct server polling function as backup
    const pollServerForMessages = async () => {
      try {
        console.log(`[MessageProvider DEBUG] Polling server for messages for thread: ${threadId}`);
        const serverMessages = await messageService.getMessages(threadId);
        
        if (Array.isArray(serverMessages) && serverMessages.length > 0) {
          console.log(`[MessageProvider DEBUG] Fetched ${serverMessages.length} messages from server`);
          
          // Process the messages by getting the current state and combining
          setMessages(prevMessages => {
            // Normalize all messages
            const normalized = serverMessages
              .map(normalizeMessage)
              .filter(Boolean);
              
            // Find messages we don't already have
            const newMessages = normalized.filter(newMsg => 
              !prevMessages.some(existingMsg => existingMsg._id === newMsg._id)
            );
            
            if (newMessages.length === 0) {
              console.log('[MessageProvider DEBUG] No new messages from server poll');
              return prevMessages;
            }
            
            console.log(`[MessageProvider DEBUG] Adding ${newMessages.length} new messages from server poll`);
            
            // Combine and sort
            return [...prevMessages, ...newMessages].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
        }
      } catch (err) {
        console.error('[MessageProvider] Error polling server for messages:', err);
      }
    };

    // Join thread room to receive socket messages - make socket setup more robust
    const setupSocketConnection = () => {
      // Ensure socket is connected first
      if (!socketService.isSocketConnected()) {
        console.log('[MessageProvider DEBUG] Socket not connected, connecting now...');
        socketService.connect();
      }
  
      console.log(`[MessageProvider DEBUG] Joining thread room: ${threadId}`);
      
      // 1. Join the thread room via socket
      socketService.emitEvent('join-thread', threadId);
      
      // 2. Subscribe explicitly to thread-specific messages
      console.log(`[MessageProvider DEBUG] Subscribing to thread: ${threadId}`);
      socketService.subscribeToThread(threadId, handleNewMessage);
      
      // 3. Manually register with persistent handlers for reliable updates
      try {
        if (socketService.persistentHandlers && socketService.persistentHandlers['new-message']) {
          console.log('[MessageProvider DEBUG] Adding to persistent new-message handlers');
          socketService.persistentHandlers['new-message'].add(handleNewMessage);
        } else {
          console.warn('[MessageProvider DEBUG] Cannot add to persistent handlers - not initialized');
        }
      } catch (err) {
        console.error('[MessageProvider] Error adding to persistent handlers:', err);
      }
      
      // 4. OPTIMIZED: Register only primary socket event for messages (removed redundant handlers)
      console.log('[MessageProvider DEBUG] Setting up optimized socket event listener');
      
      try {
        // OPTIMIZATION: Use only 'new-message' event to avoid duplicate processing
        socketService.on('new-message', handleNewMessage);
        console.log('[MessageProvider DEBUG] Registered primary new-message handler');
      } catch (err) {
        console.error('[MessageProvider] Error setting up socket listener:', err);
      }
    };
    
    // Set up the socket connection and listeners
    setupSocketConnection();
    
    // OPTIMIZED: Smart emergency polling - only when connection has issues
    const intervalId = setInterval(() => {
      if (!socketService.isSocketConnected()) {
        console.log('[MessageProvider] Socket disconnected, attempting reconnect');
        socketService.connect();
        pollServerForMessages();
      } else if (socketService.hasConnectionIssues()) {
        // SMART POLLING: Only poll when connection is unstable
        console.log('[MessageProvider] Connection issues detected, emergency polling');
        pollServerForMessages();
      } else {
        // CONNECTION HEALTHY: Skip polling, rely on real-time socket events
        console.log('[MessageProvider] Connection healthy, skipping emergency poll');
      }
    }, 15000); // Check every 15 seconds (reduced from 30s for better responsiveness)
    
    // CRITICAL: Initial polling to ensure we have messages
    pollServerForMessages();

    // Clean up listeners when thread changes or component unmounts
    return () => {
      console.log(`[MessageProvider DEBUG] Cleaning up listeners for thread: ${threadId}`);
      
      // 1. Remove from persistent handlers
      try {
        if (socketService.persistentHandlers && socketService.persistentHandlers['new-message']) {
          console.log('[MessageProvider DEBUG] Removing from persistent handlers');
          socketService.persistentHandlers['new-message'].delete(handleNewMessage);
        }
      } catch (err) {
        console.error('[MessageProvider] Error removing from persistent handlers:', err);
      }
      
      // 2. OPTIMIZED: Remove only primary socket listener (matches registration)
      try {
        socketService.off('new-message', handleNewMessage);
        console.log('[MessageProvider DEBUG] Removed primary new-message handler');
      } catch (err) {
        console.error('[MessageProvider] Error removing socket listener:', err);
      }
      
      // 3. Unsubscribe from thread-specific messages
      try {
        console.log(`[MessageProvider DEBUG] Unsubscribing from thread: ${threadId}`);
        socketService.unsubscribeFromThread(threadId);
      } catch (err) {
        console.error('[MessageProvider] Error unsubscribing from thread:', err);
      }
      
      // 4. Leave thread room
      if (socketService.isSocketConnected()) {
        try {
          console.log(`[MessageProvider DEBUG] Leaving thread room: ${threadId}`);
          socketService.emitEvent('leave-thread', threadId);
        } catch (err) {
          console.error('[MessageProvider] Error leaving thread room:', err);
        }
      }
      
      // Clear refresh interval
      clearInterval(intervalId);
    };
  }, [threadId, userId, normalizeMessage]);

  // Send message function
  const sendMessage = useCallback(async (content) => {
    if (!threadId || !content.trim()) {
      console.warn('[MessageProvider] Cannot send message: missing threadId or content');
      return null;
    }
    
    try {
      // Create optimistic message for immediate UI feedback
      const optimisticMessage = normalizeMessage({
        _id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        threadId: threadId,
        content: content.trim(),
        sender: { _id: userId },
        createdAt: new Date().toISOString(),
        pending: true
      });
      
      // Add optimistic message to UI
      setMessages(currentMessages => {
        return [...currentMessages, optimisticMessage].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      
      console.log(`[MessageProvider] Sending message to thread: ${threadId}`);
      const sentMessage = await messageService.sendMessage(threadId, content);
      console.log(`[MessageProvider] Message sent successfully:`, sentMessage);
      
      if (sentMessage && sentMessage._id) {
        // Replace optimistic message with server response
        setMessages(currentMessages => 
          currentMessages.map(msg => 
            (msg._id === optimisticMessage._id) ? normalizeMessage(sentMessage) : msg
          )
        );
      }
      
      return sentMessage;
    } catch (error) {
      console.error('[MessageProvider] Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(currentMessages => 
        currentMessages.filter(msg => !msg._id.startsWith('temp-'))
      );
      
      setError('Failed to send message');
      return null;
    }
  }, [threadId, userId, normalizeMessage]);

  // Function to refresh messages from the server
  const refreshMessages = useCallback(async () => {
    if (!threadId) return;
    
    console.log(`[MessageProvider] Refreshing messages for thread: ${threadId}`);
    setLoading(true);
    
    try {
      const fetchedMessages = await messageService.getMessages(threadId);
      
      if (Array.isArray(fetchedMessages)) {
        const normalizedMessages = fetchedMessages
          .map(normalizeMessage)
          .filter(Boolean)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          
        setMessages(normalizedMessages);
        console.log(`[MessageProvider] Refreshed ${normalizedMessages.length} messages for thread: ${threadId}`);
      } else {
        console.warn(`[MessageProvider] Expected array of messages during refresh but got:`, fetchedMessages);
        setMessages([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('[MessageProvider] Error refreshing messages:', err);
      setError('Failed to refresh messages');
    } finally {
      setLoading(false);
    }
  }, [threadId, normalizeMessage]);

  // The value provided by the context
  const contextValue = {
    messages,
    loading,
    error,
    socketConnected,
    sendMessage,
    refreshMessages
  };

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
}; 