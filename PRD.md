# Coffee Chat Connector - Product Requirements Document

> **IMPORTANT**: This document is now deprecated. Please refer to the consolidated product documentation in the `/project_documentation` folder:
> - `handshake-product-requirements.md` - For product requirements
> - `handshake-software-specifications.md` - For UI/UX specifications
> - `handshake-ux-design.md` - For software architecture and technical requirements

## App Overview
A platform connecting **Professionals** (experienced workers) and **Seekers** (career-curious users) for paid virtual/offline coffee chats.

## User Roles
1. **Professionals**: Verify via LinkedIn (optional), set availability, and accept bookings.
2. **Seekers**: Upload resumes or specify interests (industry, company, seniority) to find professionals.

## User Flows
1. **Signup**:
   - Professionals: Link LinkedIn (optional), add job details.
   - Seekers: Upload resume or input interests (industry, company, seniority).
2. **Matching**:
   - System recommends Professionals to Seekers based on preferences.
3. **Booking**:
   - Seekers book slots from a Professional's calendar.
   - Payment processed via Stripe.
4. **Meeting**:
   - Auto-generate Zoom link for virtual meetings.

## Core Features
- **Auth**: JWT-based authentication.
- **Recommendations**: Algorithm for matching Seekers/Professionals.
- **Payments**: Stripe integration for secure transactions.
- **Calendar**: Time slot management for Professionals.
- **Zoom Integration**: Auto-generated meeting links.

## Tech Stack
- **Frontend**: React.js + Tailwind CSS
- **Backend**: Node.js/Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: JWT
- **Payments**: Stripe API
- **Meeting**: Zoom API

## Future Roadmap
- LinkedIn OAuth for Professionals.
- Review/rating system.
- ✅ **LinkedIn-Style Messaging System** - Comprehensive real-time messaging with group chats, file attachments, typing indicators, and professional-grade features (See MESSAGING_SYSTEM_REQUIREMENTS.md)

## Latest Updates
### Messaging System Requirements (Added)
- **Scope**: LinkedIn-level messaging with 1-on-1 and group conversations
- **Features**: Real-time delivery, file attachments, typing indicators, read receipts
- **Infrastructure**: Leveraging existing Socket.io, MongoDB, and React stack
- **Timeline**: 8-week phased implementation
- **Security**: End-to-end encryption and content moderation capabilities