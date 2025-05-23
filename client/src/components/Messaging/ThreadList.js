import React, { useState, useContext, useMemo } from 'react';
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

/**
 * SafeChatList component wraps react-chat-elements ChatList with safety checks
 */
const SafeChatList = React.memo(({ dataSource, onClick }) => {
  // Ensure dataSource is a valid array
  const safeDataSource = useMemo(() => {
    if (!Array.isArray(dataSource)) {
      console.warn('Invalid dataSource provided to SafeChatList:', dataSource);
      return [];
    }
    
    // Filter out any invalid items and ensure all required properties exist
    return dataSource.filter(item => {
      if (!item || typeof item !== 'object') return false;
      
      // Ensure minimum required props for ChatList
      const hasRequiredProps = item.id && 
                              (typeof item.title === 'string') && 
                              (item.date instanceof Date);
      
      if (!hasRequiredProps) {
        console.warn('Item missing required properties:', item);
        return false;
      }
      
      return true;
    });
  }, [dataSource]);
  
  // Safely handle click events
  const handleClick = React.useCallback((item) => {
    if (item && typeof onClick === 'function') {
      onClick(item);
    }
  }, [onClick]);
  
  // Render empty state if no valid items
  if (!safeDataSource.length) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">No conversations</Typography>
      </Box>
    );
  }
  
  try {
    return (
      <ChatList 
        className="chat-list"
        dataSource={safeDataSource}
        onClick={handleClick}
      />
    );
  } catch (error) {
    console.error('Error rendering ChatList:', error);
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Could not display conversations
        </Typography>
      </Box>
    );
  }
});

