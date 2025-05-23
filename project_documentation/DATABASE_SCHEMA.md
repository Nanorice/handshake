# Handshake Database Schema

This document outlines the MongoDB schema for the Handshake application. All database models should conform to these schemas to ensure data consistency.

## User Collection

```javascript
{
  _id: ObjectId,
  email: String,               // Unique, required
  passwordHash: String,        // Required
  role: String,                // 'seeker' or 'professional'
  firstName: String,           // User's first name
  lastName: String,            // User's last name
  bio: String,                 // Short user bio
  resumeUrl: String,           // For job seekers (optional)
  linkedinUrl: String,         // Professional's LinkedIn (optional)
  profileImage: String,        // URL to profile image
  createdAt: Date,
  updatedAt: Date
}
```

## ProfessionalProfile Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,            // Reference to User collection
  industries: [String],        // Array of industries
  skills: [String],            // Array of skills
  experience: [
    {
      company: String,
      title: String,
      startDate: Date,
      endDate: Date,
      description: String
    }
  ],
  availability: [
    {
      day: String,             // Day of week
      startTime: String,       // Format: "HH:MM"
      endTime: String          // Format: "HH:MM"
    }
  ],
  rate: Number,                // Hourly rate for sessions
  isPublic: Boolean,           // Controls public visibility of the profile, defaults to true
  createdAt: Date,
  updatedAt: Date
}
```

## Invitation Collection

```javascript
{
  _id: ObjectId,
  sender: ObjectId,            // Reference to User (seeker who sends invitation)
  receiver: ObjectId,          // Reference to User (professional who receives invitation)
  status: String,              // 'pending', 'accepted', 'declined', 'cancelled'
  message: String,             // Message from sender to receiver
  sessionDetails: {
    proposedDate: Date,        // Proposed date and time for the meeting
    duration: Number,          // Duration in minutes
    topic: String              // Topic for the coffee chat
  },
  threadId: ObjectId,          // Reference to Thread for messaging
  createdAt: Date,
  updatedAt: Date
}
```

## Thread Collection

```javascript
{
  _id: ObjectId,
  participants: [ObjectId],    // Array of User IDs participating in this thread
  lastMessage: {
    content: String,           // Content of the last message
    sender: ObjectId,          // User who sent the last message
    timestamp: Date,           // When the last message was sent
    messageType: String        // Type of the last message
  },
  unreadCount: Map,            // Map of user IDs to unread message counts
                               // Example: { "userId1": 5, "userId2": 0 }
  status: String,              // 'active' or 'archived'
  metadata: {
    isGroupChat: Boolean,      // Whether this is a group chat
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Message Collection

```javascript
{
  _id: ObjectId,
  threadId: ObjectId,          // Reference to Thread
  sender: ObjectId,            // User who sent the message
  content: String,             // Message content
  messageType: String,         // 'text', 'image', 'invite', etc.
  metadata: {                  // Additional data based on message type
    inviteId: ObjectId,        // For invitation-related messages
    status: String,            // Status of related invitation
    // Other metadata fields as needed
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Session Collection

```javascript
{
  _id: ObjectId,
  seekerId: ObjectId,          // Reference to User (seeker)
  professionalId: ObjectId,    // Reference to User (professional)
  datetime: Date,              // When the session is scheduled
  duration: Number,            // Duration in minutes
  zoomLink: String,            // Generated Zoom meeting link
  status: String,              // 'pending', 'confirmed', 'completed', 'cancelled'
  stripeSessionId: String,     // Reference to Stripe session
  notes: {
    seeker: String,            // Seeker's pre-meeting notes
    professional: String       // Professional's pre-meeting notes
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Payment Collection

```javascript
{
  _id: ObjectId,
  sessionId: ObjectId,         // Reference to Session collection
  userId: ObjectId,            // User who made the payment
  stripePaymentId: String,     // Stripe payment ID
  amount: Number,              // Amount in cents
  currency: String,            // Currency code (e.g., 'usd')
  status: String,              // 'pending', 'succeeded', 'failed', 'refunded'
  createdAt: Date,
  updatedAt: Date
}
```

## Notification Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,            // User receiving the notification
  type: String,                // 'booking', 'reminder', 'payment', etc.
  title: String,               // Notification title
  message: String,             // Notification message
  relatedId: ObjectId,         // ID of related entity (e.g., sessionId)
  read: Boolean,               // Whether the notification has been read
  createdAt: Date
}
```

## Implementation Guidelines

1. Use Mongoose Schemas with proper validation
2. Define virtual fields as needed
3. Implement pre/post hooks for data validation and cleanup
4. Use indexes for frequently queried fields:
   - User.email
   - ProfessionalProfile.userId
   - Invitation.sender and Invitation.receiver
   - Invitation.status
   - Thread.participants
   - Session.seekerId and Session.professionalId
   - Payment.sessionId
   - Notification.userId
5. Implement soft delete where appropriate
6. Use timestamps plugin for createdAt/updatedAt fields
7. Ensure proper data sanitization before storing user input 