# Handshake Project - Product Requirements Document (PRD)

This document outlines the product requirements for the Handshake project, compiled from various source documents.

## Table of Contents
- Core Product Requirements and User Flows
- System Architecture and Technical Stack
- Development Guidelines
- Detailed Development Standards
- Codebase Navigation and Key User Flows
- UI/UX Design Guidelines
- Chat Functionality

---

## Core Product Requirements and User Flows
Taken from `handshake-core-requirements.mdc`

- Scheduling and booking of 1:1 meetings
- Secure payment processing through Stripe
- Virtual meeting integration through Zoom

### Core User Flows
1. **Registration & Onboarding**
   - Role-based registration (Seeker or Professional)
   - Profile completion with role-specific wizards
   - For Seekers: Resume upload, goal setting
   - For Professionals: LinkedIn integration, availability setup, rate setting

2. **Discovery & Matching**
   - AI-powered recommendations based on resume/profile data
   - Transparent matching with clear reasons (e.g., "Matches your interest in AI")
   - Browse professionals with filtering by industry/skills

3. **Booking Process**
   - Timezone-aware scheduling with buffer times
   - Stripe payment integration
   - Automatic Zoom link generation post-payment
   - Calendar invites with ICS files

### Security Requirements
- JWT-based authentication with refresh tokens
- Role-based access control for routes
- Rate limiting for sensitive endpoints
- Secure storage of resumes and profiles
- PCI compliance for payment processing

### User Interface Requirements
- Separate dashboards for seekers and professionals
- Clean, responsive design with mobile-first approach
- Accessible interface following WCAG guidelines
- Visual feedback for all user actions
- Clear status indicators for bookings and payments

---

## System Architecture and Technical Stack
Taken from `handshake-architecture.mdc`

```
CLIENT (React SPA) <--HTTP/REST--> SERVER (Express.js API) <--> MongoDB
```

### Technical Stack

#### Frontend
- **Framework**: React.js (functional components)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router with protected routes
- **HTTP Client**: Axios for API calls
- **Component Organization**: Uses PascalCase component files with clear separation of concerns

#### Backend
- **Framework**: Express.js on Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (access and refresh tokens)
- **API Structure**: RESTful design with modular controllers and routes
- **File Storage**: AWS S3/Firebase for resumes
- **TypeScript**: New backend code should use TypeScript

#### Third-Party Integrations
- **Payments**: Stripe API with webhook validation
- **Meetings**: Zoom API for meeting link generation
- **Emails**: Nodemailer (optional) for notifications

### Security Architecture
- **Authentication**: JWT-based with middleware protection
- **Rate Limiting**:
  ```javascript
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
  app.use('/api/auth/', limiter);
  ```
- **Data Validation**: Zod for input validation
- **Environment Variables**: `.env` for secrets management

---

## Development Guidelines
Taken from `project-rules.mdc` (as referenced in `handshake-index.mdc`) - *Content for project-rules was provided in the initial prompt and is used here.*

### Project Rules
1. **Frontend**:
   - Use functional React components with Tailwind classes.
   - Use PascalCase for component filenames (e.g., `BookingCard.tsx`).

2. **Backend**:
   - Organize routes into `server/src/routes/` with clear responsibility separation.
   - Use TypeScript for new code (`.ts` extension).
   - Use `async/await` for MongoDB operations (no callbacks).

3. **Security**:
   - Never expose JWT secrets or Stripe keys – use `.env`.
   - Validate API inputs with Zod (e.g., email/password checks).

4. **Naming**:
   - Database collections: `camelCase` (e.g., `users`, `professionals`).
   - React hooks: `useBookingForm`, `useAuth`.
   - Components: PascalCase (e.g., `ProfileCard`, `BookingForm`).

5. **Documentation**:
   - Update `notepad.md` with reusable code snippets.
   - Keep DATABASE_SCHEMA.md in sync with model changes.
   - Update all routes created and used in the API_ROUTES.md file

---

## Detailed Development Standards
Taken from `handshake-development-guidelines.mdc`

- Use functional React components with Tailwind CSS classes
- Use PascalCase for component filenames (e.g., `BookingCard.tsx`)
- Keep components small and focused on a single responsibility
- Use React hooks for state management and side effects
- Follow naming conventions:
  - React hooks: `useBookingForm`, `useAuth`
  - Components: PascalCase (e.g., `ProfileCard`, `BookingForm`)

### Backend Standards
- Organize routes into `server/src/routes/` with clear responsibility separation
- Use TypeScript for new code (`.ts` extension)
- Use `async/await` for MongoDB operations (no callbacks)
- Follow RESTful API design principles
- Implement proper error handling with standardized response formats

