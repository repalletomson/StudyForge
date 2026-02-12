require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { connectDatabase } = require('./config/database');
const { startPublishingWorker } = require('./services/publishingWorker');
const logger = require('./config/logger');

require('./models');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const catalogRoutes = require('./routes/catalog');
const healthRoutes = require('./routes/health');

const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const { serveAsset } = require('./controllers/assetController');

const app = express();
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDatabase();
    
    startPublishingWorker();

    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));
    
    app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6,
      threshold: 1024
    }));
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'https://studyforge-gwqy.onrender.com',
      'https://study-forge-git-main-sidharthamahendra-gmailcoms-projects.vercel.app',
      'https://study-forge-gold.vercel.app'
    ];
    
    if (process.env.CORS_ORIGIN && !allowedOrigins.includes(process.env.CORS_ORIGIN)) {
      allowedOrigins.push(process.env.CORS_ORIGIN);
    }
    
    app.use(cors({
      origin: allowedOrigins,
      credentials: true
    }));

    app.use(express.json({ 
      limit: '10mb'
    }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
    app.use(requestLogger);

    app.use('/api/assets', (req, res, next) => {
      res.set({
        'Cache-Control': 'public, max-age=31536000',
        'ETag': `"${Date.now()}"`,
      });
      next();
    });

    app.get('/', (req, res) => {
      res.json({
        message: 'StudyForge Backend API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          auth: '/api/auth',
          admin: '/api/admin',
          catalog: '/catalog',
          assets: '/api/assets/:fileId'
        }
      });
    });

    app.use('/health', healthRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/catalog', catalogRoutes);
    
    app.get('/api/assets/:fileId', serveAsset);

    app.post('/api/admin/trigger-publishing', async (req, res) => {
      try {
        const { triggerPublishing } = require('./services/publishingWorker');
        await triggerPublishing();
        res.json({ 
          success: true, 
          message: 'Publishing worker triggered successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Manual publishing trigger failed:', error);
        res.status(500).json({ 
          success: false, 
          message: 'Failed to trigger publishing worker',
          error: error.message 
        });
      }
    });

    app.use(errorHandler);

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        environment: process.env.NODE_ENV,
        port: PORT
      });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`Port ${PORT} is busy, trying port ${PORT + 1}`);
        const newPort = PORT + 1;
        app.listen(newPort, () => {
          logger.info(`Server running on port ${newPort}`, {
            environment: process.env.NODE_ENV,
            port: newPort
          });
        });
      } else {
        logger.error('Server error:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();