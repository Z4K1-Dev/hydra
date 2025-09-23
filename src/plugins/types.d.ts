// Global type declarations for plugins
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    google?: {
      maps?: any;
    };
    initGoogleLocalPlugin?: () => void;
  }
}

export {};