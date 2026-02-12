const cron = require('node-cron');
const Lesson = require('../models/Lesson');
const Term = require('../models/Term');
const Program = require('../models/Program');

const processScheduledLessons = async () => {
  try {
    const now = new Date();
    const scheduledLessons = await Lesson.find({
      status: 'scheduled',
      publishAt: { $lte: now }
    }).sort({ publishAt: 1 });

    console.log(`Found ${scheduledLessons.length} lessons ready to publish`);

    for (const lesson of scheduledLessons) {
      try {
        const result = await Lesson.findOneAndUpdate(
          {
            _id: lesson._id,
            status: 'scheduled',
            publishAt: { $lte: now }
          },
          {
            $set: {
              status: 'published',
              publishedAt: new Date()
            },
            $unset: { publishAt: 1 }
          },
          { new: true, runValidators: true }
        );

        if (!result) continue;

        const term = await Term.findById(result.termId);
        if (term) {
          const program = await Program.findById(term.programId);
          if (program && program.status === 'draft') {
            await Program.findOneAndUpdate(
              { _id: program._id, status: 'draft' },
              {
                $set: {
                  status: 'published',
                  publishedAt: new Date()
                }
              },
              { new: true }
            );
          }
        }

        console.log(`Published lesson: ${lesson.title}`);
      } catch (error) {
        console.error(`Error publishing lesson ${lesson._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Worker error:', error.message);
  }
};

const startPublishingWorker = () => {
  try {
    const cronExpression = process.env.WORKER_CRON || '* * * * *';
    
    console.log('Starting publishing worker');

    cron.schedule(cronExpression, async () => {
      await processScheduledLessons();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    setTimeout(async () => {
      console.log('Running initial check');
      await processScheduledLessons();
    }, 10000);

    console.log('Publishing worker started');
  } catch (error) {
    console.error('Failed to start worker:', error);
  }
};

const triggerPublishing = async () => {
  console.log('Manual trigger initiated');
  await processScheduledLessons();
};

module.exports = {
  startPublishingWorker,
  triggerPublishing,
  processScheduledLessons
};