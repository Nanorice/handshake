# Handshake Software Requirements Specification

## System Design
- A modular, full-stack web application built on a decoupled client-server model.
- Primary goal: streamline paid 1:1 meetings (coffee chats) between job seekers and professionals.
- Features include account management, professional matching, session scheduling, Stripe payments, and Zoom integration.

## Architecture Pattern
- **Backend:** RESTful API using Express.js
- **Frontend:** React.js SPA (Single Page Application)
- **Architecture:** Modular MVC on the backend; component-based design on the frontend.
- Uses middleware for authentication, rate limiting, and error handling.

## State Management
- **Frontend:** React Context API (or Redux, if scaling needed) for auth state, session data, and user profiles.
- **Backend:** Stateless JWT-based access control. Session info is persisted in MongoDB.

## Data Flow
1. User logs in/registers → JWT issued/stored.
2. Job Seeker uploads resume → backend processes and returns recommendations.
3. Seeker browses professionals → selects a time → session booked → Stripe charge initiated.
4. Upon success → Zoom link generated and stored.
5. Notifications dispatched via in-app or email.

## Technical Stack
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js with Express.js
- **Database:** MongoDB using Mongoose ODM
- **Authentication:** JWT (access and refresh tokens)
- **Payments:** Stripe API (session-based charges)
- **Meetings:** Zoom API for automatic link generation
- **Other Tools:** Multer for resume upload, Nodemailer (optional) for email notifications

## Authentication Process
- JWT issued at login with expiration
- Refresh token flow (if required)
- Middleware guards for protected routes
- Roles (Seeker, Professional) handled via claims in token

## Route Design
- **Public Routes**
  - `/login`
  - `/register`
  - `/explore`
- **Protected Routes (Seeker)**
  - `/dashboard`
  - `/resume-upload`
  - `/book/:professionalId`
  - `/sessions`
- **Protected Routes (Professional)**
  - `/dashboard`
  - `/availability`
  - `/sessions`
- **Shared**
  - `/profile`
  - `/logout`

## API Design
- **Auth**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
- **Users**
  - `GET /api/users/me`
  - `PUT /api/users/profile`
- **Professionals**
  - `GET /api/professionals`
  - `POST /api/professionals/availability`
- **Sessions**
  - `POST /api/sessions/book`
  - `GET /api/sessions/my`
- **Payments**
  - `POST /api/payments/create-session` (Stripe Checkout session)
- **Zoom**
  - `POST /api/zoom/create-meeting` (abstracted in booking flow)

## Database Design ERD
- **User**
  - `_id`, `email`, `passwordHash`, `role`, `name`, `bio`, `resumeUrl`, `linkedinUrl`
- **ProfessionalProfile**
  - `userId`, `industries`, `skills`, `availability`, `rate`
- **Session**
  - `_id`, `seekerId`, `professionalId`, `datetime`, `zoomLink`, `status`, `stripeSessionId`
- **Payment**
  - `sessionId`, `stripePaymentId`, `amount`, `status`
