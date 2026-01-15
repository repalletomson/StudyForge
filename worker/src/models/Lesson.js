/**
 * Lesson model for worker service
 * (Copy of backend/src/models/Lesson.js)
 */
const mongoose = require('mongoose');
const { LESSON_STATUS, CONTENT_TYPE, PROGRAM_STATUS } = require('./constants');

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
    trim: true,
    maxlength: 255
  },
  contentType: {
    type: String,
    required: true,
    enum: Object.values(CONTENT_TYPE)
  },
  durationMs: {
    type: Number,
    min: 0,
    validate: {
      validator: function(duration) {
        return this.contentType !== CONTENT_TYPE.VIDEO || duration != null;
      },
      message: 'Duration is required for video content'
    }
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  contentLanguagePrimary: {
    type: String,
    required: true,
    maxlength: 10
  },
  contentLanguagesAvailable: {
    type: [String],
    required: true,
    validate: {
      validator: function(languages) {
        return languages.includes(this.contentLanguagePrimary);
      },
      message: 'Primary content language must be included in available languages'
    }
  },
  contentUrlsByLanguage: {
    type: Map,
    of: String,
    default: new Map(),
    validate: {
      validator: function (urls) {
        // For video content type, require content URL for primary language
        if (this.contentType === CONTENT_TYPE.VIDEO) {
          return urls && urls.has(this.contentLanguagePrimary);
        }
        return true;
      },
      message: "Content URL for primary language is required for video lessons",
    },
  },
  articleContentByLanguage: {
    type: Map,
    of: String,
    default: new Map(),
    validate: {
      validator: function (content) {
        // For article content type, require article content for primary language
        if (this.contentType === CONTENT_TYPE.ARTICLE) {
          return content && content.has(this.contentLanguagePrimary) && 
                 content.get(this.contentLanguagePrimary)?.trim();
        }
        return true;
      },
      message: "Article content for primary language is required for article lessons",
    },
  },
  subtitleLanguages: {
    type: [String],
    default: []
  },
  subtitleUrlsByLanguage: {
    type: Map,
    of: String,
    default: new Map()
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(LESSON_STATUS),
    default: LESSON_STATUS.DRAFT
  },
  publishAt: {
    type: Date,
    validate: {
      validator: function(publishAt) {
        return this.status !== LESSON_STATUS.SCHEDULED || publishAt != null;
      },
      message: 'Publish date is required for scheduled lessons'
    }
  },
  publishedAt: {
    type: Date,
    validate: {
      validator: function(publishedAt) {
        return this.status !== LESSON_STATUS.PUBLISHED || publishedAt != null;
      },
      message: 'Published date is required for published lessons'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      // Convert Map to Object for JSON serialization
      if (
        ret.contentUrlsByLanguage &&
        ret.contentUrlsByLanguage instanceof Map
      ) {
        ret.contentUrlsByLanguage = Object.fromEntries(
          ret.contentUrlsByLanguage
        );
      } else if (
        ret.contentUrlsByLanguage &&
        typeof ret.contentUrlsByLanguage === "object"
      ) {
        // Already an object, keep as is
        ret.contentUrlsByLanguage = ret.contentUrlsByLanguage;
      } else {
        ret.contentUrlsByLanguage = {};
      }

      if (
        ret.subtitleUrlsByLanguage &&
        ret.subtitleUrlsByLanguage instanceof Map
      ) {
        ret.subtitleUrlsByLanguage = Object.fromEntries(
          ret.subtitleUrlsByLanguage
        );
      } else if (
        ret.subtitleUrlsByLanguage &&
        typeof ret.subtitleUrlsByLanguage === "object"
      ) {
        // Already an object, keep as is
        ret.subtitleUrlsByLanguage = ret.subtitleUrlsByLanguage;
      } else {
        ret.subtitleUrlsByLanguage = {};
      }

      if (
        ret.articleContentByLanguage &&
        ret.articleContentByLanguage instanceof Map
      ) {
        ret.articleContentByLanguage = Object.fromEntries(
          ret.articleContentByLanguage
        );
      } else if (
        ret.articleContentByLanguage &&
        typeof ret.articleContentByLanguage === "object"
      ) {
        // Already an object, keep as is
        ret.articleContentByLanguage = ret.articleContentByLanguage;
      } else {
        ret.articleContentByLanguage = {};
      }

      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
lessonSchema.index({ termId: 1, lessonNumber: 1 }, { unique: true });
lessonSchema.index({ status: 1, publishAt: 1 });
lessonSchema.index({ status: 1, publishedAt: -1 });
lessonSchema.index({ termId: 1 });

/**
 * Validate required assets for primary content language
 */
lessonSchema.methods.validateAssets = async function() {
  const LessonAsset = mongoose.model('LessonAsset');
  
  const requiredVariants = ['portrait', 'landscape'];
  const assets = await LessonAsset.find({
    lessonId: this._id,
    language: this.contentLanguagePrimary,
    assetType: 'thumbnail'
  });
  
  const availableVariants = assets.map(asset => asset.variant);
  const missingVariants = requiredVariants.filter(variant => 
    !availableVariants.includes(variant)
  );
  
  return {
    isValid: missingVariants.length === 0,
    missingVariants,
    message: missingVariants.length > 0 
      ? `Missing required thumbnail variants: ${missingVariants.join(', ')}`
      : 'All required assets are present'
  };
};

// Export constants
lessonSchema.statics.STATUS = LESSON_STATUS;
lessonSchema.statics.CONTENT_TYPE = CONTENT_TYPE;

module.exports = mongoose.model('Lesson', lessonSchema);