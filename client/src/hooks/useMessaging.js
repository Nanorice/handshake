import { useState, useEffect, useCallback } from 'react';
import messageService from '../services/messageService';
import socketService from '../services/socketService';
import { getAuthToken, getCurrentUserId } from '../utils/authUtils';

/**
 * Custom hook to handle messaging functionality
 */
const useMessaging = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUserId = getCurrentUserId();
  
  // Initialize socket and fetch threads
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      socketService.connect(token);
    }
    
    fetchThreads();
    
    // Set up socket listeners
    socketService.onNewMessage(handleNewMessage);
    socketService.onThreadRead(handleThreadRead);
    socketService.onMessageNotification(handleMessageNotification);
    
    // Cleanup on unmount
    return () => {
      socketService.removeListener('new-message');
      socketService.removeListener('thread-read');
      socketService.removeListener('message-notification');
      
      if (selectedThread) {
        socketService.leaveThread(selectedThread._id);
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
      const updatedThreads = [...prev];
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
        console.log('Thread not found in list, refreshing threads');
        setTimeout(() => fetchThreads(), 100); // Slight delay to ensure server has processed any new messages
        return updatedThreads; // Return unchanged for now, we'll update after fetch
      }
    });
    
    // If the notification is for the currently selected thread, add the message
    if (selectedThread && notification.threadId === selectedThread._id) {
      // Add message to the current thread's messages
      setMessages(prev => [...prev, notification.message]);
    }
  }, [selectedThread]);
  
  // Fetch all threads for the current user
  const fetchThreads = async () => {
    try {
      setLoading(true);
      const threadData = await messageService.getThreads();
      console.log('Fetched threads:', threadData);
      setThreads(threadData);
      
      // Select the first thread if none is selected
      if (!selectedThread && threadData.length > 0) {
        setSelectedThread(threadData[0]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Failed to load conversations');
      setLoading(false);
    }
  };
  
  // Fetch messages for a specific thread
  const fetchMessages = async (threadId) => {
    try {
      setLoading(true);
      const data = await messageService.getMessages(threadId);
      console.log('Fetched messages for thread:', threadId, data.messages);
      setMessages(data.messages || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
      setLoading(false);
    }
  };
  
  // Handle a new message from the socket
  const handleNewMessage = useCallback((message) => {
    console.log('Received new message via socket:', message);
    
    // Check if message is for the current selected thread
    if (selectedThread && message.threadId === selectedThread._id) {
      // Avoid duplicate messages by checking both _id and tempId
      const messageExists = messages.some(m => 
        (m._id === message._id) || 
        (m.tempId && message.tempId && m.tempId === message.tempId) ||
        (m._id === message.tempId) ||
        (message._id === m.tempId)
      );
      
      if (!messageExists) {
        console.log('Adding new message to current thread:', message);
        setMessages(prev => [...prev, message]);
        
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
      const updatedThreads = [...prev];
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
        console.log('Thread not found in list, might be a new conversation');
        
        // Fetch threads to get the latest including any new ones
        setTimeout(() => fetchThreads(), 200);
      }
      
      return updatedThreads;
    });
  }, [selectedThread, messages, currentUserId]);
  
  // Handle thread read status update
  const handleThreadRead = useCallback(({ threadId, userId }) => {
    setThreads(prev => {
      return prev.map(thread => {
        if (thread._id === threadId) {
          return { ...thread, isRead: true, unreadCount: 0 };
        }
        return thread;
      });
    });
  }, []);
  
  // Send a message with attachments using the updated messageService
  const sendMessage = async (messageText, attachments = []) => {
    if (!selectedThread) {
      console.error('Cannot send message: No thread selected');
      return null;
    }
    
    // Require either text content or attachments
    if (!messageText.trim() && (!attachments || attachments.length === 0)) {
      console.error('Cannot send message: No content or attachments');
      return null;
    }
    
    const trimmedContent = messageText.trim();
    
    try {
      // Process attachments if any (we already have the URLs from fileService)
      const processedAttachments = attachments.map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        url: attachment.url || attachment.preview
      }));
      
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
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Send to server using messageService
      const serverMessage = await messageService.sendMessage(
        selectedThread._id,
        trimmedContent,
        processedAttachments
      );
      
      console.log('Message sent to server, response:', serverMessage);
      
      // Update messages with server response or keep optimistic if server fails
      if (serverMessage) {
        setMessages(prev => 
          prev.map(msg => 
            msg.tempId === optimisticMessage.tempId ? 
              { ...serverMessage, attachments: processedAttachments } : 
              msg
          )
        );
        
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
      setThreads(prev => [newThread, ...prev]);
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
      setThreads(prev => 
        prev.map(thread => 
          thread._id === threadId 
            ? { ...thread, unreadCount: 0 } 
            : thread
        )
      );
    } catch (err) {
      console.error('Error marking thread as read:', err);
    }
  };
  
  // Refresh threads
  const refreshThreads = () => {
    console.log('Manually refreshing threads');
    fetchThreads();
  };
  
  return {
    threads,
    selectedThread,
    messages,
    loading,
    error,
    setSelectedThread,
    sendMessage,
    createThread,
    markThreadAsRead,
    refreshThreads
  };
};

export default useMessaging; 