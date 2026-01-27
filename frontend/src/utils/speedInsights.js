/**
 * Speed Insights Configuration
 * Customize how performance metrics are collected
 */

// You can configure Speed Insights with custom options
export const speedInsightsConfig = {
  // Enable debug mode in development
  debug: import.meta.env.DEV,
  
  // Custom route tracking (optional)
  beforeSend: (data) => {
    // You can modify or filter data before sending
    // For example, exclude certain routes or add custom properties
    
    if (import.meta.env.DEV) {
      console.log('Speed Insights data:', data);
    }
    
    return data;
  }
};

// Custom performance tracking functions
export const trackCustomMetric = (name, value) => {
  if (window.va) {
    window.va('track', name, { value });
  }
};

// Track page load performance
export const trackPageLoad = (pageName) => {
  if (window.va) {
    window.va('track', 'Page Load', { page: pageName });
  }
};

// Track user interactions
export const trackInteraction = (action, element) => {
  if (window.va) {
    window.va('track', 'User Interaction', { action, element });
  }
};