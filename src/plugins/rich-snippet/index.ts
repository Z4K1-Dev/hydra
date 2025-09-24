import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export interface RichSnippetData {
  type: 'article' | 'product' | 'local-business' | 'website' | 'organization' | 'person';
  data: any;
}

export class RichSnippetPlugin extends BasePlugin {
  private static settingsSchema: PluginSettings = {
    enableArticle: {
      type: 'boolean',
      label: 'Enable Article Snippets',
      required: false,
      default: true,
      description: 'Enable structured data for articles'
    },
    enableProduct: {
      type: 'boolean',
      label: 'Enable Product Snippets',
      required: false,
      default: true,
      description: 'Enable structured data for products'
    },
    enableLocalBusiness: {
      type: 'boolean',
      label: 'Enable Local Business Snippets',
      required: false,
      default: true,
      description: 'Enable structured data for local businesses'
    },
    enableOrganization: {
      type: 'boolean',
      label: 'Enable Organization Snippets',
      required: false,
      default: true,
      description: 'Enable structured data for organizations'
    },
    defaultOrganization: {
      type: 'object',
      label: 'Default Organization Data',
      required: false,
      default: {},
      description: 'Default organization information for structured data'
    }
  };

  private snippets: RichSnippetData[] = [];

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const settings = this.config.settings || {};
      
      // Apply default organization snippet if enabled
      if (settings.enableOrganization && settings.defaultOrganization) {
        this.addOrganizationSnippet(settings.defaultOrganization);
      }

      // Inject all existing snippets
      this.injectAllSnippets();

      this.isLoaded = true;
      console.log('Rich Snippet plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Rich Snippet plugin:', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      // Remove all structured data scripts
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => script.remove());

      this.snippets = [];
      this.isLoaded = false;
      console.log('Rich Snippet plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload Rich Snippet plugin:', error);
    }
  }

  private injectAllSnippets(): void {
    if (typeof window === 'undefined') return;

    // Remove existing structured data scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Inject all snippets
    for (const snippet of this.snippets) {
      this.injectStructuredData(this.generateStructuredData(snippet.type, snippet.data));
    }
  }

  addArticleSnippet(data: {
    headline: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    author: string;
    publisher: string;
    description?: string;
  }): void {
    const settings = this.config.settings || {};
    if (!settings.enableArticle) return;

    this.snippets.push({
      type: 'article',
      data
    });

    if (this.isLoaded) {
      this.injectAllSnippets();
    }
  }

  addProductSnippet(data: {
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
    const settings = this.config.settings || {};
    if (!settings.enableProduct) return;

    this.snippets.push({
      type: 'product',
      data
    });

    if (this.isLoaded) {
      this.injectAllSnippets();
    }
  }

  addLocalBusinessSnippet(data: {
    name: string;
    address: {
      streetAddress: string;
      addressLocality: string;
      addressRegion: string;
      postalCode: string;
      addressCountry: string;
    };
    geo?: {
      latitude: number;
      longitude: number;
    };
    telephone?: string;
    openingHours?: string[];
    priceRange?: string;
    image?: string;
  }): void {
    const settings = this.config.settings || {};
    if (!settings.enableLocalBusiness) return;

    this.snippets.push({
      type: 'local-business',
      data
    });

    if (this.isLoaded) {
      this.injectAllSnippets();
    }
  }

  addOrganizationSnippet(data: {
    name: string;
    url?: string;
    logo?: string;
    description?: string;
    address?: {
      streetAddress: string;
      addressLocality: string;
      addressRegion: string;
      postalCode: string;
      addressCountry: string;
    };
    contactPoint?: {
      telephone: string;
      contactType: string;
    }[];
  }): void {
    const settings = this.config.settings || {};
    if (!settings.enableOrganization) return;

    this.snippets.push({
      type: 'organization',
      data
    });

    if (this.isLoaded) {
      this.injectAllSnippets();
    }
  }

  private generateStructuredData(type: string, data: any): any {
    switch (type) {
      case 'article':
        return {
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

      case 'product':
        return {
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

      case 'local-business':
        return {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: data.name,
          address: {
            '@type': 'PostalAddress',
            streetAddress: data.address.streetAddress,
            addressLocality: data.address.addressLocality,
            addressRegion: data.address.addressRegion,
            postalCode: data.address.postalCode,
            addressCountry: data.address.addressCountry
          },
          geo: data.geo ? {
            '@type': 'GeoCoordinates',
            latitude: data.geo.latitude,
            longitude: data.geo.longitude
          } : undefined,
          telephone: data.telephone,
          openingHours: data.openingHours,
          priceRange: data.priceRange,
          image: data.image
        };

      case 'organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: data.name,
          url: data.url,
          logo: data.logo,
          description: data.description,
          address: data.address ? {
            '@type': 'PostalAddress',
            streetAddress: data.address.streetAddress,
            addressLocality: data.address.addressLocality,
            addressRegion: data.address.addressRegion,
            postalCode: data.address.postalCode,
            addressCountry: data.address.addressCountry
          } : undefined,
          contactPoint: data.contactPoint?.map(point => ({
            '@type': 'ContactPoint',
            telephone: point.telephone,
            contactType: point.contactType
          }))
        };

      default:
        return {};
    }
  }

  // Method to remove a specific snippet
  removeSnippet(type: string, index: number): void {
    this.snippets = this.snippets.filter(snippet => 
      !(snippet.type === type && this.snippets.indexOf(snippet) === index)
    );

    if (this.isLoaded) {
      this.injectAllSnippets();
    }
  }

  // Method to clear all snippets
  clearSnippets(): void {
    this.snippets = [];

    if (this.isLoaded) {
      this.injectAllSnippets();
    }
  }

  // Method to get all snippets
  getSnippets(): RichSnippetData[] {
    return [...this.snippets];
  }

  static getSettingsSchema(): PluginSettings {
    return RichSnippetPlugin.settingsSchema;
  }
}