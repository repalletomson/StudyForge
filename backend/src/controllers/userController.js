/**
 * User controller for user management (Admin only)
 */
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Create application error
 */
const createError = (message, statusCode = 500, code = 'APPLICATION_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

/**
 * GET /api/admin/users
 * Get all users
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/users
 * Create new user
 */
const createUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      throw createError('Email, password, and role are required', 400, 'VALIDATION_ERROR');
    }

    const user = new User({
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      role
    });

    await user.save();

    logger.info('User created', {
      userId: user._id,
      email: user.email,
      role: user.role,
      createdBy: req.user._id,
      correlationId: req.correlationId
    });

    res.status(201).json(user);

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/:id
 * Get user by ID
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw createError('User not found', 404, 'RESOURCE_NOT_FOUND');
    }

    res.json(user);

  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id
 * Update user
 */
const updateUser = async (req, res, next) => {
  try {
    const { email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      throw createError('User not found', 404, 'RESOURCE_NOT_FOUND');
    }

    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    logger.info('User updated', {
      userId: user._id,
      email: user.email,
      role: user.role,
      updatedBy: req.user._id,
      correlationId: req.correlationId
    });

    res.json(user);

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw createError('User not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      throw createError('Cannot delete your own account', 400, 'VALIDATION_ERROR');
    }

    await User.findByIdAndDelete(req.params.id);

    logger.info('User deleted', {
      userId: user._id,
      email: user.email,
      deletedBy: req.user._id,
      correlationId: req.correlationId
    });

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Toggle user active status
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      throw createError('User not found', 404, 'RESOURCE_NOT_FOUND');
    }

    // Prevent deactivating self
    if (user._id.toString() === req.user._id.toString() && !isActive) {
      throw createError('Cannot deactivate your own account', 400, 'VALIDATION_ERROR');
    }

    user.isActive = isActive;
    await user.save();

    logger.info('User status toggled', {
      userId: user._id,
      email: user.email,
      isActive: user.isActive,
      updatedBy: req.user._id,
      correlationId: req.correlationId
    });

    res.json(user);

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      throw createError('New password is required', 400, 'VALIDATION_ERROR');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      throw createError('User not found', 404, 'RESOURCE_NOT_FOUND');
    }

    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    logger.info('User password reset', {
      userId: user._id,
      email: user.email,
      resetBy: req.user._id,
      correlationId: req.correlationId
    });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword
};