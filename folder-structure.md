# Project Folder Structure

```
Handshake/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/ # Page components for routing
│   │   ├── contexts/ # React context providers (Auth, etc.)
│   │   ├── services/ # API service functions
│   │   ├── App.js # Main application component
│   │   └── index.js # Application entry point
│   ├── package.json
│   └── package-lock.json
├── server/
│   ├── src/
│   │   ├── models/ # Mongoose data models
│   │   ├── routes/ # API route definitions
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/ # Express middleware
│   │   ├── utils/ # Utility functions
│   │   ├── config/ # Configuration files
│   │   ├── services/ # External service integrations
│   │   └── index.ts # Main server file
│   ├── DATABASE_SCHEMA.md # Database schema documentation
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── tests/ # Server-side tests
├── PRD.md # Product Requirements Document
├── README.md # Project overview and setup instructions
├── folder-structure.md # This file - structure documentation
├── notepad.md # Code snippets and implementation notes
├── project-rules.md # Development conventions and rules
└── design-system.md # UI design system guidelines
```

Note: The actual structure may evolve during development, but this document will be updated to reflect current state.