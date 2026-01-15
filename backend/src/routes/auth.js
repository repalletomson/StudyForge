/**
 * Authentication routes
 */
const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const logger = require("../config/logger");

const router = express.Router();

/**
 * Create application error
 */
const createError = (message, statusCode = 500, code = "APPLICATION_ERROR") => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string}
 */
const generateToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET || "temporary-jwt-secret-for-development-only";
  
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );
};

/**
 * POST /api/auth/signup
 * User registration (only for admin/editor roles via invitation)
 */
router.post(
  "/signup",
  [
    body("firstName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw createError(
          "User with this email already exists",
          400,
          "USER_EXISTS"
        );
      }

      // Create new user (default role is viewer)
      const user = new User({
        firstName,
        lastName,
        email,
        passwordHash: password, // Will be hashed by pre-save middleware
        role: "viewer", // Default role
        isActive: true,
        emailVerified: false,
      });

      await user.save();

      logger.info("New user registered", {
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        message: "Account created successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put(
  "/profile",
  authenticate,
  [
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name cannot be empty"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("phone")
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage("Invalid phone number format"),
    body("bio")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),
  ],
  async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { firstName, lastName, email, phone, bio, avatar } = req.body;
      const user = req.user;

      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw createError("Email is already taken", 400, "EMAIL_TAKEN");
        }
      }

      // Update user fields
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (email !== undefined) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (bio !== undefined) user.bio = bio;
      if (avatar !== undefined) user.avatar = avatar;

      await user.save();

      logger.info("User profile updated", {
        userId: user._id,
        email: user.email,
      });

      res.json({
        message: "Profile updated successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          phone: user.phone,
          bio: user.bio,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * User login
 */
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 1 })
      .withMessage("Password is required"),
  ],
  async (req, res, next) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        throw createError("Invalid credentials", 401, "INVALID_CREDENTIALS");
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw createError("Invalid credentials", 401, "INVALID_CREDENTIALS");
      }

      // Update last login
      await user.updateLastLogin();

      // Generate token
      const token = generateToken(user);

      logger.info("User logged in successfully", {
        userId: user._id,
        email: user.email,
        role: user.role,
        correlationId: req.correlationId,
      });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * User logout (client-side token removal)
 */
router.post("/logout", authenticate, async (req, res, next) => {
  try {
    logger.info("User logged out", {
      userId: req.user._id,
      email: req.user.email,
      correlationId: req.correlationId,
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get("/me", authenticate, async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        fullName: req.user.fullName,
        phone: req.user.phone,
        bio: req.user.bio,
        avatar: req.user.avatar,
        role: req.user.role,
        lastLoginAt: req.user.lastLoginAt,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
