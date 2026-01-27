/**
 * Image utility functions
 */

/**
 * Check if a URL is a placeholder image service
 */
export const isPlaceholderImage = (url) => {
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
 * Validate and sanitize image URL
 * Returns null if the URL is a placeholder or invalid
 */
export const validateImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Reject placeholder images
  if (isPlaceholderImage(url)) {
    console.warn('Placeholder image URL rejected:', url);
    return null;
  }

  // Basic URL validation
  try {
    new URL(url);
    return url;
  } catch {
    console.warn('Invalid image URL:', url);
    return null;
  }
};

/**
 * Get the best available image from assets object
 * Prioritizes user-uploaded images and rejects placeholders
 */
export const getBestImageUrl = (assets, language = 'en', preferredVariant = 'landscape') => {
  if (!assets) return null;

  // Handle both singular and plural asset keys
  const assetGroup = assets.posters?.[language] || 
                    assets.poster?.[language] || 
                    assets.thumbnails?.[language] || 
                    assets.thumbnail?.[language];
  
  if (!assetGroup) return null;

  // Try preferred variant first, then fallback to others
  const variants = [preferredVariant, 'landscape', 'portrait', 'square', 'banner'];
  
  for (const variant of variants) {
    const url = assetGroup[variant];
    const validUrl = validateImageUrl(url);
    if (validUrl) return validUrl;
  }

  return null;
};

/**
 * Create a safe image props object for components
 */
export const createSafeImageProps = (assets, alt, language = 'en', preferredVariant = 'landscape') => {
  const imageUrl = getBestImageUrl(assets, language, preferredVariant);
  
  return {
    src: imageUrl,
    alt: alt || 'Image',
    hasValidImage: !!imageUrl
  };
};