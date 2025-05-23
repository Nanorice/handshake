# Handshake API Routes Documentation

This document provides the standardized API route structure for the Handshake application. All backend development should conform to these routes to ensure consistency across the application.

> **Note**: For real-time communication via Socket.io, see [SOCKET_EVENTS.md](./SOCKET_EVENTS.md)

## Authentication Routes

```
POST /api/auth/register    // Register a new user (both Seeker and Professional)
POST /api/auth/login       // Login and receive JWT tokens
POST /api/auth/refresh     // Refresh access token using refresh token
POST /api/auth/logout      // Logout and invalidate tokens
GET /api/auth/me           // Get current authenticated user's details
PUT /api/auth/update-role  // Update user's role (e.g., admin modifications)
```

## User Routes

```
GET  /api/users/me         // Get current user profile
PUT  /api/users/profile    // Update user profile
GET  /api/users/:id        // Get public profile of a specific user (if permissions allow)
GET  /api/users/stats       // Get statistics for the current user
// TODO: Verify implementation and controller details for: POST /api/users/me/resume  // Upload/update user's resume
// TODO: Verify implementation and controller details for: GET  /api/users/me/recommended-professionals // Get recommended professionals for the current user
```

## Professional Routes

```
GET  /api/professionals             // Get list of professionals with filtering
GET  /api/professionals/:id         // Get specific professional details
POST /api/professionals/availability // Update professional availability (professional only)
// TODO: Verify implementation and controller details for: GET  /api/professionals/me/earnings // Get earnings overview for the current professional
```

## Professional Public Profile Routes

```
GET  /api/professionalprofiles/me   // Get current professional's public profile (professional only)
POST /api/professionalprofiles      // Create or update current professional's public profile (professional only)
GET  /api/professionalprofiles/:id  // Get public profile of a specific professional by user ID
```

## Invitation Routes

```
POST /api/invitations              // Send an invitation from seeker to professional
GET  /api/invitations              // Get all invitations for current user (query params: type, status)
GET  /api/invitations/:id          // Get specific invitation details
PUT  /api/invitations/:id/respond  // Respond to an invitation (accept/decline)
PUT  /api/invitations/:id/cancel   // Cancel a pending invitation
GET  /api/simple-invitations/:id   // Get invitation details (simplified flow)
PUT  /api/simple-invitations/:id/respond // Respond to invitation (simplified flow)
```

## Session/Booking Routes

```
GET  /api/sessions               // Get all sessions (admin or general purpose - needs clarification)
GET  /api/sessions/upcoming      // Get upcoming sessions for the current user
POST /api/sessions/book          // Book a new session
GET  /api/sessions/my            // Get current user's sessions
GET  /api/sessions/:id           // Get specific session details
PUT  /api/sessions/:id           // Update session details (status, etc)
DELETE /api/sessions/:id         // Cancel a session
```

## Payment Routes

```
POST /api/payments/create-session  // Create Stripe checkout session
POST /api/payments/webhook         // Handle Stripe webhook events (public)
GET  /api/payments/history         // Get payment history for current user
```

## Integration Routes

```
POST /api/zoom/create-meeting      // Create a Zoom meeting for a session (professional only)
```

## Notification Routes

```
GET  /api/notifications/invitations // Get invitation-related notifications for the current user
// TODO: Verify implementation for these routes, or remove if deprecated:
// GET  /api/users/me/notifications         // Get all notifications for the current user
// PUT  /api/notifications/:id/read         // Mark a specific notification as read
// PUT  /api/users/me/notifications/mark-all-read // Mark all notifications as read for the current user
```

## Messaging Routes

```
GET  /api/messages/threads              // Get all threads for current user
POST /api/messages/threads              // Create a new thread
GET  /api/messages/threads/:threadId    // Get messages in a thread
POST /api/messages/threads/:threadId    // Send a message to a thread
PUT  /api/messages/threads/:threadId/read  // Mark a thread as read
PUT  /api/messages/threads/:threadId/archive  // Archive a thread
GET  /api/messages/:threadId/messages   // Get messages for a thread (alternative endpoint)
POST /api/messages                      // Send a message (TODO: clarify relation to POST /api/messages/threads/:threadId)
GET  /api/messages/utils/dedup-threads  // Utility to deduplicate threads (admin/debug)
GET  /api/messages/test                 // Test endpoint for messaging system (utility)
```

## Match Routes

```
GET    /api/matches                 // Get all matches for the current user
GET    /api/matches/:id             // Get details of a specific match
POST   /api/matches/request         // Send a match request (seeker only)
PUT    /api/matches/:id/accept      // Accept a match request (professional only)
PUT    /api/matches/:id/reject      // Reject a match request (professional only)
```

### Real-Time Messaging

Real-time messaging is handled via Socket.io. Key events:

```
send-message      // Client → Server: Send a message to a thread
new-message       // Server → Client: Receive a new message
message-notification // Server → Client: Notification about a new message
```

For complete Socket.io events documentation, see [SOCKET_EVENTS.md](./SOCKET_EVENTS.md).

## Response Format Standards

All API responses should follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },  // Response data object
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message"
  }
}
```

## Error Codes

Standard error codes to be used across the application:

- `AUTH_REQUIRED`: Authentication required
- `INVALID_CREDENTIALS`: Invalid login credentials
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `VALIDATION_ERROR`: Input validation error
- `PERMISSION_DENIED`: User lacks permission for the action
- `PAYMENT_FAILED`: Payment processing failed
- `BOOKING_CONFLICT`: Time slot already booked
- `SERVER_ERROR`: Internal server error

## Implementation Guidelines

1. All routes should be implemented in separate route files under `server/src/routes/`
2. Controller logic should be separated in `server/src/controllers/`
3. Use middleware for authentication and validation
4. Document all routes using JSDoc comments
5. Implement proper error handling for all routes 