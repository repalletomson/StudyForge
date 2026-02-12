
const express = require('express');
const catalogController = require('../controllers/catalogController');

const router = express.Router();

router.get('/programs', catalogController.getPrograms);
router.get('/programs/:id', catalogController.getProgram);
router.get('/lessons/:id', catalogController.getLesson);
router.get('/topics', catalogController.getTopics);

router.get('/debug/programs', catalogController.debugPrograms);

module.exports = router;