### Database Standards
- Database collections: `camelCase` (e.g., `users`, `professionals`)
- Use MongoDB schema validation where possible
- Keep embedded documents reasonably sized
- Use transactions for operations spanning multiple collections
- Use projection (`select()`) to retrieve only needed fields

### Security Best Practices
- Never expose JWT secrets or Stripe keys – use `.env` files
- Validate API inputs with Zod (e.g., email/password checks)
- Implement rate limiting on authentication endpoints
- Sanitize user inputs to prevent injection attacks
- Use HTTPS for all production communications

### Documentation Requirements
- Update `notepad.md` with reusable code snippets
- Keep `DATABASE_SCHEMA.md` in sync with model changes
- Update all routes created and used in the `API_ROUTES.md` file
- Document authentication flows and token management

### Development Workflow
- Create feature branches from `main` for new features
- Write tests for critical functionality
- Use descriptive commit messages explaining the changes
- Review code for security and performance issues before merging
- Maintain backward compatibility with existing API endpoints

---

## Codebase Navigation and Key User Flows
Taken from `handshake-navigation-guide.mdc`

### Client-Side Structure
- **Entry Points**:
  - Main React application entry
  - Main component with routing

- **Frontend Organization**:
  - UI components
  - Page components
  - Context providers
  - API services
  - Utility functions
  - Custom React hooks

### Server-Side Structure
- **Core Directories**:
  - Server-side code
  - API routes
  - Business logic
  - MongoDB models
  - Express middleware

### Authentication Flow

#### Authentication Services
- Authentication API calls
- Auth state management

#### Authentication Components
- Login form
- Professional registration
- Seeker registration

#### Protected Routes
- Routes use `checkDirectAuth()` for protection

### Database Structure

#### Data Models
- User authentication and data
- Professional profiles
- Meeting sessions

#### Database Operations
- User registration creates basic user with userType (professional/seeker)
- Professional profiles are linked to user accounts via userId field
- CoffeeChats track meetings between seekers and professionals

### Key User Flows

#### Registration and Login
1. User registers via `/register/professional` or `/register/seeker`
2. Registration completes with token storage
3. User is redirected to Dashboard

#### Professional Discovery
1. User navigates to `/professionals`
2. Filtered list of professionals is displayed
3. User can select a professional for booking

#### Session Booking
1. User selects available time slot
2. Payment is processed via Stripe
3. Zoom meeting is created
4. Both users receive notifications

---

## UI/UX Design Guidelines
Taken from `handshake-ux-design.mdc`

