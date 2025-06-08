# Production Environment Configuration

## Overview
This document outlines the complete production deployment setup for the Handshake professional networking platform with file upload capabilities.

## Environment Variables

### Required Environment Variables

#### Backend (.env file for server)
```bash
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/handshake?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_here_minimum_32_characters
REFRESH_TOKEN_SECRET=your_super_secure_refresh_token_secret_here_minimum_32_characters

# Server Configuration
NODE_ENV=production
PORT=5000

# Frontend URL (for CORS)
CLIENT_URL=https://your-app-name.pages.dev

# File Upload Configuration (GridFS - no additional config needed)
# GridFS uses the same MongoDB connection for file storage

# Future Integrations (Optional - can be added later)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
RESEND_API_KEY=re_your_resend_api_key
UPSTASH_REDIS_URL=redis://your_upstash_redis_url
SENTRY_DSN=https://your_sentry_dsn
```

#### Frontend (.env file for client)
```bash
# API Configuration
REACT_APP_API_URL=https://your-backend-app.onrender.com

# Future Integrations (Optional)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
REACT_APP_GA_TRACKING_ID=G-XXXXXXXXXX
```

## Deployment Architecture

### 🎯 $0 Cost Production Setup

#### Frontend: Cloudflare Pages
- **Cost**: Free (unlimited bandwidth, global CDN)
- **Features**: 
  - Global CDN with 200+ locations
  - Automatic HTTPS
  - Custom domains
  - Automatic deployments from Git
  - Build optimization

#### Backend: Render.com
- **Cost**: Free tier (750 hours/month)
- **Features**:
  - Automatic deployments from Git
  - HTTPS included
  - Environment variable management
  - Automatic restarts
  - Build logs and monitoring

#### Database: MongoDB Atlas
- **Cost**: Free tier (512MB storage)
- **Features**:
  - Managed MongoDB hosting
  - Automatic backups
  - Security features
  - Global clusters
  - GridFS for file storage

#### File Storage: GridFS (MongoDB)
- **Cost**: Free (uses MongoDB Atlas storage)
- **Features**:
  - Integrated with MongoDB
  - Automatic chunking for large files
  - Metadata storage
  - Version control
  - No additional service needed

## File Upload System Details

### Supported File Types
- **Profile Photos**: JPG, PNG, GIF, WebP (max 5MB)
- **CVs/Resumes**: PDF, Word (.doc, .docx) (max 10MB)

### Storage Architecture
- Files stored in MongoDB GridFS
- Automatic chunking for large files
- Metadata tracking (upload date, file type, user ID)
- Secure access control (users can only access their own files)

### API Endpoints
```
POST /api/files/upload/profile-photo  # Upload profile photo
POST /api/files/upload/cv             # Upload CV/resume
GET  /api/files/file/:fileId          # Download file by ID
GET  /api/files/profile-photo/:userId # Get user's profile photo
GET  /api/files/cv/:userId            # Get user's CV
GET  /api/files/info/:userId          # Get user's file information
DELETE /api/files/file/:fileId        # Delete file
```

## Deployment Steps

### Phase 1: Database Setup (✅ COMPLETED)
- [x] MongoDB Atlas cluster created
- [x] Database consolidated and cleaned
- [x] Connection strings standardized
- [x] GridFS configured for file storage

### Phase 2: File Upload System (✅ COMPLETED)
- [x] GridFS configuration implemented
- [x] File upload routes created
- [x] User model updated with file references
- [x] Frontend file upload components created
- [x] Profile settings page with file management

### Phase 3: Backend Deployment (🚀 READY)

#### 3.1 Create Render.com Deployment Configuration
```yaml
# render.yaml
services:
  - type: web
    name: handshake-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

#### 3.2 Deploy to Render.com
1. Connect GitHub repository to Render
2. Configure build and start commands
3. Set environment variables
4. Deploy and verify

### Phase 4: Frontend Deployment (🚀 READY)

#### 4.1 Create Cloudflare Pages Configuration
```json
{
  "build": {
    "command": "npm run build",
    "output": "build"
  },
  "env": {
    "NODE_VERSION": "18"
  }
}
```

#### 4.2 Deploy to Cloudflare Pages
1. Connect GitHub repository to Cloudflare Pages
2. Configure build settings
3. Set environment variables
4. Deploy and verify

## Security Considerations

### Authentication
- JWT tokens with secure secrets
- Token expiration and refresh mechanism
- Protected file access (users can only access their own files)

### File Upload Security
- File type validation (MIME type checking)
- File size limits enforced
- Malicious file detection
- Secure file storage in GridFS

### Database Security
- MongoDB Atlas security features enabled
- IP whitelisting configured
- Encrypted connections (TLS/SSL)
- Regular security updates

## Cost Breakdown (Monthly)

### Current Setup ($0/month)
- Frontend (Cloudflare Pages): $0
- Backend (Render.com): $0 (750 hours free)
- Database (MongoDB Atlas): $0 (512MB free)
- File Storage (GridFS): $0 (included in MongoDB)
- Monitoring (Sentry): $0 (5K errors/month free)
- Analytics (Google Analytics): $0

### Scaling Options
- MongoDB Atlas M2: $9/month (2GB storage)
- Render.com Starter: $7/month (always-on)
- Total for upgraded tiers: $16/month

This configuration provides a robust, production-ready platform with file upload capabilities at zero cost, with clear scaling paths as the application grows. 