# StudyForge - Educational Content Management System

A modern, full-stack educational content management system built with React, Node.js, and MongoDB Atlas. Features role-based access control, automated publishing workflows, and a comprehensive content management interface.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   React SPA     │    │   Node.js API   │    │  Background     │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│  Worker         │
│                 │    │                 │    │                 │
│ • Landing Page  │    │ • REST API      │    │ • Auto Publish  │
│ • Admin Panel   │    │ • Auth & RBAC   │    │ • Scheduling    │
│ • Content Mgmt  │    │ • File Upload   │    │ • Notifications │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   nginx         │    │  MongoDB Atlas  │    │   File Storage  │
│   (Proxy)       │    │  (Database)     │    │   (Local/Cloud) │
│                 │    │                 │    │                 │
│ • SSL/TLS       │    │ • Users         │    │ • Images        │
│ • Load Balance  │    │ • Programs      │    │ • Videos        │
│ • Static Files  │    │ • Lessons       │    │ • Documents     │
│                 │    │ • Assets        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

- **Frontend (React)**: Modern SPA with landing page and admin dashboard
- **Backend (Node.js)**: RESTful API with authentication and file handling
- **Worker Process**: Background job processing for scheduled publishing
- **Database (MongoDB Atlas)**: Cloud-hosted document database
- **Reverse Proxy (nginx)**: SSL termination and load balancing

## 🚀 Local Setup Steps

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose
- MongoDB Atlas account

### 1. Clone and Configure
```bash
git clone <repository-url>
cd studyforge
cp .env.example .env
```

### 2. Update Environment Variables
Edit `.env` with your configuration:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studyforge
JWT_SECRET=your-super-secure-jwt-secret-key
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Install Dependencies
```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies  
cd ../frontend && npm install

# Worker dependencies
cd ../worker && npm install
```

### 4. Run Database Setup
```bash
# Run migrations (if any)
npm run migrate

# Seed initial data
npm run seed
```

### 5. Start Development Services
```bash
# Terminal 1: Backend API
cd backend && npm run dev

# Terminal 2: Frontend Dev Server
cd frontend && npm run dev

# Terminal 3: Background Worker
cd worker && npm run dev
```

### 6. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

## 🗄️ Database Operations

### How Migrations Run
```bash
# Run database migrations
cd backend
npm run migrate

# Or using Docker
docker-compose exec backend npm run migrate
```

Migrations handle:
- Schema updates
- Index creation
- Data transformations
- Version tracking

### How Seed Runs
```bash
# Seed development data
cd backend
npm run seed

# Or using Docker
docker-compose exec backend npm run seed
```

Seed script creates:
- **3 Users**: Admin, Editor, Viewer with demo credentials
- **12 Topics**: Technology, Business, Design, Science, etc.
- **4 Programs**: Sample educational programs with multi-language support
- **Sample Assets**: Placeholder images and media files

**Demo Credentials:**
- Admin: `admin@example.com` / `admin123`
- Editor: `editor@example.com` / `editor123`  
- Viewer: `viewer@example.com` / `viewer123`

## 🌐 Deployed URLs

### Production Environment
- **Web Application**: https://studyforge.example.com
- **API Endpoint**: https://api.studyforge.example.com
- **Health Check**: https://api.studyforge.example.com/health
- **Public Catalog**: https://studyforge.example.com/catalog

### Staging Environment
- **Web Application**: https://staging.studyforge.example.com
- **API Endpoint**: https://api-staging.studyforge.example.com

## 🎯 Complete Demo Flow

### Step 1: Login as Editor
1. Navigate to the deployed web application
2. Click "Sign In" on the landing page
3. Use editor credentials:
   - Email: `editor@example.com`
   - Password: `editor123`
4. Verify you're redirected to the dashboard

### Step 2: Create/Edit Program and Lesson
1. **Create a Program:**
   - Go to "Programs" in the sidebar
   - Click "New Program"
   - Fill in program details:
     - Title: "Advanced React Development"
     - Description: "Master advanced React patterns and techniques"
     - Select topics: "Technology", "Programming"
     - Add poster images (portrait/landscape)
   - Click "Create Program"

2. **Add a Term:**
   - In the program detail page, click "Add Term"
   - Enter term title: "React Hooks & Context"
   - Save the term

