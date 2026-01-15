/**
 * Program Asset model for program posters and media
 */
const mongoose = require('mongoose');
const { ASSET_VARIANT, PROGRAM_ASSET_TYPE } = require('./constants');

const programAssetSchema = new mongoose.Schema({
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  language: {
    type: String,
    required: true,
    maxlength: 10
  },
  variant: {
    type: String,
    required: true,
    enum: Object.values(ASSET_VARIANT)
  },
  assetType: {
    type: String,
    required: true,
    enum: Object.values(PROGRAM_ASSET_TYPE)
  },
  url: {
    type: String,
    required: true,
    maxlength: 500
  },
  filename: {
    type: String,
    maxlength: 255
  },
  mimeType: {
    type: String,
    maxlength: 100
  },
  fileSize: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound unique index to prevent duplicates
programAssetSchema.index({ 
  programId: 1, 
  language: 1, 
  variant: 1, 
  assetType: 1 
}, { unique: true });

programAssetSchema.index({ programId: 1 });
programAssetSchema.index({ programId: 1, language: 1, assetType: 1 });

// Export constants
programAssetSchema.statics.VARIANT = ASSET_VARIANT;
programAssetSchema.statics.ASSET_TYPE = PROGRAM_ASSET_TYPE;

module.exports = mongoose.model('ProgramAsset', programAssetSchema);