/**
 * Asset controller for file upload and management
 */
const ProgramAsset = require('../models/ProgramAsset');
const LessonAsset = require('../models/LessonAsset');
const { uploadToGridFS, deleteFileFromGridFS } = require('../services/fileUploadService');
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
 * POST /api/admin/programs/:id/assets
 * Upload program asset
 */
const uploadProgramAsset = async (req, res, next) => {
  try {
    const { id: programId } = req.params;
    const { language, variant } = req.body;

    if (!language || !variant) {
      throw createError('Language and variant are required', 400, 'VALIDATION_ERROR');
    }

    if (!req.file) {
      throw createError('No file uploaded', 400, 'VALIDATION_ERROR');
    }

    const { buffer, originalname, mimetype, size } = req.file;

    // Upload file to GridFS
    const fileId = await uploadToGridFS(buffer, originalname, mimetype, {
      programId,
      language,
      variant,
      assetType: 'poster'
    });

    // Check if asset already exists and delete old file
    const existingAsset = await ProgramAsset.findOne({
      programId,
      language,
      variant,
      assetType: 'poster'
    });

    if (existingAsset) {
      // Delete old file from GridFS
      try {
        await deleteFileFromGridFS(existingAsset.fileId);
      } catch (error) {
        logger.warn('Failed to delete old asset file', { fileId: existingAsset.fileId, error: error.message });
      }
      
      // Update existing asset
      existingAsset.fileId = fileId;
      existingAsset.filename = originalname;
      existingAsset.mimeType = mimetype;
      existingAsset.fileSize = size;
      await existingAsset.save();
      
      logger.info('Program asset updated', {
        assetId: existingAsset._id,
        fileId,
        programId,
        language,
        variant,
        userId: req.user._id,
        correlationId: req.correlationId
      });

      res.status(200).json(existingAsset);
    } else {
      // Create new asset
      const asset = new ProgramAsset({
        programId,
        language,
        variant,
        assetType: 'poster',
        fileId,
        filename: originalname,
        mimeType: mimetype,
        fileSize: size
      });
      await asset.save();

      logger.info('Program asset uploaded', {
        assetId: asset._id,
        fileId,
        programId,
        language,
        variant,
        userId: req.user._id,
        correlationId: req.correlationId
      });

      res.status(201).json(asset);
    }

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/programs/:id/assets/:assetId
 * Delete program asset
 */
const deleteProgramAsset = async (req, res, next) => {
  try {
    const { assetId } = req.params;

    const asset = await ProgramAsset.findById(assetId);
    if (!asset) {
      throw createError('Asset not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Delete file from GridFS
    try {
      await deleteFileFromGridFS(asset.fileId);
    } catch (error) {
      logger.warn('Failed to delete asset file from GridFS', { fileId: asset.fileId, error: error.message });
    }

    // Delete asset record
    await ProgramAsset.findByIdAndDelete(assetId);

    logger.info('Program asset deleted', {
      assetId: asset._id,
      fileId: asset.fileId,
      programId: asset.programId,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/assets/:fileId
 * Serve asset file
 */
const serveAsset = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { getFileFromGridFS, getFileInfo } = require('../services/fileUploadService');

    // Get file info
    const fileInfo = await getFileInfo(fileId);
    
    // Set appropriate headers
    res.set({
      'Content-Type': fileInfo.metadata.mimetype,
      'Content-Length': fileInfo.length,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'ETag': fileInfo._id.toString()
    });

    // Stream file
    const downloadStream = await getFileFromGridFS(fileId);
    downloadStream.pipe(res);

  } catch (error) {
    if (error.message === 'File not found') {
      res.status(404).json({ error: 'Asset not found' });
    } else {
      next(error);
    }
  }
};

/**
 * POST /api/admin/lessons/:id/assets
 * Upload lesson asset
 */
const uploadLessonAsset = async (req, res, next) => {
  try {
    const { id: lessonId } = req.params;
    const { language, variant, url } = req.body;

    if (!language || !variant || !url) {
      throw createError('Language, variant, and URL are required', 400, 'VALIDATION_ERROR');
    }

    // Check if asset already exists and update or create
    const existingAsset = await LessonAsset.findOne({
      lessonId,
      language,
      variant,
      assetType: 'thumbnail'
    });

    let asset;
    if (existingAsset) {
      existingAsset.url = url;
      asset = await existingAsset.save();
    } else {
      asset = new LessonAsset({
        lessonId,
        language,
        variant,
        assetType: 'thumbnail',
        url
      });
      await asset.save();
    }

    logger.info('Lesson asset uploaded', {
      assetId: asset._id,
      lessonId,
      language,
      variant,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(201).json(asset);

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/lessons/:id/assets/:assetId
 * Delete lesson asset
 */
const deleteLessonAsset = async (req, res, next) => {
  try {
    const { assetId } = req.params;

    const asset = await LessonAsset.findById(assetId);
    if (!asset) {
      throw createError('Asset not found', 404, 'RESOURCE_NOT_FOUND');
    }

    await LessonAsset.findByIdAndDelete(assetId);

    logger.info('Lesson asset deleted', {
      assetId: asset._id,
      lessonId: asset.lessonId,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadProgramAsset,
  deleteProgramAsset,
  uploadLessonAsset,
  deleteLessonAsset,
  serveAsset
};