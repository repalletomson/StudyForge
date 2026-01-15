/**
 * User model for authentication and authorization
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLE } = require('./constants');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String, // URL to profile image
    default: null
  },
  role: {
    type: String,
    required: true,
    enum: Object.values(USER_ROLE),
    default: USER_ROLE.VIEWER
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  },
  // Profile information
  bio: {
    type: String,
    maxlength: 500
  },
  phone: {
    type: String,
    trim: true
  },
  // Account settings
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for performance - remove duplicate email index since unique: true creates it
userSchema.index({ role: 1 });

/**
 * Virtual for full name
 */
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || this.email.split('@')[0];
});

/**
 * Hash password before saving
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password method
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Update last login timestamp
 * @returns {Promise<void>}
 */
userSchema.methods.updateLastLogin = async function() {
  this.lastLoginAt = new Date();
  return this.save();
};

/**
 * Check if user has permission for action
 * @param {string} action - Action to check
 * @returns {boolean}
 */
userSchema.methods.hasPermission = function(action) {
  const permissions = {
    admin: ['read', 'write', 'delete', 'manage_users'],
    editor: ['read', 'write', 'delete'],
    viewer: ['read']
  };
  
  return permissions[this.role]?.includes(action) || false;
};

// Export constants
userSchema.statics.ROLE = USER_ROLE;

module.exports = mongoose.model('User', userSchema);