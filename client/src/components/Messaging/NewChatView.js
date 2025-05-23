import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  IconButton, 
  Paper, 
  Avatar, 
  AppBar, 
  Toolbar, 
  useTheme,
  Chip,
  Badge
} from '@mui/material';
import { 
  Send as SendIcon, 
  ArrowBack as ArrowBackIcon,
  Circle as CircleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import NewMessageItem from './NewMessageItem';
import messageService from '../../services/messageService';
import socketService from '../../services/socketService';

// Helper to get initials
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Helper to safely check if a message is from the current user
const isMessageFromUser = (message, currentUserId) => {
  if (!message || !currentUserId) return false;
  
  // Handle different sender formats
  if (message.sender === currentUserId) return true;
  if (message.sender?._id === currentUserId) return true;
  if (typeof message.sender === 'string' && message.sender === currentUserId) return true;
  
  return false;
};

const NewChatView = ({ thread, onSendMessage, onBack, isMobile, currentUserId, socketConnected }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());
  const [lastPollingTime, setLastPollingTime] = useState(Date.now());
  const messagesEndRef = useRef(null);
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  
  // Track if polling is currently in progress to avoid overlapping calls
  const isPollingRef = useRef(false);

  // Refs for state and callbacks to ensure stable references for useEffect
  const processedMessageIdsRef = useRef(processedMessageIds);
  useEffect(() => {
    processedMessageIdsRef.current = processedMessageIds;
  }, [processedMessageIds]);

  const threadIdRef = useRef(thread?._id);
  useEffect(() => {
    threadIdRef.current = thread?._id;
  }, [thread?._id]);

  // NEW - Track remounts/renderings for debugging
  const mountCountRef = useRef(0);
  useEffect(() => {
    mountCountRef.current++;
    console.log(`[NewChatView] Component mounted/remounted count: ${mountCountRef.current}`);
    
    return () => {
      console.log(`[NewChatView] Component unmounting. Mount count was: ${mountCountRef.current}`);
    };
  }, []);

  // Helper function to normalize message format (ensure it's defined before useEffect)
  const normalizeMessageFormat = useCallback((msg) => {
    if (!msg) return null;
    const normalizedMsg = { ...msg };
    if (!normalizedMsg._id) {
      normalizedMsg._id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    }
    if (normalizedMsg.sender === undefined || normalizedMsg.sender === null) {
      normalizedMsg.sender = { _id: 'unknown' };
    } else if (typeof normalizedMsg.sender === 'string') {
      normalizedMsg.sender = { _id: normalizedMsg.sender };
    } else if (typeof normalizedMsg.sender === 'object' && !normalizedMsg.sender._id) {
      if (normalizedMsg.sender.id) {
        normalizedMsg.sender._id = normalizedMsg.sender.id;
      } else {
        normalizedMsg.sender._id = 'unknown';
      }
    }
    if (!normalizedMsg.createdAt) {
      normalizedMsg.createdAt = normalizedMsg.timestamp || new Date().toISOString();
    }
    return normalizedMsg;
  }, []);

  // Log received props
  console.log('[NewChatView] Received props:', { 
    threadId: thread?._id, 
    isMobile, 
    currentUserId,
    socketConnected
  });

  // Define handleNewMessage using useCallback to stabilize its reference
  const handleNewMessageLogic = useCallback((message) => {
    console.log('[NewChatView] handleNewMessageLogic: Received message object:', JSON.parse(JSON.stringify(message)));
    if (!threadIdRef.current) {
        console.warn('[NewChatView] handleNewMessageLogic: No active thread ID (threadIdRef.current is falsy). Current thread prop:', thread?._id, '. Ignoring message.');
        return;
    }
    console.log('[NewChatView] handleNewMessageLogic: Current threadIdRef:', threadIdRef.current, 'Message threadId:', message?.threadId);
    
    if (!message || !message.threadId || !message.content) {
      console.error('[NewChatView] handleNewMessageLogic: Received invalid or incomplete message format.', message);
      return;
    }
    
    if (message.threadId === threadIdRef.current) {
      console.log('[NewChatView] handleNewMessageLogic: Processing new message for current thread.');
      setMessages(prevMessages => {
        if (message._id && processedMessageIdsRef.current.has(message._id)) {
          console.log('[NewChatView] handleNewMessageLogic: Skipping already processed message ID:', message._id);
          return prevMessages;
        }
        
        const normalizedMessage = normalizeMessageFormat(message);
        if(!normalizedMessage) {
          console.warn('[NewChatView] handleNewMessageLogic: Normalization failed for message:', message);
          return prevMessages;
        }

        const isDuplicate = prevMessages.some(m => {
          if (!m) return false;
          if (m._id && normalizedMessage._id && m._id === normalizedMessage._id) return true;
          return false; 
        });
        
        if (isDuplicate) {
          console.log('[NewChatView] handleNewMessageLogic: Duplicate message detected by _id post-normalization, not adding:', normalizedMessage);
          return prevMessages;
        }
        
        if (normalizedMessage._id) {
          setProcessedMessageIds(prevIds => {
            const newIds = new Set(prevIds).add(normalizedMessage._id)
            console.log('[NewChatView] handleNewMessageLogic: Updated processedMessageIdsRef. Current size:', newIds.size);
            return newIds;
          });
        }
        
        console.log('[NewChatView] handleNewMessageLogic: Adding new message to state:', normalizedMessage);
        
        const newMessages = [...prevMessages, normalizedMessage].sort((a, b) => 
          new Date(a?.createdAt || a?.timestamp || 0).getTime() - 
          new Date(b?.createdAt || b?.timestamp || 0).getTime()
        );
        
        // setTimeout(() => { // Scroll might be better handled in a separate useEffect observing messages
        //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        // }, 100);
        
        return newMessages;
      });
    } else {
      console.log('[NewChatView] handleNewMessageLogic: Received message for a DIFFERENT thread. Current:', threadIdRef.current, 'Message was for:', message.threadId);
    }
  }, [currentUserId, normalizeMessageFormat, setMessages, setProcessedMessageIds, thread?._id]); // Added thread?._id to ensure threadIdRef is based on current prop

  const handleNewMessageRef = useRef(handleNewMessageLogic);
  useEffect(() => {
    handleNewMessageRef.current = handleNewMessageLogic;
  }, [handleNewMessageLogic]);

  // Define checkForMissedMessages using useCallback
  const checkForMissedMessagesLogic = useCallback(async () => {
    if (!threadIdRef.current) return;
    try {
      console.log('[NewChatView] checkForMissedMessagesLogic: Checking for thread:', threadIdRef.current);
      const latestMessages = await messageService.getMessages(threadIdRef.current);
      
      if (Array.isArray(latestMessages)) {
        setMessages(prevMessages => {
          const currentMessageIds = new Set(prevMessages.map(m => m._id).filter(Boolean));
          
          const missedMessages = latestMessages
            .map(msg => normalizeMessageFormat(msg))
            .filter(msg => msg && msg._id && !currentMessageIds.has(msg._id) && !processedMessageIdsRef.current.has(msg._id));
          
          if (missedMessages.length > 0) {
            console.log(`[NewChatView] checkForMissedMessagesLogic: Found ${missedMessages.length} missed messages. Adding.`);
            setProcessedMessageIds(prevIds => {
              const newProcessedIds = new Set(prevIds);
              missedMessages.forEach(msg => msg && msg._id && newProcessedIds.add(msg._id));
              return newProcessedIds;
            });
            return [...prevMessages, ...missedMessages].sort((a, b) => 
              new Date(a?.createdAt || a?.timestamp || 0).getTime() - 
              new Date(b?.createdAt || b?.timestamp || 0).getTime()
            );
          }
          console.log('[NewChatView] checkForMissedMessagesLogic: No new missed messages found.');
          return prevMessages;
        });
      }
    } catch (error) {
      console.error('[NewChatView] checkForMissedMessagesLogic: Error:', error);
    }
  }, [normalizeMessageFormat, setMessages, setProcessedMessageIds]); // Dependencies are stable or state setters

  const checkForMissedMessagesRef = useRef(checkForMissedMessagesLogic);
  useEffect(() => {
    checkForMissedMessagesRef.current = checkForMissedMessagesLogic;
  }, [checkForMissedMessagesLogic]);

  // Define handleMessageNotification using useCallback
  const handleMessageNotificationLogic = useCallback((notification) => {
    console.log('[NewChatView] handleMessageNotificationLogic: Received notification:', JSON.parse(JSON.stringify(notification)));
    if (!threadIdRef.current) {
        console.warn('[NewChatView] handleMessageNotificationLogic: No active thread ID (threadIdRef.current is falsy). Current thread prop:', thread?._id, '. Ignoring.');
        return;
    }

    const notificationThreadId = notification.threadId || 
                                (notification.thread && notification.thread._id) ||
                                (notification.message && notification.message.threadId);
    console.log('[NewChatView] handleMessageNotificationLogic: Current threadIdRef:', threadIdRef.current, 'Notification threadId:', notificationThreadId);

    if (notificationThreadId === threadIdRef.current) {
      console.log('[NewChatView] handleMessageNotificationLogic: Notification is for current thread.');
      if (notification.message && notification.message._id && notification.message.content) {
        if (!processedMessageIdsRef.current.has(notification.message._id)) {
            console.log('[NewChatView] handleMessageNotificationLogic: Processing message directly from notification payload.');
            handleNewMessageRef.current(notification.message); 
        } else {
            console.log('[NewChatView] handleMessageNotificationLogic: Message from notification already processed (ID found in processedMessageIdsRef):', notification.message._id);
        }
      } else {
        console.log('[NewChatView] handleMessageNotificationLogic: Notification payload incomplete or missing message content, falling back to checkForMissedMessages.');
        checkForMissedMessagesRef.current();
      }
    } else {
        console.log('[NewChatView] handleMessageNotificationLogic: Notification for DIFFERENT thread. Current:', threadIdRef.current, 'Notification was for:', notificationThreadId);
    }
  }, [thread?._id]); // Added thread?._id here as well for consistency with threadIdRef usage

  const handleMessageNotificationRef = useRef(handleMessageNotificationLogic);
  useEffect(() => {
    handleMessageNotificationRef.current = handleMessageNotificationLogic;
  }, [handleMessageNotificationLogic]);

  // useEffect for socket subscriptions
  useEffect(() => {
    const currentThreadId = thread?._id; // Capture threadId at the time effect runs
    if (!currentThreadId || !socketConnected) {
      console.log('[NewChatView] useEffect (subscriptions): Skipping due to no thread ID or socket not connected. Thread ID:', currentThreadId, 'Socket Connected:', socketConnected);
      return;
    }

    console.log('[NewChatView] useEffect (subscriptions): Setting up for thread:', currentThreadId, 'Socket Connected:', socketConnected);
    
    // MODIFIED - Create more stable wrappers with added tracking
    const componentId = `NewChatView-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    const onNewMessageWrapper = (message) => {
      console.log(`[NewChatView] onNewMessageWrapper (${componentId}): Invoked for thread:`, currentThreadId, 'Calling handleNewMessageRef.current with message:', message ? JSON.parse(JSON.stringify(message)) : 'undefined message');
      if (handleNewMessageRef.current) {
        handleNewMessageRef.current(message);
      }
    };
    
    const onMessageNotificationWrapper = (notification) => {
      console.log(`[NewChatView] onMessageNotificationWrapper (${componentId}): Invoked for thread:`, currentThreadId, 'Calling handleMessageNotificationRef.current with notification:', notification ? JSON.parse(JSON.stringify(notification)) : 'undefined notification');
      if (handleMessageNotificationRef.current) {
        handleMessageNotificationRef.current(notification);
      }
    };

    socketService.subscribeToThread(currentThreadId, onNewMessageWrapper);
    socketService.onMessageNotification(onMessageNotificationWrapper); 
    
    // NEW - Set up periodic check for new messages in addition to room rejoin
    // This acts as a safeguard for missed real-time messages
    const messageCheckInterval = setInterval(() => {
      if (socketService.isSocketConnected() && currentThreadId) {
        // Check if we have any last received message for this thread directly in socketService
        const lastMsg = socketService.getLastReceivedMessage(currentThreadId);
        const hasProcessedMissedMessages = checkForMissedMessagesRef.current();
        
        if (lastMsg && !hasProcessedMissedMessages) {
          console.log(`[NewChatView] Periodic check found last message in socketService for thread: ${currentThreadId}, forcing update`);
          socketService.forceMessageUpdate(currentThreadId);
        }
      }
    }, 5000); // Check every 5 seconds
    
    // Keep the existing room rejoin interval
    const roomRejoinInterval = setInterval(() => {
      if (socketService.isSocketConnected() && currentThreadId) {
        console.log(`[NewChatView] Periodic thread room rejoin emit for thread: ${currentThreadId}`);
        socketService.emitEvent('join-thread', currentThreadId);
      }
    }, 15000); // Check every 15 seconds

    return () => {
      console.log(`[NewChatView] useEffect (subscriptions): Cleaning up for thread: ${currentThreadId}, component ID: ${componentId}`);
      socketService.unsubscribeFromThread(currentThreadId);
      socketService.removeListener('message-notification', onMessageNotificationWrapper); // Use the same wrapper instance
      clearInterval(roomRejoinInterval);
      clearInterval(messageCheckInterval);
    };
  }, [thread?._id, socketConnected, currentUserId]); // Dependencies are now more stable

  // useEffect for fetching initial messages
  useEffect(() => {
    if (!thread?._id) {
      setMessages([]); // Clear messages if no thread is selected
      setLoadingMessages(false);
      console.log('[NewChatView] useEffect (fetchMessages): No thread ID, clearing messages.');
      return;
    }
    console.log(`[NewChatView] useEffect (fetchMessages): Triggered for thread ID: ${thread._id}`);
    setLoadingMessages(true);
    setProcessedMessageIds(new Set()); // Reset processed IDs when thread changes

    const fetchInitialMessages = async () => {
      try {
        const fetchedMsgs = await messageService.getMessages(thread._id);
        if (Array.isArray(fetchedMsgs)) {
          const newProcessedIds = new Set(); // Local set for this fetch
          const normalizedMessages = fetchedMsgs
            .map(msg => {
              const normalized = normalizeMessageFormat(msg);
              if(normalized && normalized._id) newProcessedIds.add(normalized._id); // Add to local set
              return normalized;
            })
            .filter(msg => msg !== null)
            .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
          
          setMessages(normalizedMessages);
          setProcessedMessageIds(newProcessedIds); // Set the main state with IDs from this fetch
          console.log('[NewChatView] useEffect (fetchMessages): Initial messages loaded. Count:', normalizedMessages.length, 'Processed IDs set. Count:', newProcessedIds.size);
        } else {
          console.warn('[NewChatView] useEffect (fetchMessages): messageService.getMessages did not return an array:', fetchedMsgs);
          setMessages([]);
        }
      } catch (error) {
        console.error('[NewChatView] useEffect (fetchMessages): Error fetching messages:', error);
        setMessages([]);
      }
      setLoadingMessages(false);
    };
    fetchInitialMessages();
  }, [thread?._id, normalizeMessageFormat]); // normalizeMessageFormat is stable due to useCallback

  // useEffect for scrolling to bottom
  useEffect(() => {
    if (messages.length > 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Scroll when messages change

  // Polling function to regularly check for new messages via API
  const pollForNewMessages = useCallback(async () => {
    if (!threadIdRef.current || isPollingRef.current) return;
    
    try {
      isPollingRef.current = true;
      console.log(`[NewChatView] Polling for new messages in thread: ${threadIdRef.current}`);
      
      const fetchedMsgs = await messageService.getMessages(threadIdRef.current);
      const now = Date.now();
      
      if (Array.isArray(fetchedMsgs)) {
        // Process only messages created after our last polling time
        const recentMessages = fetchedMsgs.filter(msg => 
          new Date(msg.createdAt).getTime() > lastPollingTime
        );
        
        if (recentMessages.length > 0) {
          console.log(`[NewChatView] Polling found ${recentMessages.length} new message(s) since last poll`);
          
          setMessages(prevMessages => {
            const currentMessageIds = new Set(prevMessages.map(m => m?._id).filter(Boolean));
            
            const newMessages = recentMessages
              .map(msg => normalizeMessageFormat(msg))
              .filter(msg => msg && msg._id && !currentMessageIds.has(msg._id) && !processedMessageIdsRef.current.has(msg._id));
            
            if (newMessages.length > 0) {
              console.log(`[NewChatView] Adding ${newMessages.length} new polled messages to UI`);
              
              // Update processed IDs to avoid duplicates
              setProcessedMessageIds(prevIds => {
                const newSet = new Set(prevIds);
                newMessages.forEach(msg => msg._id && newSet.add(msg._id));
                return newSet;
              });
              
              // Sort messages by creation time and add to existing
              return [...prevMessages, ...newMessages].sort((a, b) => 
                new Date(a?.createdAt || a?.timestamp || 0).getTime() - 
                new Date(b?.createdAt || b?.timestamp || 0).getTime()
              );
            }
            
            return prevMessages;
          });
        }
        
        // Update the last polling time
        setLastPollingTime(now);
      }
    } catch (error) {
      console.error('[NewChatView] Error polling for messages:', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [lastPollingTime, normalizeMessageFormat]);

  // Setup polling interval effect
  useEffect(() => {
    if (!thread?._id) return;
    
    console.log(`[NewChatView] Setting up polling for thread: ${thread._id}`);
    
    // Poll immediately to catch any messages sent while component wasn't mounted
    pollForNewMessages();
    
    // Set up regular polling interval
    const pollingInterval = setInterval(() => {
      pollForNewMessages();
    }, 3000); // Poll every 3 seconds
    
    return () => {
      console.log(`[NewChatView] Cleaning up polling for thread: ${thread._id}`);
      clearInterval(pollingInterval);
    };
  }, [thread?._id, pollForNewMessages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && thread?._id && currentUserId) {
      const messageContent = newMessage.trim();
      
      // Create an optimistic message object
      const optimisticMessage = normalizeMessageFormat({ // Ensure consistent format
        _id: `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`, // More unique temp ID
        threadId: thread._id,
        content: messageContent,
        sender: { _id: currentUserId, firstName: 'You', lastName: '' }, // Basic sender info
        createdAt: new Date().toISOString(),
        isOptimistic: true 
      });

      setNewMessage(''); // Clear input immediately for better UX
      
      // Optimistically update UI
      // Add to processedMessageIds right away for the optimistic message
      if (optimisticMessage._id) {
        setProcessedMessageIds(prevIds => new Set([...prevIds, optimisticMessage._id]));
      }
      setMessages(prev => [...prev, optimisticMessage].sort((a, b) => 
        new Date(a?.createdAt || a?.timestamp || 0).getTime() - 
        new Date(b?.createdAt || b?.timestamp || 0).getTime()
      ));

      try {
        // Ensure socket is connected (onSendMessage from props might not check)
        if (!socketConnected) {
          console.log('[NewChatView] Socket disconnected, attempting to connect before sending...');
          socketService.connect(); // Or handle error more gracefully
        }
        
        // Call the actual send function passed from MessagingPage (which calls messageService.sendMessage)
        await onSendMessage(thread._id, messageContent); 
        // The server will emit 'new-message'. The subscription's handleNewMessage
        // should then receive it and potentially replace the optimistic one if IDs match,
        // or add it if it's truly new (e.g. from another user).
        // The existing deduplication in handleNewMessage should handle the server version.

      } catch (err) {
        console.error('[NewChatView] Error sending message via prop:', err);
        // Revert optimistic update
        setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
        // Remove from processed IDs
        if (optimisticMessage._id) {
          setProcessedMessageIds(prevIds => {
            const newIds = new Set(prevIds);
            newIds.delete(optimisticMessage._id);
            return newIds;
          });
        }
        // Consider adding an error state to display to the user
        // setError('Failed to send message.'); 
      }
    }
  };

  const getParticipantName = () => {
    if (!thread || !thread.participants || !currentUserId) return 'Chat';
    const otherParticipant = thread.participants.find(p => p._id !== currentUserId);
    return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Chat';
  };

  const getParticipantAvatar = () => {
    if (!thread || !thread.participants || !currentUserId) return <Avatar />;
    const otherParticipant = thread.participants.find(p => p._id !== currentUserId);
    return otherParticipant ? (
      <Avatar 
        sx={{ bgcolor: theme.palette.secondary.main }}
        src={otherParticipant.profile?.profilePicture || null}
      >
        {getInitials(`${otherParticipant.firstName} ${otherParticipant.lastName}`)}
      </Avatar>
    ) : <Avatar />;
  };

  // Add manual refresh button to the toolbar
  const handleManualRefresh = useCallback(() => {
    if (!thread?._id) return;
    console.log('[NewChatView] Manual refresh triggered for thread:', thread._id);
    socketService.connect(); // Ensure connection
    socketService.emitEvent('join-thread', thread._id); // Rejoin room
    setLoadingMessages(true);
    
    // Use polling for consistent behavior
    pollForNewMessages().finally(() => setLoadingMessages(false));
  }, [thread?._id, pollForNewMessages]);

  // Add an effect for forcing message updates when the component mounts/remounts
  useEffect(() => {
    if (thread?._id && socketConnected && messages.length > 0) {
      console.log(`[NewChatView] Component mounted with existing messages, checking for updates to thread: ${thread._id}`);
      // Instead of an immediate call, delay slightly to ensure socket handlers are registered
      const timeoutId = setTimeout(() => {
        socketService.forceMessageUpdate(thread._id);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [thread?._id, socketConnected]);

  if (!thread) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 2, 
          height: 'calc(100vh - 64px - 48px)', // Example height adjustment, assuming 64px navbar, 48px some other offset
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: darkMode ? theme.palette.background.paper : theme.palette.grey[100]
        }}
      >
        <Typography variant="h6" color="textSecondary">
          Select a conversation to start chatting.
        </Typography>
      </Paper>
    );
  }
  
  // Main component structure
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', // Occupy full height given by parent
        // The parent of NewChatView will need to manage actual height, e.g. calc(100vh - headerHeight)
        backgroundColor: darkMode ? theme.palette.background.default : theme.palette.grey[50]
      }}
    >
      <AppBar 
        position="static" 
        color="default" 
        elevation={1}
        sx={{ backgroundColor: darkMode ? theme.palette.background.paper : theme.palette.primary.main }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 2 }}>
              <ArrowBackIcon sx={{ color: darkMode ? theme.palette.text.primary : theme.palette.common.white }} />
            </IconButton>
          )}
          {getParticipantAvatar()}
          <Typography variant="h6" sx={{ ml: 2, flexGrow: 1, color: darkMode ? theme.palette.text.primary : theme.palette.common.white }}>
            {getParticipantName()}
          </Typography>
          
          {/* Status indicator */}
          <Chip
            size="small"
            icon={<CircleIcon fontSize="small" sx={{ color: socketConnected ? 'success.main' : 'error.main' }} />}
            label={socketConnected ? "Connected" : "Disconnected"}
            color={socketConnected ? "success" : "error"}
            variant="outlined"
            sx={{ 
              mr: 1,
              color: darkMode ? theme.palette.text.primary : theme.palette.common.white,
              borderColor: darkMode ? theme.palette.text.primary : theme.palette.common.white
            }}
          />
          
          {/* Manual refresh button */}
          <IconButton 
            onClick={handleManualRefresh} 
            color="inherit" 
            size="small"
            sx={{ color: darkMode ? theme.palette.text.primary : theme.palette.common.white }}
          >
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          p: 2,
          backgroundColor: darkMode ? theme.palette.background.default : theme.palette.common.white,
          // Custom scrollbar (optional, for webkit browsers)
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: darkMode ? theme.palette.grey[700] : theme.palette.grey[300],
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: darkMode ? theme.palette.grey[500] : theme.palette.grey[500],
            borderRadius: '4px',
          }
        }}
      >
        {loadingMessages ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography>Loading messages...</Typography> {/* Replace with CircularProgress if available */}
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="textSecondary">No messages yet. Start the conversation!</Typography>
          </Box>
        ) : (
          messages.map((msg, index) => {
            const normalizedMsg = normalizeMessageFormat(msg); // Ensure format before rendering
            if (!normalizedMsg) {
              console.warn(`[NewChatView] Skipping render for invalid message at index ${index}:`, msg);
              return null; 
            }
            return (
              <NewMessageItem 
                key={normalizedMsg._id || `msg-${index}`} // Fallback key if _id is somehow missing
                message={normalizedMsg} 
                isOwnMessage={isMessageFromUser(normalizedMsg, currentUserId)} 
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      <Box 
        component="form"
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        sx={{ 
          p: 1, 
          backgroundColor: darkMode ? theme.palette.background.paper : theme.palette.grey[200], 
          borderTop: `1px solid ${darkMode ? theme.palette.divider : theme.palette.grey[300]}`,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          sx={{ 
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px', // More rounded input
              backgroundColor: darkMode ? theme.palette.grey[800] : theme.palette.common.white,
            },
          }}
        />
        <IconButton type="submit" color="primary" disabled={!newMessage.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default NewChatView; 