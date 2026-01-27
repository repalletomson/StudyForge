/**
 * Performance monitoring hook
 */
import { useEffect, useCallback } from 'react';
import { trackCustomMetric } from '../utils/speedInsights';

export const usePerformance = (componentName) => {
  const startTime = performance.now();

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Track component render time
    trackCustomMetric(`${componentName} Render Time`, renderTime);
    
    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && renderTime > 100) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  }, [componentName, startTime]);

  const trackUserAction = useCallback((action, data = {}) => {
    trackCustomMetric(`${componentName} - ${action}`, {
      timestamp: Date.now(),
      ...data
    });
  }, [componentName]);

  return { trackUserAction };
};

// Hook for tracking API performance
export const useApiPerformance = () => {
  const trackApiCall = useCallback((endpoint, duration, success = true) => {
    trackCustomMetric('API Call Performance', {
      endpoint,
      duration,
      success,
      timestamp: Date.now()
    });

    // Log slow API calls
    if (duration > 2000) {
      console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
    }
  }, []);

  return { trackApiCall };
};