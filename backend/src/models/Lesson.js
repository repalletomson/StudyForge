const mongoose = require('mongoose');
const { withTransaction, withOptimisticLocking } = require('../utils/concurrency');

const lessonSchema = new mongoose.Schema({
  termId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Term',
    required: true
  },
  lessonNumber: {
    type: Number,
    required: true,
    min: 1
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['video', 'article']
  },
  durationMs: Number,
  isPaid: {
    type: Boolean,
    default: false
  },
  contentLanguagePrimary: {
    type: String,
    required: true
  },
  contentLanguagesAvailable: {
    type: [String],
    required: true
  },
  contentUrlsByLanguage: {
    type: Map,
    of: String,
    default: {}
  },
  articleContentByLanguage: {
    type: Map,
    of: String,
    default: {}
  },
  subtitleLanguages: [String],
  subtitleUrlsByLanguage: {
    type: Map,
    of: String,
    default: {}
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'archived'],
    default: 'draft'
  },
  publishAt: Date,
  publishedAt: Date,
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  optimisticConcurrency: true // Enable Mongoose optimistic concurrency
});

lessonSchema.index({ termId: 1, lessonNumber: 1 }, { unique: true });
lessonSchema.index({ status: 1, publishAt: 1 });
lessonSchema.index({ version: 1 }); // Index for optimistic locking

lessonSchema.methods.validateAssets = async function() {
  const LessonAsset = mongoose.model('LessonAsset');
  
  const assets = await LessonAsset.find({
    lessonId: this._id,
    language: this.contentLanguagePrimary,
    assetType: 'thumbnail'
  });
  
  const variants = assets.map(a => a.variant);
  const missing = ['portrait', 'landscape'].filter(v => !variants.includes(v));
  
  return {
    isValid: missing.length === 0,
    missingVariants: missing,
    message: missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'Valid'
  };
};

lessonSchema.methods.publish = async function() {
  if (!['draft', 'archived'].includes(this.status)) {
    throw new Error(`Cannot publish ${this.status} lesson`);
  }
  
  const validation = await this.validateAssets();
  if (!validation.isValid) {
    throw new Error(validation.message);
  }
  
  // Use transaction for atomic publish operation
  return await withTransaction(async (session) => {
    // Update lesson status with optimistic locking
    const updatedLesson = await withOptimisticLocking(this, async (lesson) => {
      lesson.status = 'published';
      lesson.publishedAt = new Date();
      lesson.publishAt = undefined;
    });
    
    // Auto-publish program if this is the first lesson
    const Term = mongoose.model('Term');
    const Program = mongoose.model('Program');
    
    const term = await Term.findById(this.termId).session(session);
    if (term) {
      const program = await Program.findById(term.programId).session(session);
      if (program && program.status === 'draft') {
        // Check if this is the first published lesson in the program
        const publishedLessonsCount = await mongoose.model('Lesson').countDocuments({
          termId: { $in: await Term.find({ programId: term.programId }).distinct('_id') },
          status: 'published'
        }).session(session);
        
        if (publishedLessonsCount === 1) { // This is the first published lesson
          await withOptimisticLocking(program, async (prog) => {
            prog.status = 'published';
            prog.publishedAt = prog.publishedAt || new Date();
          });
        }
      }
    }
    
    return updatedLesson;
  });
};

lessonSchema.methods.schedule = async function(publishAt) {
  if (!['draft', 'archived'].includes(this.status)) {
    throw new Error(`Cannot schedule ${this.status} lesson`);
  }
  
  if (!publishAt || publishAt <= new Date()) {
    throw new Error('Publish date must be in future');
  }
  
  return await withOptimisticLocking(this, async (lesson) => {
    lesson.status = 'scheduled';
    lesson.publishAt = publishAt;
    lesson.publishedAt = undefined;
  });
};

lessonSchema.methods.archive = async function() {
  return await withOptimisticLocking(this, async (lesson) => {
    lesson.status = 'archived';
    lesson.publishAt = undefined;
  });
};

module.exports = mongoose.model('Lesson', lessonSchema);