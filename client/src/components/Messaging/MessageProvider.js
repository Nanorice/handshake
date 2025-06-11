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

    // CRITICAL FIX: Ensure content is always a string and trim trailing spaces
    const messageContent = message.content;
    const validContent = typeof messageContent === 'string' ? messageContent.trim() : 
                        (messageContent ? String(messageContent).trim() : '');

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

  // Add message to state with proper deduplication
  const addMessageToState = useCallback((message) => {
    if (!message) return;

    const normalizedMessage = normalizeMessage(message);
    if (!normalizedMessage) return;

    setMessages(prev => {
      // Enhanced deduplication check using multiple criteria
      const messageExists = prev.some(existing => {
        if (!existing) return false;
        
        // Check multiple ID fields to catch duplicates
        return (
          // Same _id
          (existing._id && normalizedMessage._id && existing._id === normalizedMessage._id) ||
          // Same tempId 
          (existing.tempId && normalizedMessage.tempId && existing.tempId === normalizedMessage.tempId) ||
          // Cross-reference: existing._id matches new tempId (server response to temp message)
          (existing._id && normalizedMessage.tempId && existing._id === normalizedMessage.tempId) ||
          // Cross-reference: existing.tempId matches new _id (temp message gets real ID)
          (existing.tempId && normalizedMessage._id && existing.tempId === normalizedMessage._id) ||
          // Same content, sender, and close timestamp (within 5 seconds)
          (existing.content === normalizedMessage.content &&
           existing.sender?._id === normalizedMessage.sender?._id &&
           Math.abs(new Date(existing.createdAt) - new Date(normalizedMessage.createdAt)) < 5000)
        );
      });

      if (messageExists) {
        console.log(`[MessageProvider] Duplicate message ignored:`, {
          messageId: normalizedMessage._id,
          tempId: normalizedMessage.tempId,
          content: normalizedMessage.content?.substring(0, 20)
        });
        return prev;
      }

      // Add new message and sort
      const updatedMessages = [...prev, normalizedMessage].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      console.log(`[MessageProvider] Message added. Count: ${prev.length} → ${updatedMessages.length}`);
      
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
    
    // Event handlers
    const handleNewMessage = (message) => {
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
    };

    const handleMessageError = (data) => {
      console.log('[MessageProvider] Message error received:', data);
      if (data.tempId) {
        // Remove failed temp message
        setMessages(prev => prev.filter(m => m.tempId !== data.tempId));
        setError('Failed to send message');
      }
    };

    const handleMessageRemoved = (data) => {
      console.log('[MessageProvider] Message removed:', data);
      if (data.tempId) {
        // Remove temp message
        setMessages(prev => prev.filter(m => m.tempId !== data.tempId));
      }
    };
    
    // Register event listeners
    socketService.on('new-message', handleNewMessage);
    socketService.on('message-error', handleMessageError);
    socketService.on('message-removed', handleMessageRemoved);
    
    // Cleanup function
    return () => {
      socketService.off('new-message', handleNewMessage);
      socketService.off('message-error', handleMessageError);
      socketService.off('message-removed', handleMessageRemoved);
      socketService.emitEvent('leave-thread', threadId);
      
      // Save scroll position when leaving thread
      if (threadId) {
        saveScrollPosition('message-thread-container', threadId);
      }
    };
  }, [threadId, addMessageToState]);

  // Optimized send message function with immediate UI update - FIXED to handle proper parameters
  const sendMessage = useCallback(async (content, attachments = [], replyToId = null, type = 'text') => {
    // CRITICAL FIX: Ensure content is a string and trim any trailing spaces
    const messageContent = typeof content === 'string' ? content.trim() : String(content || '').trim();
    
    if (!messageContent || !threadId) return null;

    const tempId = `temp-${Date.now()}-${threadId}`;
    const tempMessage = {
      tempId,
      content: messageContent, // Use validated and trimmed string content
      sender: { _id: userId }, // Proper sender object structure
      threadId,
      type,
      attachments: attachments || [],
      replyTo: replyToId,
      createdAt: new Date().toISOString(),
      pending: true
    };

    // Save scroll position before adding optimistic message
    saveScrollPosition('message-thread-container', threadId);

    // Add optimistic message
    addMessageToState(tempMessage);

    try {
      // CRITICAL FIX: Call messageService.sendMessage with correct parameter order
      // messageService expects: sendMessage(threadId, content, attachments, replyToId)
      const sentMessage = await messageService.sendMessage(threadId, messageContent, attachments || [], replyToId);
      
      // Replace temp message with server response (prevents duplicates)
      setMessages(prev => {
        return prev.map(msg => {
          // Replace temp message with real server response
          if (msg.tempId === tempId) {
            const normalized = normalizeMessage(sentMessage);
            return normalized || msg; // Keep temp if normalization fails
          }
          return msg;
        }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
