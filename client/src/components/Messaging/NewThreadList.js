import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Divider, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Button,
  CircularProgress,
  useTheme
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Clear as ClearIcon, Person as PersonIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// Helper to get initials
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const NewThreadList = ({
  threads = [],
  selectedThreadId,
  onSelectThread,
  onCreateThread, // Will be used for a 'New Message' button
  loading,
  error,
  currentUserId, // Added currentUserId prop
  onThreadSelect
}) => {
  // Log threads prop on component entry
  console.log('[NewThreadList] Received props:', { threads: JSON.parse(JSON.stringify(threads)), loading, error, selectedThreadId, currentUserId });

  const [searchTerm, setSearchTerm] = useState('');
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const filteredThreads = threads.filter(thread => {
    const participantName = thread.otherParticipant?.name || thread.otherParticipant?.firstName || 'Unknown User';
    return participantName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle thread selection
  const handleThreadClick = (threadId) => {
    if (onThreadSelect) {
      onThreadSelect(threadId);
    }
  };

  // Get the other participant in the thread
  const getOtherParticipant = (thread) => {
    if (!thread.participants || !Array.isArray(thread.participants)) {
      // Check if thread already has otherParticipant property
      if (thread.otherParticipant) {
        return thread.otherParticipant;
      }
      return null;
    }
    
    // Find participant who is not the current user
    return thread.participants.find(p => p._id !== currentUserId) || null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading conversations...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2, textAlign: 'center' }}>
        <Typography color="error">
          Error loading conversations: {error.message || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: darkMode ? 'grey.900' : 'grey.50' }}>
      {/* Header & Search */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: '600', color: darkMode ? 'grey.100' : 'grey.800' }}>
          Messages
        </Typography>
        <TextField
          fullWidth
          placeholder="Search or start new chat"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: darkMode ? 'grey.800' : 'white',
            },
            '& .MuiOutlinedInput-input': {
              py: '10px'
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: darkMode ? 'grey.400' : 'grey.500' }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={clearSearch} size="small">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Thread List */}
      <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
        {filteredThreads.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3, mt: 4 }}>
            <PersonIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              {searchTerm ? 'No matching conversations' : 'No conversations yet'}
            </Typography>
             {/* TODO: Add New Message Dialog Trigger */}
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              sx={{ mt: 2, bgcolor: 'blue.600', '&:hover': { bgcolor: 'blue.700'} }}
              onClick={() => alert('Open new message dialog')} // Placeholder for onCreateThread or similar
            >
              New Message
            </Button>
          </Box>
        ) : (
          filteredThreads.map((thread, index) => {
            const otherParticipant = getOtherParticipant(thread);
            
            // Improved participant name extraction
            let participantName = 'Unknown';
            
            if (otherParticipant) {
              if (otherParticipant.firstName && otherParticipant.lastName) {
                participantName = `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim();
              } else if (otherParticipant.firstName) {
                participantName = otherParticipant.firstName;
              } else if (otherParticipant.name) {
                participantName = otherParticipant.name;
              } else if (otherParticipant.username) {
                participantName = otherParticipant.username;
              } else if (otherParticipant.email) {
                // Use email as last resort (might want to hide this in production)
                participantName = otherParticipant.email.split('@')[0];
              }
            } else if (thread.otherParticipant) {
              // Fallback if thread.otherParticipant exists but wasn't found by getOtherParticipant
              const op = thread.otherParticipant;
              if (op.firstName && op.lastName) {
                participantName = `${op.firstName} ${op.lastName}`.trim();
              } else if (op.firstName) {
                participantName = op.firstName;
              } else if (op.name) {
                participantName = op.name;
              }
            }
            
            const lastMessage = thread.lastMessage?.content || 'No messages yet.';
            const timestamp = thread.lastMessage?.timestamp ? 
              formatDistanceToNow(new Date(thread.lastMessage.timestamp), { addSuffix: true })
              : (thread.updatedAt ? formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true }) : ' ');
            
            const unreadCount = thread.unreadCount && typeof thread.unreadCount === 'object' 
              ? (thread.unreadCount[currentUserId] || 0) 
              : (typeof thread.unreadCount === 'number' ? thread.unreadCount : 0); // Fallback for older numeric unreadCount

            return (
              <React.Fragment key={thread._id}>
                <ListItem 
                  alignItems="flex-start"
                  button 
                  selected={selectedThreadId === thread._id}
                  onClick={() => handleThreadClick(thread._id)}
                  sx={{
                    bgcolor: selectedThreadId === thread._id ? (darkMode ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.1)') : 'transparent',
                    '&:hover': {
                      bgcolor: darkMode ? 'grey.800' : 'grey.100'
                    },
                    pt: 1.5, pb: 1.5, px: 2
                  }}
                >
                  <ListItemAvatar sx={{mt: 0.5}}>
                    <Avatar 
                      src={otherParticipant?.profile?.profilePicture || null}
                      sx={{
                        bgcolor: otherParticipant?.profile?.profilePicture ? undefined : 'blue.600',
                        width: 44, height: 44, fontSize: '1rem' 
                      }}
                    >
                      {!otherParticipant?.profile?.profilePicture && getInitials(participantName)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primaryTypographyProps={{ 
                      noWrap: true, 
                      fontWeight: '600', 
                      fontSize: '0.95rem',
                      color: darkMode ? 'grey.100' : 'grey.900' 
                    }}
                    secondaryTypographyProps={{ 
                      noWrap: true, 
                      fontSize: '0.85rem',
                      color: darkMode ? 'grey.400' : 'grey.600'
                    }}
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" component="span" noWrap>
                          {participantName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {timestamp}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        noWrap
                        sx={{ 
                          display: 'inline',
                          fontWeight: thread.unread ? 'bold' : 'normal' 
                        }}
                      >
                        {lastMessage}
                      </Typography>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 1, mt: 0.5 }}>
                    {unreadCount > 0 && (
                      <Box sx={{
                        bgcolor: 'blue.600',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        mt: 0.5
                      }}>
                        {unreadCount}
                      </Box>
                    )}
                  </Box>
                </ListItem>
                {index < filteredThreads.length - 1 && <Divider variant="inset" component="li" sx={{ borderColor: darkMode ? 'grey.700' : 'grey.200'}} />}
              </React.Fragment>
            );
          })
        )}
      </List>
      {/* TODO: Potentially a global "New Message" FAB if design calls for it and not using the one in empty state */}
    </Box>
  );
};

export default NewThreadList; 