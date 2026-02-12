const PROGRAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

const LESSON_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

const CONTENT_TYPE = {
  VIDEO: 'video',
  ARTICLE: 'article'
};

const ASSET_VARIANT = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
  SQUARE: 'square',
  BANNER: 'banner'
};

const PROGRAM_ASSET_TYPE = {
  POSTER: 'poster'
};

const LESSON_ASSET_TYPE = {
  THUMBNAIL: 'thumbnail'
};

const USER_ROLE = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

module.exports = {
  PROGRAM_STATUS,
  LESSON_STATUS,
  CONTENT_TYPE,
  ASSET_VARIANT,
  PROGRAM_ASSET_TYPE,
  LESSON_ASSET_TYPE,
  USER_ROLE
};