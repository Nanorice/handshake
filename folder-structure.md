# Handshake Project - Folder Structure

**Version**: 2.0 (Post-UI/UX Overhaul)  
**Last Updated**: December 2024

## 📁 Root Directory Structure

```
handshake/
├── 📂 client/                    # React frontend application
├── 📂 server/                    # Node.js backend application
├── 📂 project_documentation/     # Comprehensive technical docs
├── 📂 docs/                      # Additional documentation
├── 📂 node_modules/              # Root dependencies
├── 📄 README.md                  # Main project documentation
├── 📄 PROJECT_PROGRESS.md        # Current status and roadmap
├── 📄 notepad.md                 # Development notes and code snippets
├── 📄 folder-structure.md        # This file - project organization
├── 📄 design-system.md           # UI design system guidelines
├── 📄 package.json               # Root package configuration
├── 📄 .gitignore                 # Git ignore patterns
└── 📄 PRD.md                     # Product Requirements Document
```

## 🖥️ Frontend Structure (`client/`)

```
client/
├── 📂 public/                    # Static assets and HTML template
│   ├── index.html               # Main HTML template
│   ├── favicon.ico              # App icon
│   └── manifest.json            # PWA manifest
├── 📂 src/                      # React source code
│   ├── 📂 components/           # Reusable UI components
│   │   ├── 📂 Auth/            # Authentication components
│   │   │   ├── LoginForm.js    # Custom login form
│   │   │   └── RegisterForm.js # Custom registration form
│   │   ├── 📂 Messaging/       # Chat and messaging components
│   │   │   ├── MessageComposer.js
│   │   │   ├── MessageList.js
│   │   │   └── ChatWindow.js
│   │   ├── 📂 UI/              # Common UI elements
│   │   │   ├── Button.js
│   │   │   ├── Modal.js
│   │   │   └── LoadingSpinner.js
│   │   ├── 📂 Professional/    # Professional-specific components
│   │   ├── 📂 Profile/         # Profile management components
│   │   ├── 📂 Invitation/      # Coffee chat invitation components
│   │   ├── 📂 CoffeeChat/      # Meeting management components
│   │   └── Navbar.js           # Main navigation component
│   ├── 📂 pages/               # Page components (routes)
│   │   ├── Home.js             # Landing page with theme system
│   │   ├── ProfessionalLanding.js # Professional-focused landing
│   │   ├── Dashboard.js        # Main dashboard
│   │   ├── RegisterSeeker.js   # Seeker registration
│   │   ├── RegisterProfessional.js # Professional registration
│   │   ├── Profile.js          # User profile page
│   │   ├── Messaging.js        # Messaging interface
│   │   ├── ProfessionalDiscovery.js # Professional search
│   │   ├── Matches.js          # Matching system
│   │   ├── CoffeeChats.js      # Meeting management
│   │   └── AdminDashboard.js   # Admin interface
│   ├── 📂 contexts/            # React Context providers
│   │   └── ThemeContext.js     # Theme system (light/dark mode)
│   ├── 📂 services/            # API services and utilities
│   │   ├── authService.js      # Authentication API calls
│   │   ├── userService.js      # User management APIs
│   │   ├── messageService.js   # Messaging APIs
│   │   └── socketService.js    # Socket.IO client service
│   ├── 📂 hooks/               # Custom React hooks
│   │   ├── useAuth.js          # Authentication hook
│   │   ├── useSocket.js        # Socket connection hook
│   │   └── useTheme.js         # Theme management hook
│   ├── 📂 utils/               # Helper functions and utilities
│   │   ├── authUtils.js        # Authentication utilities
│   │   ├── dateUtils.js        # Date formatting utilities
│   │   └── validationUtils.js  # Form validation helpers
│   ├── App.js                  # Main App component with routing
│   ├── index.js                # React app entry point
│   ├── index.css               # Global styles
│   └── mockData.js             # Development mock data
├── 📄 package.json             # Frontend dependencies
├── 📄 craco.config.js          # Create React App configuration
├── 📄 tailwind.config.js       # Tailwind CSS configuration
└── 📄 tsconfig.json            # TypeScript configuration
```

## 🖧 Backend Structure (`server/`)

