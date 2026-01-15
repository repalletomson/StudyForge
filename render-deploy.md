# StudyForge Render Deployment Guide

This guide explains how to deploy StudyForge on Render using Docker images from Docker Hub.

## Prerequisites

1. Docker Hub account
2. Render account
3. MongoDB Atlas database (already configured)

## Step 1: Build and Push Docker Images

### Option A: Using the build script (Recommended)

1. **Update Docker Hub username** in the build script:
   ```bash
   # Edit build-and-push.sh (Linux/Mac) or build-and-push.bat (Windows)
   DOCKER_USERNAME="your-actual-dockerhub-username"
   ```

2. **Run the build script**:
   ```bash
   # Linux/Mac
   chmod +x build-and-push.sh
   ./build-and-push.sh
   
   # Windows
   build-and-push.bat
   ```

### Option B: Manual build and push

```bash
# Login to Docker Hub
docker login

# Build and push backend
docker build -t tomson112/studyforge-backend:latest ./backend
docker push tomson112/studyforge-backend:latest

# Build and push frontend
docker build -t tomson112/studyforge-frontend:latest ./frontend
docker push tomson112/studyforge-frontend:latest

# Build and push worker
docker build -t tomson112/studyforge-worker:latest ./worker
docker push tomson112/studyforge-worker:latest
```

## Step 2: Deploy on Render

### Backend API Service

1. **Create New Web Service** on Render
2. **Configuration**:
   - **Name**: `studyforge-backend`
   - **Runtime**: `Docker`
   - **Docker Image URL**: `tomson112/studyforge-backend:latest`
   - **Port**: `3001`

3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-super-secure-jwt-secret-key
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

4. **Health Check Path**: `/health`

### Frontend Web Service

1. **Create New Web Service** on Render
2. **Configuration**:
   - **Name**: `studyforge-frontend`
   - **Runtime**: `Docker`
   - **Docker Image URL**: `tomson112/studyforge-frontend:latest`
   - **Port**: `5173`

3. **Environment Variables**:
   ```
   NODE_ENV=production
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

### Background Worker Service

1. **Create New Background Worker** on Render
2. **Configuration**:
   - **Name**: `studyforge-worker`
   - **Runtime**: `Docker`
   - **Docker Image URL**: `tomson112/studyforge-worker:latest`

3. **Environment Variables**:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://your-connection-string
   BACKEND_URL=https://your-backend-url.onrender.com
   ```

## Step 3: Configure MongoDB Atlas Network Access

**IMPORTANT**: Before your services can connect to MongoDB Atlas, you must whitelist Render's IP addresses:

1. **Go to MongoDB Atlas Dashboard**
2. **Navigate to Network Access** (left sidebar)
3. **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
   - For production, consider using Render's specific IP ranges instead
4. **Confirm** the changes

Without this step, your deployment will fail with connection errors.

## Step 4: Database Setup

After all services are deployed and MongoDB access is configured:

1. **Run migrations** (one-time setup):
   ```bash
   # Connect to your backend service shell and run:
   npm run migrate
   ```

2. **Seed initial data** (optional):
   ```bash
   # Connect to your backend service shell and run:
   npm run seed
   ```

## Step 5: Update CORS Configuration

Update the backend's CORS_ORIGIN environment variable with your actual frontend URL:
```
CORS_ORIGIN=https://your-frontend-app.onrender.com
```

## Step 6: Test Deployment

1. **Backend Health Check**: `https://studyforge-gwqy.onrender.com/health`
2. **Frontend Application**: `https://your-frontend-app.onrender.com`
3. **Demo Login**:
   - Admin: `admin@example.com` / `admin123`
   - Editor: `editor@example.com` / `editor123`

## Render Service URLs

After deployment, you'll have:
- **Backend API**: `https://studyforge-gwqy.onrender.com`
- **Frontend**: `https://your-frontend-app.onrender.com` (to be deployed)
- **Worker**: Background service (no public URL)

## Environment Variables Summary

### Backend Service
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://tt0234240_db_user:E9HVyxFKMiLbiNfj@cluster0.ftdl94i.mongodb.net/cms_db
JWT_SECRET=your-super-secure-jwt-secret-key-change-in-production
CORS_ORIGIN=https://your-frontend-app.onrender.com
```

### Frontend Service
```env
NODE_ENV=production
VITE_API_URL=https://studyforge-gwqy.onrender.com
```

### Worker Service
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://tt0234240_db_user:E9HVyxFKMiLbiNfj@cluster0.ftdl94i.mongodb.net/cms_db
BACKEND_URL=https://studyforge-gwqy.onrender.com
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**: 
   - **Cause**: Render IPs not whitelisted in MongoDB Atlas
   - **Fix**: Add 0.0.0.0/0 to Network Access in MongoDB Atlas
2. **CORS Errors**: Ensure CORS_ORIGIN in backend matches frontend URL
3. **Database Connection**: Verify MongoDB Atlas connection string
4. **Service Communication**: Check that BACKEND_URL in worker matches backend URL
5. **Build Failures**: Check Docker build logs for dependency issues

### Logs and Monitoring

- View service logs in Render dashboard
- Monitor health check status
- Check worker logs for background job processing

## Updating Deployment

To update your deployment:

1. **Rebuild and push images**:
   ```bash
   ./build-and-push.sh
   ```

2. **Trigger redeploy** in Render dashboard or use auto-deploy from Docker Hub

## Cost Optimization

- **Free Tier**: Backend and Frontend on free tier (spins down after inactivity)
- **Paid Tier**: Recommended for production (always-on services)
- **Worker**: Can use free tier for background processing

## Security Considerations

- Use strong JWT secrets
- Enable MongoDB Atlas IP whitelisting
- Use HTTPS for all communications
- Regularly update Docker base images