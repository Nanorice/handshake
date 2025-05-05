import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Divider,
  CircularProgress,
  Box
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import simpleChatService from '../services/simpleChatService';
import userService from '../services/userService';
import { getCurrentUserId } from '../utils/authUtils';

const SimpleChat = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Initialize chat service and load users
  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      
      // Connect to socket
      simpleChatService.connect();
      
      // Load users
      const testUsers = await userService.getTestUsers();
      const currentUserId = getCurrentUserId();
      const filteredUsers = testUsers.filter(user => user._id !== currentUserId);
      setUsers(filteredUsers);
      
      // Load threads
      const userThreads = await simpleChatService.getThreads();
      setThreads(userThreads);
      
      // Register message listener
      simpleChatService.onMessage(handleNewMessage);
      
      // Register notification listener
      simpleChatService.onNotification(handleNotification);
      
      setLoading(false);
    };
    
    initChat();
    
    // Cleanup
    return () => {
      simpleChatService.disconnect();
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages when selected user changes
  useEffect(() => {
    if (selectedUser) {
      loadMessages();
    }
  }, [selectedUser]);

  // Handle incoming messages
  const handleNewMessage = (message) => {
    console.log('New message received:', message);
    
    // Update messages list if it's for the current thread
    if (selectedUser && message.threadId === `thread-${selectedUser._id}`) {
      setMessages(prev => {
        // Check if message already exists
        const exists = prev.some(m => m.id === message.id);
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      });
    }
    
    // Update threads list
    loadThreads();
  };

  // Handle notifications
  const handleNotification = (notification) => {
    console.log('Notification received:', notification);
    
    // Update threads to show unread messages
    loadThreads();
  };

  // Load threads
  const loadThreads = async () => {
    const userThreads = await simpleChatService.getThreads();
    setThreads(userThreads);
  };

  // Load messages for selected user
  const loadMessages = async () => {
    if (selectedUser) {
      const threadId = `thread-${selectedUser._id}`;
      const threadMessages = await simpleChatService.getMessages(threadId);
      setMessages(threadMessages);
      
      // Mark as read
      simpleChatService.markThreadAsRead(threadId);
      
      // Refresh threads
      loadThreads();
    }
  };

  // Handle user selection
  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setNewMessage('');
  };

  // Send message
  const handleSendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;
    
    try {
      const result = await simpleChatService.sendDirectMessage(
        selectedUser._id,
        newMessage.trim()
      );
      
      if (result.success) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Find a thread for a user
  const findThreadForUser = (userId) => {
    return threads.find(thread => 
      thread.otherParticipant && thread.otherParticipant._id === userId
    );
  };

  // Render the chat interface
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Simple Chat
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ height: 'calc(100vh - 180px)' }}>
          {/* Users/Threads List */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ height: '100%' }}>
              <List sx={{ 
                overflow: 'auto', 
                height: '100%',
                maxHeight: 'calc(100vh - 180px)'
              }}>
                {threads.map(thread => {
                  const user = thread.otherParticipant;
                  if (!user) return null;
                  
                  const isSelected = selectedUser && selectedUser._id === user._id;
                  const unreadCount = thread.unreadCount || 0;
                  
                  return (
                    <React.Fragment key={user._id}>
                      <ListItem 
                        button 
                        selected={isSelected}
                        onClick={() => handleUserSelect(user)}
                        sx={{ 
                          bgcolor: isSelected ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.08)'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            color="error"
                            badgeContent={unreadCount}
                            invisible={unreadCount === 0}
                            overlap="circular"
                          >
                            <Avatar src={user.profile?.profilePicture}>
                              {user.firstName.charAt(0)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${user.firstName} ${user.lastName}`}
                          secondary={
                            thread.lastMessage ? thread.lastMessage.content : 'No messages yet'
                          }
                          secondaryTypographyProps={{
                            noWrap: true,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  );
                })}
                
                {/* Show other users not in threads */}
                {users
                  .filter(user => !findThreadForUser(user._id))
                  .map(user => (
                    <React.Fragment key={user._id}>
                      <ListItem 
                        button 
                        onClick={() => handleUserSelect(user)}
                      >
                        <ListItemAvatar>
                          <Avatar src={user.profile?.profilePicture}>
                            {user.firstName.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${user.firstName} ${user.lastName}`}
                          secondary="Start a new conversation"
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))
                }
              </List>
            </Paper>
          </Grid>
          
          {/* Chat Area */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column' 
            }}>
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <Box sx={{ 
                    p: 2, 
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Avatar 
                      src={selectedUser.profile?.profilePicture} 
                      sx={{ mr: 2 }}
                    >
                      {selectedUser.firstName.charAt(0)}
                    </Avatar>
                    <Typography variant="h6">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </Typography>
                  </Box>
                  
                  {/* Messages */}
                  <Box sx={{ 
                    flexGrow: 1, 
                    p: 2, 
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {messages.length === 0 ? (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        height: '100%'
                      }}>
                        <Typography color="text.secondary">
                          No messages yet. Start the conversation!
                        </Typography>
                      </Box>
                    ) : (
                      messages.map((message, index) => {
                        const currentUserId = getCurrentUserId();
                        const isCurrentUser = message.sender?._id === currentUserId;
                        
                        return (
                          <Box
                            key={message.id || index}
                            sx={{
                              alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                              maxWidth: '70%',
                              mb: 2
                            }}
                          >
                            <Box
                              sx={{
                                bgcolor: isCurrentUser ? 'primary.main' : 'grey.200',
                                color: isCurrentUser ? 'white' : 'text.primary',
                                borderRadius: 2,
                                p: 2
                              }}
                            >
                              <Typography variant="body1">
                                {message.content}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  display: 'block',
                                  mt: 0.5,
                                  textAlign: 'right',
                                  opacity: 0.7
                                }}
                              >
                                {new Date(message.timestamp || message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </Box>
                  
                  {/* Message Input */}
                  <Box sx={{ p: 2, display: 'flex', borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      sx={{ mr: 1 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<SendIcon />}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      Send
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <Typography color="text.secondary">
                    Select a user to start chatting
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default SimpleChat; 