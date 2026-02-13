import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
const AssetUploader = ({ 
  entityId, 
  entityType, 
  language, 
  variant, 
  currentUrl, 
  onUploadSuccess,
  className = '',
  showAsButton = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  // Update preview when currentUrl changes (from parent component refresh)
  useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl, variant]);
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    setUploading(true);
    try {
      // Create immediate preview from file
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      formData.append('variant', variant);
      // Call API to upload actual file
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/${entityType}s/${entityId}/assets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Upload failed:', response.status, errorData);
        throw new Error(`Failed to upload file: ${response.status}`);
      }
      const savedAsset = await response.json();
      const serverUrl = `${apiUrl}/api/assets/${savedAsset.fileId}`;
      setPreview(serverUrl);
      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(serverUrl);
      }
      toast.success(`${variant} image uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${variant} image: ${error.message}`);
      setPreview(currentUrl); // Revert to previous state
    } finally {
      setUploading(false);
    }
  }, [entityId, entityType, language, variant, currentUrl, onUploadSuccess]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false,
    disabled: uploading
  });

  if (showAsButton) {
    return (
      <button
        {...getRootProps()}
        className={`btn-secondary ${className} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={uploading}
      >
        <input {...getInputProps()} />
        <FiUpload className="w-4 h-4 mr-2" />
        {uploading ? 'Uploading...' : `Upload ${variant}`}
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {preview ? (
        // Show preview with upload overlay
        <div className="relative group">
          <img
            src={preview}
            alt={`${variant} preview`}
            className="w-full h-32 object-cover rounded-lg border border-gray-200"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
            <div
              {...getRootProps()}
              className="cursor-pointer p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            >
              <input {...getInputProps()} />
              <FiUpload className="w-5 h-5 text-gray-700" />
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
              ✓ Uploaded
            </span>
          </div>
        </div>
      ) : (
        // Show upload area
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <FiImage className="mx-auto h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
              </p>
              <p className="text-xs text-gray-500">
                {variant} • {language.toUpperCase()} • PNG, JPG up to 5MB
              </p>
            </div>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          )}
        </div>
      )}
      {}
      <div className="absolute -top-2 -left-2">
        <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded-md shadow-sm">
          {variant}
        </span>
      </div>
    </div>
  );
};
export default AssetUploader;
