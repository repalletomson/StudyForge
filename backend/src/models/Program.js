const mongoose = require('mongoose');

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
  youtubeUrl: String,
  youtubeVideoId: String,
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
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
      validator: function(langs) {
        return langs.includes(this.languagePrimary);
      },
      message: 'Primary language must be in available languages'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  topicIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

programSchema.index({ status: 1, publishedAt: -1 });
programSchema.index({ topicIds: 1 });
programSchema.index({ title: 'text', description: 'text' });

programSchema.methods.autoPublish = async function() {
  if (this.status === 'draft') {
    this.status = 'published';
    this.publishedAt = this.publishedAt || new Date();
    await this.save();
  }
  return this;
};

programSchema.methods.autoDraft = async function() {
  const Term = mongoose.model('Term');
  const Lesson = mongoose.model('Lesson');
  
  const terms = await Term.find({ programId: this._id });
  const termIds = terms.map(t => t._id);
  
  const publishedCount = await Lesson.countDocuments({
    termId: { $in: termIds },
    status: 'published'
  });
  
  if (publishedCount === 0 && this.status === 'published') {
    this.status = 'draft';
    await this.save();
    return true;
  }
  
  return false;
};

module.exports = mongoose.model('Program', programSchema);