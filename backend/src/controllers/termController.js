/**
 * Term controller for CRUD operations
 */
const Term = require('../models/Term');
const Program = require('../models/Program');
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
 * GET /api/admin/programs/:programId/terms
 * Get terms for a program
 */
const getTerms = async (req, res, next) => {
  try {
    const { programId } = req.params;

    // Verify program exists
    const program = await Program.findById(programId);
    if (!program) {
      throw createError('Program not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const terms = await Term.find({ programId }).sort({ termNumber: 1 });
    res.json({ terms });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/programs/:programId/terms
 * Create new term
 */
const createTerm = async (req, res, next) => {
  try {
    const { programId } = req.params;
    const { termNumber, title } = req.body;

    // Verify program exists
    const program = await Program.findById(programId);
    if (!program) {
      throw createError('Program not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const term = new Term({
      programId,
      termNumber,
      title
    });

    await term.save();

    logger.info('Term created', {
      termId: term._id,
      programId,
      termNumber,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.status(201).json(term);

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/terms/:id
 * Get term by ID
 */
const getTerm = async (req, res, next) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term) {
      throw createError('Term not found', 404, 'RESOURCE_NOT_FOUND');
    }

    res.json(term);

  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/terms/:id
 * Update term
 */
const updateTerm = async (req, res, next) => {
  try {
    const { title } = req.body;

    const term = await Term.findById(req.params.id);
    if (!term) {
      throw createError('Term not found', 404, 'RESOURCE_NOT_FOUND');
    }

    if (title !== undefined) term.title = title;
    await term.save();

    logger.info('Term updated', {
      termId: term._id,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(term);

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/terms/:id
 * Delete term and all associated lessons
 */
const deleteTerm = async (req, res, next) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term) {
      throw createError('Term not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Get the program before deletion
    const program = await Program.findById(term.programId);

    // Delete all lessons associated with this term
    const Lesson = require('../models/Lesson');
    const LessonAsset = require('../models/LessonAsset');
    
    const lessons = await Lesson.find({ termId: term._id });
    
    // Delete lesson assets for all lessons in this term
    for (const lesson of lessons) {
      await LessonAsset.deleteMany({ lessonId: lesson._id });
    }
    
    // Delete all lessons in this term
    await Lesson.deleteMany({ termId: term._id });

    // Delete the term itself
    await Term.findByIdAndDelete(req.params.id);

    // Check if program should be reverted to draft status
    if (program && program.status === 'published') {
      const wasReverted = await program.autoDraft();
      
      if (wasReverted && program.status === 'draft') {
        logger.info('Program reverted to draft status - no published lessons remain after term deletion', {
          programId: program._id,
          programTitle: program.title,
          termId: term._id,
          deletedLessonsCount: lessons.length,
          userId: req.user._id,
          correlationId: req.correlationId
        });
      }
    }

    logger.info('Term and associated lessons deleted', {
      termId: term._id,
      programId: term.programId,
      deletedLessonsCount: lessons.length,
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
 * POST /api/admin/terms/:id/close
 * Close term (hide lessons)
 */
const closeTerm = async (req, res, next) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term) {
      throw createError('Term not found', 404, 'RESOURCE_NOT_FOUND');
    }

    await term.close();

    logger.info('Term closed', {
      termId: term._id,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(term);

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/terms/:id/open
 * Open term (show lessons)
 */
const openTerm = async (req, res, next) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term) {
      throw createError('Term not found', 404, 'RESOURCE_NOT_FOUND');
    }

    await term.open();

    logger.info('Term opened', {
      termId: term._id,
      userId: req.user._id,
      correlationId: req.correlationId
    });

    res.json(term);

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTerms,
  createTerm,
  getTerm,
  updateTerm,
  deleteTerm,
  closeTerm,
  openTerm
};