```
server/
├── 📂 src/                      # Server source code
│   ├── 📂 routes/              # API route definitions
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User management routes
│   │   ├── professionals.js    # Professional-specific routes
│   │   ├── messages.js         # Messaging routes
│   │   ├── invitations.js      # Coffee chat invitation routes
│   │   └── discovery.js        # Professional discovery routes
│   ├── 📂 controllers/         # Route handlers and business logic
│   │   ├── authController.js   # Authentication logic
│   │   ├── userController.js   # User management logic
│   │   ├── messageController.js # Messaging logic
│   │   └── invitationController.js # Invitation logic
│   ├── 📂 models/              # MongoDB data models
│   │   ├── User.js             # User schema
│   │   ├── Professional.js     # Professional schema
│   │   ├── Message.js          # Message schema
│   │   ├── Invitation.js       # Invitation schema
│   │   └── Match.js            # Matching schema
│   ├── 📂 middleware/          # Express middleware
│   │   ├── auth.js             # JWT authentication middleware
│   │   ├── cors.js             # CORS configuration
│   │   ├── validation.js       # Input validation middleware
│   │   └── errorHandler.js     # Error handling middleware
│   ├── 📂 services/            # Business services
│   │   ├── authService.js      # Authentication business logic
│   │   ├── emailService.js     # Email notification service
│   │   ├── matchingService.js  # Professional matching logic
│   │   └── socketService.js    # Socket.IO server logic
│   ├── 📂 validations/         # Input validation schemas
│   │   ├── authValidation.js   # Authentication validation
│   │   ├── userValidation.js   # User data validation
│   │   └── messageValidation.js # Message validation
│   ├── 📂 scripts/             # Utility scripts
│   │   ├── setupDatabase.js    # Database initialization
│   │   └── seedData.js         # Development data seeding
│   ├── 📂 tests/               # Backend tests
│   │   ├── auth.test.js        # Authentication tests
│   │   ├── users.test.js       # User management tests
│   │   └── messages.test.js    # Messaging tests
│   ├── 📂 utils/               # Server utilities
│   │   ├── database.js         # Database connection utilities
│   │   ├── jwt.js              # JWT token utilities
│   │   └── helpers.js          # General helper functions
│   ├── server.js               # Main server file
│   ├── app.js                  # Express app configuration
│   └── index.js                # Server entry point
├── 📄 package.json             # Backend dependencies
├── 📄 .env.example             # Environment variables template
└── 📄 nodemon.json             # Nodemon configuration
```

## 📚 Documentation Structure

### **Primary Documentation (`project_documentation/`)**
```
project_documentation/
├── 📄 README.md                # Documentation overview
├── 📄 handshake_PRD.md         # Complete Product Requirements Document
├── 📄 API_ROUTES.md            # API endpoint documentation
├── 📄 DATABASE_SCHEMA.md       # MongoDB schema specifications
├── 📄 SOCKET_EVENTS.md         # Real-time communication events
└── 📄 INVITATION_FLOW.md       # Coffee chat invitation process
```

### **Additional Documentation (`docs/`)**
```
docs/
└── 📄 MESSAGING_CLEANUP.md     # Chat system maintenance guide
```

### **Root Level Documentation**
- `📄 README.md` - Main project overview and setup guide
- `📄 PROJECT_PROGRESS.md` - Current status, progress tracking, and roadmap
- `📄 notepad.md` - Development notes and reusable code snippets
- `📄 folder-structure.md` - This file, project organization guide
- `📄 design-system.md` - UI design system and component guidelines

## 🎨 Key Design Patterns

### **Component Organization**
- **Atomic Design**: Components organized by complexity (UI → Components → Pages)
- **Feature-based**: Related functionality grouped together
- **Separation of Concerns**: Business logic separated from presentation

### **File Naming Conventions**
- **Components**: PascalCase (e.g., `LoginForm.js`, `MessageComposer.js`)
- **Pages**: PascalCase (e.g., `Dashboard.js`, `ProfessionalDiscovery.js`)
- **Services**: camelCase (e.g., `authService.js`, `socketService.js`)
- **Utilities**: camelCase (e.g., `authUtils.js`, `dateUtils.js`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.js`, `useTheme.js`)

### **Import Organization**
```javascript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 2. Internal services
import { authService } from '../services/authService';

// 3. Components
import { LoginForm } from '../components/Auth/LoginForm';

// 4. Utilities and helpers
import { formatDate } from '../utils/dateUtils';
```

## 🔧 Configuration Files

### **Frontend Configuration**
- `package.json` - Dependencies and scripts
- `craco.config.js` - Create React App overrides
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

### **Backend Configuration**
- `package.json` - Dependencies and scripts
- `.env` - Environment variables (not committed)
- `nodemon.json` - Development server configuration

### **Development Tools**
- `.gitignore` - Git ignore patterns
- `README.md` - Setup and usage instructions
- `PROJECT_PROGRESS.md` - Development tracking

## 🚀 Recent Changes (Version 2.0)

### **New Additions**
- ✅ `ThemeContext.js` - Complete theme system implementation
- ✅ `ProfessionalLanding.js` - Dedicated professional landing page
- ✅ Enhanced responsive design across all components
- ✅ Custom authentication forms replacing Material-UI
- ✅ Improved project documentation structure

### **Structural Improvements**
- ✅ Consolidated theme management in single context
- ✅ Responsive navigation with intelligent mobile menu
- ✅ Unified design language across all components
- ✅ Better separation of concerns in component organization

## 📋 Maintenance Guidelines

### **When Adding New Features**
1. **Frontend**: Add components in appropriate subdirectories
2. **Backend**: Follow RESTful route organization
3. **Documentation**: Update relevant docs immediately
4. **Tests**: Add corresponding test files

### **File Organization Rules**
1. **Single Responsibility**: Each file should have one primary purpose
2. **Logical Grouping**: Related functionality stays together
3. **Clear Naming**: File names should describe their contents
4. **Consistent Structure**: Follow established patterns

### **Documentation Updates**
- Update this file when adding new directories or major restructuring
- Keep component documentation current with code changes
- Maintain API documentation for all route changes
- Update PROJECT_PROGRESS.md with new features

---

*This folder structure is designed to scale with the project while maintaining clear organization and separation of concerns.*