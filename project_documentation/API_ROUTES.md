# Handshake API Routes Documentation

This document provides the standardized API route structure for the Handshake application. All backend development should conform to these routes to ensure consistency across the application.

## Authentication Routes

```
POST /api/auth/register    // Register a new user (both Seeker and Professional)
POST /api/auth/login       // Login and receive JWT tokens
POST /api/auth/refresh     // Refresh access token using refresh token
POST /api/auth/logout      // Logout and invalidate tokens
```

## User Routes

```
GET  /api/users/me         // Get current user profile
PUT  /api/users/profile    // Update user profile
GET  /api/users/:id        // Get public profile of a specific user (if permissions allow)
```

## Professional Routes

```
GET  /api/professionals             // Get list of professionals with filtering
GET  /api/professionals/:id         // Get specific professional details
POST /api/professionals/availability // Update professional availability
```

## Professional Public Profile Routes

```
GET  /api/professionalprofiles/me   // Get current professional's public profile (default from user info if not set)
POST /api/professionalprofiles      // Create or update current professional's public profile
```

## Session/Booking Routes

```
POST /api/sessions/book     // Book a new session
GET  /api/sessions/my       // Get current user's sessions
GET  /api/sessions/:id      // Get specific session details
PUT  /api/sessions/:id      // Update session details (status, etc)
DELETE /api/sessions/:id    // Cancel a session
```

## Payment Routes

```
POST /api/payments/create-session  // Create Stripe checkout session
POST /api/payments/webhook         // Handle Stripe webhook events
GET  /api/payments/history         // Get payment history for current user
```

## Integration Routes

```
POST /api/zoom/create-meeting      // Create a Zoom meeting for a session
```

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