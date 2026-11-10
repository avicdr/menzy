export type ConversionEventName =
  | 'pricing_viewed'
  | 'signup_started'
  | 'signup_completed'
  | 'subscription_started'
  | 'demo_requested'
  | 'contact_submitted';

export function trackConversionEvent(
  eventName: ConversionEventName,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === 'undefined') return;
  const gtag = (window as any).gtag;
  if (typeof gtag === 'function') {
    gtag('event', eventName, params || {});
  }
  const dataLayer = (window as any).dataLayer;
  if (Array.isArray(dataLayer)) {
    dataLayer.push({ event: eventName, ...(params || {}) });
  }
}

