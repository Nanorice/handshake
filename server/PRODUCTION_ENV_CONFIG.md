# 🚀 PRODUCTION ENVIRONMENT CONFIGURATION

## Environment Variables Setup

Create a `.env` file in the `server/` directory with these variables:

```env
# =================================
# PRODUCTION ENVIRONMENT VARIABLES
# =================================

# MongoDB Database (REQUIRED)
MONGODB_URI=mongodb+srv://loveohara:l07WI2DtfaZYyLrm@cluster0.fgmlgyv.mongodb.net/handshake?retryWrites=true&w=majority&appName=Cluster0

# JWT Authentication (REQUIRED - CHANGE THESE!)
JWT_SECRET=your_super_secure_jwt_secret_for_production_min_32_chars
REFRESH_TOKEN_SECRET=your_super_secure_refresh_secret_for_production_min_32_chars

# Server Configuration (REQUIRED)
NODE_ENV=production
PORT=5000

# CORS and Client Configuration (REQUIRED)
CLIENT_URL=https://your-app.pages.dev

# =================================
# DEPLOYMENT PLATFORM VARIABLES
# =================================

# For Render.com deployment:
# These will be set in Render dashboard
RENDER_SERVICE_NAME=handshake-backend

# For Cloudflare Pages (Frontend):
# Set in Cloudflare Pages dashboard
REACT_APP_API_URL=https://your-backend.render.com

# =================================
# FUTURE INTEGRATIONS (OPTIONAL)
# =================================

# Stripe Payment Processing (when ready)
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service with Resend (when ready)
# RESEND_API_KEY=re_...
# EMAIL_FROM_ADDRESS=noreply@yourapp.com

# Redis Caching with Upstash (when ready)
# UPSTASH_REDIS_REST_URL=https://...
# UPSTASH_REDIS_REST_TOKEN=...

# Sentry Error Monitoring (when ready)
# SENTRY_DSN=https://...
```

## 🔑 Security Notes

1. **CHANGE THE JWT SECRETS** - Generate random 32+ character strings
2. **Never commit .env files** - They're already in .gitignore
3. **Use environment-specific values** for each deployment

## 📋 Quick Setup Commands

```bash
# Generate secure JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy this template to .env
cp PRODUCTION_ENV_CONFIG.md .env
# Then edit .env with your actual values
```

## 🌍 Deployment Environment Setup

### Render.com (Backend)
Add these environment variables in Render dashboard:
- `MONGODB_URI`
- `JWT_SECRET` 
- `REFRESH_TOKEN_SECRET`
- `NODE_ENV=production`
- `CLIENT_URL=https://your-app.pages.dev`

### Cloudflare Pages (Frontend)
Add these environment variables in Cloudflare dashboard:
- `REACT_APP_API_URL=https://your-backend.render.com`

## ✅ Production Readiness Checklist

- [ ] MongoDB Atlas configured with production cluster
- [ ] JWT secrets generated and secure (32+ chars)
- [ ] CLIENT_URL matches actual frontend domain
- [ ] All sensitive data in environment variables
- [ ] No hardcoded secrets in code
- [ ] Database connections use production URI
- [ ] CORS configured for production domains 