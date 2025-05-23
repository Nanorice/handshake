# Invitation System Flow Documentation

This document describes the connection invitation system in Handshake, which allows seekers to send invitations to professionals for coffee chats or mentoring sessions.

## Overview

The invitation system enables a seeker to connect with a professional by sending a request for a coffee chat session. The professional can then accept or decline the invitation. If accepted, the system creates a message thread between the users and prepares for scheduling the actual meeting.

## User Roles

- **Seeker**: Can send invitations to professionals
- **Professional**: Can accept or decline invitations from seekers

## Invitation Flow

### 1. Sending an Invitation

1. Seeker navigates to a professional's profile via the Professional Discovery page
2. Seeker clicks "Connect" or "Request Coffee Chat"
3. Seeker fills out invitation form with:
   - Message to the professional
   - Proposed date/time 
   - Duration
   - Topic
4. System creates a new invitation with status "pending"
5. System creates or identifies the message thread between these users

**API Endpoint:** `POST /api/invitations`

**Request Body:**
```json
{
  "receiverId": "professional-user-id",
  "message": "I'd like to connect to discuss career opportunities in tech",
  "sessionDetails": {
    "proposedDate": "2023-07-15T15:00:00Z", 
    "duration": 30,
    "topic": "Career Transition Advice"
  }
}
```

### 2. Professional Receiving an Invitation

1. Professional receives a notification (via app and email)
2. Professional can view pending invitations on their dashboard
3. For each invitation, the professional sees:
   - Sender's name and basic profile info
   - Proposed date/time
   - Duration
   - Message from the seeker
   - Topic

### 3. Responding to an Invitation

1. Professional clicks "Accept" or "Decline" on an invitation
2. If accepting, professional can optionally add a response message
3. If declining, professional is encouraged to provide a reason
4. System updates invitation status to "accepted" or "declined"
5. System sends notification to the seeker

**API Endpoint:** `PUT /api/invitations/:id/respond`

**Request Body:**
```json
{
  "status": "accepted", // or "declined"
  "responseMessage": "I'd be happy to chat with you! Looking forward to it."
}
```

### 4. After Acceptance

1. System creates a thread message to both users confirming the session
2. Invitation appears in both users' "Upcoming" sections
3. Reminder notifications are sent as the date approaches
4. Further scheduling and payment flow begins for paid sessions

### 5. Cancellation

Either party can cancel a pending or accepted invitation:

**API Endpoint:** `PUT /api/invitations/:id/cancel`

## Simplified Flow

For reliability, a simplified invitation flow is also available:

1. Access via direct link: `/simple-invitation/:id`
2. Professional can view and respond with minimal interface
3. Uses dedicated endpoints with improved error handling

**API Endpoints:**
- `GET /api/simple-invitations/:id`
- `PUT /api/simple-invitations/:id/respond`

## Implementation Details

### Data Model

The invitation system uses these main models:
- **Invitation**: Stores the invitation data
- **Thread**: Represents the message thread between users
- **Message**: Stores messages within a thread

### Key Components

**Backend:**
- `invitationController.js`: Main controller for invitation operations
- `simpleInvitationController.js`: Simplified controller with better error handling
- `invitationRoutes.js`: API route definitions

**Frontend:**
- `InvitationList.js`: Component to display and manage invitations
- `InvitationModal.js`: Component for creating new invitations
- `SimpleInvitationHandler.js`: Component for simplified invitation flow

## Status Lifecycle

Invitations follow this status lifecycle:
1. **pending**: Initial state after creation
2. **accepted**: Professional has accepted
3. **declined**: Professional has declined
4. **cancelled**: Either user has cancelled

## Error Handling

Common errors and their codes:
- `RESOURCE_NOT_FOUND`: Invitation or user doesn't exist
- `PERMISSION_DENIED`: User doesn't have permission for the action
- `VALIDATION_ERROR`: Invalid status or data submission

## Debugging and Troubleshooting

For debugging invitations:
1. Check invitation status in database
2. Verify user roles (seeker/professional)
3. Check correct thread ID is linked
4. Use the `/api/diagnostic/invitations` endpoint for basic checks

If needed, the `reset-invitation.js` script can reset a problematic invitation. 