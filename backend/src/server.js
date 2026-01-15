/**
 * Main server file for StudyForge Backend API
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { connectDatabase } = require('./config/database');
const { initGridFS } = require('./services/fileUploadService');
const { startPublishingWorker } = require('./services/publishingWorker');
const logger = require('./config/logger');

// Import models to ensure they're registered with mongoose
require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const catalogRoutes = require('./routes/catalog');
const healthRoutes = require('./routes/health');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Import controllers
const { serveAsset } = require('./controllers/assetController');

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Initialize server
 */
async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    
    // Initialize GridFS for file storage
    initGridFS();

    // Start the integrated publishing worker
    startPublishingWorker();

    // Security middleware
    app.use(helmet());
    app.use(cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'https://studyforge-gwqy.onrender.com',
        'https://study-forge-git-main-sidharthamahendra-gmailcoms-projects.vercel.app'
      ],
      credentials: true
    }));

    // General middleware
    app.use(compression());
    
    // JSON parsing with proper error handling
    app.use(express.json({ 
      limit: '10mb'
    }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
    app.use(requestLogger);

    // Routes
    app.use('/health', healthRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/catalog', catalogRoutes);
    
    // Asset serving route (public)
    app.get('/api/assets/:fileId', serveAsset);

    // Worker trigger endpoint (for testing)
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

    // Error handling
    app.use(errorHandler);

    // Start server with port conflict handling
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

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();