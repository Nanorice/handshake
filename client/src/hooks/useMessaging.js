import { useState, useEffect, useCallback, useRef } from 'react';
import messageService from '../services/messageService';
import socketService from '../services/socketService';
import { getAuthToken, getCurrentUserId } from '../utils/authUtils';

/**
 * Custom hook to handle messaging functionality
 */
const useMessaging = () => {
  // Always initialize with empty arrays to prevent undefined
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUserId = getCurrentUserId();
  
  // Add refs to track refresh state
  const refreshingRef = useRef(false);
  const lastRefreshTimeRef = useRef(0);
  const MIN_REFRESH_INTERVAL = 3000; // Minimum time between refreshes (3 seconds)
  
  // Initialize socket and fetch threads
  useEffect(() => {
    // Keep track of initialization status
    let isMounted = true;
    setLoading(true);
    
    const initializeMessaging = async () => {
      try {
        // Get JWT token and validate it first
        const token = getAuthToken();
        if (!token) {
          console.error('useMessaging: No valid JWT token available');
          setError(new Error('Authentication required'));
          setLoading(false);
          return;
        }
        
        // Initialize socket connection
        try {
          await socketService.connect(token);
          console.log('Socket connection established');
          
          // Set up socket listeners after successful connection
          if (isMounted) {
            socketService.onNewMessage(handleNewMessage);
            socketService.onThreadRead(handleThreadRead);
            socketService.onMessageNotification(handleMessageNotification);
            socketService.onTyping(handleTyping);
            socketService.onTypingStopped(handleTypingStopped);
          }
        } catch (socketError) {
          console.error('Socket connection failed:', socketError);
          // Don't return early - we can still try to load messages from API
        }
        
        // Fetch threads from API
        try {
          const fetchedThreads = await messageService.getThreads();
          if (isMounted) {
            setThreads(fetchedThreads || []);
          }
        } catch (threadsError) {
          console.error('Failed to fetch threads:', threadsError);
          if (isMounted) {
            setError(new Error('Could not load message threads'));
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Messaging initialization failed:', error);
        if (isMounted) {
          setError(error);
          setLoading(false);
        }
      }
    };
    
    initializeMessaging();
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
      
      // Clean up all socket listeners
      if (socketService.isSocketConnected()) {
        socketService.removeListener('new-message');
        socketService.removeListener('thread-read');
        socketService.removeListener('message-notification');
        socketService.removeListener('typing');
        socketService.removeListener('typing-stopped');
        
        // Leave any selected thread
        if (selectedThread?._id) {
          socketService.leaveThread(selectedThread._id);
        }
        
        // Don't disconnect here as other components might use the socket
      }
    };
  }, []);
  
  // When selected thread changes, fetch messages
  useEffect(() => {
    if (selectedThread) {
      console.log('Selected thread changed, fetching messages for:', selectedThread._id);
      fetchMessages(selectedThread._id);
      socketService.joinThread(selectedThread._id);
      
      // Mark thread as read
      if (selectedThread.unreadCount > 0) {
        markThreadAsRead(selectedThread._id);
      }
    }
    
    return () => {
      if (selectedThread) {
        socketService.leaveThread(selectedThread._id);
      }
    };
  }, [selectedThread]);
  
  // Handle message notifications
  const handleMessageNotification = useCallback((notification) => {
    console.log('Message notification received in useMessaging:', notification);
    
    // Update thread list or create new thread
    setThreads(prev => {
      // Ensure prev is always an array
      const prevThreads = Array.isArray(prev) ? prev : [];
      
      const updatedThreads = [...prevThreads];
      const threadIndex = updatedThreads.findIndex(t => t._id === notification.threadId);
      
      if (threadIndex !== -1) {
        // Update existing thread with new message info
        const updatedThread = {
          ...updatedThreads[threadIndex],
          lastMessage: {
            content: notification.message.content,
            sender: notification.message.sender,
            timestamp: new Date().toISOString()
          },
          unreadCount: (updatedThreads[threadIndex].unreadCount || 0) + 1
        };
        
        // Move thread to top of list
        updatedThreads.splice(threadIndex, 1);
        updatedThreads.unshift(updatedThread);
        
        return updatedThreads;
      } else {
        // If thread not found, we'll need to refresh the threads
        // This will trigger if it's a new conversation
        console.log('Thread not found in list, scheduling thread refresh');
        debouncedRefreshThreads();
        return updatedThreads; // Return unchanged for now, we'll update after fetch
      }
    });
    
    // If the notification is for the currently selected thread, add the message
    if (selectedThread && notification.threadId === selectedThread._id) {
      // Add message to the current thread's messages
      setMessages(prev => {
        // Ensure prev is always an array
        const prevMessages = Array.isArray(prev) ? prev : [];
        return [...prevMessages, notification.message];
      });
    }
  }, [selectedThread]);
  
  // Fetch all threads for the current user
  const fetchThreads = async () => {
    // Prevent concurrent refreshes
    if (refreshingRef.current) {
      console.log('Thread refresh already in progress, skipping');
      return;
    }
    
    // Check if we're refreshing too frequently
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL) {
      console.log('Skipping thread refresh - too soon since last refresh');
      return;
    }
    
    try {
      refreshingRef.current = true;
      setLoading(true);
      setError(null); // Clear previous errors
      console.log('Fetching threads from messageService.getThreads()');
      
      // Add a small delay to ensure UI is properly initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const threadData = await messageService.getThreads();
      console.log('Fetched threads:', threadData);
      
      // Add a defensive check to ensure threadData is valid
      if (Array.isArray(threadData)) {
        // Store threads in state
        setThreads(threadData);
        
        // Select the first thread if none is selected
        if (!selectedThread && threadData.length > 0) {
          // Use a small delay to allow state to update properly
          setTimeout(() => {
            setSelectedThread(threadData[0]);
          }, 50);
        }
      } else {
        console.error('Invalid thread data received:', threadData);
        setError('Failed to load conversations: Invalid data format');
        
        try {
          // Try to fall back to local storage
          const localThreads = await messageService.getLocalThreads();
          if (Array.isArray(localThreads) && localThreads.length > 0) {
            setThreads(localThreads);
          } else {
            // Ensure we always set an array even if local storage fails
            setThreads([]);
          }
        } catch (localError) {
          console.error('Local storage fallback failed:', localError);
          setThreads([]);
        }
      }
      
      lastRefreshTimeRef.current = Date.now();
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError(`Failed to load conversations: ${err.message}`);
      
      // Set empty array to prevent undefined errors
      setThreads([]);
      
      // Log additional details for diagnosis
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
      } else if (err.request) {
        console.error('No response received:', err.request);
      }
    } finally {
      setLoading(false);
      refreshingRef.current = false;
    }
  };
  
  // Fetch messages for a specific thread
  const fetchMessages = async (threadId) => {
    try {
      setLoading(true);
      const data = await messageService.getMessages(threadId);
      console.log('Fetched messages for thread:', threadId, data.messages);
      
      // Ensure messages is always an array
      setMessages(data.messages || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
      setLoading(false);
      
      // Set empty array to prevent undefined errors
      setMessages([]);
    }
  };
  
  // Handle a new message from the socket
  const handleNewMessage = useCallback((message) => {
    if (!message) {
      console.warn('Received undefined message from socket');
      return;
    }
    
    console.log('Received new message via socket:', message);
    
    // Check if message is for the current selected thread
    if (selectedThread && message.threadId === selectedThread._id) {
      // Ensure messages is always an array
      const messagesArray = Array.isArray(messages) ? messages : [];
      
      // Avoid duplicate messages by checking both _id and tempId
      const messageExists = messagesArray.some(m => {
        if (!m) return false;
        return (
          (m._id === message._id) || 
          (m.tempId && message.tempId && m.tempId === message.tempId) ||
          (m._id === message.tempId) ||
          (message._id === m.tempId)
        );
      });
      
      if (!messageExists) {
        console.log('Adding new message to current thread:', message);
        setMessages(prev => {
          // Ensure prev is always an array
          const prevMessages = Array.isArray(prev) ? prev : [];
          return [...prevMessages, message];
        });
        
        // Mark as read immediately since user is viewing this thread
        if (message.sender?._id !== currentUserId) {
          messageService.markThreadAsRead(message.threadId)
            .then(() => console.log('Thread marked as read after receiving message'))
            .catch(err => console.error('Error marking thread as read:', err));
        }
      } else {
        console.log('Message already exists in current thread', message);
      }
    } else {
      console.log('Message is for another thread:', message.threadId);
    }
    
    // Update threads list to show latest message at top
    setThreads(prev => {
      // Ensure prev is always an array
      const prevThreads = Array.isArray(prev) ? prev : [];
      
      const updatedThreads = [...prevThreads];
      const threadIndex = updatedThreads.findIndex(t => t._id === message.threadId);
      
      if (threadIndex !== -1) {
        // Thread exists, update it
        const updatedThread = {
          ...updatedThreads[threadIndex],
          lastMessage: {
            content: message.content,
            sender: message.sender?._id || message.sender, // Handle both object and ID
            timestamp: message.createdAt || new Date().toISOString(),
            messageType: message.messageType || 'text'
          },
          updatedAt: message.createdAt || new Date().toISOString()
        };
        
        // If message is from another user and not the current thread, increment unread
        if (message.sender?._id !== currentUserId && 
            (!selectedThread || selectedThread._id !== message.threadId)) {
          updatedThread.unreadCount = (updatedThread.unreadCount || 0) + 1;
        } else if (selectedThread && selectedThread._id === message.threadId) {
          // If this is the current thread, reset unread count
          updatedThread.unreadCount = 0;
        }
        
        // Move to top
        updatedThreads.splice(threadIndex, 1);
        updatedThreads.unshift(updatedThread);
      } else {
        // Thread doesn't exist yet, might be a new conversation
        // We'll handle this by refreshing threads later
        debouncedRefreshThreads();
      }
      
      return updatedThreads;
    });
  }, [selectedThread, messages, currentUserId]);
  
  // Handle thread read status updates
  const handleThreadRead = useCallback((data) => {
    console.log('Thread read notification received:', data);
    const { threadId, userId } = data;
    
    // Only need to update if read by another user
    if (userId !== currentUserId) {
      // The other user read the messages, no need to update anything in our UI
      console.log('Messages marked as read by another user');
    }
  }, [currentUserId]);
  
  // Handle typing indicator
  const handleTyping = useCallback((data) => {
    // Not implemented yet
    console.log('Typing indicator received:', data);
  }, []);
  
  // Handle typing stopped indicator
  const handleTypingStopped = useCallback((data) => {
    // Not implemented yet
    console.log('Typing stopped indicator received:', data);
  }, []);
  
  // Add a debounce for refreshThreads to prevent too many calls
  let refreshThreadsTimeout = null;
  const debouncedRefreshThreads = () => {
    clearTimeout(refreshThreadsTimeout);
    refreshThreadsTimeout = setTimeout(fetchThreads, 1000);
  };

  // Function to allow parent components to refresh threads
  const refreshThreads = () => {
    debouncedRefreshThreads();
  };
  
  // Send a message with attachments using the updated messageService
  const sendMessage = async (messageText, attachments = []) => {
    if (!selectedThread) {
      console.error('Cannot send message: No thread selected');
      return null;
    }
    
    // Ensure messageText is a string
    const textContent = typeof messageText === 'string' ? messageText : '';
    
    // Require either text content or attachments
    if (!textContent.trim() && (!attachments || !Array.isArray(attachments) || attachments.length === 0)) {
      console.error('Cannot send message: No content or attachments');
      return null;
    }
    
    const trimmedContent = textContent.trim();
    
    try {
      // Process attachments if any (we already have the URLs from fileService)
      const processedAttachments = Array.isArray(attachments) ? attachments.map(attachment => {
        if (!attachment) return null;
        return {
          id: attachment.id || `attachment-${Date.now()}-${Math.random()}`,
          name: attachment.name || 'File',
          type: attachment.type || 'application/octet-stream',
          size: attachment.size || 0,
          url: attachment.url || attachment.preview || ''
        };
      }).filter(Boolean) : [];
      
      // Create optimistic local message
      const optimisticMessage = {
        _id: `local-${Date.now()}`,
        tempId: `temp-${Date.now()}`,
        threadId: selectedThread._id,
        content: trimmedContent,
        messageType: processedAttachments.length > 0 ? 'mixed' : 'text',
        attachments: processedAttachments,
        sender: { 
          _id: currentUserId,
          firstName: 'You', // This will be replaced when the server responds
          lastName: ''
        },
        createdAt: new Date().toISOString(),
        isLocal: true
      };
      
      // Update UI immediately with optimistic message
      setMessages(prev => {
        // Ensure prev is always an array
        const prevMessages = Array.isArray(prev) ? prev : [];
        return [...prevMessages, optimisticMessage];
      });
      
      // Send to server using messageService
      const serverMessage = await messageService.sendMessage(
        selectedThread._id,
        trimmedContent,
        processedAttachments
      );
      
      console.log('Message sent to server, response:', serverMessage);
      
      // Update messages with server response or keep optimistic if server fails
      if (serverMessage) {
        setMessages(prev => {
          // Ensure prev is always an array
          const prevMessages = Array.isArray(prev) ? prev : [];
          return prevMessages.map(msg => 
            msg && msg.tempId === optimisticMessage.tempId ? 
              { ...serverMessage, attachments: processedAttachments } : 
              msg
          );
        });
        
        return serverMessage;
      }
      
      // Server failed, keep optimistic message
      return optimisticMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      return null;
    }
  };
  
  // Create a new thread
  const createThread = async (participantId, initialMessage) => {
    try {
      // Create the thread
      const newThread = await messageService.createThread(participantId, initialMessage);
      console.log('New thread created:', newThread);
      
      // Add to threads list and select it
      setThreads(prev => {
        // Ensure prev is always an array
        const prevThreads = Array.isArray(prev) ? prev : [];
        return [newThread, ...prevThreads];
      });
      setSelectedThread(newThread);
      
      return newThread;
    } catch (err) {
      console.error('Error creating thread:', err);
      setError('Failed to create conversation');
      return null;
    }
  };
  
  // Mark a thread as read
  const markThreadAsRead = async (threadId) => {
    try {
      await messageService.markThreadAsRead(threadId);
      
      // Update local thread state
      setThreads(prev => {
        // Ensure prev is always an array
        const prevThreads = Array.isArray(prev) ? prev : [];
        return prevThreads.map(thread => 
          thread._id === threadId 
            ? { ...thread, unreadCount: 0 } 
            : thread
        );
      });
    } catch (err) {
      console.error('Error marking thread as read:', err);
    }
  };
  
  return {
    // Always ensure threads and messages are arrays
    threads: Array.isArray(threads) ? threads : [],
    selectedThread,
    messages: Array.isArray(messages) ? messages : [],
    loading: !!loading,
    error,
    setSelectedThread,
    selectThread: setSelectedThread,
    sendMessage,
    createThread,
    refreshThreads
  };
};

export default useMessaging; 