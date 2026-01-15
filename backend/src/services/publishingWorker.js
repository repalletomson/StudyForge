/**
 * Publishing Worker Service (Integrated)
 * Handles scheduled lesson publishing as part of the backend service
 */
const cron = require('node-cron');
const Lesson = require('../models/Lesson');
const Term = require('../models/Term');
const Program = require('../models/Program');
const logger = require('../config/logger');

/**
 * Process scheduled lessons for publishing
 */
const processScheduledLessons = async () => {
  const startTime = Date.now();
  let processedCount = 0;
  let errorCount = 0;

  try {
    logger.info('Worker: Starting scheduled lesson processing');

    // Find lessons that are scheduled and ready to publish
    const now = new Date();
    const scheduledLessons = await Lesson.find({
      status: 'scheduled',
      publishAt: { $lte: now }
    }).sort({ publishAt: 1 });

    logger.info(`Worker: Found ${scheduledLessons.length} lessons ready for publishing`);

    // Process each lesson with concurrency safety
    for (const lesson of scheduledLessons) {
      try {
        // Use atomic update with conditions to prevent race conditions
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

        // If result is null, another process already handled this lesson
        if (!result) {
          logger.warn('Worker: Lesson already processed', {
            lessonId: lesson._id,
            title: lesson.title
          });
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
                  publishedAt: new Date()
                }
              },
              { new: true }
            );
            
            if (programResult) {
              logger.info('Worker: Auto-published parent program', {
                programId: program._id,
                programTitle: program.title,
                triggeredByLessonId: lesson._id
              });
            }
          }
        }

        logger.info('Worker: Lesson published successfully', {
          lessonId: lesson._id,
          title: lesson.title,
          publishedAt: result.publishedAt
        });

        processedCount++;

      } catch (lessonError) {
        logger.error('Worker: Error processing individual lesson', {
          lessonId: lesson._id,
          title: lesson.title,
          error: lessonError.message
        });
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Worker: Scheduled lesson processing completed', {
      totalFound: scheduledLessons.length,
      processed: processedCount,
      errors: errorCount,
      duration: `${duration}ms`
    });

  } catch (error) {
    logger.error('Worker: Error in scheduled lesson processing', {
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Start the publishing worker as a cron job
 */
const startPublishingWorker = () => {
  try {
    // Schedule the publishing job to run every minute
    const cronExpression = process.env.WORKER_CRON || '* * * * *'; // Every minute
    
    logger.info('Worker: Starting integrated publishing worker', {
      cronExpression,
      timezone: process.env.TZ || 'UTC'
    });

    cron.schedule(cronExpression, async () => {
      await processScheduledLessons();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Run once on startup for any missed lessons (after 10 seconds to let server fully start)
    setTimeout(async () => {
      logger.info('Worker: Running initial check for scheduled lessons');
      await processScheduledLessons();
    }, 10000);

    logger.info('Worker: Publishing worker started successfully');

  } catch (error) {
    logger.error('Worker: Failed to start publishing worker:', error);
  }
};

/**
 * Manual trigger for testing (can be called via API endpoint)
 */
const triggerPublishing = async () => {
  logger.info('Worker: Manual publishing trigger initiated');
  await processScheduledLessons();
};

module.exports = {
  startPublishingWorker,
  triggerPublishing,
  processScheduledLessons
};