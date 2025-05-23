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
  CircularProgress,
  Typography,
  Collapse
} from '@mui/material';
import { 
  Send as SendIcon,
  InsertEmoticon as EmojiIcon,
  AttachFile as AttachIcon,
  Image as ImageIcon,
  Description as FileIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Reply as ReplyIcon
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
 * @param {Object} props.replyTo - Message being replied to
 * @param {Function} props.onCancelReply - Function to cancel replying to a message
 */
const MessageComposer = ({ 
  onSendMessage, 
  onTypingStart, 
  onTypingStop, 
  darkMode = false,
  placeholder = "Type a message...",
  sx = {},
  replyTo = null,
  onCancelReply
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
    const value = e.target.value || '';
    setMessage(value);
    
    // Handle typing indicator
    if (value && !isTyping) {
      setIsTyping(true);
      if (typeof onTypingStart === 'function') onTypingStart();
    } else if (!value && isTyping) {
      setIsTyping(false);
      if (typeof onTypingStop === 'function') onTypingStop();
    }
    
    // Clear previous timeout
    if (typingTimeoutId) {
      clearTimeout(typingTimeoutId);
    }
    
    // Set new timeout for typing indicator
    if (value) {
      const timeoutId = setTimeout(() => {
        setIsTyping(false);
        if (typeof onTypingStop === 'function') onTypingStop();
      }, 3000);
      
      setTypingTimeoutId(timeoutId);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() && (!attachments || !Array.isArray(attachments) || attachments.length === 0)) return;
    
    // Call parent handler with message text and attachments
    if (typeof onSendMessage === 'function') {
      onSendMessage(
        message.trim(), 
        Array.isArray(attachments) ? attachments : [],
        replyTo ? replyTo._id : null // Pass the replyTo message ID
      );
    }
    
    // Reset state
    setMessage('');
    setAttachments([]);
    setIsTyping(false);
    if (typingTimeoutId) {
      clearTimeout(typingTimeoutId);
    }
    if (typeof onTypingStop === 'function') onTypingStop();
    
    // Cancel reply mode if active
    if (replyTo && typeof onCancelReply === 'function') {
      onCancelReply();
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emoji) => {
    if (!emoji) return;
    
    setMessage(prev => prev + (emoji.native || ''));
    setEmojiAnchorEl(null);
    
    // Trigger typing indicator when emoji is selected
    if (!isTyping) {
      setIsTyping(true);
      if (typeof onTypingStart === 'function') onTypingStart();
      
      // Set typing timeout
      const timeoutId = setTimeout(() => {
        setIsTyping(false);
        if (typeof onTypingStop === 'function') onTypingStop();
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
    if (!e || !e.target || !e.target.files) return;
    
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
                id: uploadResult?.filename || Date.now() + Math.random().toString(36).substring(2, 10),
                name: file.name,
                type: file.type,
                size: file.size,
                url: uploadResult?.url,
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
      setAttachments(prev => [...(Array.isArray(prev) ? prev : []), ...newAttachments]);
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setUploading(false);
      
      // Reset the file input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (id) => {
    setAttachments(prev => (Array.isArray(prev) ? prev : []).filter(attachment => attachment.id !== id));
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  // Function to handle canceling a reply
  const handleCancelReply = () => {
    if (typeof onCancelReply === 'function') {
      onCancelReply();
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%',
        ...(sx || {})
      }}
    >
      {/* Reply Preview */}
      <Collapse in={!!replyTo}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            mb: 1,
            backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.2)' : 'rgba(229, 231, 235, 0.5)',
            borderRadius: 1,
            border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.8)'}`,
            maxWidth: '100%'
          }}
        >
          <ReplyIcon sx={{ mr: 1, color: darkMode ? 'primary.light' : 'primary.main', fontSize: 18 }} />
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: darkMode ? 'primary.light' : 'primary.main' }}>
              Replying to {replyTo?.sender?.firstName || 'User'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                opacity: 0.9,
                fontSize: '0.8rem'
              }}
            >
              {replyTo?.content}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleCancelReply}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Collapse>

      {/* Attachments Preview */}
      {Array.isArray(attachments) && attachments.length > 0 && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 1, 
            mb: 1, 
            border: `1px solid ${darkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.8)'}`,
            backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.3)' : 'rgba(243, 244, 246, 0.5)',
            borderRadius: 1
          }}
        >
          <List dense sx={{ py: 0 }}>
            {attachments.map((attachment) => (
              <ListItem 
                key={attachment.id}
                secondaryAction={
                  <IconButton edge="end" onClick={() => removeAttachment(attachment.id)} size="small">
                    <CancelIcon fontSize="small" />
                  </IconButton>
                }
                sx={{ py: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {attachment.type.startsWith('image/') ? 
                    <ImageIcon fontSize="small" color="primary" /> : 
                    <FileIcon fontSize="small" color="primary" />
                  }
                </ListItemIcon>
                <ListItemText 
                  primary={attachment.name}
                  secondary={formatFileSize(attachment.size)}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    noWrap: true,
                    sx: { maxWidth: '200px' }
                  }}
                  secondaryTypographyProps={{ 
                    variant: 'caption',
                    color: 'text.secondary'
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Message Input */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          backgroundColor: darkMode ? 'rgba(31, 41, 55, 0.8)' : 'white',
          borderRadius: '24px',
          border: `1px solid ${darkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(229, 231, 235, 0.8)'}`,
          p: '2px',
          px: 1.5,
          position: 'relative',
          width: '100%'
        }}
      >
        {/* Emoji Picker */}
        <IconButton 
          onClick={handleOpenEmojiPicker}
          sx={{ 
            p: 1,
            mr: 0.5,
            color: darkMode ? 'rgba(156, 163, 175, 0.8)' : 'rgba(107, 114, 128, 0.8)'
          }}
          size="small"
        >
          <EmojiIcon fontSize="small" />
        </IconButton>
        
        <Popover
          open={Boolean(emojiAnchorEl)}
          anchorEl={emojiAnchorEl}
          onClose={handleCloseEmojiPicker}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          PaperProps={{
            elevation: 3,
            sx: { 
              mt: -1,
              // Ensure the picker always appears on top
              zIndex: theme.zIndex.modal + 1
            }
          }}
        >
          <Picker 
            data={data}
            onEmojiSelect={handleEmojiClick}
            theme={darkMode ? 'dark' : 'light'}
            previewPosition="none"
            skinTonePosition="none"
          />
        </Popover>
        
        {/* File Attachment Button */}
        <Tooltip title="Attach files" arrow>
          <span>
            <IconButton 
              onClick={handleFileAttachment}
              sx={{ 
                p: 1,
                mr: 0.5,
                color: darkMode ? 'rgba(156, 163, 175, 0.8)' : 'rgba(107, 114, 128, 0.8)'
              }}
              size="small"
              disabled={uploading}
            >
              {uploading ? (
                <CircularProgress size={18} thickness={5} />
              ) : (
                <AttachIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          multiple
        />
        
        {/* Message Input TextField */}
        <TextField
          fullWidth
          multiline
          maxRows={6}
          variant="standard"
          placeholder={placeholder}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          InputProps={{
            disableUnderline: true,
            sx: {
              px: 1,
              py: 0.5,
              fontSize: '0.9rem',
              color: darkMode ? 'rgba(243, 244, 246, 0.9)' : 'inherit'
            }
          }}
          inputProps={{
            style: {
              resize: 'none',
            }
          }}
        />
        
        {/* Send Button */}
        <Tooltip title="Send message" arrow>
          <span>
            <IconButton 
              onClick={handleSendMessage}
              color="primary"
              sx={{ p: 1, ml: 0.5 }}
              size="small"
              disabled={(!message.trim() && attachments.length === 0) || uploading}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default MessageComposer; 