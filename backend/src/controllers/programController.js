/**
 * Program controller for CRUD operations
 */
const Program = require("../models/Program");
const Topic = require("../models/Topic");
const ProgramAsset = require("../models/ProgramAsset");
const logger = require("../config/logger");
const { validateProgramAssets, validateAssetUrl } = require('../utils/assetValidation');

/**
 * Create application error
 */
const createError = (message, statusCode = 500, code = "APPLICATION_ERROR") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

/**
 * PUT /api/admin/programs/:id/assets
 * Update program assets
 */
const updateProgramAssets = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { language, assetType, assets } = req.body;

    // Validate program exists
    const program = await Program.findById(id);
    if (!program) {
      throw createError("Program not found", 404, "RESOURCE_NOT_FOUND");
    }

    // Validate required fields
    if (!language || !assetType || !assets) {
      throw createError("Language, asset type, and assets are required", 400, "VALIDATION_ERROR");
    }

    // Validate asset URLs and reject placeholders
    for (const [variant, url] of Object.entries(assets)) {
      const urlValidation = validateAssetUrl(url);
      if (!urlValidation.isValid) {
        throw createError(
          `Invalid ${variant} asset: ${urlValidation.error}`,
          400,
          "VALIDATION_ERROR"
        );
      }
    }

    // Delete existing assets for this program/language/type combination
    const ProgramAsset = require('../models/ProgramAsset');
    await ProgramAsset.deleteMany({
      programId: id,
      language,
      assetType
    });

    // Create new assets
    const assetPromises = Object.entries(assets).map(([variant, url]) => {
      const asset = new ProgramAsset({
        programId: id,
        language,
        variant,
        assetType,
        url: url.trim()
      });
      return asset.save();
    });

    await Promise.all(assetPromises);

    logger.info("Program assets updated", {
      programId: id,
      language,
      assetType,
      variants: Object.keys(assets),
      userId: req.user._id,
      correlationId: req.correlationId,
    });

    res.json({ 
      message: "Program assets updated successfully",
      assets: Object.keys(assets)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/programs
 * Get programs with filtering and pagination
 */
const getPrograms = async (req, res, next) => {
  try {
    const { status, language, topic, cursor, limit = 20, search } = req.query;

    // Build filter
    const filter = {};

    if (status) filter.status = status;
    if (language) filter.languagePrimary = language;
    if (search) {
      filter.$text = { $search: search };
    }

    // Handle topic filter
    if (topic) {
      const topicDoc = await Topic.findOne({ name: topic });
      if (topicDoc) {
        filter.topicIds = topicDoc._id;
      }
    }

    // Handle cursor pagination
    if (cursor) {
      filter._id = { $gt: cursor };
    }

    const programs = await Program.find(filter)
      .populate("topicIds", "name")
      .sort({ _id: 1 })
      .limit(parseInt(limit) + 1);

    // Check if there are more results
    const hasMore = programs.length > limit;
    if (hasMore) programs.pop();

    // Get assets and lesson statistics for each program
    const programsWithAssets = await Promise.all(
      programs.map(async (program) => {
        const [programAssets, lessonStats] = await Promise.all([
          // Get program assets using ProgramAsset model
          require('../models/ProgramAsset').find({ 
            programId: program._id,
            assetType: 'poster'
          }),
          // Get lesson statistics via aggregation
          require('../models/Term').aggregate([
            { $match: { programId: program._id } },
            {
              $lookup: {
                from: 'lessons',
                localField: '_id',
                foreignField: 'termId',
                as: 'lessons'
              }
            },
            {
              $unwind: { path: '$lessons', preserveNullAndEmptyArrays: true }
            },
            {
              $group: {
                _id: '$programId',
                totalLessons: { $sum: { $cond: [{ $ifNull: ['$lessons', false] }, 1, 0] } },
                publishedLessons: { 
                  $sum: { 
                    $cond: [
                      { $eq: ['$lessons.status', 'published'] }, 
                      1, 
                      0
                    ] 
                  } 
                },
                totalDuration: { 
                  $sum: { 
                    $cond: [
                      { $and: [
                        { $ifNull: ['$lessons.durationMs', false] },
                        { $eq: ['$lessons.status', 'published'] }
                      ]}, 
                      '$lessons.durationMs', 
                      0
                    ] 
                  } 
                }
              }
            }
          ])
        ]);

        const stats = lessonStats[0] || { totalLessons: 0, publishedLessons: 0, totalDuration: 0 };

        return {
          ...program.toJSON(),
          lessonCount: stats.totalLessons,
          publishedLessonCount: stats.publishedLessons,
          totalDurationMs: stats.totalDuration,
          assets: programAssets.reduce((acc, asset) => {
            // Pluralize asset type for frontend compatibility
            const assetTypeKey = asset.assetType === 'poster' ? 'posters' : asset.assetType;
            if (!acc[assetTypeKey]) acc[assetTypeKey] = {};
            if (!acc[assetTypeKey][asset.language])
              acc[assetTypeKey][asset.language] = {};
            acc[assetTypeKey][asset.language][asset.variant] = asset.url;
            return acc;
          }, {}),
        };
      })
    );

    res.json({
      programs: programsWithAssets,
      pagination: {
        cursor: hasMore ? programs[programs.length - 1]._id : null,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/programs
 * Create new program
 */
const createProgram = async (req, res, next) => {
  try {
    const {
      title,
      description,
      youtubeUrl,
      youtubeVideoId,
      difficulty,
      languagePrimary,
      languagesAvailable,
      topicIds,
      assets
    } = req.body;

    // Validate required fields
    if (!title || !languagePrimary || !languagesAvailable) {
      throw createError(
        "Title, primary language, and available languages are required",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Validate required assets
    const assetValidation = validateProgramAssets(assets, languagePrimary);
    if (!assetValidation.isValid) {
      throw createError(
        assetValidation.error,
        400,
        "VALIDATION_ERROR"
      );
    }

    // Validate topics exist if provided
    if (topicIds && topicIds.length > 0) {
      const topics = await Topic.find({ _id: { $in: topicIds } });
      if (topics.length !== topicIds.length) {
        throw createError(
          "One or more topics not found",
          400,
          "VALIDATION_ERROR"
        );
      }
    }

    // Create the program first
    const program = new Program({
      title,
      description,
      youtubeUrl,
      youtubeVideoId,
      difficulty: difficulty || "beginner",
      languagePrimary,
      languagesAvailable,
      topicIds: topicIds || [],
      status: "draft",
    });

    await program.save();

    // Store assets in ProgramAsset collection if provided
    if (assets && assets.posters && assets.posters[languagePrimary]) {
      const posterAssets = assets.posters[languagePrimary];
      const assetPromises = Object.entries(posterAssets).map(([variant, url]) => {
        if (url && url.trim()) {
          const asset = new ProgramAsset({
            programId: program._id,
            language: languagePrimary,
            variant,
            assetType: 'poster',
            url: url.trim()
          });
          return asset.save();
        }
        return null;
      }).filter(Boolean);

      if (assetPromises.length > 0) {
        await Promise.all(assetPromises);
      }
    }

    logger.info("Program created", {
      programId: program._id,
      title: program.title,
      languagePrimary,
      topicIds: topicIds || [],
      hasAssets: !!(assets && assets.posters),
      userId: req.user._id,
      correlationId: req.correlationId,
    });

    // Populate topics for response
    await program.populate("topicIds", "name");

    // Get the created assets for response
    const programAssets = await ProgramAsset.find({ 
      programId: program._id,
      assetType: 'poster'
    });

    const programWithAssets = {
      ...program.toJSON(),
      assets: programAssets.reduce((acc, asset) => {
        const assetTypeKey = asset.assetType === 'poster' ? 'posters' : asset.assetType;
        if (!acc[assetTypeKey]) acc[assetTypeKey] = {};
        if (!acc[assetTypeKey][asset.language])
          acc[assetTypeKey][asset.language] = {};
        acc[assetTypeKey][asset.language][asset.variant] = asset.url;
        return acc;
      }, {}),
    };

    res.status(201).json({
      message: "Program created successfully",
      program: programWithAssets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/programs/:id
 * Get program by ID
 */
const getProgram = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id).populate(
      "topicIds",
      "name"
    );

    if (!program) {
      throw createError("Program not found", 404, "RESOURCE_NOT_FOUND");
    }

    // Get assets using ProgramAsset model (not LessonAsset)
    const ProgramAsset = require('../models/ProgramAsset');
    const programAssets = await ProgramAsset.find({ 
      programId: program._id,
      assetType: 'poster'
    });
    
    const programWithAssets = {
      ...program.toJSON(),
      assets: programAssets.reduce((acc, asset) => {
        // Pluralize asset type for frontend compatibility
        const assetTypeKey = asset.assetType === 'poster' ? 'posters' : asset.assetType;
        if (!acc[assetTypeKey]) acc[assetTypeKey] = {};
        if (!acc[assetTypeKey][asset.language])
          acc[assetTypeKey][asset.language] = {};
        acc[assetTypeKey][asset.language][asset.variant] = asset.url;
        return acc;
      }, {}),
    };

    res.json(programWithAssets);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/programs/:id
 * Update program
 */
const updateProgram = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      throw createError("Program not found", 404, "RESOURCE_NOT_FOUND");
    }

    const {
      title,
      description,
      languagePrimary,
      languagesAvailable,
      topicIds,
      status,
    } = req.body;

    // Validate topics exist
    if (topicIds && topicIds.length > 0) {
      const topics = await Topic.find({ _id: { $in: topicIds } });
      if (topics.length !== topicIds.length) {
        throw createError(
          "One or more topics not found",
          400,
          "VALIDATION_ERROR"
        );
      }
    }

    // Update fields
    if (title !== undefined) program.title = title;
    if (description !== undefined) program.description = description;
    if (languagePrimary !== undefined)
      program.languagePrimary = languagePrimary;
    if (languagesAvailable !== undefined)
      program.languagesAvailable = languagesAvailable;
    if (topicIds !== undefined) program.topicIds = topicIds;
    if (status !== undefined) program.status = status;

    await program.save();
    await program.populate("topicIds", "name");

    logger.info("Program updated", {
      programId: program._id,
      title: program.title,
      userId: req.user._id,
      correlationId: req.correlationId,
    });

    res.json(program);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/programs/:id
 * Delete program
 */
const deleteProgram = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      throw createError("Program not found", 404, "RESOURCE_NOT_FOUND");
    }

    // Delete associated assets
    await ProgramAsset.deleteMany({ programId: program._id });

    // Delete the program (cascade delete will handle terms and lessons)
    await Program.findByIdAndDelete(req.params.id);

    logger.info("Program deleted", {
      programId: program._id,
      title: program.title,
      userId: req.user._id,
      correlationId: req.correlationId,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/programs/:id/publish
 * Publish program
 */
const publishProgram = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      throw createError("Program not found", 404, "RESOURCE_NOT_FOUND");
    }

    const { languages = [] } = req.body;

    // Validate that program has required assets for selected languages
    const requiredVariants = ["portrait", "landscape"];
    for (const language of languages) {
      for (const variant of requiredVariants) {
        const asset = await ProgramAsset.findOne({
          programId: program._id,
          language,
          variant,
          assetType: "poster",
        });
        if (!asset) {
          throw createError(
            `Missing required ${variant} poster for ${language.toUpperCase()} language`,
            400,
            "VALIDATION_ERROR"
          );
        }
      }
    }

    program.status = "published";
    program.publishedAt = new Date();
    program.publishedLanguages =
      languages.length > 0 ? languages : program.languagesAvailable;

    await program.save();

    logger.info("Program published", {
      programId: program._id,
      title: program.title,
      languages: program.publishedLanguages,
      userId: req.user._id,
      correlationId: req.correlationId,
    });

    res.json(program);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/programs/:id/schedule
 * Schedule program publishing
 */
const scheduleProgram = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      throw createError("Program not found", 404, "RESOURCE_NOT_FOUND");
    }

    const { scheduledPublishAt, languages = [] } = req.body;

    if (!scheduledPublishAt) {
      throw createError(
        "Scheduled publish date is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const scheduledDate = new Date(scheduledPublishAt);
    if (scheduledDate <= new Date()) {
      throw createError(
        "Scheduled date must be in the future",
        400,
        "VALIDATION_ERROR"
      );
    }

    // Validate that program has required assets for selected languages
    const requiredVariants = ["portrait", "landscape"];
    for (const language of languages) {
      for (const variant of requiredVariants) {
        const asset = await ProgramAsset.findOne({
          programId: program._id,
          language,
          variant,
          assetType: "poster",
        });
        if (!asset) {
          throw createError(
            `Missing required ${variant} poster for ${language.toUpperCase()} language`,
            400,
            "VALIDATION_ERROR"
          );
        }
      }
    }

    program.status = "scheduled";
    program.scheduledPublishAt = scheduledDate;
    program.publishedLanguages =
      languages.length > 0 ? languages : program.languagesAvailable;

    await program.save();

    logger.info("Program scheduled for publishing", {
      programId: program._id,
      title: program.title,
      scheduledPublishAt: scheduledDate,
      languages: program.publishedLanguages,
      userId: req.user._id,
      correlationId: req.correlationId,
    });

    res.json(program);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/programs/:id/archive
 * Archive program
 */
const archiveProgram = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      throw createError("Program not found", 404, "RESOURCE_NOT_FOUND");
    }

    program.status = "archived";
    program.archivedAt = new Date();

    await program.save();

    logger.info("Program archived", {
      programId: program._id,
      title: program.title,
      userId: req.user._id,
      correlationId: req.correlationId,
    });

    res.json(program);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrograms,
  createProgram,
  getProgram,
  updateProgram,
  deleteProgram,
  publishProgram,
  scheduleProgram,
  archiveProgram,
  updateProgramAssets,
};
