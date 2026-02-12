const mongoose = require('mongoose');

const programAssetSchema = new mongoose.Schema({
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
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
    enum: ['poster']
  },
  url: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

programAssetSchema.index({ 
  programId: 1, 
  language: 1, 
  variant: 1, 
  assetType: 1 
}, { unique: true });

module.exports = mongoose.model('ProgramAsset', programAssetSchema);