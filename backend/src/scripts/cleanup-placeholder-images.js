/**
 * Script to find and remove placeholder image URLs from the database
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const ProgramAsset = require('../models/ProgramAsset');
const LessonAsset = require('../models/LessonAsset');
const logger = require('../config/logger');

/**
 * Connect to database
 */
const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cms_db';
    await mongoose.connect(mongoUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info('Connected to MongoDB for cleanup');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Find placeholder image URLs
 */
const findPlaceholderImages = async () => {
  try {
    logger.info('Searching for placeholder image URLs...');

    // Search patterns for common placeholder services
    const placeholderPatterns = [
      /picsum\.photos/i,
      /placeholder\.com/i,
      /via\.placeholder\.com/i,
      /unsplash\.it/i,
      /lorempixel\.com/i,
      /dummyimage\.com/i,
      /placehold\.it/i,
      /random=/i
    ];

    const programAssets = await ProgramAsset.find({});
    const lessonAssets = await LessonAsset.find({});

    const placeholderProgramAssets = [];
    const placeholderLessonAssets = [];

    // Check program assets
    for (const asset of programAssets) {
      for (const pattern of placeholderPatterns) {
        if (pattern.test(asset.url)) {
          placeholderProgramAssets.push(asset);
          break;
        }
      }
    }

    // Check lesson assets
    for (const asset of lessonAssets) {
      for (const pattern of placeholderPatterns) {
        if (pattern.test(asset.url)) {
          placeholderLessonAssets.push(asset);
          break;
        }
      }
    }

    logger.info('Placeholder image search results:', {
      totalProgramAssets: programAssets.length,
      totalLessonAssets: lessonAssets.length,
      placeholderProgramAssets: placeholderProgramAssets.length,
      placeholderLessonAssets: placeholderLessonAssets.length
    });

    if (placeholderProgramAssets.length > 0) {
      logger.info('Found placeholder program assets:');
      placeholderProgramAssets.forEach(asset => {
        logger.info(`- Program ${asset.programId}: ${asset.language}-${asset.variant} -> ${asset.url}`);
      });
    }

    if (placeholderLessonAssets.length > 0) {
      logger.info('Found placeholder lesson assets:');
      placeholderLessonAssets.forEach(asset => {
        logger.info(`- Lesson ${asset.lessonId}: ${asset.language}-${asset.variant} -> ${asset.url}`);
      });
    }

    return {
      programAssets: placeholderProgramAssets,
      lessonAssets: placeholderLessonAssets
    };

  } catch (error) {
    logger.error('Error searching for placeholder images:', error);
    throw error;
  }
};

/**
 * Remove placeholder images
 */
const removePlaceholderImages = async (dryRun = true) => {
  try {
    const placeholders = await findPlaceholderImages();
    
    if (placeholders.programAssets.length === 0 && placeholders.lessonAssets.length === 0) {
      logger.info('No placeholder images found to remove');
      return;
    }

    if (dryRun) {
      logger.info('DRY RUN - Would remove the following assets:');
      logger.info(`- ${placeholders.programAssets.length} program assets`);
      logger.info(`- ${placeholders.lessonAssets.length} lesson assets`);
      logger.info('Run with --execute flag to actually remove them');
      return;
    }

    logger.info('Removing placeholder images...');

    // Remove program assets
    if (placeholders.programAssets.length > 0) {
      const programAssetIds = placeholders.programAssets.map(asset => asset._id);
      const programResult = await ProgramAsset.deleteMany({ _id: { $in: programAssetIds } });
      logger.info(`Removed ${programResult.deletedCount} program assets`);
    }

    // Remove lesson assets
    if (placeholders.lessonAssets.length > 0) {
      const lessonAssetIds = placeholders.lessonAssets.map(asset => asset._id);
      const lessonResult = await LessonAsset.deleteMany({ _id: { $in: lessonAssetIds } });
      logger.info(`Removed ${lessonResult.deletedCount} lesson assets`);
    }

    logger.info('Placeholder image cleanup completed');

  } catch (error) {
    logger.error('Error removing placeholder images:', error);
    throw error;
  }
};

/**
 * Main cleanup function
 */
const cleanupPlaceholderImages = async () => {
  try {
    await connectDatabase();

    const shouldExecute = process.argv.includes('--execute');
    await removePlaceholderImages(!shouldExecute);

  } catch (error) {
    logger.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the cleanup script
if (require.main === module) {
  cleanupPlaceholderImages();
}

module.exports = { cleanupPlaceholderImages, findPlaceholderImages };