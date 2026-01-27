/**
 * Lesson controller for CRUD operations
 */
const Lesson = require('../models/Lesson');
const Term = require('../models/Term');
const logger = require('../config/logger');

/**
 * Create application error
 */
const createError = (message, statusCode = 500, code = 'APPLICATION_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

/**
 * GET /api/admin/terms/:termId/lessons
 * Get lessons for a term
 */
const getLessons = async (req, res, next) => {
  try {
    console.log('=== DEBUG GET LESSONS ===');
    const { termId } = req.params;
    console.log('1. termId:', termId);

    // Basic validation
    if (!termId) {
      console.log('2. ERROR: No termId');
      throw createError('Term ID is required', 400, 'VALIDATION_ERROR');
    }

    // Validate ObjectId format
    if (!termId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('3. ERROR: Invalid ObjectId format');
      throw createError('Invalid term ID format', 400, 'VALIDATION_ERROR');
    }

    console.log('4. About to query Lesson model');
    console.log('5. Lesson model:', typeof Lesson);

    // Try a simple query first
    let lessons;
    try {
      console.log('6. Executing Lesson.find query...');
      lessons = await Lesson.find({ termId }).lean();
      console.log('7. Query successful, found:', lessons.length, 'lessons');
    } catch (dbError) {
      console.error('8. Database query error:', dbError);
      throw dbError;
    }

    // Get assets for each lesson
    const LessonAsset = require('../models/LessonAsset');
    const lessonsWithAssets = await Promise.all(
      lessons.map(async (lesson) => {
        const assets = await LessonAsset.find({ lessonId: lesson._id });
        return {
          ...lesson,
          assets: assets.reduce((acc, asset) => {
            // Pluralize asset type for frontend compatibility
            const assetTypeKey = asset.assetType === 'thumbnail' ? 'thumbnails' : 
                               asset.assetType === 'poster' ? 'posters' : asset.assetType;
            if (!acc[assetTypeKey]) acc[assetTypeKey] = {};
            if (!acc[assetTypeKey][asset.language])
              acc[assetTypeKey][asset.language] = {};
            acc[assetTypeKey][asset.language][asset.variant] = asset.url;
            return acc;
          }, {}),
        };
      })
    );

    // Sort lessons
    try {
      console.log('9. Sorting lessons...');
      lessonsWithAssets.sort((a, b) => a.lessonNumber - b.lessonNumber);
      console.log('10. Sorting successful');
    } catch (sortError) {
      console.error('11. Sorting error:', sortError);
      // Continue without sorting if it fails
    }

    console.log('12. About to send response');
    res.json({ lessons: lessonsWithAssets });
    console.log('13. Response sent successfully');

  } catch (error) {
    console.error('=== ERROR IN GET LESSONS ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    logger.error('Error getting lessons', {
      termId: req.params.termId,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId
    });
    next(error);
  }
};

/**
 * POST /api/admin/terms/:termId/lessons
 * Create new lesson
 */
