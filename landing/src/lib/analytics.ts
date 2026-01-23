// Analytics tracking functions for Google Analytics
// Replace G-XXXXXXXXXX with your actual GA4 measurement ID

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const gtag = (...args: any[]) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
};

export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  gtag('event', eventName, eventParams);
};

export const trackFormView = () => {
  trackEvent('form_view', {
    event_category: 'engagement',
    event_label: 'early_list_form'
  });
};

export const trackFormStart = () => {
  trackEvent('form_start', {
    event_category: 'engagement',
    event_label: 'early_list_form'
  });
};

export const trackFormSubmit = () => {
  trackEvent('form_submit', {
    event_category: 'conversion',
    event_label: 'early_list_signup_attempt'
  });
};

export const trackFormSuccess = (interestTagCount: number) => {
  trackEvent('form_success', {
    event_category: 'conversion',
    event_label: 'early_list_signup_complete',
    interest_tag_count: interestTagCount
  });
};

export const trackInterestTagSelect = (tag: string) => {
  trackEvent('interest_tag_select', {
    event_category: 'engagement',
    event_label: tag
  });
};

export const trackCTAClick = (ctaLocation: string) => {
  trackEvent('cta_click', {
    event_category: 'engagement',
    event_label: ctaLocation
  });
};

export const trackSectionView = (sectionName: string) => {
  trackEvent('section_view', {
    event_category: 'engagement',
    event_label: sectionName
  });
};
