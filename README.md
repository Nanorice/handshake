# Handshake

A professional networking platform connecting job seekers with professionals.

## Overview

Handshake is a web application that allows users to:
- Create professional profiles
- Connect with industry professionals for coffee chats
- Schedule and manage meetings
- Message contacts
- Discover professionals in their field of interest

## Technical Stack

- **Frontend**: React with Material-UI
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Authentication**: JWT-based authentication

## Features

- User authentication (login/register)
- Dashboard with upcoming meetings and activity summary
- Profile management
- Professional discovery
- Messaging system
- Meeting scheduling

## Getting Started

### Prerequisites

- Node.js
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/handshake.git
cd handshake
```

2. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Start the development servers
```bash
# Start the backend server
cd server
npm start

# Start the frontend development server
cd ../client
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `/client` - React frontend
- `/server` - Node.js backend

## Documentation

All project documentation is now centralized in the `project_documentation` folder:

- **Product Requirements**: [project_documentation/handshake-product-requirements.md](./project_documentation/handshake-product-requirements.md)
- **UI/UX Design**: [project_documentation/handshake-software-specifications.md](./project_documentation/handshake-software-specifications.md)
- **Technical Architecture**: [project_documentation/handshake-ux-design.md](./project_documentation/handshake-ux-design.md)
- **API Routes**: [project_documentation/API_ROUTES.md](./project_documentation/API_ROUTES.md)
- **Database Schema**: [project_documentation/DATABASE_SCHEMA.md](./project_documentation/DATABASE_SCHEMA.md)

For development conventions, please refer to:
- [project-rules.md](./project-rules.md) - Coding standards and conventions
- [folder-structure.md](./folder-structure.md) - Project folder organization
- [design-system.md](./design-system.md) - UI component design system

## License

This project is licensed under the MIT License.

## Database Configuration

The application uses MongoDB as its database. Important details:

- **Database Name**: `test`
- **Connection String**: `mongodb://localhost:27017/test`
- **Configuration File**: See `server/DATABASE_CONFIG.md` for more details

If you encounter any issues with database connectivity, please ensure:

1. MongoDB is running locally on port 27017
2. The `.env` file in the server directory has the correct MONGODB_URI value
3. All collections are in the `test` database 