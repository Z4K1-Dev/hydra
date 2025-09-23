import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export class SEOToolsPlugin extends BasePlugin {
  private static settingsSchema: PluginSettings = {
    title: {
      type: 'string',
      label: 'Default Title',
      required: false,
      default: '',
      description: 'Default meta title for pages'
    },
    description: {
      type: 'string',
      label: 'Default Description',
      required: false,
      default: '',
      description: 'Default meta description for pages'
    },
    keywords: {
      type: 'string',
      label: 'Default Keywords',
      required: false,
      default: '',
      description: 'Default meta keywords (comma-separated)'
    },
    author: {
      type: 'string',
      label: 'Author',
      required: false,
      default: '',
      description: 'Default author meta tag'
    },
    ogImage: {
      type: 'string',
      label: 'Default OG Image',
      required: false,
      default: '',
      description: 'Default Open Graph image URL'
    },
    twitterCard: {
      type: 'string',
      label: 'Twitter Card Type',
      required: false,
      default: 'summary',
      description: 'Twitter card type (summary, summary_large_image, etc.)'
    },
    enableStructuredData: {
      type: 'boolean',
      label: 'Enable Structured Data',
      required: false,
      default: true,
      description: 'Enable structured data generation'
    }
  };

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const settings = this.config.settings || {};
      
      // Validate settings
      const isValid = this.validateSettings(settings, SEOToolsPlugin.settingsSchema);
      if (!isValid) {
        console.error('Invalid SEO Tools settings');
        return;
      }

      // Apply default SEO meta tags
      if (settings.title) {
        this.injectMetaTag('title', settings.title);
        document.title = settings.title;
      }
      
      if (settings.description) {
        this.injectMetaTag('description', settings.description);
      }
      
      if (settings.keywords) {
        this.injectMetaTag('keywords', settings.keywords);
      }
      
      if (settings.author) {
        this.injectMetaTag('author', settings.author);
      }

      // Apply Open Graph meta tags
      this.injectMetaTag('og:title', settings.title || document.title);
      this.injectMetaTag('og:description', settings.description || '');
      this.injectMetaTag('og:type', 'website');
      this.injectMetaTag('og:url', window.location.href);
      
      if (settings.ogImage) {
        this.injectMetaTag('og:image', settings.ogImage);
      }

      // Apply Twitter Card meta tags
      this.injectMetaTag('twitter:card', settings.twitterCard || 'summary');
      this.injectMetaTag('twitter:title', settings.title || document.title);
      this.injectMetaTag('twitter:description', settings.description || '');
      
      if (settings.ogImage) {
        this.injectMetaTag('twitter:image', settings.ogImage);
      }

      // Apply additional SEO meta tags
      this.injectMetaTag('robots', 'index, follow');
      this.injectMetaTag('googlebot', 'index, follow');
      this.injectMetaTag('viewport', 'width=device-width, initial-scale=1');

      // Add event listeners for SEO updates
      this.addEventListeners();

      // Register hooks
      this.registerHooks();

      // Generate default structured data if enabled
      if (settings.enableStructuredData) {
        this.generateDefaultStructuredData();
      }

      // Emit plugin loaded event
      this.getEventEmitter().emit('seoToolsLoaded', this.config);

      this.isLoaded = true;
      console.log('SEO Tools plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load SEO Tools plugin:', error);
      this.getEventEmitter().emit('seoToolsError', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      // Remove SEO meta tags
      const seoMetaTags = [
        'title', 'description', 'keywords', 'author', 'robots', 'googlebot',
        'og:title', 'og:description', 'og:type', 'og:url', 'og:image',
        'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'
      ];

      seoMetaTags.forEach(tagName => {
        const meta = document.querySelector(`meta[name="${tagName}"]`);
        if (meta) {
          meta.remove();
        }
      });

      // Remove structured data scripts
      const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
      structuredDataScripts.forEach(script => script.remove());

      // Remove event listeners
      this.removeEventListeners();

      // Remove hooks
      this.unregisterHooks();

      // Emit plugin unloaded event
      this.getEventEmitter().emit('seoToolsUnloaded', this.config);

      this.isLoaded = false;
      console.log('SEO Tools plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload SEO Tools plugin:', error);
      this.getEventEmitter().emit('seoToolsError', error);
    }
  }

  private addEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for SEO update events
    const handleSEOUpdate = (data: any) => {
      if (data.title) this.updateTitle(data.title);
      if (data.description) this.updateDescription(data.description);
      if (data.keywords) this.updateKeywords(data.keywords);
    };

    // Store reference for removal
    (this as any).seoUpdateHandler = handleSEOUpdate;

    // Add event listener
    this.getEventEmitter().on('seoUpdate', handleSEOUpdate);
  }

  private removeEventListeners(): void {
    if (typeof window === 'undefined') return;

    const handleSEOUpdate = (this as any).seoUpdateHandler;
    if (!handleSEOUpdate) return;

    // Remove event listener
    this.getEventEmitter().off('seoUpdate', handleSEOUpdate);
  }

  private registerHooks(): void {
    const hookManager = this.getHookManager();
    
    // Register hook for updating SEO meta tags
    hookManager.addHook('updateSEOTitle', this.updateTitle.bind(this));
    hookManager.addHook('updateSEODescription', this.updateDescription.bind(this));
    hookManager.addHook('updateSEOKeywords', this.updateKeywords.bind(this));
    hookManager.addHook('updateSEOOgImage', this.updateOGImage.bind(this));
    
    // Register hook for generating structured data
    hookManager.addHook('generateArticleStructuredData', this.generateArticleStructuredData.bind(this));
    hookManager.addHook('generateProductStructuredData', this.generateProductStructuredData.bind(this));
  }

  private unregisterHooks(): void {
    const hookManager = this.getHookManager();
    
    hookManager.removeHook('updateSEOTitle', this.updateTitle.bind(this));
    hookManager.removeHook('updateSEODescription', this.updateDescription.bind(this));
    hookManager.removeHook('updateSEOKeywords', this.updateKeywords.bind(this));
    hookManager.removeHook('updateSEOOgImage', this.updateOGImage.bind(this));
    hookManager.removeHook('generateArticleStructuredData', this.generateArticleStructuredData.bind(this));
    hookManager.removeHook('generateProductStructuredData', this.generateProductStructuredData.bind(this));
  }

  private generateDefaultStructuredData(): void {
    const settings = this.config.settings || {};
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: settings.title || document.title,
      description: settings.description || '',
      url: window.location.href
    };

    this.injectStructuredData(structuredData);
  }

  // Public methods for dynamic SEO updates
  updateTitle(title: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;
    
    document.title = title;
    this.injectMetaTag('og:title', title);
    this.injectMetaTag('twitter:title', title);
    
    this.getEventEmitter().emit('seoTitleUpdated', { title });
  }

  updateDescription(description: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;
    
    this.injectMetaTag('description', description);
    this.injectMetaTag('og:description', description);
    this.injectMetaTag('twitter:description', description);
    
    this.getEventEmitter().emit('seoDescriptionUpdated', { description });
  }

  updateKeywords(keywords: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;
    
    this.injectMetaTag('keywords', keywords);
    
    this.getEventEmitter().emit('seoKeywordsUpdated', { keywords });
  }

  updateOGImage(imageUrl: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;
    
    this.injectMetaTag('og:image', imageUrl);
    this.injectMetaTag('twitter:image', imageUrl);
    
    this.getEventEmitter().emit('seoOGImageUpdated', { imageUrl });
  }

  // Method to generate structured data for articles
  generateArticleStructuredData(data: {
    headline: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    author: string;
    publisher: string;
    description?: string;
  }): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const settings = this.config.settings || {};
    if (!settings.enableStructuredData) return;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.headline,
      image: data.image,
      datePublished: data.datePublished,
      dateModified: data.dateModified || data.datePublished,
      author: {
        '@type': 'Person',
        name: data.author
      },
      publisher: {
        '@type': 'Organization',
        name: data.publisher
      },
      description: data.description
    };

    this.injectStructuredData(structuredData);
    this.getEventEmitter().emit('articleStructuredDataGenerated', { data, structuredData });
  }

  // Method to generate structured data for products
  generateProductStructuredData(data: {
    name: string;
    image: string;
    description: string;
    brand: string;
    sku: string;
    price: number;
    priceCurrency: string;
    availability: 'InStock' | 'OutOfStock' | 'PreOrder';
    reviewCount?: number;
    ratingValue?: number;
  }): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const settings = this.config.settings || {};
    if (!settings.enableStructuredData) return;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data.name,
      image: data.image,
      description: data.description,
      brand: {
        '@type': 'Brand',
        name: data.brand
      },
      sku: data.sku,
      offers: {
        '@type': 'Offer',
        price: data.price,
        priceCurrency: data.priceCurrency,
        availability: `https://schema.org/${data.availability}`
      },
      review: data.reviewCount && data.ratingValue ? {
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: data.ratingValue,
          bestRating: 5
        },
        author: {
          '@type': 'Person',
          name: 'Customer'
        }
      } : undefined,
      aggregateRating: data.reviewCount && data.ratingValue ? {
        '@type': 'AggregateRating',
        ratingValue: data.ratingValue,
        reviewCount: data.reviewCount
      } : undefined
    };

    this.injectStructuredData(structuredData);
    this.getEventEmitter().emit('productStructuredDataGenerated', { data, structuredData });
  }

  // Method to update multiple SEO properties at once
  updateSEO(data: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
  }): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    if (data.title) this.updateTitle(data.title);
    if (data.description) this.updateDescription(data.description);
    if (data.keywords) this.updateKeywords(data.keywords);
    if (data.ogImage) this.updateOGImage(data.ogImage);

    this.getEventEmitter().emit('seoUpdated', data);
  }

  static getSettingsSchema(): PluginSettings {
    return SEOToolsPlugin.settingsSchema;
  }
}