import React from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import { format } from 'date-fns';

const NewMessageItem = ({ message, isOwnMessage }) => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  // Define colors based on theme mode and message ownership
  let bubbleColor, textColor, timestampColor;

  if (isOwnMessage) {
    bubbleColor = darkMode ? theme.palette.primary.dark : theme.palette.primary.main;
    textColor = theme.palette.primary.contrastText;
    timestampColor = darkMode ? alpha(theme.palette.primary.contrastText, 0.7) : alpha(theme.palette.primary.contrastText, 0.85);
  } else {
    bubbleColor = darkMode ? theme.palette.grey[700] : theme.palette.grey[200]; // A bit lighter than 300 for incoming, grey[200] is common
    textColor = theme.palette.text.primary;
    timestampColor = darkMode ? theme.palette.grey[400] : theme.palette.grey[600];
  }

  return (
    <Box 
      sx={{
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 1.5, // Increased margin for better spacing
      }}
    >
      <Paper 
        elevation={0} // Flat design for bubbles
        sx={{
          p: '10px 14px',
          bgcolor: bubbleColor,
          color: textColor,
          borderRadius: isOwnMessage ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          maxWidth: '75%',
          wordBreak: 'break-word',
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>
        <Typography 
          variant="caption" 
          component="div" // Use div for block display to push it to new line
          sx={{
            textAlign: 'right',
            fontSize: '0.7rem',
            color: timestampColor, // Use defined timestampColor
            mt: '4px' // Margin top for spacing from message content
          }}
        >
          {message.createdAt ? format(new Date(message.createdAt), 'p') : ''} 
        </Typography>
      </Paper>
    </Box>
  );
};

export default NewMessageItem; 