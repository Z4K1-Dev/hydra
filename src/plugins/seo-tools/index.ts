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
    }
  };

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const settings = this.config.settings || {};
      
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

      this.isLoaded = true;
      console.log('SEO Tools plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load SEO Tools plugin:', error);
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

      this.isLoaded = false;
      console.log('SEO Tools plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload SEO Tools plugin:', error);
    }
  }

  // Public methods for dynamic SEO updates
  updateTitle(title: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;
    
    document.title = title;
    this.injectMetaTag('og:title', title);
    this.injectMetaTag('twitter:title', title);
  }

  updateDescription(description: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;
    
    this.injectMetaTag('description', description);
    this.injectMetaTag('og:description', description);
    this.injectMetaTag('twitter:description', description);
  }

  updateKeywords(keywords: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;
    
    this.injectMetaTag('keywords', keywords);
  }

  updateOGImage(imageUrl: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;
    
    this.injectMetaTag('og:image', imageUrl);
    this.injectMetaTag('twitter:image', imageUrl);
  }

  // Method to generate structured data for articles
  generateArticleStructuredData(data: {
    headline: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    author: string;
    publisher: string;
  }): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

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
      }
    };

    this.injectStructuredData(structuredData);
  }

  static getSettingsSchema(): PluginSettings {
    return SEOToolsPlugin.settingsSchema;
  }
}