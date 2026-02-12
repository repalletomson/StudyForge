const User = require('../models/User');

const validateUserCreation = async (userData) => {
  const errors = [];
  
  if (!userData.email) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      errors.push('Invalid email format');
    } else {
      const existingUser = await User.findOne({ 
        email: userData.email.toLowerCase().trim() 
      });
      if (existingUser) {
        errors.push('A user with this email already exists');
      }
    }
  }
  
  if (!userData.password) {
    errors.push('Password is required');
  } else if (userData.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!userData.role) {
    errors.push('Role is required');
  } else if (!['admin', 'editor', 'viewer'].includes(userData.role)) {
    errors.push('Invalid role. Must be admin, editor, or viewer');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const sanitizeUserData = (userData) => {
  return {
    email: userData.email?.toLowerCase().trim(),
    password: userData.password,
    role: userData.role,
    firstName: userData.firstName?.trim() || '',
    lastName: userData.lastName?.trim() || ''
  };
};

module.exports = {
  validateUserCreation,
  sanitizeUserData
};