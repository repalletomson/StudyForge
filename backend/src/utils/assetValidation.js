/**
 * Asset validation utilities
 */

/**
 * Check if a URL is a placeholder image service
 */
const isPlaceholderImage = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const placeholderPatterns = [
    /picsum\.photos/i,
    /placeholder\.com/i,
    /via\.placeholder\.com/i,
    /unsplash\.it/i,
    /lorempixel\.com/i,
    /dummyimage\.com/i,
    /placehold\.it/i,
    /random=/i
  ];

  return placeholderPatterns.some(pattern => pattern.test(url));
};

/**
 * Validate asset URL
 */
const validateAssetUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  // Reject placeholder images
  if (isPlaceholderImage(url)) {
    return { isValid: false, error: 'Placeholder images are not allowed' };
  }

  // Basic URL validation
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

/**
 * Validate program assets
 */
const validateProgramAssets = (assets, languagePrimary) => {
  // Check if assets object exists and has the right structure
  if (!assets || typeof assets !== 'object') {
    return { isValid: false, error: 'Portrait and landscape posters are required' };
  }

  if (!assets.posters || typeof assets.posters !== 'object') {
    return { isValid: false, error: 'Portrait and landscape posters are required' };
  }

  if (!assets.posters[languagePrimary] || typeof assets.posters[languagePrimary] !== 'object') {
    return { isValid: false, error: 'Portrait and landscape posters are required' };
  }

  const requiredVariants = ['portrait', 'landscape'];
  const posterAssets = assets.posters[languagePrimary];
  
  for (const variant of requiredVariants) {
    const url = posterAssets[variant];
    
    if (!url || typeof url !== 'string' || !url.trim()) {
      return { 
        isValid: false, 
        error: `${variant.charAt(0).toUpperCase() + variant.slice(1)} poster is required` 
      };
    }

    const urlValidation = validateAssetUrl(url.trim());
    if (!urlValidation.isValid) {
      return { 
        isValid: false, 
        error: `${variant.charAt(0).toUpperCase() + variant.slice(1)} poster: ${urlValidation.error}` 
      };
    }
  }

  return { isValid: true };
};

/**
 * Validate lesson assets
 */
const validateLessonAssets = (assets, languagePrimary) => {
  // Check if assets object exists and has the right structure
  if (!assets || typeof assets !== 'object') {
    return { isValid: false, error: 'Portrait and landscape thumbnails are required' };
  }

  if (!assets.thumbnails || typeof assets.thumbnails !== 'object') {
    return { isValid: false, error: 'Portrait and landscape thumbnails are required' };
  }

  if (!assets.thumbnails[languagePrimary] || typeof assets.thumbnails[languagePrimary] !== 'object') {
    return { isValid: false, error: 'Portrait and landscape thumbnails are required' };
  }

  const requiredVariants = ['portrait', 'landscape'];
  const thumbnailAssets = assets.thumbnails[languagePrimary];
  
  for (const variant of requiredVariants) {
    const url = thumbnailAssets[variant];
    
    if (!url || typeof url !== 'string' || !url.trim()) {
      return { 
        isValid: false, 
        error: `${variant.charAt(0).toUpperCase() + variant.slice(1)} thumbnail is required` 
      };
    }

    const urlValidation = validateAssetUrl(url.trim());
    if (!urlValidation.isValid) {
      return { 
        isValid: false, 
        error: `${variant.charAt(0).toUpperCase() + variant.slice(1)} thumbnail: ${urlValidation.error}` 
      };
    }
  }

  return { isValid: true };
};

module.exports = {
  isPlaceholderImage,
  validateAssetUrl,
  validateProgramAssets,
  validateLessonAssets
};