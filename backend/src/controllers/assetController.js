const ProgramAsset = require('../models/ProgramAsset');
const LessonAsset = require('../models/LessonAsset');
const logger = require('../config/logger');

const createError = (message, statusCode = 500, code = 'APPLICATION_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const uploadProgramAsset = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'File upload not implemented' });
  } catch (error) {
    next(error);
  }
};

const deleteProgramAsset = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'Asset deletion not implemented' });
  } catch (error) {
    next(error);
  }
};

const serveAsset = async (req, res, next) => {
  try {
    res.status(501).json({ message: 'Asset serving not implemented' });
  } catch (error) {
    next(error);
  }
};

const uploadLessonAsset = async (req, res, next) => {
  try {
    const { id: lessonId } = req.params;
    const { language, variant, url } = req.body;

    if (!language || !variant || !url) {
      throw createError('Language, variant, and URL are required', 400, 'VALIDATION_ERROR');
    }

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