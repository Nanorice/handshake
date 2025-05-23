# Clearing Dummy Messages in Handshake

This guide explains how to remove dummy/test messages from both the server database and client local storage.

## Clearing Server-Side Messages

To clear all messages from the MongoDB database:

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Run the cleanup script:
   ```
   npm run clean-messages
   ```

This script will:
- Connect to the MongoDB database
- Delete all messages from the `messages` collection
- Reset the `lastMessage` and `unreadCount` fields on all threads
- Show a summary of what was deleted

## Clearing Client-Side Messages

There are two ways to clear messages from the client's local storage:

### Using the UI Button

1. Navigate to the Messaging page in the application
2. Look for the "Clear Messages" button in the bottom-right corner of the thread list
3. Click the button and confirm the deletion in the dialog

### Using the Browser Developer Tools

1. Open your browser's developer tools (F12 or right-click and select "Inspect")
2. Go to the "Application" tab
3. Select "Local Storage" in the sidebar
4. Look for these items and delete them:
   - `handshake_threads`
   - `handshake_messages`
   - Any items starting with `messages_`

## Complete Cleanup

For a full cleanup of all dummy messages:

1. Run the server-side cleanup script
2. Clear the browser's local storage using either method above
3. Refresh the application

After these steps, all dummy messages should be gone, and the messaging system will show empty conversation lists until new messages are created. 