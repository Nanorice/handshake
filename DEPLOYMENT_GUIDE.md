# 🚀 Handshake Production Deployment Guide

## Overview
Deploy your Handshake professional networking platform with file upload capabilities at $0 cost.

## ✅ What's Ready
- Database consolidated and cleaned (MongoDB Atlas)
- File upload system implemented (GridFS)
- Frontend and backend code production-ready

## 🎯 Architecture
- **Frontend**: Cloudflare Pages (Free)
- **Backend**: Render.com (Free tier)
- **Database**: MongoDB Atlas (Free tier)
- **File Storage**: GridFS in MongoDB (Free)

---

## Phase 1: Backend Deployment (Render.com)

### Step 1: Sign up and Connect Repository
1. Go to https://render.com and sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your handshake repository

### Step 2: Configure Service
- **Name**: `handshake-backend`
- **Region**: Oregon (US West)
- **Branch**: `main`
- **Runtime**: Node
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && npm start`

### Step 3: Set Environment Variables
```
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
REFRESH_TOKEN_SECRET=your_super_secure_refresh_token_secret_minimum_32_characters
CLIENT_URL=https://your-app-name.pages.dev
```

### Step 4: Deploy and Test
- Click "Create Web Service"
- Wait 5-10 minutes for deployment
- Test: `curl https://your-backend-url.onrender.com/test`

---

## Phase 2: Frontend Deployment (Cloudflare Pages)

### Step 1: Sign up and Connect Repository
1. Go to https://pages.cloudflare.com and sign up with GitHub
2. Click "Create a project"
3. Connect your handshake repository

### Step 2: Configure Build Settings
- **Project name**: `handshake-app`
- **Production branch**: `main`
- **Framework preset**: Create React App
- **Build command**: `cd client && npm install && npm run build`
- **Build output directory**: `client/build`

### Step 3: Set Environment Variables
```
NODE_VERSION=18
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

### Step 4: Deploy and Update CORS
- Click "Save and Deploy"
- Wait 3-5 minutes for deployment
- Update backend `CLIENT_URL` to your Cloudflare Pages URL
- Redeploy backend

---

## Phase 3: Testing Checklist

### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens issued properly

### File Upload System
- [ ] Profile photo upload works
- [ ] CV upload works
- [ ] File download works
- [ ] File deletion works
- [ ] File size/type validation works

### Real-time Features
- [ ] Socket.io connection established
- [ ] Messages send/receive in real-time
- [ ] Thread management works

---

## 🆘 Troubleshooting

### Backend Won't Start
- Check environment variables in Render dashboard
- Verify MongoDB connection string
- Review build logs

### Frontend Build Fails
- Check Node.js version (18+)
- Verify build command path
- Review build logs in Cloudflare

### CORS Errors
- Ensure CLIENT_URL matches frontend URL exactly
- Check both HTTP and HTTPS protocols
- Redeploy backend after URL changes

### File Upload Issues
- Check file size limits (5MB images, 10MB docs)
- Verify MIME type validation
- Review GridFS initialization logs

---

## 💰 Cost Summary

**Current Setup**: $0/month
- Render.com: Free (750 hours)
- Cloudflare Pages: Free (unlimited)
- MongoDB Atlas: Free (512MB)

**Scaling Options**: $16/month
- MongoDB Atlas M2: $9/month (2GB)
- Render.com Starter: $7/month (always-on)

---

## 🎉 You're Ready!

Your Handshake platform with file upload capabilities is ready for production deployment at zero cost! Follow the steps above and you'll have a live app in under an hour.

**Next Steps After Deployment**:
1. Test all features thoroughly
2. Set up monitoring (optional)
3. Add custom domain (optional)
4. Plan for scaling as you grow
