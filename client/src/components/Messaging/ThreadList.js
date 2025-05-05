import React, { useState, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  useTheme
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  Clear as ClearIcon,
  ChatBubbleOutline as ChatIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ThemeContext } from '../../contexts/ThemeContext';
import userService from '../../services/userService';
import { ChatList } from 'react-chat-elements';
import 'react-chat-elements/dist/main.css';
import { getCurrentUserId } from '../../utils/authUtils';

const ThreadList = ({ 
  threads, 
  selectedThreadId, 
  onSelectThread, 
  onCreateThread,
  loading,
  error,
  darkMode = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState([]); 
  const [creatingThread, setCreatingThread] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const theme = useTheme();

  // Filter threads based on search term
  const filteredThreads = threads.filter(thread => {
    const otherUser = thread.otherParticipant;
    if (!otherUser) return false;
    
    const fullName = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleOpenNewDialog = async () => {
    setOpenNewDialog(true);
    setLoadingUsers(true);
    
    try {
      // Always use our test users from userService 
      const testUsers = await userService.getTestUsers();
      console.log('Loaded test users:', testUsers);
      
      // Filter out current user if needed
      const currentUserId = localStorage.getItem('userId');
      const filteredUsers = currentUserId
        ? testUsers.filter(user => user._id !== currentUserId)
        : testUsers;
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading test users:', error);
      setUsers([]); // Clear users on error
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCloseNewDialog = () => {
    setOpenNewDialog(false);
    setNewMessage('');
    setSelectedUserId('');
  };

  const handleCreateThread = async () => {
    if (!selectedUserId || !newMessage.trim()) return;

    setCreatingThread(true);
    try {
      await onCreateThread(selectedUserId, newMessage);
      handleCloseNewDialog();
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setCreatingThread(false);
    }
  };

  // Format timestamp to relative time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Get thread preview text
  const getThreadPreview = (thread) => {
    if (!thread.lastMessage) return 'Start a conversation';
    return thread.lastMessage.content;
  };

  // Format threads for react-chat-elements ChatList
  const formatChatListItems = () => {
    return filteredThreads.map(thread => {
      const otherUser = thread.otherParticipant;
      if (!otherUser) return null;
      
      // Handle unread count - ensure it's a number and properly formatted
      let unreadCount = 0;
      const currentUserId = getCurrentUserId();
      
      // If unreadCount is an object/map, get count for current user
      if (thread.unreadCount && typeof thread.unreadCount === 'object') {
        unreadCount = thread.unreadCount[currentUserId] || 0;
      } else if (typeof thread.unreadCount === 'number') {
        unreadCount = thread.unreadCount;
      }
      
      return {
        id: thread._id,
        avatar: otherUser.profile?.profilePicture,
        avatarFlexible: true,
        alt: otherUser.firstName?.[0],
        title: `${otherUser.firstName} ${otherUser.lastName}`,
        subtitle: getThreadPreview(thread),
        date: thread.lastMessage?.timestamp ? new Date(thread.lastMessage.timestamp) : new Date(thread.updatedAt),
        unread: unreadCount,
        muted: false,
        selected: selectedThreadId === thread._id,
        letterItem: !otherUser.profile?.profilePicture,
        statusColor: unreadCount > 0 ? 'var(--primary)' : 'transparent',
        statusColorType: unreadCount > 0 ? 'badge' : undefined,
        dateString: formatTime(thread.lastMessage?.timestamp || thread.updatedAt),
      };
    }).filter(Boolean);
  };

  const handleSelectThread = (item) => {
    const thread = threads.find(t => t._id === item.id);
    if (thread) {
      onSelectThread(thread);
    }
  };

  if (loading && threads.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && threads.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  const chatListItems = formatChatListItems();

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: darkMode ? 'background.paper' : 'background.default',
        borderRadius: 0
      }}
    >
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Messages</Typography>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ 
        overflow: 'auto', 
        flexGrow: 1,
        '& .rce-citem': {
          backgroundColor: 'transparent',
          borderBottom: `1px solid ${theme.palette.divider}`
        },
        '& .rce-citem-body--top-title': {
          fontWeight: 500
        },
        '& .rce-citem-body--bottom-title': {
          color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
        },
        '& .rce-citem-body--top-time': {
          color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
        },
        '& .rce-citem-avatar': {
          borderRadius: '50%'
        },
        '& .rce-citem:hover': {
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
        },
        '& .rce-citem.selected': {
          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
        }
      }}>
        {chatListItems.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
            <ChatIcon color="disabled" sx={{ fontSize: 64, mb: 2 }} />
            <Typography color="text.secondary" align="center">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              sx={{ mt: 2 }}
              onClick={handleOpenNewDialog}
            >
              New Message
            </Button>
          </Box>
        ) : (
          <ChatList
            className="chat-list"
            dataSource={chatListItems}
            onClick={handleSelectThread}
          />
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button 
          fullWidth 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenNewDialog}
        >
          New Message
        </Button>
      </Box>

      {/* New Message Dialog */}
      <Dialog open={openNewDialog} onClose={handleCloseNewDialog} fullWidth maxWidth="sm">
        <DialogTitle>New Message</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel id="user-select-label">Recipient</InputLabel>
            {loadingUsers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Select
                labelId="user-select-label"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                label="Recipient"
              >
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {`${user.firstName} ${user.lastName} (${user.userType === 'professional' ? 'Professional' : 'Seeker'})`}
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>
          <TextField
            autoFocus
            margin="dense"
            label="Message"
            fullWidth
            multiline
            rows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!selectedUserId}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateThread} 
            variant="contained" 
            disabled={!selectedUserId || !newMessage.trim() || creatingThread}
          >
            {creatingThread ? <CircularProgress size={24} /> : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ThreadList; 