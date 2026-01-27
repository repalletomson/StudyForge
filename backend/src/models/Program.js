/**
 * Program model for educational programs
 */
const mongoose = require('mongoose');
const { PROGRAM_STATUS } = require('./constants');

const programSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    maxlength: 2000
  },
  languagePrimary: {
    type: String,
    required: true,
    maxlength: 10
  },
  languagesAvailable: {
    type: [String],
    required: true,
    validate: {
      validator: function(languages) {
        return languages.includes(this.languagePrimary);
      },
      message: 'Primary language must be included in available languages'
    }
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(PROGRAM_STATUS),
    default: PROGRAM_STATUS.DRAFT
  },
  publishedAt: {
    type: Date
  },
  scheduledPublishAt: {
    type: Date
  },
  archivedAt: {
    type: Date
  },
  publishedLanguages: {
    type: [String],
    default: []
  },
  topicIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
programSchema.index({ status: 1, languagePrimary: 1, publishedAt: -1 });
programSchema.index({ topicIds: 1 });
programSchema.index({ createdAt: -1 });
programSchema.index({ title: 'text', description: 'text' });

/**
 * Auto-publish program when first lesson is published
 */
programSchema.methods.autoPublish = async function() {
  if (this.status === PROGRAM_STATUS.DRAFT) {
    this.status = PROGRAM_STATUS.PUBLISHED;
    this.publishedAt = this.publishedAt || new Date();
    return this.save();
  }
  return this;
};

/**
 * Auto-draft program when no published lessons remain
 */
programSchema.methods.autoDraft = async function() {
  if (this.status === PROGRAM_STATUS.PUBLISHED) {
    const publishedLessonsCount = await this.getPublishedLessonsCount();
    if (publishedLessonsCount === 0) {
      this.status = PROGRAM_STATUS.DRAFT;
      this.publishedAt = null;
      this.publishedLanguages = [];
      return this.save();
    }
  }
  return this;
};

/**
 * Get terms count for this program
 * @returns {Promise<number>}
 */
programSchema.methods.getTermsCount = async function() {
  const Term = mongoose.model('Term');
  return Term.countDocuments({ programId: this._id });
};

/**
 * Get published lessons count for this program
 * @returns {Promise<number>}
 */
programSchema.methods.getPublishedLessonsCount = async function() {
  const Term = mongoose.model('Term');
  const Lesson = mongoose.model('Lesson');
  
  const terms = await Term.find({ programId: this._id }).select('_id');
  const termIds = terms.map(term => term._id);
  
  return Lesson.countDocuments({ 
    termId: { $in: termIds }, 
    status: 'published' 
  });
};

/**
 * Validate required assets for primary language
 * @returns {Promise<Object>}
 */
programSchema.methods.validateAssets = async function() {
  const ProgramAsset = mongoose.model('ProgramAsset');
  
  const requiredVariants = ['portrait', 'landscape'];
  const assets = await ProgramAsset.find({
    programId: this._id,
    language: this.languagePrimary,
    assetType: 'poster'
  });
  
  const availableVariants = assets.map(asset => asset.variant);
  const missingVariants = requiredVariants.filter(variant => 
    !availableVariants.includes(variant)
  );
  
  return {
    isValid: missingVariants.length === 0,
    missingVariants,
    message: missingVariants.length > 0 
      ? `Missing required poster variants: ${missingVariants.join(', ')}`
      : 'All required assets are present'
  };
};

// Export constants
programSchema.statics.STATUS = PROGRAM_STATUS;

module.exports = mongoose.model('Program', programSchema);