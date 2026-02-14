const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const programController = require('../controllers/programController');
const termController = require('../controllers/termController');
const lessonController = require('../controllers/lessonController');
const topicController = require('../controllers/topicController');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);

router.get('/programs', authorize(['admin', 'editor', 'viewer']), programController.getPrograms);
router.get('/programs/publishing-data', authorize(['admin', 'editor', 'viewer']), programController.getPublishingData);
router.post('/programs', authorize(['admin', 'editor']), programController.createProgram);
router.get('/programs/:id', authorize(['admin', 'editor', 'viewer']), programController.getProgram);
router.put('/programs/:id', authorize(['admin', 'editor']), programController.updateProgram);
router.delete('/programs/:id', authorize(['admin', 'editor']), programController.deleteProgram);
router.put('/programs/:id/assets', authorize(['admin', 'editor']), programController.updateProgramAssets);

router.get('/programs/:programId/terms', authorize(['admin', 'editor', 'viewer']), termController.getTerms);
router.post('/programs/:programId/terms', authorize(['admin', 'editor']), termController.createTerm);
router.get('/terms/:id', authorize(['admin', 'editor', 'viewer']), termController.getTerm);
router.put('/terms/:id', authorize(['admin', 'editor']), termController.updateTerm);
router.delete('/terms/:id', authorize(['admin', 'editor']), termController.deleteTerm);
router.post('/terms/:id/close', authorize(['admin', 'editor', 'viewer']), termController.closeTerm);
router.post('/terms/:id/open', authorize(['admin', 'editor', 'viewer']), termController.openTerm);

router.get('/terms/:termId/lessons', authorize(['admin', 'editor', 'viewer']), lessonController.getLessons);
router.post('/terms/:termId/lessons', authorize(['admin', 'editor']), lessonController.createLesson);
router.get('/lessons/:id', authorize(['admin', 'editor', 'viewer']), lessonController.getLesson);
router.put('/lessons/:id', authorize(['admin', 'editor']), lessonController.updateLesson);
router.delete('/lessons/:id', authorize(['admin', 'editor']), lessonController.deleteLesson);
router.post('/lessons/:id/publish', authorize(['admin', 'editor']), lessonController.publishLesson);
router.post('/lessons/:id/schedule', authorize(['admin', 'editor']), lessonController.scheduleLesson);
router.post('/lessons/:id/archive', authorize(['admin', 'editor']), lessonController.archiveLesson);
router.put('/lessons/:id/assets', authorize(['admin', 'editor']), lessonController.updateLessonAssets);

router.get('/topics', authorize(['admin', 'editor', 'viewer']), topicController.getTopics);
router.post('/topics', authorize(['admin', 'editor']), topicController.createTopic);
router.get('/topics/:id', authorize(['admin', 'editor', 'viewer']), topicController.getTopic);
router.put('/topics/:id', authorize(['admin', 'editor']), topicController.updateTopic);
router.delete('/topics/:id', authorize(['admin', 'editor']), topicController.deleteTopic);

router.get('/users', authorize(['admin']), userController.getUsers);
router.post('/users', authorize(['admin']), userController.createUser);
router.get('/users/debug', authorize(['admin']), userController.debugUsers); // Debug endpoint
router.get('/users/:id', authorize(['admin']), userController.getUser);
router.put('/users/:id', authorize(['admin']), userController.updateUser);
router.patch('/users/:id/status', authorize(['admin']), userController.toggleUserStatus);
router.delete('/users/:id', authorize(['admin']), userController.deleteUser);

module.exports = router;