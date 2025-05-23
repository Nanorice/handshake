# Messaging System Cleanup Guide

This document explains how to clean up message data in the Handshake platform when testing or troubleshooting the messaging system.

## Client-Side Cleanup (localStorage)

The Handshake messaging system has a fallback to localStorage when the MongoDB connection is not available. This can lead to test message data accumulating in your browser's localStorage.

### Using the UI Button

1. Navigate to the `/messages` page in the application
2. In the bottom right corner of the thread list, you'll see a trash icon button
3. Click this button to open the confirmation dialog
4. Confirm that you want to clear message data
5. The system will clear all message-related data from localStorage

### Manual Cleanup

If needed, you can manually clear the following localStorage keys:

- `handshake_threads` - Thread list data
- `handshake_messages` - Message content data
- Any keys starting with `messages_` - Thread-specific message collections

## Server-Side Cleanup (MongoDB)

To clear message data from the MongoDB database while preserving thread structures:

1. In the project terminal, run:
   ```
   cd server
   npm run clean-messages
   ```

2. This script will:
   - Delete all messages from the Message collection
   - Reset the lastMessage and unreadCount fields on all threads
   - Preserve the thread structures and relationships

## Complete Cleanup

For a full reset of the messaging system:

1. Run the server-side cleanup script
2. Use the client-side cleanup button in the UI
3. Refresh your browser

This ensures that all message data is removed from both the server and client storage while preserving the basic thread structure for testing new messages.

## Troubleshooting

If you still experience issues after cleanup:

1. Check the browser console for any errors
2. Verify that the API calls to `/api/messages/threads` are working correctly
3. Ensure that the MongoDB connection is properly configured in the `.env` file
4. Check that the socket.io connection is established for real-time updates

If the error "Cannot read properties of undefined (reading 'length')" persists, it may indicate an issue with the API response format. Verify that the server is correctly returning an array for the threads property. 