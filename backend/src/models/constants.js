/**
 * Shared constants and enums for all models
 */

// Program status enum
const PROGRAM_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

// Lesson status enum
const LESSON_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

// Content type enum
const CONTENT_TYPE = {
  VIDEO: "video",
  ARTICLE: "article",
};

// Asset variant enum
const ASSET_VARIANT = {
  PORTRAIT: "portrait",
  LANDSCAPE: "landscape",
  SQUARE: "square",
  BANNER: "banner",
};

// Program asset type enum
const PROGRAM_ASSET_TYPE = {
  POSTER: "poster",
};

// Lesson asset type enum
const LESSON_ASSET_TYPE = {
  THUMBNAIL: "thumbnail",
  POSTER: "poster", // Added for program assets stored in LessonAsset model
};

// User role enum
const USER_ROLE = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
};

module.exports = {
  PROGRAM_STATUS,
  LESSON_STATUS,
  CONTENT_TYPE,
  ASSET_VARIANT,
  PROGRAM_ASSET_TYPE,
  LESSON_ASSET_TYPE,
  USER_ROLE,
};
