/**
 * Asset Input Component for URL-based image assets
 */
import { useState, useEffect } from 'react';
import { FiImage, FiExternalLink, FiAlertCircle, FiCheck } from 'react-icons/fi';

const AssetInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "Enter image URL...", 
  required = false,
  aspectRatio = "16:9",
  compact = false,
  className = ""
}) => {
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Validate URL format
  const isValidImageUrl = (url) => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Test if image loads
  const testImageLoad = (url) => {
    if (!url || !isValidImageUrl(url)) {
      setIsValidUrl(false);
      setImageError(false);
      return;
    }

    setIsLoading(true);
    setImageError(false);
    
    const img = new Image();
    img.onload = () => {
      setIsValidUrl(true);
      setIsLoading(false);
      setImageError(false);
    };
    img.onerror = () => {
      setIsValidUrl(false);
      setIsLoading(false);
      setImageError(true);
    };
    img.src = url;
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      testImageLoad(value);
    }, 500); // Debounce image loading

    return () => clearTimeout(timeoutId);
  }, [value]);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "1:1": return "aspect-square";
      case "4:3": return "aspect-[4/3]";
      case "3:4": return "aspect-[3/4]";
      case "16:9": return "aspect-video";
      case "9:16": return "aspect-[9/16]";
      default: return "aspect-video";
    }
  };

  const getAspectRatioLabel = () => {
    switch (aspectRatio) {
      case "1:1": return "Square";
      case "4:3": return "Landscape";
      case "3:4": return "Portrait";
      case "16:9": return "Widescreen";
      case "9:16": return "Portrait";
      default: return aspectRatio;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <span className="text-xs text-gray-500">
          {getAspectRatioLabel()} ({aspectRatio})
        </span>
      </div>

      {/* URL Input */}
      <div className="relative">
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent pr-10 ${
            value && isValidUrl ? 'border-green-600' : 
            value && imageError ? 'border-red-600' : 
            'border-gray-700'
          }`}
        />
        
        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : value && isValidUrl ? (
            <FiCheck className="h-4 w-4 text-green-400" />
          ) : value && imageError ? (
            <FiAlertCircle className="h-4 w-4 text-red-400" />
          ) : null}
        </div>
      </div>

      {/* Validation Messages */}
      {value && imageError && (
        <p className="text-sm text-red-400 flex items-center">
          <FiAlertCircle className="w-4 h-4 mr-1" />
          Unable to load image from this URL
        </p>
      )}
      
      {value && !isValidImageUrl(value) && (
        <p className="text-sm text-red-400 flex items-center">
          <FiAlertCircle className="w-4 h-4 mr-1" />
          Please enter a valid HTTP/HTTPS URL
        </p>
      )}

      {/* Image Preview */}
      {value && isValidUrl && (
        <div className="space-y-2">
          <div className={`relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700 ${compact ? 'h-8' : getAspectRatioClass()}`}>
            <img
              src={value}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
            
            {/* Overlay with external link */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-black bg-opacity-50 rounded-lg text-white hover:bg-opacity-70 transition-colors"
                title="Open in new tab"
              >
                <FiExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {!compact && (
            <p className="text-xs text-gray-500 text-center">
              Preview • Click to open in new tab
            </p>
          )}
        </div>
      )}

      {/* Placeholder when no URL */}
      {!value && !compact && (
        <div className={`relative bg-gray-900 rounded-lg border-2 border-dashed border-gray-700 ${getAspectRatioClass()} flex items-center justify-center`}>
          <div className="text-center text-gray-500">
            <FiImage className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">No image</p>
            <p className="text-xs">Enter URL above</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetInput;