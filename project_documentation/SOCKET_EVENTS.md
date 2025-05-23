# Socket.io Events Documentation

This document outlines the real-time communication system used in the Handshake application. All client and server interactions involving real-time updates utilize Socket.io with the following event structure.

## Connection

### Authentication
Sockets are authenticated using JWT tokens passed in the handshake:

```javascript
// Client-side connection with authentication
const socket = io(SOCKET_URL, {
  auth: { token },
  transports: ['websocket', 'polling']
});
```

```javascript
// Server-side authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify token and attach user to socket
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = decoded.userId;
  next();
});
```

## Message Events

### Joining a Thread Room
**Event:** `join-thread`  
**Direction:** Client → Server  
**Payload:** `threadId` (string)

```javascript
// Client: Join a thread
socketService.subscribeToThread(threadId, callback);

// Server: Handle join request
socket.on('join-thread', (threadId) => {
  socket.join(`thread:${threadId}`);
});
```

### Leaving a Thread Room
**Event:** `leave-thread`  
**Direction:** Client → Server  
**Payload:** `threadId` (string)

```javascript
// Client: Leave a thread
socketService.unsubscribeFromThread(threadId);

// Server: Handle leave request
socket.on('leave-thread', (threadId) => {
  socket.leave(`thread:${threadId}`);
});
```

### Sending a Message
**Event:** `send-message`  
**Direction:** Client → Server  
**Payload:**
```javascript
{
  threadId: string,
  message: {
    content: string,
    messageType: string, // 'text', 'image', etc.
    metadata: object     // Optional additional data
  }
}
```

### Receiving a New Message
**Event:** `new-message`  
**Direction:** Server → Client  
**Payload:**
```javascript
{
  _id: string,
  threadId: string,
  content: string,
  sender: {
    _id: string,
    firstName: string,
    lastName: string,
    email: string,
    profile: {
      profilePicture: string
    },
    userType: string
  },
  createdAt: string,
  messageType: string
}
```

### Message Notifications
**Event:** `message-notification`  
**Direction:** Server → Client  
**Payload:**
```javascript
{
  threadId: string,        // Included at top level for redundancy
  message: {
    threadId: string,      // Also included in message for fallback
    content: string,
    sender: {
      _id: string,
      firstName: string,
      lastName: string,
      profilePicture: string
    }
  },
  thread: {
    _id: string
  }
}
```

## Thread Status Events

### Marking Thread as Read
**Event:** `mark-thread-read`  
**Direction:** Client → Server  
**Payload:** `threadId` (string)

### Thread Read Status Update
**Event:** `thread-read`  
**Direction:** Server → Client  
**Payload:**
```javascript
{
  threadId: string,
  userId: string  // User who read the thread
}
```

## Typing Indicators

### User Started Typing
**Event:** `typing`  
**Direction:** Client → Server  
**Payload:** `threadId` (string)

### User Typing Notification
**Event:** `user-typing`  
**Direction:** Server → Client  
**Payload:**
```javascript
{
  threadId: string,
  user: {
    _id: string,
    firstName: string
  }
}
```

### User Stopped Typing
**Event:** `typing-stopped`  
**Direction:** Client → Server  
**Payload:** `threadId` (string)

### User Typing Stopped Notification
**Event:** `user-typing-stopped`  
**Direction:** Server → Client  
**Payload:**
```javascript
{
  threadId: string,
  userId: string
}
```

## Invitation Events

### Invitation Notification
**Event:** `invitation-notification`  
**Direction:** Server → Client  
**Payload:**
```javascript
{
  type: string,            // 'invitation_accepted', 'invitation_declined'
  invitation: {            // The invitation object
    _id: string,
    // Other invitation fields
  },
  sender: {                // Who performed the action
    _id: string,
    firstName: string,
    lastName: string
  },
  receiver: {              // Who is receiving the notification
    _id: string,
    firstName: string,
    lastName: string
  }
}
```

## General Notification Event

### New Generic Notification
**Event:** `new-notification`  
**Direction:** Server → Client  
**Payload:**
```javascript
{
  _id: string,         // Notification ID
  userId: string,      // User receiving the notification
  type: string,        // e.g., 'booking_confirmed', 'session_reminder', 'payment_success'
  title: string,       // Notification title
  message: string,     // Notification message content
  relatedId: string,   // Optional: ID of the related entity (e.g., sessionId, paymentId)
  read: boolean,       // Typically false when first sent
  createdAt: string    // ISO date string
}
```

## Error Handling

### Socket Error Event
**Event:** `error`  
**Direction:** Server → Client  
**Payload:**
```javascript
{
  message: string  // Error message
}
```

## Client Implementation

Recommended approach for handling socket events on the client:

```javascript
// Connect socket
socketService.connect(token);

// Subscribe to message events
socketService.subscribeToThread(threadId, (message) => {
  // Handle new message
});

// Listen for notifications
socketService.onMessageNotification((data) => {
  // Process notification
});

// Handle connection issues
socket.on('connect_error', (error) => {
  // Connection error handling
});
```

## Reliability Features

The socket implementation includes:

1. **Message Queuing**: Messages sent while offline are queued and sent when reconnected
2. **Reconnection Logic**: Automatic reconnection with exponential backoff
3. **Connection Status**: UI indicators for connection state
4. **Deduplication**: Multi-level checks to prevent duplicate messages
   - Message ID tracking
   - Content/sender/timestamp similarity checks
   - Optimistic update filtering

## Security Considerations

1. All socket connections require valid JWT authentication
2. User data is verified on the server before broadcast
3. Thread room access is restricted to thread participants
4. Sensitive user data is filtered before sending through sockets
5. Rate limiting is applied to message sending

This document will be updated as the socket events system evolves. 