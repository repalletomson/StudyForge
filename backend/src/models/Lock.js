const mongoose = require('mongoose');

const lockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

lockSchema.index({ name: 1, expiresAt: 1 });

module.exports = mongoose.model('Lock', lockSchema);