import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export class GoogleAnalyticsPlugin extends BasePlugin {
  private static settingsSchema: PluginSettings = {
    trackingId: {
      type: 'string',
      label: 'Google Analytics Tracking ID',
      required: true,
      description: 'Your Google Analytics tracking ID (e.g., UA-XXXXXXXXX-X)'
    },
    anonymizeIp: {
      type: 'boolean',
      label: 'Anonymize IP',
      required: false,
      default: true,
      description: 'Enable IP anonymization'
    },
    enableDemographics: {
      type: 'boolean',
      label: 'Enable Demographics',
      required: false,
      default: false,
      description: 'Enable demographics and interests reports'
    }
  };

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const { trackingId, anonymizeIp, enableDemographics } = this.config.settings || {};

      if (!trackingId) {
        console.error('Google Analytics tracking ID is required');
        return;
      }

      // Load Google Analytics script
      await this.injectScript(`https://www.googletagmanager.com/gtag/js?id=${trackingId}`);

      // Initialize data layer
      const dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer = dataLayer;
      
      // Define gtag function
      const gtag = (...args: any[]) => {
        dataLayer.push(args);
      };

      // Make gtag globally available
      (window as any).gtag = gtag;

      // Initialize Google Analytics
      gtag('js', new Date());
      gtag('config', trackingId, {
        anonymize_ip: anonymizeIp || false,
        send_page_view: true
      });

      // Enable demographics if requested
      if (enableDemographics) {
        gtag('config', trackingId, {
          custom_map: { dimension1: 'demographics' }
        });
      }

      // Track page views
      this.trackPageView();

      this.isLoaded = true;
      console.log('Google Analytics plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Google Analytics plugin:', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      // Remove Google Analytics scripts
      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      scripts.forEach(script => script.remove());

      // Clear data layer
      if (window.dataLayer) {
        window.dataLayer = [];
      }

      // Remove gtag from global scope
      delete (window as any).gtag;

      this.isLoaded = false;
      console.log('Google Analytics plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload Google Analytics plugin:', error);
    }
  }

  private trackPageView(): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', 'page_view', {
        page_path: window.location.pathname,
        page_title: document.title
      });
    }
  }

  // Public methods for tracking events
  trackEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', eventName, eventParams);
    }
  }

  trackConversion(conversionId: string, conversionLabel: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', 'conversion', {
        send_to: `${conversionId}/${conversionLabel}`
      });
    }
  }

  static getSettingsSchema(): PluginSettings {
    return GoogleAnalyticsPlugin.settingsSchema;
  }
}