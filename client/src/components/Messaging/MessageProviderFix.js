import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  // Use refs to prevent unnecessary re-renders
  const scrollPositionRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  // Enhanced message normalization with proper content validation and sender structure
  const normalizeMessage = useCallback((message) => {
    if (!message) return null;

    // Extract thread info
    const threadInfo = message.thread || {};
    const threadId = typeof threadInfo === 'string' ? threadInfo : (threadInfo._id || message.threadId);

    // Extract sender info - preserve object structure for compatibility
    const senderInfo = message.sender || {};
    const senderId = typeof senderInfo === 'string' ? senderInfo : (senderInfo._id || message.senderId);
    const senderName = senderInfo.firstName || senderInfo.name || 'Unknown';

    // CRITICAL FIX: Ensure content is always a string to prevent trim() errors
    const messageContent = message.content;
    const validContent = typeof messageContent === 'string' ? messageContent : 
                        (messageContent ? String(messageContent) : '');

    return {
      _id: message._id || message.tempId || `temp-${Date.now()}-${Math.random()}`,
      tempId: message.tempId,
      content: validContent, // Now guaranteed to be a string
      // CRITICAL FIX: Ensure sender has proper object structure for isCurrentUser check
      sender: typeof senderInfo === 'object' && senderInfo._id ? senderInfo : { 
        _id: senderId, 
        firstName: senderName,
        profile: senderInfo.profile || {}
      },
      threadId: threadId,
      createdAt: message.createdAt || message.timestamp || new Date().toISOString(),
      updatedAt: message.updatedAt || new Date().toISOString(),
      type: message.type || 'text'
    };
  }, []);

  // Optimized message deduplication with scroll preservation
  const addMessageToState = useCallback((newMessage) => {
    const normalizedMessage = normalizeMessage(newMessage);
    if (!normalizedMessage) return;

    // Save scroll position before state update
    if (threadId) {
      saveScrollPosition('message-thread-container', threadId);
    }

    setMessages(prevMessages => {
      // Multiple deduplication strategies
      const isDuplicate = prevMessages.some(existing => {
        // Check by exact ID
        if (existing._id === normalizedMessage._id) return true;
        
        // Check by temp ID
        if (normalizedMessage.tempId && existing.tempId === normalizedMessage.tempId) return true;
        
        // Check by content + sender + time (within 10 seconds)
        if (existing.content === normalizedMessage.content && 
            existing.sender?._id === normalizedMessage.sender?._id) {
          const timeDiff = Math.abs(
            new Date(existing.createdAt).getTime() - 
            new Date(normalizedMessage.createdAt).getTime()
          );
          if (timeDiff < 10000) return true; // 10 seconds
        }
        
        return false;
      });

      if (isDuplicate) {
        console.log(`[MessageProvider] Duplicate message blocked: ${normalizedMessage._id}`);
        return prevMessages;
      }

      // Add new message and sort
      const updatedMessages = [...prevMessages, normalizedMessage].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      console.log(`[MessageProvider] Message added. Count: ${prevMessages.length} → ${updatedMessages.length}`);
      
      // Update ref for scroll management
      lastMessageCountRef.current = updatedMessages.length;
      
      return updatedMessages;
    });
  }, [normalizeMessage, threadId]);

  // Debounced message handler to prevent rapid re-renders
  const handleNewMessage = useCallback((message) => {
    if (!message) return;

    // Check thread relevance
    const messageThreadId = message.threadId || 
                           (message.thread && message.thread._id) || 
                           (message.thread && typeof message.thread === 'string' ? message.thread : null);

    if (!messageThreadId || messageThreadId !== threadId) {
      return; // Ignore messages for other threads
    }

    // Use requestAnimationFrame to batch updates and prevent scroll jumping
    requestAnimationFrame(() => {
      addMessageToState(message);
    });
  }, [threadId, addMessageToState]);

  // Load initial messages with scroll restoration
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
          lastMessageCountRef.current = normalizedMessages.length;
          
          console.log(`[MessageProvider] Loaded ${normalizedMessages.length} messages for thread: ${threadId}`);
          
          // Restore scroll position after messages load
          setTimeout(() => {
            restoreScrollPosition('message-thread-container', threadId);
          }, 100);
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

  // Enhanced socket setup with single event listener
  useEffect(() => {
    if (!threadId) return;

    // Ensure socket connection
    if (!socketService.isSocketConnected()) {
      socketService.connect();
    }

    // Join thread room
    socketService.emitEvent('join-thread', threadId);
    
    // Single event listener for new messages
    socketService.on('new-message', handleNewMessage);
    
    // Cleanup function
    return () => {
      socketService.off('new-message', handleNewMessage);
      socketService.emitEvent('leave-thread', threadId);
      
      // Save scroll position when leaving thread
      if (threadId) {
        saveScrollPosition('message-thread-container', threadId);
      }
    };
  }, [threadId, handleNewMessage]);

  // Optimized send message function with immediate UI update
  const sendMessage = useCallback(async (content, type = 'text') => {
    if (!content.trim() || !threadId) return null;

    const tempId = `temp-${Date.now()}-${threadId}`;
    const tempMessage = {
      tempId,
      content: String(content), // Ensure content is string
      sender: { _id: userId }, // Proper sender object structure
      threadId,
      type,
      createdAt: new Date().toISOString(),
      pending: true
    };

    // Save scroll position before adding optimistic message
    saveScrollPosition('message-thread-container', threadId);

    // Add optimistic message
    addMessageToState(tempMessage);

    try {
      // Send via API
      const sentMessage = await messageService.sendMessage(threadId, { content, type });
      
      // Remove temp message and add real message
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.tempId !== tempId);
        const normalized = normalizeMessage(sentMessage);
        return normalized ? [...withoutTemp, normalized].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ) : withoutTemp;
      });

      return sentMessage;
    } catch (error) {
      console.error('[MessageProvider] Error sending message:', error);
      
      // Remove failed temp message
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
      
      setError(error.message);
      throw error;
    }
  }, [threadId, userId, addMessageToState, normalizeMessage]);

  // Function to refresh messages from the server
  const refreshMessages = useCallback(async () => {
    if (!threadId) return;
    
    console.log(`[MessageProvider] Refreshing messages for thread: ${threadId}`);
    
    // Save current scroll position
    saveScrollPosition('message-thread-container', threadId);
    setLoading(true);
    
    try {
      const fetchedMessages = await messageService.getMessages(threadId);
      
      if (Array.isArray(fetchedMessages)) {
        const normalizedMessages = fetchedMessages
          .map(normalizeMessage)
          .filter(Boolean)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          
        setMessages(normalizedMessages);
        lastMessageCountRef.current = normalizedMessages.length;
        console.log(`[MessageProvider] Refreshed ${normalizedMessages.length} messages for thread: ${threadId}`);
        
        // Restore scroll position after refresh
        setTimeout(() => {
          restoreScrollPosition('message-thread-container', threadId);
        }, 100);
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

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    messages,
    loading,
    error,
    socketConnected,
    isTyping,
    typingUsers,
    sendMessage,
    refreshMessages
  }), [messages, loading, error, socketConnected, isTyping, typingUsers, sendMessage, refreshMessages]);

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
}; 