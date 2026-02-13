export const speedInsightsConfig = {
  debug: import.meta.env.DEV,
  beforeSend: (data) => {
    if (import.meta.env.DEV) {
      console.log('Speed Insights data:', data);
    }
    return data;
  }
};

export const trackCustomMetric = (name, value) => {
  if (window.va) {
    window.va('track', name, { value });
  }
};

export const trackPageLoad = (pageName) => {
  if (window.va) {
    window.va('track', 'Page Load', { page: pageName });
  }
};

export const trackInteraction = (action, element) => {
  if (window.va) {
    window.va('track', 'User Interaction', { action, element });
  }
};
