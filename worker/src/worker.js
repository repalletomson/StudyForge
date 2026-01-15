/**
 * Publishing Worker Service
 * Handles scheduled lesson publishing
 */
require('dotenv').config();

const cron = require('node-cron');
const mongoose = require('mongoose');
const winston = require('winston');

// Import models (we'll need to copy them or create a shared package)
const Lesson = require('./models/Lesson');
const Term = require('./models/Term');
const Program = require('./models/Program');
const LessonAsset = require('./models/LessonAsset');

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'studyforge-worker' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * Connect to MongoDB
 */
const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cms_db';
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000
    });

    logger.info('Worker connected to MongoDB', {
      host: mongoose.connection.host,
      database: mongoose.connection.name
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Process scheduled lessons for publishing
 */
const processScheduledLessons = async () => {
  const startTime = Date.now();
  let processedCount = 0;
  let errorCount = 0;

  try {
    logger.info('Starting scheduled lesson processing');

    // Find lessons that are scheduled and ready to publish
    // IMPORTANT: Exclude archived lessons - they must never be published again
    const now = new Date();
    const scheduledLessons = await Lesson.find({
      status: 'scheduled',
      publishAt: { $lte: now }
    }).sort({ publishAt: 1 });

    logger.info(`Found ${scheduledLessons.length} lessons ready for publishing`);

    // Process each lesson with concurrency safety
    for (const lesson of scheduledLessons) {
      try {
        // Use atomic update with conditions to prevent race conditions
        // This ensures only one worker can publish a lesson even if multiple workers run
        const result = await Lesson.findOneAndUpdate(
          {
            _id: lesson._id,
            status: 'scheduled', // Double-check status hasn't changed
            publishAt: { $lte: now }
          },
          {
            $set: {
              status: 'published',
              publishedAt: new Date()
            },
            $unset: {
              publishAt: 1 // Remove publishAt field when published
            }
          },
          {
            new: true,
            runValidators: true
          }
        );

        // If result is null, another worker already processed this lesson
        if (!result) {
          logger.warn('Lesson already processed by another worker', {
            lessonId: lesson._id,
            title: lesson.title
          });
          continue;
        }

        // Validate assets before considering it successfully published
        const assetValidation = await result.validateAssets();
        if (!assetValidation.isValid) {
          // Revert to scheduled status if assets are missing
          await Lesson.findByIdAndUpdate(lesson._id, {
            status: 'scheduled',
            publishAt: lesson.publishAt
          });
          
          logger.error('Reverted lesson publication due to missing assets', {
            lessonId: lesson._id,
            title: lesson.title,
            missingAssets: assetValidation.missingVariants
          });
          errorCount++;
          continue;
        }

        // Auto-publish parent program if needed (idempotent)
        const term = await Term.findById(result.termId);
        if (term) {
          const program = await Program.findById(term.programId);
          if (program && program.status === 'draft') {
            // Use atomic update to prevent race conditions on program publishing
            const programResult = await Program.findOneAndUpdate(
              {
                _id: program._id,
                status: 'draft' // Only update if still draft
              },
              {
                $set: {
                  status: 'published',
                  publishedAt: new Date() // Set publishedAt only once
                }
              },
              { new: true }
            );
            
            if (programResult) {
              logger.info('Auto-published parent program', {
                programId: program._id,
                programTitle: program.title,
                triggeredByLessonId: lesson._id
              });
            }
          }
        }

        logger.info('Lesson published successfully', {
          lessonId: lesson._id,
          title: lesson.title,
          publishedAt: result.publishedAt
        });

        processedCount++;

      } catch (lessonError) {
        logger.error('Error processing individual lesson', {
          lessonId: lesson._id,
          title: lesson.title,
          error: lessonError.message,
          stack: lessonError.stack
        });
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Scheduled lesson processing completed', {
      totalFound: scheduledLessons.length,
      processed: processedCount,
      errors: errorCount,
      duration: `${duration}ms`
    });

  } catch (error) {
    logger.error('Error in scheduled lesson processing', {
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Start the worker service
 */
const startWorker = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Schedule the publishing job to run every minute
    const cronExpression = process.env.WORKER_CRON || '* * * * *'; // Every minute
    
    logger.info('Starting publishing worker', {
      cronExpression,
      timezone: process.env.TZ || 'UTC'
    });

    cron.schedule(cronExpression, async () => {
      await processScheduledLessons();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Run once on startup for any missed lessons
    setTimeout(async () => {
      await processScheduledLessons();
    }, 5000);

    logger.info('Publishing worker started successfully');

  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down worker gracefully');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down worker gracefully');
  await mongoose.disconnect();
  process.exit(0);
});

// Start the worker
startWorker();