const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  isActive: {
    type: Boolean,
    default: true
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

topicSchema.index({ isActive: 1, name: 1 });

topicSchema.methods.getProgramsCount = async function() {
  const Program = mongoose.model('Program');
  return Program.countDocuments({ topicIds: this._id });
};

module.exports = mongoose.model('Topic', topicSchema);