3. **Create a Lesson:**
   - Click "Add Lesson" in the term
   - Fill lesson details:
     - Title: "Custom Hooks Deep Dive"
     - Content Type: "Video"
     - YouTube URL: `https://www.youtube.com/watch?v=example`
     - Duration: 45 minutes
     - Mark as "Paid Content"
   - Set status to "Draft"
   - Save lesson

### Step 3: Schedule Publishing
1. **Edit the Lesson:**
   - Click "Edit" on the created lesson
   - Change status from "Draft" to "Scheduled"
   - Set publish date: 2 minutes from current time
   - Add thumbnail images
   - Save changes

2. **Verify Scheduling:**
   - Check lesson shows "Scheduled" status
   - Note the scheduled publish time
   - Lesson should not appear in public catalog yet

### Step 4: Wait for Worker → Verify Publishing
1. **Monitor Worker Process:**
   - Worker runs every minute checking for scheduled content
   - Wait for the scheduled time to pass (2+ minutes)
   - Check backend logs for publishing activity:
     ```bash
     docker-compose logs worker
     ```

2. **Verify Auto-Publishing:**
   - Refresh the lesson page
   - Status should change from "Scheduled" to "Published"
   - Published timestamp should be populated
   - Program status should auto-update to "Published"

### Step 5: Verify Public Catalog
1. **Check Public Catalog:**
   - Navigate to `/catalog` (public route, no login required)
   - Verify the program appears in the catalog
   - Click on the program to view details
   - Confirm the published lesson is visible

2. **Test Content Access:**
   - Free lessons should be accessible to all users
   - Paid lessons should show "Premium Content" indicator
   - Verify proper content filtering by language/topic

### Step 6: Additional Verification
1. **Test Different User Roles:**
   - Logout and login as viewer (`viewer@example.com` / `viewer123`)
   - Verify limited access to admin features
   - Login as admin to see full management capabilities

2. **Test Publishing Workflow:**
   - Create another lesson with different publish schedule
   - Test immediate publishing (status: "Published")
   - Test archiving workflow (status: "Archived")

## 🔧 Development Commands

```bash
# Backend
npm run dev          # Start development server
npm run start        # Start production server
npm run seed         # Seed database
npm run migrate      # Run migrations

# Frontend  
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Worker
npm run dev          # Start development worker
npm run start        # Start production worker

# Docker
docker-compose up -d              # Start all services
docker-compose -f docker-compose.prod.yml up -d  # Production
docker-compose logs -f worker     # View worker logs
```

## 📁 Project Structure

```
studyforge/
├── backend/                 # Node.js API Server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── scripts/        # Migration & seed scripts
│   │   └── config/         # Database, logging config
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── services/       # API client functions
│   │   ├── contexts/       # React contexts
│   │   └── utils/          # Helper functions
│   ├── public/             # Static assets
│   ├── Dockerfile
│   └── package.json
├── worker/                 # Background Job Processor
│   ├── src/
│   │   ├── models/         # Shared data models
│   │   └── worker.js       # Main worker process
│   └── package.json
├── nginx/                  # Reverse Proxy Config
│   └── nginx.conf
├── docker-compose.yml      # Development setup
├── docker-compose.prod.yml # Production setup
└── README.md
```

## 🔒 Security & Production Features

- **Authentication**: JWT-based with role-based access control
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API endpoint protection
- **File Upload Security**: Type validation and size limits  
- **CORS Protection**: Configurable origin restrictions
- **SSL/TLS**: nginx handles certificate management
- **Health Monitoring**: Endpoint monitoring and logging
- **Error Handling**: Structured error responses and logging

## 📊 Monitoring & Logging

- **Health Checks**: `/health` endpoint for all services
- **Structured Logging**: Winston with daily log rotation
- **Docker Health Checks**: Container health monitoring
- **Worker Status**: Background job processing logs
- **Database Monitoring**: MongoDB Atlas built-in monitoring

## 🚀 Deployment

### Production Deployment
```bash
# Build and deploy all services
docker-compose -f docker-compose.prod.yml up -d

# Run initial setup
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed

# Monitor services
docker-compose logs -f
```

### Environment-Specific Configs
- **Development**: Hot reloading, debug logging, local file storage
- **Staging**: Production builds, staging database, SSL certificates
- **Production**: Optimized builds, CDN integration, monitoring alerts