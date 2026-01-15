/**
 * Catalog controller for public API
 */
const Program = require('../models/Program');
const Term = require('../models/Term');
const Lesson = require('../models/Lesson');
const Topic = require('../models/Topic');
const ProgramAsset = require('../models/ProgramAsset');
const LessonAsset = require('../models/LessonAsset');
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
 * Set cache headers
 */
const setCacheHeaders = (res, maxAge = 300) => {
  res.set({
    'Cache-Control': `public, max-age=${maxAge}`,
    'ETag': `"${Date.now()}"`,
    'Last-Modified': new Date().toUTCString()
  });
};

/**
 * GET /catalog/programs
 * Get published programs with filtering and pagination
 * Only programs with ≥1 published lessons, sorted by most recently published
 */
const getPrograms = async (req, res, next) => {
  try {
    const {
      language,
      topic,
      cursor,
      limit = 20
    } = req.query;

    // Validate limit (max 100 items per page)
    const parsedLimit = Math.min(parseInt(limit) || 20, 100);

    // Build aggregation pipeline to find programs with published lessons
    const pipeline = [
      // Match published programs only
      { $match: { status: 'published' } },
      
      // Lookup published lessons count
      {
        $lookup: {
          from: 'terms',
          localField: '_id',
          foreignField: 'programId',
          as: 'terms'
        }
      },
      {
        $lookup: {
          from: 'lessons',
          let: { termIds: '$terms._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$termId', '$termIds'] },
                    { $eq: ['$status', 'published'] }
                  ]
                }
              }
            }
          ],
          as: 'publishedLessons'
        }
      },
      
      // Only include programs with at least 1 published lesson
      { $match: { 'publishedLessons.0': { $exists: true } } },
      
      // Add published lessons count
      { $addFields: { publishedLessonsCount: { $size: '$publishedLessons' } } },
      
      // Remove the lessons array to reduce payload
      { $unset: ['publishedLessons', 'terms'] }
    ];

    // Add language filter
    if (language) {
      if (!/^[a-z]{2}$/.test(language)) {
        throw createError('Invalid language code', 400, 'VALIDATION_ERROR');
      }
      pipeline.unshift({ $match: { languagePrimary: language } });
    }

    // Add topic filter
    if (topic) {
      const topicDoc = await Topic.findOne({ name: { $regex: new RegExp(topic, 'i') } });
      if (topicDoc) {
        pipeline.unshift({ $match: { topicIds: topicDoc._id } });
      } else {
        // Return empty result if topic not found
        const response = {
          programs: [],
          pagination: {
            cursor: null,
            hasMore: false,
            limit: parsedLimit,
            total: 0
          }
        };
        setCacheHeaders(res, 300);
        return res.json(response);
      }
    }

    // Add cursor pagination
    if (cursor) {
      try {
        pipeline.push({ $match: { _id: { $gt: cursor } } });
      } catch (error) {
        throw createError('Invalid cursor', 400, 'VALIDATION_ERROR');
      }
    }

    // Sort by most recently published, then by _id for consistent pagination
    pipeline.push({ $sort: { publishedAt: -1, _id: 1 } });
    
    // Limit results (get one extra to check if there are more)
    pipeline.push({ $limit: parsedLimit + 1 });

    // Execute aggregation
    let programs = await Program.aggregate(pipeline);

    // Populate topics
    programs = await Program.populate(programs, { path: 'topicIds', select: 'name' });

    // Check if there are more results
    const hasMore = programs.length > parsedLimit;
    if (hasMore) programs.pop();

    // Get assets for each program and format response
    const programsWithAssets = await Promise.all(
      programs.map(async (program) => {
        const assets = await ProgramAsset.find({ programId: program._id });
        
        // Format assets according to specification
        const formattedAssets = {
          posters: {}
        };

        assets.forEach(asset => {
          if (asset.assetType === 'poster') {
            if (!formattedAssets.posters[asset.language]) {
              formattedAssets.posters[asset.language] = {};
            }
            formattedAssets.posters[asset.language][asset.variant] = asset.url;
          }
        });

        return {
          id: program._id,
          title: program.title,
          description: program.description,
          language_primary: program.languagePrimary,
          languages_available: program.languagesAvailable,
          published_at: program.publishedAt,
          published_lessons_count: program.publishedLessonsCount,
          topics: program.topicIds ? program.topicIds.map(topic => topic.name) : [],
          assets: formattedAssets
        };
      })
    );

    const response = {
      programs: programsWithAssets,
      pagination: {
        cursor: hasMore ? programs[programs.length - 1]._id : null,
        hasMore,
        limit: parsedLimit,
        total: programsWithAssets.length
      }
    };

    setCacheHeaders(res, 300);
    res.json(response);

  } catch (error) {
    // Consistent error format
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        code: error.code || 'APPLICATION_ERROR',
        message: error.message,
        details: error.details || null
      });
    }
    next(error);
  }
};

/**
 * GET /catalog/programs/:id
 * Get published program with terms and published lessons only
 * Includes multi-language fields and assets
 */