const createLesson = async (req, res, next) => {
  try {
    const { termId } = req.params;
    const {
      lessonNumber,
      title,
      contentType,
      durationMs,
      isPaid,
      contentLanguagePrimary,
      contentLanguagesAvailable,
      contentUrlsByLanguage,
      articleContentByLanguage,
      subtitleLanguages,
      subtitleUrlsByLanguage
    } = req.body;

    // Validate ObjectId format
    if (!termId.match(/^[0-9a-fA-F]{24}$/)) {
      throw createError('Invalid term ID format', 400, 'VALIDATION_ERROR');
    }

    // Verify term exists
    const term = await Term.findById(termId);
    if (!term) {
      throw createError('Term not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Check if lesson number already exists for this term
    const existingLesson = await Lesson.findOne({ termId, lessonNumber });
    if (existingLesson) {
      throw createError(`Lesson number ${lessonNumber} already exists for this term`, 409, 'DUPLICATE_LESSON_NUMBER');
    }

    const lesson = new Lesson({
      termId,
      lessonNumber,
      title,
      contentType,
      durationMs,
      isPaid,
      contentLanguagePrimary,
      contentLanguagesAvailable,
      contentUrlsByLanguage: new Map(Object.entries(contentUrlsByLanguage || {})),
      articleContentByLanguage: new Map(Object.entries(articleContentByLanguage || {})),
      subtitleLanguages,
      subtitleUrlsByLanguage: new Map(Object.entries(subtitleUrlsByLanguage || {}))
    });

    await lesson.save();

    logger.info('Lesson created', {
      lessonId: lesson._id,
      termId,
      title,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(201).json(lesson);

  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === 'lessonNumber') {
        next(createError(`Lesson number ${error.keyValue?.lessonNumber} already exists for this term`, 409, 'DUPLICATE_LESSON_NUMBER'));
      } else {
        next(createError('Duplicate entry detected', 409, 'DUPLICATE_ERROR'));
      }
    } else {
      next(error);
    }
  }
};

/**
 * GET /api/admin/lessons/:id
 * Get lesson by ID
 */
const getLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).lean();
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Get assets for this lesson
    const LessonAsset = require('../models/LessonAsset');
    const assets = await LessonAsset.find({ lessonId: lesson._id });
    
    // Add assets to lesson
    const lessonWithAssets = {
      ...lesson,
      assets: assets.reduce((acc, asset) => {
        // Pluralize asset type for frontend compatibility
        const assetTypeKey = asset.assetType === 'thumbnail' ? 'thumbnails' : 
                           asset.assetType === 'poster' ? 'posters' : asset.assetType;
        if (!acc[assetTypeKey]) acc[assetTypeKey] = {};
        if (!acc[assetTypeKey][asset.language])
          acc[assetTypeKey][asset.language] = {};
        acc[assetTypeKey][asset.language][asset.variant] = asset.url;
        return acc;
      }, {}),
    };

    res.json(lessonWithAssets);

  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/lessons/:id
 * Update lesson
 */
const updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const {
      title,
      contentType,
      durationMs,
      isPaid,
      contentLanguagePrimary,
      contentLanguagesAvailable,
      contentUrlsByLanguage,
      articleContentByLanguage,
      subtitleLanguages,
      subtitleUrlsByLanguage
    } = req.body;

    // Update fields
    if (title !== undefined) lesson.title = title;
    if (contentType !== undefined) lesson.contentType = contentType;
    if (durationMs !== undefined) lesson.durationMs = durationMs;
    if (isPaid !== undefined) lesson.isPaid = isPaid;
    if (contentLanguagePrimary !== undefined) lesson.contentLanguagePrimary = contentLanguagePrimary;
    if (contentLanguagesAvailable !== undefined) lesson.contentLanguagesAvailable = contentLanguagesAvailable;
    if (contentUrlsByLanguage !== undefined) {
      lesson.contentUrlsByLanguage = new Map(Object.entries(contentUrlsByLanguage));
    }
    if (articleContentByLanguage !== undefined) {
      lesson.articleContentByLanguage = new Map(Object.entries(articleContentByLanguage));
    }
    if (subtitleLanguages !== undefined) lesson.subtitleLanguages = subtitleLanguages;
    if (subtitleUrlsByLanguage !== undefined) {
      lesson.subtitleUrlsByLanguage = new Map(Object.entries(subtitleUrlsByLanguage));
    }

    await lesson.save();

    logger.info('Lesson updated', {
      lessonId: lesson._id,
      title: lesson.title,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(lesson);

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/lessons/:id
 * Delete lesson and all related data
 */
const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Get the term and program info before deletion
    const term = await Term.findById(lesson.termId);
    let program = null;
    if (term) {
      const Program = require('../models/Program');
      program = await Program.findById(term.programId);
    }

    // Delete all related data
    const LessonAsset = require('../models/LessonAsset');
    
    // Delete lesson assets
    await LessonAsset.deleteMany({ lessonId: lesson._id });
    
    // Delete the lesson itself
    await Lesson.findByIdAndDelete(req.params.id);

    // Check if program should be reverted to draft status
    if (program && program.status === 'published') {
      const wasReverted = await program.autoDraft();
      
      if (wasReverted && program.status === 'draft') {
        logger.info('Program reverted to draft status - no published lessons remain', {
          programId: program._id,
          programTitle: program.title,
          lessonId: lesson._id,
          lessonTitle: lesson.title,
          userId: req.user._id,
          correlationId: req.correlationId
        });
      }
    }

    logger.info('Lesson and related data deleted', {
      lessonId: lesson._id,
      title: lesson.title,
      programId: program?._id,
      programReverted: program && program.status === 'draft',
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/lessons/:id/publish
 * Publish lesson immediately
 */
const publishLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Use the lesson's publish method which handles all validation and auto-publishing
    await lesson.publish();

    logger.info('Lesson published', {
      lessonId: lesson._id,
      title: lesson.title,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(lesson);

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/lessons/:id/schedule
 * Schedule lesson for future publication
 */
const scheduleLesson = async (req, res, next) => {
  try {
    const { publishAt } = req.body;

    if (!publishAt) {
      throw createError('Publish date is required', 400, 'VALIDATION_ERROR');
    }

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const publishAtDate = new Date(publishAt);
    if (publishAtDate <= new Date()) {
      throw createError('Scheduled publish date must be in the future', 400, 'VALIDATION_ERROR');
    }

    // Use the lesson's schedule method which handles all validation
    await lesson.schedule(publishAtDate);

    logger.info('Lesson scheduled', {
      lessonId: lesson._id,
      title: lesson.title,
      publishAt,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(lesson);

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/lessons/:id/archive
 * Archive lesson
 */
const archiveLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw createError('Lesson not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const wasPublished = lesson.status === 'published';

    // Use the lesson's archive method which handles status transitions
    await lesson.archive();

    // If the lesson was published and is now archived, check if program should be reverted to draft
    if (wasPublished) {
      const term = await Term.findById(lesson.termId);
      if (term) {
        const Program = require('../models/Program');
        const program = await Program.findById(term.programId);
        
        if (program && program.status === 'published') {
          const wasReverted = await program.autoDraft();
          
          if (wasReverted && program.status === 'draft') {
            logger.info('Program reverted to draft status - no published lessons remain after archiving', {
              programId: program._id,
              programTitle: program.title,
              lessonId: lesson._id,
              lessonTitle: lesson.title,
              userId: req.user._id,
              correlationId: req.correlationId
            });
          }
        }
      }
    }

    logger.info('Lesson archived', {
      lessonId: lesson._id,
      title: lesson.title,
      previousStatus: lesson.status,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(lesson);

  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/lessons/:id/assets
 * Update lesson assets
 */
const updateLessonAssets = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { language, assetType, assets } = req.body;

    // Validate lesson exists
    const lesson = await Lesson.findById(id);
    if (!lesson) {
      throw createError("Lesson not found", 404, "RESOURCE_NOT_FOUND");
    }

    // Validate required fields
    if (!language || !assetType || !assets) {
      throw createError("Language, asset type, and assets are required", 400, "VALIDATION_ERROR");
    }

    // Delete existing assets for this lesson/language/type combination
    const LessonAsset = require('../models/LessonAsset');
    await LessonAsset.deleteMany({
      lessonId: id,
      language,
      assetType
    });

    // Create new assets
    const assetPromises = Object.entries(assets).map(([variant, url]) => {
      const asset = new LessonAsset({
        lessonId: id,
        language,
        variant,
        assetType,
        url: url.trim()
      });
      return asset.save();
    });

    await Promise.all(assetPromises);

    logger.info("Lesson assets updated", {
      lessonId: id,
      language,
      assetType,
      variants: Object.keys(assets),
      userId: req.user._id,
      correlationId: req.correlationId,
    });

    res.json({ 
      message: "Lesson assets updated successfully",
      assets: Object.keys(assets)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLessons,
  createLesson,
  getLesson,
  updateLesson,
  deleteLesson,
  publishLesson,
  scheduleLesson,
  archiveLesson,
  updateLessonAssets
};