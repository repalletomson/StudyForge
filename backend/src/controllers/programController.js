const Program = require('../models/Program');
const Topic = require('../models/Topic');
const ProgramAsset = require('../models/ProgramAsset');
const Term = require('../models/Term');

const buildAssetStructure = (assets) => {
  return assets.reduce((acc, asset) => {
    const key = 'posters';
    if (!acc[key]) acc[key] = {};
    if (!acc[key][asset.language]) acc[key][asset.language] = {};
    acc[key][asset.language][asset.variant] = asset.url;
    return acc;
  }, {});
};

const saveAssets = async (programId, language, assets) => {
  await ProgramAsset.deleteMany({ programId, language, assetType: 'poster' });
  
  await Promise.all(
    Object.entries(assets)
      .filter(([_, url]) => url?.trim())
      .map(([variant, url]) =>
        new ProgramAsset({
          programId,
          language,
          variant,
          assetType: 'poster',
          url: url.trim()
        }).save()
      )
  );
};

const getPrograms = async (req, res) => {
  try {
    const { status, language, topic, cursor, limit = 20, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (language) filter.languagePrimary = language;
    if (search) filter.$text = { $search: search };

    if (topic) {
      const topicDoc = await Topic.findOne({ name: topic });
      if (topicDoc) filter.topicIds = topicDoc._id;
    }

    if (cursor) filter.createdAt = { $lt: new Date(cursor) };

    const programs = await Program.find(filter)
      .populate('topicIds', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) + 1);

    const hasMore = programs.length > limit;
    if (hasMore) programs.pop();

    const programsWithData = await Promise.all(
      programs.map(async (program) => {
        const [assets, stats] = await Promise.all([
          ProgramAsset.find({ programId: program._id, assetType: 'poster' }),
          Term.aggregate([
            { $match: { programId: program._id } },
            {
              $lookup: {
                from: 'lessons',
                localField: '_id',
                foreignField: 'termId',
                as: 'lessons'
              }
            },
            { $unwind: { path: '$lessons', preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: '$programId',
                totalLessons: { $sum: { $cond: [{ $ifNull: ['$lessons', false] }, 1, 0] } },
                publishedLessons: { 
                  $sum: { $cond: [{ $eq: ['$lessons.status', 'published'] }, 1, 0] } 
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

        const lessonStats = stats[0] || { totalLessons: 0, publishedLessons: 0, totalDuration: 0 };

        return {
          ...program.toJSON(),
          lessonCount: lessonStats.totalLessons,
          publishedLessonCount: lessonStats.publishedLessons,
          totalDurationMs: lessonStats.totalDuration,
          assets: buildAssetStructure(assets)
        };
      })
    );

    res.json({
      programs: programsWithData,
      pagination: {
        cursor: hasMore ? programs[programs.length - 1].createdAt : null,
        hasMore
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createProgram = async (req, res) => {
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

    if (!title || !languagePrimary || !languagesAvailable) {
      return res.status(400).json({ message: 'Title, primary language, and available languages required' });
    }

    if (!assets?.posters?.[languagePrimary]?.portrait || !assets?.posters?.[languagePrimary]?.landscape) {
      return res.status(400).json({ message: 'Portrait and landscape posters required' });
    }

    if (topicIds && topicIds.length > 0) {
      const topics = await Topic.find({ _id: { $in: topicIds } });
      if (topics.length !== topicIds.length) {
        return res.status(400).json({ message: 'Invalid topics' });
      }
    }

    const program = new Program({
      title,
      description,
      youtubeUrl,
      youtubeVideoId,
      difficulty: difficulty || 'beginner',
      languagePrimary,
      languagesAvailable,
      topicIds: topicIds || [],
      status: 'draft'
    });

    await program.save();

    if (assets?.posters?.[languagePrimary]) {
      await saveAssets(program._id, languagePrimary, assets.posters[languagePrimary]);
    }

    await program.populate('topicIds', 'name');

    const programAssets = await ProgramAsset.find({ 
      programId: program._id,
      assetType: 'poster'
    });

    res.status(201).json({
      message: 'Program created',
      program: {
        ...program.toJSON(),
        assets: buildAssetStructure(programAssets)
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).populate('topicIds', 'name');

    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const assets = await ProgramAsset.find({ 
      programId: program._id,
      assetType: 'poster'
    });

    res.json({
      ...program.toJSON(),
      assets: buildAssetStructure(assets)
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    const {
      title,
      description,
      youtubeUrl,
      youtubeVideoId,
      difficulty,
      languagePrimary,
      languagesAvailable,
      topicIds,
      status,
      assets
    } = req.body;

    if (topicIds && topicIds.length > 0) {
      const topics = await Topic.find({ _id: { $in: topicIds } });
      if (topics.length !== topicIds.length) {
        return res.status(400).json({ message: 'Invalid topics' });
      }
    }

    if (title !== undefined) program.title = title;
    if (description !== undefined) program.description = description;
    if (youtubeUrl !== undefined) program.youtubeUrl = youtubeUrl;
    if (youtubeVideoId !== undefined) program.youtubeVideoId = youtubeVideoId;
    if (difficulty !== undefined) program.difficulty = difficulty;
    if (languagePrimary !== undefined) program.languagePrimary = languagePrimary;
    if (languagesAvailable !== undefined) program.languagesAvailable = languagesAvailable;
    if (topicIds !== undefined) program.topicIds = topicIds;
    if (status !== undefined) program.status = status;

    await program.save();

    if (assets?.posters) {
      for (const [language, postersByVariant] of Object.entries(assets.posters)) {
        await saveAssets(program._id, language, postersByVariant);
      }
    }

    await program.populate('topicIds', 'name');

    const programAssets = await ProgramAsset.find({ 
      programId: program._id,
      assetType: 'poster'
    });

    res.json({
      ...program.toJSON(),
      assets: buildAssetStructure(programAssets)
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProgram = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    await ProgramAsset.deleteMany({ programId: program._id });
    await Program.findByIdAndDelete(req.params.id);

    res.status(204).send();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProgramAssets = async (req, res) => {
  try {
    const { id } = req.params;
    const { language, assetType, assets } = req.body;

    const program = await Program.findById(id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    if (!language || !assetType || !assets) {
      return res.status(400).json({ message: 'Language, asset type, and assets required' });
    }

    await saveAssets(id, language, assets);

    res.json({ 
      message: 'Assets updated',
      assets: Object.keys(assets)
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPrograms,
  createProgram,
  getProgram,
  updateProgram,
  deleteProgram,
  updateProgramAssets
};