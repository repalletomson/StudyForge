/**
 * Term model for program terms/semesters
 */
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
  title: {
    type: String,
    trim: true,
    maxlength: 255
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
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

// Compound unique index
termSchema.index({ programId: 1, termNumber: 1 }, { unique: true });
// Additional indexes for performance
termSchema.index({ programId: 1 });
termSchema.index({ createdAt: -1 });

/**
 * Get lessons count for this term
 * @returns {Promise<number>}
 */
termSchema.methods.getLessonsCount = async function() {
  const Lesson = mongoose.model('Lesson');
  return Lesson.countDocuments({ termId: this._id });
};

/**
 * Get published lessons count for this term
 * @returns {Promise<number>}
 */
termSchema.methods.getPublishedLessonsCount = async function() {
  const Lesson = mongoose.model('Lesson');
  return Lesson.countDocuments({ 
    termId: this._id, 
    status: 'published' 
  });
};

/**
 * Get next lesson number for this term
 * @returns {Promise<number>}
 */
termSchema.methods.getNextLessonNumber = async function() {
  const Lesson = mongoose.model('Lesson');
  const lastLesson = await Lesson.findOne({ termId: this._id })
    .sort({ lessonNumber: -1 })
    .select('lessonNumber');
  
  return lastLesson ? lastLesson.lessonNumber + 1 : 1;
};

/**
 * Close this term (hide lessons)
 * @returns {Promise<Object>}
 */
termSchema.methods.close = async function() {
  this.status = 'closed';
  return this.save();
};

/**
 * Open this term (show lessons)
 * @returns {Promise<Object>}
 */
termSchema.methods.open = async function() {
  this.status = 'open';
  return this.save();
};

module.exports = mongoose.model('Term', termSchema);