const ThreadList = ({ 
  threads = [], // Provide a default empty array to prevent undefined
  selectedThreadId, 
  onSelectThread, 
  onCreateThread,
  loading,
  error,
  darkMode = false
}) => {
  // Log threads prop on component entry
  console.log('[ThreadList] Received threads prop:', JSON.parse(JSON.stringify(threads)));

  const [searchTerm, setSearchTerm] = useState('');
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState([]); 
  const [creatingThread, setCreatingThread] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const theme = useTheme();

  // Ensure threads is always an array
  const threadsArray = Array.isArray(threads) ? threads : [];

  // Filter threads based on search term
  const filteredThreads = threadsArray.filter(thread => {
    if (!thread || !thread.otherParticipant) return false; // Simplified this initial check slightly
    
    const otherUser = thread.otherParticipant;
    // No longer need to check otherUser again as it's covered by the above
    
    const fullName = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Log filteredThreads before mapping, and the first item if it exists
  console.log('[ThreadList] Filtered threads before mapping (count):', filteredThreads.length);
  if (filteredThreads.length > 0) {
    console.log('[ThreadList] First item of Filtered threads before mapping:', JSON.parse(JSON.stringify(filteredThreads[0])));
  }

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
      const testUsersData = await userService.getTestUsers();
      // Ensure testUsers is an array, even if the service returns null/undefined
      const testUsers = Array.isArray(testUsersData) ? testUsersData : [];
      console.log('Loaded test users:', testUsers);
      
      const currentUserId = localStorage.getItem('userId'); // Consider replacing with getCurrentUserId() for consistency if it serves the same purpose
      
      // Ensure testUsers is an array before filtering and add a check for user existence in filter
      const filteredUsersArray = currentUserId && Array.isArray(testUsers)
        ? testUsers.filter(user => user && user._id !== currentUserId)
        : (Array.isArray(testUsers) ? testUsers : []);
      
      // Ensure users state is always set with an array
      setUsers(Array.isArray(filteredUsersArray) ? filteredUsersArray : []);
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
    // Guarantee filteredThreads is an array and map safely
    // console.log('[ThreadList] Formatting chat list items from filteredThreads:', JSON.parse(JSON.stringify(filteredThreads))); // More verbose log inside format function if needed
    if (!Array.isArray(filteredThreads) || filteredThreads.length === 0) {
      return [];
    }
    
    try {
      return filteredThreads.map(thread => {
        // Skip invalid threads
        if (!thread || !thread._id || !thread.otherParticipant) {
          console.warn('Skipping invalid thread in formatChatListItems:', thread);
          return null; // Explicitly return null for invalid threads
        }
        
        const otherUser = thread.otherParticipant;
        if (!otherUser) return null;
        
        let unreadCount = 0;
        const currentUserId = getCurrentUserId();
        
        if (thread.unreadCount && typeof thread.unreadCount === 'object') {
          unreadCount = thread.unreadCount[currentUserId] || 0;
        } else if (typeof thread.unreadCount === 'number') {
          unreadCount = thread.unreadCount;
        }
        
        const firstName = otherUser.firstName || '';
        const lastName = otherUser.lastName || '';
        // Ensure profilePicture is either a URL or undefined if no picture.
        const profilePictureUrl = otherUser.profile?.profilePicture || undefined;
        
        let lastMessageTime = thread.lastMessage?.timestamp || thread.updatedAt;
        let validDate = new Date(lastMessageTime);
        if (isNaN(validDate.getTime())) {
          validDate = new Date(thread.updatedAt);
          if (isNaN(validDate.getTime())) {
            validDate = new Date();
          }
        }
        
        // Minimal properties test
        const chatListItemMinimal = {
          id: String(thread._id), // Ensure ID is a string
          key: String(thread._id), // Explicitly set key for React list rendering
          title: `${firstName} ${lastName}`.trim() || 'Unknown User',
          subtitle: thread.lastMessage?.content || ' ', // Ensure subtitle is at least a space, not empty
          date: validDate,
          unread: unreadCount,
          avatarFlexible: true, // react-chat-elements uses this
          // avatar: profilePictureUrl, // Keep this commented out for now
          letterItem: !profilePictureUrl, // Show letter if no avatar
          // Ensure other props expected by react-chat-elements are present or defaulted
          muted: false,
          showDate: true,
          // dateString: validDate.toLocaleTimeString(), // Example if needed, ChatList usually handles date formatting
          // className: 'custom-chat-item-class', // Example custom class
        };

        // Detailed log of the item being passed to ChatList
        console.log('[ThreadList] chatListItem created:', JSON.stringify(chatListItemMinimal, null, 2));

        return chatListItemMinimal; // Return the object with minimal, known-good props
      }).filter(item => item && typeof item === 'object'); // Ensure only valid objects are returned
    } catch (error) {
      console.error('Error formatting chat list items:', error, filteredThreads);
      return [];
    }
  };

  // Memoize formatted chat list items
  const chatListItems = useMemo(() => {
    return formatChatListItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredThreads, searchTerm]); // Re-calculate when filteredThreads or searchTerm changes

  const handleSelectThread = (item) => {
    if (!item || !item.id || !Array.isArray(threads)) {
      console.warn('Invalid item or threads in handleSelectThread', { item, threadsLength: threads?.length });
      return;
    }
    
    const thread = threads.find(t => t && t._id === item.id);
    if (thread && typeof onSelectThread === 'function') {
      onSelectThread(thread);
    } else {
      console.warn('Could not find thread or onSelectThread is not a function');
    }
  };

  // Check for loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check for error state
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography color="error" align="center">
          {typeof error === 'string' ? error : (error?.message || 'Unknown error')}
        </Typography>
      </Box>
    );
  }

  // Get chat items safely
  const hasChatItems = Array.isArray(chatListItems) && chatListItems.length > 0;

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
        {!hasChatItems ? (
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
          <Box sx={{ height: '100%' }}>
            <SafeChatList
              dataSource={chatListItems}
              onClick={handleSelectThread}
            />
          </Box>
        )}
      </Box>

      {/* New Message Dialog */}
      <Dialog 
        open={openNewDialog} 
        onClose={handleCloseNewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New Message</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel id="select-user-label">Select User</InputLabel>
            <Select
              labelId="select-user-label"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              label="Select User"
            >
              {loadingUsers ? (
                <MenuItem disabled>Loading users...</MenuItem>
              ) : !Array.isArray(users) || users.length === 0 ? (
                <MenuItem disabled>No users available</MenuItem>
              ) : (
                users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          
          <TextField
            autoFocus
            label="Message"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateThread} 
            variant="contained" 
            disabled={!selectedUserId || !newMessage.trim() || creatingThread}
            startIcon={creatingThread ? <CircularProgress size={20} /> : null}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create New Message Button */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={handleOpenNewDialog}
          // Make sure onCreateThread is available before enabling the button
          disabled={typeof onCreateThread !== 'function'}
        >
          New Message
        </Button>
      </Box>
    </Paper>
  );
};

export default ThreadList; 