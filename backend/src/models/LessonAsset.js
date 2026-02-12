const mongoose = require('mongoose');

const lessonAssetSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  language: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    required: true,
    enum: ['portrait', 'landscape', 'square', 'banner']
  },
  assetType: {
    type: String,
    required: true,
    enum: ['thumbnail']
  },
  url: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

lessonAssetSchema.index({ 
  lessonId: 1, 
  language: 1, 
  variant: 1, 
  assetType: 1 
}, { unique: true });

module.exports = mongoose.model('LessonAsset', lessonAssetSchema);