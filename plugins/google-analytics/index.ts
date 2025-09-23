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

      // Validate settings
      const isValid = this.validateSettings(this.config.settings || {}, GoogleAnalyticsPlugin.settingsSchema);
      if (!isValid) {
        console.error('Invalid Google Analytics settings');
        return;
      }

      // Load Google Analytics script
      await this.injectScript(`https://www.googletagmanager.com/gtag/js?id=${trackingId}`);

      // Initialize data layer
      window.dataLayer = window.dataLayer || [];
      
      // Define gtag function
      const gtag = (...args: any[]) => {
        window.dataLayer.push(args);
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

      // Add event listeners for route changes (for SPA)
      this.addRouteChangeListeners();

      // Register hooks
      this.registerHooks();

      // Emit plugin loaded event
      this.getEventEmitter().emit('googleAnalyticsLoaded', this.config);

      this.isLoaded = true;
      console.log('Google Analytics plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Google Analytics plugin:', error);
      this.getEventEmitter().emit('googleAnalyticsError', error);
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

      // Remove event listeners
      this.removeRouteChangeListeners();

      // Remove hooks
      this.unregisterHooks();

      // Emit plugin unloaded event
      this.getEventEmitter().emit('googleAnalyticsUnloaded', this.config);

      this.isLoaded = false;
      console.log('Google Analytics plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload Google Analytics plugin:', error);
      this.getEventEmitter().emit('googleAnalyticsError', error);
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

  private addRouteChangeListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for route changes in SPA
    const handleRouteChange = () => {
      this.trackPageView();
    };

    // Store reference for removal
    (this as any).routeChangeHandler = handleRouteChange;

    // Add event listeners
    window.addEventListener('popstate', handleRouteChange);
    
    // For Next.js router events
    if ((window as any).next) {
      const nextRouter = (window as any).next.router;
      if (nextRouter) {
        nextRouter.events.on('routeChangeComplete', handleRouteChange);
      }
    }
  }

  private removeRouteChangeListeners(): void {
    if (typeof window === 'undefined') return;

    const handleRouteChange = (this as any).routeChangeHandler;
    if (!handleRouteChange) return;

    // Remove event listeners
    window.removeEventListener('popstate', handleRouteChange);
    
    // For Next.js router events
    if ((window as any).next) {
      const nextRouter = (window as any).next.router;
      if (nextRouter) {
        nextRouter.events.off('routeChangeComplete', handleRouteChange);
      }
    }
  }

  private registerHooks(): void {
    const hookManager = this.getHookManager();
    
    // Register hook for custom event tracking
    hookManager.addHook('trackAnalyticsEvent', this.trackEvent.bind(this));
    
    // Register hook for conversion tracking
    hookManager.addHook('trackAnalyticsConversion', this.trackConversion.bind(this));
  }

  private unregisterHooks(): void {
    const hookManager = this.getHookManager();
    
    hookManager.removeHook('trackAnalyticsEvent', this.trackEvent.bind(this));
    hookManager.removeHook('trackAnalyticsConversion', this.trackConversion.bind(this));
  }

  // Public methods for tracking events
  trackEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', eventName, eventParams);
      this.getEventEmitter().emit('analyticsEventTracked', { eventName, eventParams });
    }
  }

  trackConversion(conversionId: string, conversionLabel: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', 'conversion', {
        send_to: `${conversionId}/${conversionLabel}`
      });
      this.getEventEmitter().emit('analyticsConversionTracked', { conversionId, conversionLabel });
    }
  }

  // Method to track user engagement
  trackUserEngagement(action: string, category?: string, label?: string, value?: number): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
      this.getEventEmitter().emit('analyticsUserEngagementTracked', { action, category, label, value });
    }
  }

  // Method to track exceptions
  trackException(description: string, fatal: boolean = false): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', 'exception', {
        description,
        fatal
      });
      this.getEventEmitter().emit('analyticsExceptionTracked', { description, fatal });
    }
  }

  static getSettingsSchema(): PluginSettings {
    return GoogleAnalyticsPlugin.settingsSchema;
  }
}