const getProgram = async (req, res, next) => {
  try {
    const programId = req.params.id;
    
    // Validate ObjectId
    if (!programId.match(/^[0-9a-fA-F]{24}$/)) {
      throw createError('Invalid program ID', 400, 'VALIDATION_ERROR');
    }

    const program = await Program.findById(programId)
      .populate('topicIds', 'name');

    if (!program || program.status !== 'published') {
      return res.status(404).json({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Program not found or not published',
        details: null
      });
    }

    // Get terms with published lessons only
    const terms = await Term.find({ programId: program._id }).sort({ termNumber: 1 });
    
    const termsWithLessons = await Promise.all(
      terms.map(async (term) => {
        // Only get published lessons
        const lessons = await Lesson.find({ 
          termId: term._id, 
          status: 'published' 
        }).sort({ lessonNumber: 1 });

        const lessonsWithAssets = await Promise.all(
          lessons.map(async (lesson) => {
            const assets = await LessonAsset.find({ lessonId: lesson._id });
            
            // Format lesson assets according to specification
            const formattedAssets = {
              thumbnails: {}
            };

            assets.forEach(asset => {
              if (asset.assetType === 'thumbnail') {
                if (!formattedAssets.thumbnails[asset.language]) {
                  formattedAssets.thumbnails[asset.language] = {};
                }
                formattedAssets.thumbnails[asset.language][asset.variant] = asset.url;
              }
            });

            return {
              id: lesson._id,
              lesson_number: lesson.lessonNumber,
              title: lesson.title,
              content_type: lesson.contentType,
              duration_ms: lesson.durationMs,
              is_paid: lesson.isPaid,
              content_language_primary: lesson.contentLanguagePrimary,
              content_languages_available: lesson.contentLanguagesAvailable,
              published_at: lesson.publishedAt,
              assets: formattedAssets
            };
          })
        );

        return {
          id: term._id,
          term_number: term.termNumber,
          title: term.title,
          lessons: lessonsWithAssets
        };
      })
    );

    // Filter out terms with no published lessons
    const termsWithPublishedLessons = termsWithLessons.filter(term => term.lessons.length > 0);

    // Get program assets
    const assets = await ProgramAsset.find({ programId: program._id });

    // Format program assets according to specification
    const formattedAssets = {
      posters: {}
    };

    assets.forEach(asset => {
      if (asset.assetType === 'poster') {
        if (!formattedAssets.posters[asset.language]) {
          formattedAssets.posters[asset.language] = {};
        }
        formattedAssets.posters[asset.language][asset.variant] = asset.url;
      }
    });

    const response = {
      id: program._id,
      title: program.title,
      description: program.description,
      language_primary: program.languagePrimary,
      languages_available: program.languagesAvailable,
      published_at: program.publishedAt,
      topics: program.topicIds ? program.topicIds.map(topic => topic.name) : [],
      assets: formattedAssets,
      terms: termsWithPublishedLessons
    };

    setCacheHeaders(res, 300);
    res.json(response);

  } catch (error) {
    // Consistent error format
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        code: error.code || 'APPLICATION_ERROR',
        message: error.message,
        details: error.details || null
      });
    }
    next(error);
  }
};

/**
 * GET /catalog/lessons/:id
 * Get published lesson details only
 */
const getLesson = async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    
    // Validate ObjectId
    if (!lessonId.match(/^[0-9a-fA-F]{24}$/)) {
      throw createError('Invalid lesson ID', 400, 'VALIDATION_ERROR');
    }

    const lesson = await Lesson.findById(lessonId);

    // Only return published lessons
    if (!lesson || lesson.status !== 'published') {
      return res.status(404).json({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Lesson not found or not published',
        details: null
      });
    }

    // Get lesson assets
    const assets = await LessonAsset.find({ lessonId: lesson._id });

    // Format lesson assets according to specification
    const formattedAssets = {
      thumbnails: {}
    };

    assets.forEach(asset => {
      if (asset.assetType === 'thumbnail') {
        if (!formattedAssets.thumbnails[asset.language]) {
          formattedAssets.thumbnails[asset.language] = {};
        }
        formattedAssets.thumbnails[asset.language][asset.variant] = asset.url;
      }
    });

    const response = {
      id: lesson._id,
      title: lesson.title,
      content_type: lesson.contentType,
      duration_ms: lesson.durationMs,
      is_paid: lesson.isPaid,
      content_language_primary: lesson.contentLanguagePrimary,
      content_languages_available: lesson.contentLanguagesAvailable,
      content_urls_by_language: lesson.contentUrlsByLanguage ? Object.fromEntries(lesson.contentUrlsByLanguage) : {},
      subtitle_languages: lesson.subtitleLanguages || [],
      subtitle_urls_by_language: lesson.subtitleUrlsByLanguage ? Object.fromEntries(lesson.subtitleUrlsByLanguage) : {},
      published_at: lesson.publishedAt,
      assets: formattedAssets
    };

    setCacheHeaders(res, 300);
    res.json(response);

  } catch (error) {
    // Consistent error format
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        code: error.code || 'APPLICATION_ERROR',
        message: error.message,
        details: error.details || null
      });
    }
    next(error);
  }
};

/**
 * GET /catalog/topics
 * Get available topics with program counts
 */
const getTopics = async (req, res, next) => {
  try {
    // Get topics with program counts
    const topics = await Topic.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'programs',
          let: { topicId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$topicId', '$topicIds'] },
                    { $eq: ['$status', 'published'] }
                  ]
                }
              }
            }
          ],
          as: 'programs'
        }
      },
      {
        $addFields: {
          programCount: { $size: '$programs' }
        }
      },
      {
        $match: { programCount: { $gt: 0 } } // Only topics with published programs
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          programCount: 1
        }
      },
      { $sort: { name: 1 } }
    ]);

    const response = {
      topics: topics.map(topic => ({
        id: topic._id,
        name: topic.name,
        description: topic.description,
        program_count: topic.programCount
      }))
    };

    setCacheHeaders(res, 600);
    res.json(response);

  } catch (error) {
    // Consistent error format
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        code: error.code || 'APPLICATION_ERROR',
        message: error.message,
        details: error.details || null
      });
    }
    next(error);
  }
};

module.exports = {
  getPrograms,
  getProgram,
  getLesson,
  getTopics
};