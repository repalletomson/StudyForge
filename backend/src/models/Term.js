const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
  programId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Program',
    required: true
  },
  termNumber: {
    type: Number,
    required: true,
    min: 1
  },
  title: String,
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true
});

termSchema.index({ programId: 1, termNumber: 1 }, { unique: true });

termSchema.methods.close = function() {
  this.status = 'closed';
  return this.save();
};

termSchema.methods.open = function() {
  this.status = 'open';
  return this.save();
};

module.exports = mongoose.model('Term', termSchema);