### Visual Design System
- **Color Palette**:
  - Primary: Blue-600 (#2563EB) - For primary actions and CTAs
  - Secondary: Indigo-600 (#4F46E5) - For secondary elements
  - Success: Emerald-600 (#059669) - For confirmations and success states
  - Error: Red-600 (#DC2626) - For errors and warnings
  - Background: Gray-50 (#F8FAFC) - For page backgrounds
  - Dark Mode Background: Slate-900 (#0F172A)

- **Typography**:
  - Primary Font: "Inter", sans-serif
  - Headings: Font weight 600
  - Body: Font weight 400
  - Clear visual hierarchy with consistent spacing

- **Components**:
  - Rounded corners (8px border radius)
  - Consistent button styles with no text transform
  - Cards with 12px border radius
  - Modal dialogs with clear headers and action buttons

### User Interface Elements
- **Navigation**:
  - Clear, minimal navbar for desktop
  - Bottom navigation for mobile
  - Sidebar for dashboard views

- **Forms**:
  - Input validation with immediate feedback
  - Clear error messages
  - Logical tab order
  - Autocomplete where appropriate

- **Feedback**:
  - Toast notifications for actions
  - Loading states for all async operations
  - Empty states with helpful guidance
  - Confirmation dialogs for destructive actions

### Role-Specific UI
- **Seeker Dashboard**:
  - Recommended professionals
  - Upcoming sessions
  - Profile completion prompts
  - Resume upload section

- **Professional Dashboard**:
  - Booking requests
  - Earnings overview
  - Availability management
  - Profile visibility settings

### Accessibility Guidelines
- Maintain WCAG 2.1 AA compliance
- Color contrast ratios of at least 4.5:1
- Keyboard navigability for all interactions
- Screen reader compatibility
- Focus indicators for interactive elements

### Mobile Responsiveness
- Mobile-first design approach
- Touch targets minimum 44×44 pixels
- Simplified layouts for small screens
- Collapsible sections for complex content

### Security UI Considerations
- Rate limiting implemented for sensitive endpoints:
  ```javascript
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
  app.use('/api/auth/', limiter);
  ```
- Clear visual cues for secure vs. insecure content
- Privacy settings exposed in user interfaces
- Confirmation steps for sensitive actions

---

## Chat Functionality
Taken from `handshake-chat-functionality.mdc`

### 🧭 Feature Purpose
Enable seamless, real-time, persistent chat between Seekers and Professionals once a connection is mutually accepted. Chat aims to replicate a clean, professional experience similar to LinkedIn's messaging, with a focus on usability, moderation, and reliability.

---

### 🔄 Feature Flow

1. **Connection-Based Access**:
   - Chat is unlocked only after a Professional accepts a Seeker's invitation.
   - A chat thread is automatically initialized and stored in the system.

2. **Chat Interface**:
   - Available both as a standalone route (`/messages`) and a floating panel on the bottom-right corner of any page (LinkedIn-style).
   - In-app notifications for new messages appear in both interfaces.

---

### 📦 Functional Requirements

- Real-time messaging between connected users.
- Persistent message history (no expiration).
- Support for sending PDF attachments.
- Reply to specific messages (threaded reply style).
- In-app notification system for new messages.
- Chat moderation system (report/block).
- Rate limiting to prevent spam.
- Continuous conversation thread (no session-based separation).

---

### 🧱 System Design

- **Service-Based**: Chat logic isolated as a service (e.g., `chat.service.js`) decoupled from the rest of the business logic.
- **Socket Layer**: Abstracted using a centralized event bus with `Socket.IO`.
- **Modular Controllers**: Split by feature — message, thread, moderation.

---

### 🏗️ Architecture Pattern

- **Client-Server + Real-Time Socket Layer**
  - RESTful APIs for fetching chat threads, metadata.
  - Socket.IO for real-time messaging.
- **Event-driven Micro-Modules**: For extensibility and testability.

---

### 🧠 State Management

- **Client-side**: React Context or Zustand to manage open chats, message history, unread counters, etc.
- **Server-side**: Stateless API + stateful socket channels.

---

### 🔁 Data Flow

1. Seeker sends invite ➝ Professional accepts ➝ Backend creates a `Thread` document.
2. Both users can now:
   - Emit messages via socket.
   - Receive real-time updates on the other end.
   - Fetch previous chat history via REST API.
3. Notifications emitted via socket + stored in Notification DB.

---

### 🧰 Technical Stack

- **Frontend**: React.js + Tailwind CSS + Zustand
- **Backend**: Node.js (Express)
- **Database**: MongoDB + Mongoose
- **Real-Time**: Socket.IO
- **File Storage**: Cloud storage (e.g., AWS S3 or Cloudinary) for PDF uploads
- **Notifications**: Mongo-backed, possibly Redis-pubsub if scaling
- **Encryption**: NaCl or AES for E2E encryption layer (future milestone)

---

### 🔐 Authentication Process

- JWT-based auth headers required for both HTTP and WebSocket handshake.
- Token verified upon each socket connection.

---

### 🌐 Route Design

#### HTTP Endpoints
- `GET /chat/threads`: List all chat threads for current user
- `GET /chat/threads/:id`: Get full message history for a thread
- `POST /chat/message`: Send a message (fallback for offline)
- `POST /chat/report`: Report a message/user
- `POST /chat/block`: Block a user

#### Socket Events
- `chat:join` – Authenticate and join rooms
- `chat:send` – Emit message
- `chat:receive` – Listen for new messages
- `chat:typing` – Optional typing event
- `chat:notification` – Notify on new message

---

### 🗃️ Database Design ERD

#### User
- _id
- name
- role (Seeker/Professional)
- blockedUsers: [UserID]

#### Thread
- _id
- userA: UserID
- userB: UserID
- messages: [MessageID]
- createdAt

#### Message
- _id
- threadId: ThreadID
- sender: UserID
- type: "text" | "pdf"
- content: String
- timestamp: Date
- replyTo: MessageID (optional)
- status: "sent" | "received"

#### Notification
- _id
- userId
- type: "chat"
- messagePreview
- threadId
- createdAt
- read: Boolean

#### Report
- _id
- reportedBy: UserID
- targetUser: UserID
- messageId: MessageID (optional)
- reason: String
- status: "open" | "resolved"

---

### 🛡️ Moderation & Rate Limiting

- Middleware checks for message frequency (e.g., max 10 messages per minute).
- Manual report interface for admins to view flagged content.
- Users can block other users — blocks both messaging and notifications. 