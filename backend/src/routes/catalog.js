/**
 * Public catalog API routes
 */
const express = require('express');
const catalogController = require('../controllers/catalogController');

const router = express.Router();

// Public catalog routes (no authentication required)
router.get('/programs', catalogController.getPrograms);
router.get('/programs/:id', catalogController.getProgram);
router.get('/lessons/:id', catalogController.getLesson);
router.get('/topics', catalogController.getTopics);

// Debug endpoint to check database contents
router.get('/debug/programs', catalogController.debugPrograms);

module.exports = router;