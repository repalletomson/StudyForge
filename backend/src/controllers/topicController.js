const Topic = require('../models/Topic');
const logger = require('../config/logger');

const createError = (message, statusCode = 500, code = 'APPLICATION_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const getTopics = async (req, res, next) => {
  try {
    const topics = await Topic.find({ isActive: true }).sort({ name: 1 });
    res.json({ topics });

  } catch (error) {
    next(error);
  }
};

const createTopic = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw createError('Topic name is required', 400, 'VALIDATION_ERROR');
    }

    const topic = new Topic({
      name,
      description
    });

    await topic.save();

    logger.info('Topic created', {
      topicId: topic._id,
      name: topic.name,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(201).json(topic);

  } catch (error) {
    next(error);
  }
};

const getTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      throw createError('Topic not found', 404, 'RESOURCE_NOT_FOUND');
    }

    res.json(topic);

  } catch (error) {
    next(error);
  }
};

const updateTopic = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;

    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      throw createError('Topic not found', 404, 'RESOURCE_NOT_FOUND');
    }

    if (name !== undefined) topic.name = name;
    if (description !== undefined) topic.description = description;
    if (isActive !== undefined) topic.isActive = isActive;

    await topic.save();

    logger.info('Topic updated', {
      topicId: topic._id,
      name: topic.name,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(topic);

  } catch (error) {
    next(error);
  }
};

const deleteTopic = async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      throw createError('Topic not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Check if topic is used by any programs
    const programsCount = await topic.getProgramsCount();
    if (programsCount > 0) {
      throw createError('Cannot delete topic that is used by programs', 400, 'VALIDATION_ERROR');
    }

    await Topic.findByIdAndDelete(req.params.id);

    logger.info('Topic deleted', {
      topicId: topic._id,
      name: topic.name,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTopics,
  createTopic,
  getTopic,
  updateTopic,
  deleteTopic
};