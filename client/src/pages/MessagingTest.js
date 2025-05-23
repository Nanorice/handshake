import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  Avatar, 
  Divider,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MessageThread from '../components/Messaging/MessageThread';
import socketService from '../services/socketService';
import { getAuthToken, getCurrentUserId } from '../utils/authUtils';
import userService from '../services/userService';
import messageService from '../services/messageService';

const MessagingTest = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [thread, setThread] = useState(null);
  const [testUsers, setTestUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [notificationLogs, setNotificationLogs] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  
  // Load test users on initial render
  useEffect(() => {
    const fetchTestUsers = async () => {
      setLoadingUsers(true);
      try {
        const users = await userService.getTestUsers();
        setTestUsers(users.slice(0, 10));
      } catch (err) {
        console.error('Error fetching test users:', err);
        setError('Failed to load test users');
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchTestUsers();
    
    const token = getAuthToken();
    if (token) {
      socketService.connect(token);
    }
    
    // Set up notification listener (can remain generic)
    socketService.onMessageNotification(handleMessageNotification);
    
    // Clean up on unmount
    return () => {
      if (activeThreadId) {
        socketService.unsubscribeFromThread(activeThreadId);
      }
      socketService.removeListener('message-notification', handleMessageNotification); // Pass the handler to remove specific listener
      socketService.disconnect();
    };
  }, []); // activeThreadId removed from dependencies to avoid re-running this whole effect
  
  const handleMessageNotification = (notification) => {
    console.log('Notification received:', notification);
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp} - Notification: ${notification.message.sender} sent "${notification.message.content}"`;
    
    setNotificationLogs(prev => [logEntry, ...prev]);
    setSuccess('Notification received!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };
  
  // Renamed and repurposed for subscribed messages
  const handleNewSubscribedMessage = (message) => {
    console.log('New message from subscription:', message);
    // The message from subscribeToThread should already be for the active thread.
    // Add the new message to our list, preventing duplicates.
    setMessages(prev => {
      if (prev.find(m => m._id === message._id)) {
        return prev; // Message already exists (e.g. from sender's optimistic update)
      }
      return [...prev, message];
    });
    setSuccess('New message received!');
    setTimeout(() => setSuccess(''), 3000);
  };
  
  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    setError(''); // Clear previous errors
    setMessages([]); // Clear messages from previous thread

    // Unsubscribe from the old thread if there was one
    if (activeThreadId) {
      socketService.unsubscribeFromThread(activeThreadId);
      setActiveThreadId(null);
    }

    try {
      const threads = await messageService.getThreads();
      let currentThread = threads.find(t => 
        t.otherParticipant && t.otherParticipant._id === user._id
      );
      
      if (!currentThread) {
        console.log(`No existing thread found with ${user.firstName}, creating new one.`);
        currentThread = await messageService.createThread(user._id);
        if (!currentThread) {
          throw new Error('Failed to create new thread.');
        }
        setMessages([]); // Start with an empty message list for new threads
      }
      
      setThread(currentThread); // Set the full thread object
      setActiveThreadId(currentThread._id); // Set active thread ID for subscription

      // Fetch messages for this thread
      const messageData = await messageService.getMessages(currentThread._id);
      setMessages(messageData || []); // Assuming getMessages returns array directly or an object with a messages property
      
      // Subscribe to the new thread
      socketService.subscribeToThread(currentThread._id, handleNewSubscribedMessage);

    } catch (err) {
      console.error('Error setting up conversation:', err);
      setError('Failed to set up conversation');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !thread) {
      setError('Please select a user and enter a message');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Use our messageService to send the message
      const sentMessage = await messageService.sendMessage(
        thread._id,
        newMessage.trim()
      );
      
      // Add to our messages (optimistic update for sender)
      setMessages(prev => [...prev, sentMessage]);
      
      // Clear the input
      setNewMessage('');
      setSuccess('Message sent successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Messaging Test Page
      </Typography>
      <Typography variant="body1" paragraph>
        This page allows you to test the messaging functionality by selecting test users and sending messages.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Test Users
            </Typography>
            {loadingUsers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {testUsers.map((user) => (
                  <React.Fragment key={user._id}>
                    <ListItem 
                      button 
                      onClick={() => handleUserSelect(user)}
                      selected={selectedUser?._id === user._id}
                    >
                      <Avatar sx={{ mr: 2 }}>
                        {user.firstName.charAt(0)}
                      </Avatar>
                      <ListItemText 
                        primary={`${user.firstName} ${user.lastName}`} 
                        secondary={user.userType === 'professional' ? 
                          `${user.profile?.title || 'Professional'} at ${user.profile?.company || 'Company'}` : 
                          `${user.profile?.education?.university || 'Student'}`
                        } 
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          {selectedUser && thread ? (
            <Paper sx={{ p: 0, height: '70vh', display: 'flex', flexDirection: 'column' }}>
              <MessageThread 
                thread={thread}
                messages={messages}
                onSendMessage={handleSendMessage}
                loading={loading}
                error={error}
              />
            </Paper>
          ) : (
            <Paper sx={{ p: 4, height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Select a user from the list to start messaging
              </Typography>
            </Paper>
          )}
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Log
            </Typography>
            <Box sx={{ maxHeight: '200px', overflow: 'auto', mb: 2 }}>
              {notificationLogs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No notifications received yet
                </Typography>
              ) : (
                notificationLogs.map((log, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                    {log}
                  </Typography>
                ))
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Socket Connection Test
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => {
                  // Test socket connection
                  const isConnected = socketService.isSocketConnected();
                  console.log('Socket connected:', isConnected);
                  setSuccess(`Socket connected: ${isConnected}`);
                  
                  // If connected, try to join a random room to test socket
                  if (isConnected) {
                    const testRoomId = 'test-room-' + Date.now();
                    socketService.joinThread(testRoomId);
                    console.log('Joined test room:', testRoomId);
                  }
                  
                  // Clear success message after 3 seconds
                  setTimeout(() => {
                    setSuccess('');
                  }, 3000);
                }}
              >
                Test Socket Connection
              </Button>
              
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={() => {
                  // Re-initialize socket
                  const token = getAuthToken();
                  if (token) {
                    socketService.disconnect();
                    socketService.connect(token);
                    setSuccess('Socket reconnected');
                    console.log('Socket reconnected');
                  } else {
                    setError('No auth token found');
                  }
                  
                  // Clear messages after 3 seconds
                  setTimeout(() => {
                    setSuccess('');
                    setError('');
                  }, 3000);
                }}
              >
                Reconnect Socket
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MessagingTest; 