import React, { useState, useRef } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Popover,
  useTheme,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Send as SendIcon,
  InsertEmoticon as EmojiIcon,
  AttachFile as AttachIcon,
  Image as ImageIcon,
  Description as FileIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import fileService from '../../services/fileService';

/**
 * MessageComposer component for message input with emoji picker and file attachment
 * 
 * @param {Object} props
 * @param {Function} props.onSendMessage - Function to handle sending a message
 * @param {Function} props.onTypingStart - (Optional) Function to call when user starts typing
 * @param {Function} props.onTypingStop - (Optional) Function to call when user stops typing
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 * @param {string} props.placeholder - Placeholder text for the input field
 * @param {Object} props.sx - Additional styles for the container
 */
const MessageComposer = ({ 
  onSendMessage, 
  onTypingStart, 
  onTypingStop, 
  darkMode = false,
  placeholder = "Type a message...",
  sx = {}
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeoutId, setTypingTimeoutId] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const theme = useTheme();

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle typing indicator
    if (value && !isTyping) {
      setIsTyping(true);
      if (onTypingStart) onTypingStart();
    } else if (!value && isTyping) {
      setIsTyping(false);
      if (onTypingStop) onTypingStop();
    }
    
    // Clear previous timeout
    if (typingTimeoutId) {
      clearTimeout(typingTimeoutId);
    }
    
    // Set new timeout for typing indicator
    if (value) {
      const timeoutId = setTimeout(() => {
        setIsTyping(false);
        if (onTypingStop) onTypingStop();
      }, 3000);
      
      setTypingTimeoutId(timeoutId);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() && attachments.length === 0) return;
    
    // Call parent handler with message text and attachments
    if (onSendMessage) {
      onSendMessage(message.trim(), attachments);
    }
    
    // Reset state
    setMessage('');
    setAttachments([]);
    setIsTyping(false);
    if (typingTimeoutId) {
      clearTimeout(typingTimeoutId);
    }
    if (onTypingStop) onTypingStop();
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji.native);
    setEmojiAnchorEl(null);
    
    // Trigger typing indicator when emoji is selected
    if (!isTyping) {
      setIsTyping(true);
      if (onTypingStart) onTypingStart();
      
      // Set typing timeout
      const timeoutId = setTimeout(() => {
        setIsTyping(false);
        if (onTypingStop) onTypingStop();
      }, 3000);
      
      setTypingTimeoutId(timeoutId);
    }
  };

  const handleOpenEmojiPicker = (event) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleCloseEmojiPicker = () => {
    setEmojiAnchorEl(null);
  };

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      // Process each file to create a preview
      const filePromises = files.map(file => {
        return new Promise(async (resolve) => {
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            try {
              // Upload file to server (or use mock in development)
              const uploadResult = await fileService.uploadFile(file, 'message');
              
              // Create a file metadata object
              resolve({
                file,
                id: uploadResult.filename || Date.now() + Math.random().toString(36).substring(2, 10),
                name: file.name,
                type: file.type,
                size: file.size,
                url: uploadResult.url,
                preview: file.type.startsWith('image/') ? reader.result : null
              });
            } catch (error) {
              console.error('Error uploading file:', error);
              
              // Fallback to local preview only
              resolve({
                file,
                id: Date.now() + Math.random().toString(36).substring(2, 10),
                name: file.name,
                type: file.type,
                size: file.size,
                preview: file.type.startsWith('image/') ? reader.result : null
              });
            }
          };
          
          if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
          } else {
            reader.readAsArrayBuffer(new Blob([file]));
          }
        });
      });

      const newAttachments = await Promise.all(filePromises);
      setAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setUploading(false);
      // Reset the file input
      e.target.value = null;
    }
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <Paper
      elevation={0}
      sx={{ 
        p: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: darkMode ? 'background.paper' : 'background.default',
        ...sx
      }}
    >
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <List dense sx={{ mt: -1, mb: 1 }}>
          {attachments.map(attachment => (
            <ListItem 
              key={attachment.id}
              secondaryAction={
                <IconButton edge="end" size="small" onClick={() => removeAttachment(attachment.id)}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              }
              sx={{ 
                py: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {attachment.type.startsWith('image/') ? 
                  <ImageIcon color="primary" fontSize="small" /> : 
                  <FileIcon color="secondary" fontSize="small" />
                }
              </ListItemIcon>
              <ListItemText 
                primary={attachment.name} 
                secondary={formatFileSize(attachment.size)}
                primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>
      )}
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Add emoji">
          <IconButton size="small" sx={{ mr: 1 }} onClick={handleOpenEmojiPicker}>
            <EmojiIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Attach file">
          <IconButton 
            size="small" 
            sx={{ mr: 1 }} 
            onClick={handleFileAttachment}
            disabled={uploading}
          >
            {uploading ? <CircularProgress size={20} /> : <AttachIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <TextField
          fullWidth
          placeholder={placeholder}
          multiline
          maxRows={4}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          variant="outlined"
          size="small"
          sx={{ mr: 1 }}
        />
        
        <Tooltip title="Send message">
          <span>
            <IconButton 
              onClick={handleSendMessage}
              disabled={!message.trim() && attachments.length === 0}
              sx={{
                bgcolor: (message.trim() || attachments.length > 0) ? 'primary.main' : 'grey.300',
                color: (message.trim() || attachments.length > 0) ? 'white' : 'grey.500',
                '&:hover': {
                  bgcolor: (message.trim() || attachments.length > 0) ? 'primary.dark' : 'grey.300',
                },
                width: 40,
                height: 40
              }}
            >
              <SendIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Emoji Picker */}
      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={handleCloseEmojiPicker}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Picker 
          data={data} 
          onEmojiSelect={handleEmojiClick}
          theme={darkMode ? 'dark' : 'light'} 
          set="native"
        />
      </Popover>
    </Paper>
  );
};

export default MessageComposer; 