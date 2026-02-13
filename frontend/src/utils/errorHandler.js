import toast from 'react-hot-toast';

export const extractErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const showErrorToast = (error, fallbackMessage = 'An error occurred') => {
  const message = extractErrorMessage(error) || fallbackMessage;
  toast.error(message);
  return message;
};

export const showSuccessToast = (message) => {
  toast.success(message);
};

export const validateYouTubeUrl = (url) => {
  if (!url) return { isValid: false, error: 'URL is required' };
  
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  
  if (!match) {
    return { isValid: false, error: 'Please enter a valid YouTube URL' };
  }
  
  return { isValid: true, videoId: match[4] };
};

export const handleAsyncOperation = async (operation, options = {}) => {
  const { 
    loadingMessage, 
    successMessage, 
    errorMessage = 'Operation failed',
    showLoading = true,
    showSuccess = true,
    showError = true 
  } = options;
  
  let toastId;
  
  try {
    if (showLoading && loadingMessage) {
      toastId = toast.loading(loadingMessage);
    }
    
    const result = await operation();
    
    if (toastId) {
      toast.dismiss(toastId);
    }
    
    if (showSuccess && successMessage) {
      toast.success(successMessage);
    }
    
    return { success: true, data: result };
  } catch (error) {
    if (toastId) {
      toast.dismiss(toastId);
    }
    
    if (showError) {
      showErrorToast(error, errorMessage);
    }
    
    return { success: false, error };
  }
};

export const retryOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};