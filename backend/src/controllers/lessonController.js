const Lesson = require('../models/Lesson');
const Term = require('../models/Term');
const LessonAsset = require('../models/LessonAsset');
const { withTransaction, withRetry } = require('../utils/concurrency');

const getLessons = async (req, res) => {
  try {
    const { termId } = req.params;

    if (!termId || !termId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid term ID' });
    }

    const lessons = await Lesson.find({ termId }).lean();

    const lessonsWithAssets = await Promise.all(
      lessons.map(async (lesson) => {
        const assets = await LessonAsset.find({ lessonId: lesson._id });
        return {
          ...lesson,
          assets: assets.reduce((acc, asset) => {
            const key = 'thumbnails';
            if (!acc[key]) acc[key] = {};
            if (!acc[key][asset.language]) acc[key][asset.language] = {};
            acc[key][asset.language][asset.variant] = asset.url;
            return acc;
          }, {})
        };
      })
    );

    lessonsWithAssets.sort((a, b) => a.lessonNumber - b.lessonNumber);

    res.json({ lessons: lessonsWithAssets });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createLesson = async (req, res) => {
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

    if (!termId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid term ID' });
    }

    // Use transaction to ensure atomicity
    const lesson = await withTransaction(async (session) => {
      const term = await Term.findById(termId).session(session);
      if (!term) {
        throw new Error('Term not found');
      }

      // Check for existing lesson with retry for race conditions
      const existingLesson = await Lesson.findOne({ termId, lessonNumber }).session(session);
      if (existingLesson) {
        throw new Error(`Lesson number ${lessonNumber} already exists`);
      }

      const newLesson = new Lesson({
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

      return await newLesson.save({ session });
    });

    res.status(201).json(lesson);
  } catch (error) {
    if (error.code === 11000 || error.message.includes('already exists')) {
      return res.status(409).json({ message: 'Lesson number already exists' });
    }
    console.error('Create lesson error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).lean();
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const assets = await LessonAsset.find({ lessonId: lesson._id });

    res.json({
      ...lesson,
      assets: assets.reduce((acc, asset) => {
        const key = 'thumbnails';
        if (!acc[key]) acc[key] = {};
        if (!acc[key][asset.language]) acc[key][asset.language] = {};
        acc[key][asset.language][asset.variant] = asset.url;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
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
    res.json(lesson);
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    await LessonAsset.deleteMany({ lessonId: lesson._id });
    await Lesson.findByIdAndDelete(req.params.id);

    res.status(204).send();
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const publishLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    await lesson.publish();
    res.json(lesson);
  } catch (error) {
    console.error('Publish lesson error:', error);
    res.status(400).json({ message: error.message });
  }
};

const scheduleLesson = async (req, res) => {
  try {
    const { publishAt } = req.body;

    if (!publishAt) {
      return res.status(400).json({ message: 'Publish date required' });
    }

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const publishAtDate = new Date(publishAt);
    if (publishAtDate <= new Date()) {
      return res.status(400).json({ message: 'Publish date must be in future' });
    }

    await lesson.schedule(publishAtDate);
    res.json(lesson);
  } catch (error) {
    console.error('Schedule lesson error:', error);
    res.status(400).json({ message: error.message });
  }
};

const archiveLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    await lesson.archive();
    res.json(lesson);
  } catch (error) {
    console.error('Archive lesson error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateLessonAssets = async (req, res) => {
  try {
    const { id } = req.params;
    const { language, assetType, assets } = req.body;

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (!language || !assetType || !assets) {
      return res.status(400).json({ message: 'Language, asset type, and assets required' });
    }

    await LessonAsset.deleteMany({
      lessonId: id,
      language,
      assetType
    });

    await Promise.all(
      Object.entries(assets).map(([variant, url]) =>
        new LessonAsset({
          lessonId: id,
          language,
          variant,
          assetType,
          url: url.trim()
        }).save()
      )
    );

    res.json({ 
      message: 'Assets updated',
      assets: Object.keys(assets)
    });
  } catch (error) {
    console.error('Update assets error:', error);
    res.status(500).json({ message: 'Server error' });
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