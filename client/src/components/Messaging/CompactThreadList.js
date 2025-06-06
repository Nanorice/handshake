import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  CircularProgress,
  Badge,
  Divider,
  IconButton
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const CompactListContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.divider,
    borderRadius: '2px',
  },
}));

const ThreadListItem = styled(ListItem)(({ theme, selected }) => ({
  padding: '8px 12px',
  cursor: 'pointer',
  backgroundColor: selected ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  borderRadius: '4px',
  margin: '2px 4px',
}));

const CompactThreadList = ({ 
  threads = [], 
  loading = false, 
  selectedThreadId, 
  onThreadSelect,
  currentUserId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredThreads = threads.filter(thread => {
    const otherParticipant = thread.participants?.find(p => p._id !== currentUserId);
    const participantName = otherParticipant ? 
      `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() : 
      'Unknown User';
    
    return participantName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message, maxLength = 30) => {
    if (!message) return 'No messages yet';
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%' }}>


      {/* Thread List */}
      <CompactListContainer sx={{ height: '100%' }}>
        <List sx={{ p: 0 }}>
          {filteredThreads.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No conversations yet
              </Typography>
            </Box>
          ) : (
            filteredThreads.map((thread, index) => {
              const otherParticipant = thread.participants?.find(p => p._id !== currentUserId);
              const participantName = otherParticipant ? 
                `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() : 
                'Unknown User';
              
              const lastMessage = thread.lastMessage;
              const isUnread = thread.unreadCount > 0;
              const isSelected = selectedThreadId === thread._id;

              return (
                <React.Fragment key={thread._id}>
                  <ThreadListItem
                    selected={isSelected}
                    onClick={() => onThreadSelect(thread._id)}
                  >
                    <ListItemAvatar>
                      <Badge
                        color="success"
                        variant="dot"
                        invisible={!otherParticipant?.isOnline}
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      >
                        <Avatar
                          src={otherParticipant?.profileImage}
                          sx={{ width: 36, height: 36 }}
                        >
                          {participantName.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body2" 
                          fontWeight={isUnread ? 600 : 400}
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {participantName}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography 
                            variant="caption" 
                            color="textSecondary"
                            sx={{ 
                              fontWeight: isUnread ? 500 : 400,
                              fontSize: '0.75rem',
                              flex: 1,
                              mr: 1
                            }}
                          >
                            {truncateMessage(lastMessage?.content)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                            {formatTime(lastMessage?.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                    
                    {isUnread && (
                      <Badge
                        badgeContent={thread.unreadCount}
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.625rem',
                            height: '16px',
                            minWidth: '16px',
                          }
                        }}
                      />
                    )}
                  </ThreadListItem>
                  
                  {index < filteredThreads.length - 1 && (
                    <Divider variant="inset" component="li" sx={{ ml: 6 }} />
                  )}
                </React.Fragment>
              );
            })
          )}
        </List>
      </CompactListContainer>
    </Box>
  );
};

export default CompactThreadList; 