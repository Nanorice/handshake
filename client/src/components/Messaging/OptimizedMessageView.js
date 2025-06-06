import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Avatar,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import socketService from '../../services/socketService';
import messageService from '../../services/messageService';
import { getCurrentUserId } from '../../utils/authUtils';

/**
 * PERFORMANCE: Ultra-fast message view with direct socket handling
 * Eliminates React context overhead and multiple providers
 */
const OptimizedMessageView = ({ threadId, onBack, darkMode = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = getCurrentUserId();
  
  // PERFORMANCE: Direct message handler without context overhead
  const handleIncomingMessage = useCallback((message) => {
    if (!message || !message.threadId || message.threadId !== threadId) {
      return;
    }
    
    console.log('[OptimizedMessageView] Received message:', message);
    
    setMessages(prevMessages => {
      // Check for duplicates
      const exists = prevMessages.some(m => m._id === message._id);
      if (exists) return prevMessages;
      
      // Add and sort by timestamp
      return [...prevMessages, message].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, [threadId]);
  
  // PERFORMANCE: Load initial messages once
  useEffect(() => {
    if (!threadId) return;
    
    const loadMessages = async () => {
      setLoading(true);
      try {
        const fetchedMessages = await messageService.getMessages(threadId);
        setMessages(fetchedMessages || []);
      } catch (error) {
        console.error('[OptimizedMessageView] Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [threadId]);
  
  // PERFORMANCE: Direct socket setup without complex providers
  useEffect(() => {
    if (!threadId) return;
    
    console.log('[OptimizedMessageView] Setting up socket for thread:', threadId);
    
    // Join thread room
    socketService.emitEvent('join-thread', threadId);
    
    // Register direct message handler
    socketService.on('new-message', handleIncomingMessage);
    socketService.on('message-confirmed', handleIncomingMessage);
    socketService.on('message-updated', (data) => {
      if (data.message) {
        handleIncomingMessage(data.message);
      }
    });
    
    return () => {
      console.log('[OptimizedMessageView] Cleaning up socket for thread:', threadId);
      socketService.off('new-message', handleIncomingMessage);
      socketService.off('message-confirmed', handleIncomingMessage);
      socketService.off('message-updated', handleIncomingMessage);
      socketService.emitEvent('leave-thread', threadId);
    };
  }, [threadId, handleIncomingMessage]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // PERFORMANCE: Optimistic message sending
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;
    
    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);
    
    // PERFORMANCE: Optimistic update
    const optimisticMessage = {
      _id: `temp-${Date.now()}`,
      threadId,
      content: messageText,
      sender: { _id: currentUserId },
      createdAt: new Date().toISOString(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      // Send via socket for immediate delivery
      await socketService.sendMessage(threadId, { content: messageText });
      console.log('[OptimizedMessageView] Message sent successfully');
    } catch (error) {
      console.error('[OptimizedMessageView] Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m._id !== optimisticMessage._id));
      setNewMessage(messageText); // Restore text
    } finally {
      setSending(false);
    }
  }, [newMessage, sending, threadId, currentUserId]);
  
  // PERFORMANCE: Optimized message rendering
  const renderMessage = useCallback((message) => {
    const isOwn = message.sender?._id === currentUserId;
    const senderName = message.sender?.firstName || 'Unknown';
    
    return (
      <ListItem
        key={message._id}
        sx={{
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          mb: 1
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isOwn ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            maxWidth: '70%'
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              mx: 1,
              bgcolor: isOwn ? 'primary.main' : 'secondary.main'
            }}
          >
            {senderName.charAt(0).toUpperCase()}
          </Avatar>
          <Box
            sx={{
              bgcolor: isOwn ? 'primary.main' : darkMode ? 'grey.800' : 'grey.100',
              color: isOwn ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              p: 1.5,
              maxWidth: '100%',
              opacity: message.status === 'sending' ? 0.7 : 1
            }}
          >
            <Typography variant="body1">
              {message.content}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
              {new Date(message.createdAt).toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
      </ListItem>
    );
  }, [currentUserId, darkMode]);
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: darkMode ? 'grey.900' : 'background.paper'
        }}
      >
        <IconButton onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">
          Messages
        </Typography>
      </Paper>
      
      <Divider />
      
      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>
      
      <Divider />
      
      {/* Input */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: darkMode ? 'grey.900' : 'background.paper'
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          sx={{ mr: 1 }}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={!newMessage.trim() || sending}
        >
          {sending ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default OptimizedMessageView; 