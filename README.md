# Handshake

A modern professional networking platform connecting job seekers with industry professionals for meaningful career guidance and mentorship.

## 🌟 Overview

Handshake facilitates meaningful professional connections through a sleek, responsive web application that enables:
- Professional profile creation and discovery
- Coffee chat scheduling and management
- Real-time messaging system
- Mentor-mentee matching
- Career guidance and networking opportunities

**Current Version**: 2.0 (Post-UI/UX Overhaul)  
**Status**: Active Development - Core Features Complete

## ✨ Key Features

### 🎨 **Modern UI/UX (Recently Completed)**
- **Light/Dark Theme System**: Persistent theme preferences with smooth transitions
- **Fully Responsive Design**: Mobile-first approach with intelligent responsive navigation
- **Professional Landing Pages**: Dedicated pages for different user types
- **Consistent Design Language**: Unified styling across all components

### 🔐 **Authentication & Profiles**
- JWT-based secure authentication
- Role-based access (Job Seekers & Professionals)
- Comprehensive profile management
- Protected routes and user sessions

### 💬 **Real-time Communication**
- Socket.IO powered messaging system
- Direct messages between users
- Typing indicators and online status
- Message history and persistence

### 🤝 **Professional Networking**
- Discover professionals by industry and skills
- Send and manage coffee chat invitations
- Meeting scheduling system
- Professional matching recommendations

### 📱 **Responsive Experience**
- Mobile-optimized interface
- Adaptive navigation with smart mobile menus
- Cross-device compatibility
- Progressive enhancement

## 🚀 Technical Stack

### **Frontend**
- **Framework**: React.js (functional components with hooks)
- **Styling**: Custom CSS with Tailwind CSS integration
- **State Management**: React Context API with custom theme system
- **Routing**: React Router with protected routes
- **Real-time**: Socket.IO client
- **Build Tool**: Create React App with custom configurations

### **Backend**
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with secure middleware
- **Real-time**: Socket.IO server
- **API Design**: RESTful architecture with modular routes
- **Security**: Bcrypt password hashing, CORS protection

### **Development Tools**
- **Version Control**: Git with feature branch workflow
- **Package Management**: npm
- **Code Quality**: ESLint configuration
- **Development**: Hot reload and dev server setup

## 📁 Project Structure

```
handshake/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── Auth/       # Authentication components
│   │   │   ├── Messaging/  # Chat and messaging components
│   │   │   ├── UI/         # Common UI elements
│   │   │   └── ...
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React Context providers
│   │   ├── services/       # API services and utilities
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Helper functions
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend application
│   ├── src/
│   │   ├── routes/        # API route definitions
│   │   ├── controllers/   # Route handlers and business logic
│   │   ├── models/        # MongoDB data models
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business services
│   │   └── utils/         # Server utilities
│   └── package.json       # Backend dependencies
├── project_documentation/ # Comprehensive project docs
└── docs/                 # Additional documentation
```

## 🛠️ Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **MongoDB** (v4.4 or higher)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/handshake.git
   cd handshake
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/handshake
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   NODE_ENV=development
   ```

5. **Start MongoDB service**
   ```bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Windows
   net start MongoDB
   
   # On Linux
   sudo systemctl start mongod
   ```

6. **Start the development servers**
   
   **Backend server** (Terminal 1):
   ```bash
   cd server
   npm start
   # Server runs on http://localhost:5000
   ```
   
   **Frontend server** (Terminal 2):
   ```bash
   cd client
   npm start
   # Client runs on http://localhost:3001
   ```

7. **Access the application**
   - Open your browser and navigate to `http://localhost:3001`
   - The application will automatically connect to the backend API

### Development Commands

```bash
# Start backend in development mode
cd server && npm run dev

# Start frontend in development mode
cd client && npm start

# Run backend tests
cd server && npm test

# Build frontend for production
cd client && npm run build
```

## 📚 Documentation

Comprehensive documentation is available in the `project_documentation` folder:

### **Core Documentation**
- **[Product Requirements](./project_documentation/handshake_PRD.md)** - Complete product specification
- **[API Routes](./project_documentation/API_ROUTES.md)** - Backend API documentation
- **[Database Schema](./project_documentation/DATABASE_SCHEMA.md)** - Data model specifications
- **[Socket Events](./project_documentation/SOCKET_EVENTS.md)** - Real-time communication events

### **Development Guides**
- **[PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md)** - Current status and roadmap
- **[folder-structure.md](./folder-structure.md)** - Project organization guide
- **[notepad.md](./notepad.md)** - Code snippets and development notes

### **Business Logic**
- **[Invitation Flow](./project_documentation/INVITATION_FLOW.md)** - Meeting invitation process
- **[Messaging Cleanup](./docs/MESSAGING_CLEANUP.md)** - Chat system maintenance

## 🚀 Recent Updates (Version 2.0)

### **Major UI/UX Overhaul**
- Complete redesign with modern, responsive interface
- Light/dark theme system with persistent preferences
- Mobile-first responsive design with intelligent navigation
- Consistent design language across all components
- Professional landing page for targeted user acquisition

### **Enhanced User Experience**
- Improved authentication flow with custom-styled forms
- Fixed navigation links and user journey
- Responsive navbar with mobile menu optimization
- Theme-aware component styling throughout

## 🔮 Roadmap & Next Steps

### **Immediate Priorities**
- [ ] **Payment Integration**: Stripe API for professional session payments
- [ ] **Video Calls**: Zoom API integration for virtual meetings
- [ ] **Email System**: Automated notifications and communications
- [ ] **Security Enhancement**: Rate limiting and input validation

### **Future Enhancements**
- [ ] Advanced search and filtering capabilities
- [ ] LinkedIn integration for professional profiles
- [ ] Analytics dashboard for user insights
- [ ] Mobile PWA with offline functionality
- [ ] AI-powered matching algorithms

*For detailed roadmap, see [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md)*

## 🧪 Testing

### Current Testing Status
- ✅ Manual testing of core functionality
- ✅ Cross-browser compatibility verified
- ✅ Mobile responsiveness tested
- 🔄 Automated testing suite in development

### Testing Commands
```bash
# Run backend tests
cd server && npm test

# Run frontend tests
cd client && npm test

# Run all tests
npm run test:all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the established project structure
- Use functional React components with hooks
- Implement responsive design principles
- Write clear, descriptive commit messages
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛟 Support & Contact

For questions, issues, or contributions:
- Create an issue in the GitHub repository
- Check existing documentation in `project_documentation/`
- Review the [PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md) for current status

---

**Built with ❤️ for meaningful professional connections** 