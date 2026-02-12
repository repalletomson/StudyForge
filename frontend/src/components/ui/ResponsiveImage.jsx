import { useState, useEffect } from 'react';
import { getBestImageUrl, validateImageUrl } from '../../utils/imageUtils';
const ResponsiveImage = ({ 
  assets, 
  alt, 
  className = "",
  fallbackIcon = "📚",
  fallbackText = "No Image"
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  // Detect screen size changes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  // Get the appropriate image URL based on screen size and available assets
  const getResponsiveImageUrl = () => {
    if (!assets) return null;
    // Use utility function to get best image, prioritizing based on screen size
    const preferredVariant = isMobile ? 'portrait' : 'landscape';
    const imageUrl = getBestImageUrl(assets, 'en', preferredVariant);
    // Double-check that the URL is valid and not a placeholder
    return validateImageUrl(imageUrl);
  };
  const imageUrl = getResponsiveImageUrl();
  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };
  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };
  // If no image URL or error, show fallback
  if (!imageUrl || imageError) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-3xl mb-2">{fallbackIcon}</div>
          {fallbackText && (
            <div className="text-sm font-medium px-2">
              {fallbackText}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={`relative ${className}`}>
      {}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
          <div className="text-center text-gray-400">
            <svg className="animate-spin h-6 w-6 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div className="text-xs">Loading...</div>
          </div>
        </div>
      )}
      {}
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      {}
      {process.env.NODE_ENV === 'development' && !isLoading && !imageError && (
        <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
          {isMobile ? 'M' : 'D'}
        </div>
      )}
    </div>
  );
};
export default ResponsiveImage;
