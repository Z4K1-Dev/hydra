import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export interface RichSnippetData {
  type: 'article' | 'product' | 'local-business' | 'website' | 'organization' | 'person' | 'recipe' | 'event' | 'video';
  data: any;
  id?: string;
}

export interface StructuredDataOptions {
  autoDetect?: boolean;
  validateSchema?: boolean;
  debugMode?: boolean;
  maxSnippetsPerPage?: number;
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
    enableRecipe: {
      type: 'boolean',
      label: 'Enable Recipe Snippets',
      required: false,
      default: true,
      description: 'Enable structured data for recipes'
    },
    enableEvent: {
      type: 'boolean',
      label: 'Enable Event Snippets',
      required: false,
      default: true,
      description: 'Enable structured data for events'
    },
    enableVideo: {
      type: 'boolean',
      label: 'Enable Video Snippets',
      required: false,
      default: true,
      description: 'Enable structured data for videos'
    },
    defaultOrganization: {
      type: 'object',
      label: 'Default Organization Data',
      required: false,
      default: {},
      description: 'Default organization information for structured data'
    },
    autoDetectContent: {
      type: 'boolean',
      label: 'Auto-detect Content',
      required: false,
      default: true,
      description: 'Automatically detect content type and generate structured data'
    },
    validateSchema: {
      type: 'boolean',
      label: 'Validate Schema',
      required: false,
      default: true,
      description: 'Validate structured data against schema.org'
    },
    debugMode: {
      type: 'boolean',
      label: 'Debug Mode',
      required: false,
      default: false,
      description: 'Enable debug mode for troubleshooting'
    }
  };

  private snippets: RichSnippetData[] = [];
  private mutationObserver: MutationObserver | null = null;
  private contentAnalyzer: ContentAnalyzer | null = null;

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const settings = this.config.settings || {};
      
      // Validate settings
      const isValid = this.validateSettings(settings, RichSnippetPlugin.settingsSchema);
      if (!isValid) {
        console.error('Invalid Rich Snippet settings');
        return;
      }

      // Initialize content analyzer
      this.contentAnalyzer = new ContentAnalyzer(settings);

      // Apply default organization snippet if enabled
      if (settings.enableOrganization && settings.defaultOrganization) {
        this.addOrganizationSnippet(settings.defaultOrganization);
      }

      // Setup content detection
      this.setupContentDetection();

      // Setup mutation observer for dynamic content
      this.setupMutationObserver();

      // Register hooks
      this.registerHooks();

      // Add event listeners
      this.addEventListeners();

      // Auto-detect and generate structured data
      if (settings.autoDetectContent) {
        await this.autoDetectStructuredData();
      }

      // Inject all existing snippets
      this.injectAllSnippets();

      // Emit plugin loaded event
      this.getEventEmitter().emit('richSnippetLoaded', this.config);

      this.isLoaded = true;
      console.log('Rich Snippet plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Rich Snippet plugin:', error);
      this.getEventEmitter().emit('richSnippetError', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      // Remove mutation observer
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }

      // Remove hooks
      this.unregisterHooks();

      // Remove event listeners
      this.removeEventListeners();

      // Remove all structured data scripts
      this.removeAllStructuredData();

      // Clear snippets and analyzer
      this.snippets = [];
      this.contentAnalyzer = null;

      // Emit plugin unloaded event
      this.getEventEmitter().emit('richSnippetUnloaded', this.config);

      this.isLoaded = false;
      console.log('Rich Snippet plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload Rich Snippet plugin:', error);
      this.getEventEmitter().emit('richSnippetError', error);
    }
  }

  private setupContentDetection(): void {
    if (!this.contentAnalyzer) return;

    // Detect page content on load
    this.contentAnalyzer.analyzePage().then(analysis => {
      if (analysis.type && analysis.data) {
        this.addStructuredData(analysis.type, analysis.data);
      }
    });
  }

  private setupMutationObserver(): void {
    if (typeof window === 'undefined') return;

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'subtree') {
          this.handleDOMChanges();
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-type']
    });
  }

  private handleDOMChanges(): void {
    const settings = this.config.settings || {};
    
    if (settings.autoDetectContent && this.contentAnalyzer) {
      // Debounce content detection
      clearTimeout((this as any).contentDetectionTimeout);
      (this as any).contentDetectionTimeout = setTimeout(() => {
        this.contentAnalyzer!.analyzePage().then(analysis => {
          if (analysis.type && analysis.data) {
            this.updateStructuredData(analysis.type, analysis.data);
          }
        });
      }, 1000);
    }
  }

  private registerHooks(): void {
    const hookManager = this.getHookManager();
    
    hookManager.addHook('addArticleSnippet', this.addArticleSnippet.bind(this));
    hookManager.addHook('addProductSnippet', this.addProductSnippet.bind(this));
    hookManager.addHook('addLocalBusinessSnippet', this.addLocalBusinessSnippet.bind(this));
    hookManager.addHook('addOrganizationSnippet', this.addOrganizationSnippet.bind(this));
    hookManager.addHook('addRecipeSnippet', this.addRecipeSnippet.bind(this));
    hookManager.addHook('addEventSnippet', this.addEventSnippet.bind(this));
    hookManager.addHook('addVideoSnippet', this.addVideoSnippet.bind(this));
    hookManager.addHook('addCustomSnippet', this.addCustomSnippet.bind(this));
    hookManager.addHook('removeSnippet', this.removeSnippet.bind(this));
    hookManager.addHook('updateSnippet', this.updateSnippet.bind(this));
  }

  private unregisterHooks(): void {
    const hookManager = this.getHookManager();
    
    hookManager.removeHook('addArticleSnippet', this.addArticleSnippet.bind(this));
    hookManager.removeHook('addProductSnippet', this.addProductSnippet.bind(this));
    hookManager.removeHook('addLocalBusinessSnippet', this.addLocalBusinessSnippet.bind(this));
    hookManager.removeHook('addOrganizationSnippet', this.addOrganizationSnippet.bind(this));
    hookManager.removeHook('addRecipeSnippet', this.addRecipeSnippet.bind(this));
    hookManager.removeHook('addEventSnippet', this.addEventSnippet.bind(this));
    hookManager.removeHook('addVideoSnippet', this.addVideoSnippet.bind(this));
    hookManager.removeHook('addCustomSnippet', this.addCustomSnippet.bind(this));
    hookManager.removeHook('removeSnippet', this.removeSnippet.bind(this));
    hookManager.removeHook('updateSnippet', this.updateSnippet.bind(this));
  }

  private addEventListeners(): void {
    const eventEmitter = this.getEventEmitter();
    
    eventEmitter.on('contentUpdated', this.handleContentUpdate.bind(this));
    eventEmitter.on('pageChanged', this.handlePageChange.bind(this));
    eventEmitter.on('structuredDataRequested', this.handleStructuredDataRequest.bind(this));
  }

  private removeEventListeners(): void {
    const eventEmitter = this.getEventEmitter();
    
    eventEmitter.off('contentUpdated', this.handleContentUpdate.bind(this));
    eventEmitter.off('pageChanged', this.handlePageChange.bind(this));
    eventEmitter.off('structuredDataRequested', this.handleStructuredDataRequest.bind(this));
  }

  private handleContentUpdate(contentData: any): void {
    const settings = this.config.settings || {};
    
    if (settings.autoDetectContent && this.contentAnalyzer) {
      this.contentAnalyzer.analyzeContent(contentData).then(analysis => {
        if (analysis.type && analysis.data) {
          this.updateStructuredData(analysis.type, analysis.data);
        }
      });
    }
  }

  private handlePageChange(pageData: any): void {
    // Clear page-specific snippets when page changes
    this.clearPageSnippets();
    
    // Auto-detect new page content
    const settings = this.config.settings || {};
    if (settings.autoDetectContent && this.contentAnalyzer) {
      this.contentAnalyzer.analyzePage().then(analysis => {
        if (analysis.type && analysis.data) {
          this.addStructuredData(analysis.type, analysis.data);
        }
      });
    }
  }

  private handleStructuredDataRequest(request: any): void {
    const { type, data } = request;
    if (type && data) {
      this.addStructuredData(type, data);
    }
  }

  private async autoDetectStructuredData(): Promise<void> {
    if (!this.contentAnalyzer) return;

    const analysis = await this.contentAnalyzer.analyzePage();
    if (analysis.type && analysis.data) {
      this.addStructuredData(analysis.type, analysis.data);
    }
  }

  // Article snippet methods
  addArticleSnippet(data: {
    headline: string;
    image: string;
    datePublished: string;
    dateModified?: string;
    author: string;
    publisher: string;
    description?: string;
    articleSection?: string;
    wordCount?: number;
  }): void {
    const settings = this.config.settings || {};
    if (!settings.enableArticle) return;

    const snippet: RichSnippetData = {
      type: 'article',
      data: {
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
      }
    };

    if (data.articleSection) {
      snippet.data.articleSection = data.articleSection;
    }

    if (data.wordCount) {
      snippet.data.wordCount = data.wordCount;
    }

    this.addStructuredData('article', snippet.data);
  }

  // Product snippet methods
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

    const snippet: RichSnippetData = {
      type: 'product',
      data: {
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
        }
      }
    };

    if (data.reviewCount && data.ratingValue) {
      snippet.data.review = {
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
      };

      snippet.data.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: data.ratingValue,
        reviewCount: data.reviewCount
      };
    }

    this.addStructuredData('product', snippet.data);
  }

  // Local business snippet methods
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
    rating?: {
      ratingValue: number;
      reviewCount: number;
    };
  }): void {
    const settings = this.config.settings || {};
    if (!settings.enableLocalBusiness) return;

    const snippet: RichSnippetData = {
      type: 'local-business',
      data: {
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
        }
      }
    };

    if (data.geo) {
      snippet.data.geo = {
        '@type': 'GeoCoordinates',
        latitude: data.geo.latitude,
        longitude: data.geo.longitude
      };
    }

    if (data.telephone) {
      snippet.data.telephone = data.telephone;
    }

    if (data.openingHours) {
      snippet.data.openingHoursSpecification = data.openingHours.map(hours => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: hours.split(' ')[0],
        opens: hours.split(' ')[1],
        closes: hours.split(' ')[2]
      }));
    }

    if (data.priceRange) {
      snippet.data.priceRange = data.priceRange;
    }

    if (data.image) {
      snippet.data.image = data.image;
    }

    if (data.rating) {
      snippet.data.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: data.rating.ratingValue,
        reviewCount: data.rating.reviewCount
      };
    }

    this.addStructuredData('local-business', snippet.data);
  }

  // Organization snippet methods
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
    sameAs?: string[];
  }): void {
    const settings = this.config.settings || {};
    if (!settings.enableOrganization) return;

    const snippet: RichSnippetData = {
      type: 'organization',
      data: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: data.name
      }
    };

    if (data.url) {
      snippet.data.url = data.url;
    }

    if (data.logo) {
      snippet.data.logo = data.logo;
    }

    if (data.description) {
      snippet.data.description = data.description;
    }

    if (data.address) {
      snippet.data.address = {
        '@type': 'PostalAddress',
        streetAddress: data.address.streetAddress,
        addressLocality: data.address.addressLocality,
        addressRegion: data.address.addressRegion,
        postalCode: data.address.postalCode,
        addressCountry: data.address.addressCountry
      };
    }

    if (data.contactPoint) {
      snippet.data.contactPoint = data.contactPoint.map(contact => ({
        '@type': 'ContactPoint',
        telephone: contact.telephone,
        contactType: contact.contactType
      }));
    }

    if (data.sameAs) {
      snippet.data.sameAs = data.sameAs;
    }

    this.addStructuredData('organization', snippet.data);
  }

  // Recipe snippet methods
  addRecipeSnippet(data: {
    name: string;
    image: string;
    description: string;
    ingredients: string[];
    instructions: string[];
    cookTime?: string;
    prepTime?: string;
    totalTime?: string;
    recipeYield?: string;
    nutrition?: {
      calories?: string;
      fatContent?: string;
      proteinContent?: string;
      carbohydrateContent?: string;
    };
    author?: string;
    datePublished?: string;
  }): void {
    const settings = this.config.settings || {};
    if (!settings.enableRecipe) return;

    const snippet: RichSnippetData = {
      type: 'recipe',
      data: {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: data.name,
        image: data.image,
        description: data.description,
        ingredients: data.ingredients,
        recipeInstructions: data.instructions.map(instruction => ({
          '@type': 'HowToStep',
          text: instruction
        }))
      }
    };

    if (data.cookTime) {
      snippet.data.cookTime = data.cookTime;
    }

    if (data.prepTime) {
      snippet.data.prepTime = data.prepTime;
    }

    if (data.totalTime) {
      snippet.data.totalTime = data.totalTime;
    }

    if (data.recipeYield) {
      snippet.data.recipeYield = data.recipeYield;
    }

    if (data.nutrition) {
      snippet.data.nutrition = {
        '@type': 'NutritionInformation',
        ...data.nutrition
      };
    }

    if (data.author) {
      snippet.data.author = {
        '@type': 'Person',
        name: data.author
      };
    }

    if (data.datePublished) {
      snippet.data.datePublished = data.datePublished;
    }

    this.addStructuredData('recipe', snippet.data);
  }

  // Event snippet methods
  addEventSnippet(data: {
    name: string;
    startDate: string;
    endDate: string;
    location: {
      name: string;
      address: {
        streetAddress: string;
        addressLocality: string;
        addressRegion: string;
        postalCode: string;
        addressCountry: string;
      };
    };
    description?: string;
    image?: string;
    organizer?: {
      name: string;
      url?: string;
    };
    offers?: {
      price: number;
      priceCurrency: string;
      availability: string;
      url?: string;
    }[];
  }): void {
    const settings = this.config.settings || {};
    if (!settings.enableEvent) return;

    const snippet: RichSnippetData = {
      type: 'event',
      data: {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        location: {
          '@type': 'Place',
          name: data.location.name,
          address: {
            '@type': 'PostalAddress',
            streetAddress: data.location.address.streetAddress,
            addressLocality: data.location.address.addressLocality,
            addressRegion: data.location.address.addressRegion,
            postalCode: data.location.address.postalCode,
            addressCountry: data.location.address.addressCountry
          }
        }
      }
    };

    if (data.description) {
      snippet.data.description = data.description;
    }

    if (data.image) {
      snippet.data.image = data.image;
    }

    if (data.organizer) {
      snippet.data.organizer = {
        '@type': 'Organization',
        name: data.organizer.name,
        url: data.organizer.url
      };
    }

    if (data.offers) {
      snippet.data.offers = data.offers.map(offer => ({
        '@type': 'Offer',
        price: offer.price,
        priceCurrency: offer.priceCurrency,
        availability: `https://schema.org/${offer.availability}`,
        url: offer.url
      }));
    }

    this.addStructuredData('event', snippet.data);
  }

  // Video snippet methods
  addVideoSnippet(data: {
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration?: string;
    embedUrl?: string;
    contentUrl?: string;
    author?: string;
    views?: number;
  }): void {
    const settings = this.config.settings || {};
    if (!settings.enableVideo) return;

    const snippet: RichSnippetData = {
      type: 'video',
      data: {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: data.name,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        uploadDate: data.uploadDate
      }
    };

    if (data.duration) {
      snippet.data.duration = data.duration;
    }

    if (data.embedUrl) {
      snippet.data.embedUrl = data.embedUrl;
    }

    if (data.contentUrl) {
      snippet.data.contentUrl = data.contentUrl;
    }

    if (data.author) {
      snippet.data.author = {
        '@type': 'Person',
        name: data.author
      };
    }

    if (data.views) {
      snippet.data.interactionStatistic = {
        '@type': 'InteractionCounter',
        interactionType: {
          '@type': 'WatchAction'
        },
        userInteractionCount: data.views
      };
    }

    this.addStructuredData('video', snippet.data);
  }

  // Custom snippet methods
  addCustomSnippet(type: string, data: any): void {
    this.addStructuredData(type as any, data);
  }

  // Core structured data management
  private addStructuredData(type: RichSnippetData['type'], data: any): void {
    const settings = this.config.settings || {};
    
    // Check if this type is enabled
    const typeEnabled = settings[`enable${type.charAt(0).toUpperCase() + type.slice(1).replace('-', '')}`];
    if (typeEnabled === false) return;

    // Validate schema if enabled
    if (settings.validateSchema) {
      if (!this.validateStructuredData(data)) {
        if (settings.debugMode) {
          console.warn('Invalid structured data:', data);
        }
        return;
      }
    }

    // Remove existing snippet of the same type (if not allowing multiple)
    this.snippets = this.snippets.filter(snippet => snippet.type !== type);

    // Add new snippet
    const snippet: RichSnippetData = {
      type,
      data,
      id: `${type}-${Date.now()}`
    };

    this.snippets.push(snippet);

    // Inject immediately if loaded
    if (this.isLoaded) {
      this.injectStructuredData(data);
    }

    // Emit event
    this.getEventEmitter().emit('structuredDataAdded', snippet);

    if (settings.debugMode) {
      console.log('Structured data added:', snippet);
    }
  }

  private updateStructuredData(type: RichSnippetData['type'], data: any): void {
    const snippetIndex = this.snippets.findIndex(snippet => snippet.type === type);
    if (snippetIndex === -1) {
      this.addStructuredData(type, data);
      return;
    }

    // Update existing snippet
    this.snippets[snippetIndex].data = data;

    // Re-inject all snippets
    if (this.isLoaded) {
      this.injectAllSnippets();
    }

    // Emit event
    this.getEventEmitter().emit('structuredDataUpdated', { type, data });
  }

  private removeSnippet(type: RichSnippetData['type'], id?: string): void {
    let removedSnippets: RichSnippetData[] = [];
    
    if (id) {
      // Remove specific snippet
      removedSnippets = this.snippets.filter(snippet => 
        snippet.type === type && snippet.id === id
      );
      this.snippets = this.snippets.filter(snippet => 
        !(snippet.type === type && snippet.id === id)
      );
    } else {
      // Remove all snippets of type
      removedSnippets = this.snippets.filter(snippet => snippet.type === type);
      this.snippets = this.snippets.filter(snippet => snippet.type !== type);
    }

    // Re-inject remaining snippets
    if (this.isLoaded) {
      this.injectAllSnippets();
    }

    // Emit event
    removedSnippets.forEach(snippet => {
      this.getEventEmitter().emit('structuredDataRemoved', snippet);
    });
  }

  private updateSnippet(type: RichSnippetData['type'], id: string, data: any): void {
    const snippetIndex = this.snippets.findIndex(snippet => 
      snippet.type === type && snippet.id === id
    );
    
    if (snippetIndex === -1) return;

    this.snippets[snippetIndex].data = data;

    // Re-inject all snippets
    if (this.isLoaded) {
      this.injectAllSnippets();
    }

    // Emit event
    this.getEventEmitter().emit('structuredDataUpdated', { type, id, data });
  }

  private injectAllSnippets(): void {
    if (typeof window === 'undefined') return;

    // Remove existing structured data scripts
    this.removeAllStructuredData();

    // Inject all snippets
    for (const snippet of this.snippets) {
      this.injectStructuredData(snippet.data);
    }
  }

  private removeAllStructuredData(): void {
    if (typeof window === 'undefined') return;

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => script.remove());
  }

  private clearPageSnippets(): void {
    // Remove page-specific snippets (keep organization and other global snippets)
    const globalTypes = ['organization'];
    this.snippets = this.snippets.filter(snippet => 
      globalTypes.includes(snippet.type)
    );

    if (this.isLoaded) {
      this.injectAllSnippets();
    }
  }

  private validateStructuredData(data: any): boolean {
    // Basic validation - check if data has required fields
    if (!data || typeof data !== 'object') return false;
    
    if (!data['@context'] || data['@context'] !== 'https://schema.org') return false;
    
    if (!data['@type'] || typeof data['@type'] !== 'string') return false;

    // Additional validation can be added based on type
    return true;
  }

  // Public utility methods
  getSnippets(): RichSnippetData[] {
    return [...this.snippets];
  }

  getSnippetsByType(type: RichSnippetData['type']): RichSnippetData[] {
    return this.snippets.filter(snippet => snippet.type === type);
  }

  getSnippetCount(): number {
    return this.snippets.length;
  }

  hasSnippet(type: RichSnippetData['type']): boolean {
    return this.snippets.some(snippet => snippet.type === type);
  }

  clearAllSnippets(): void {
    this.snippets = [];
    
    if (this.isLoaded) {
      this.removeAllStructuredData();
    }

    this.getEventEmitter().emit('allStructuredDataCleared');
  }

  // Analysis methods
  analyzeSnippets(): any {
    const analysis = {
      totalSnippets: this.snippets.length,
      typeDistribution: {} as Record<string, number>,
      validationErrors: [] as string[],
      optimizationTips: [] as string[]
    };

    // Analyze type distribution
    this.snippets.forEach(snippet => {
      analysis.typeDistribution[snippet.type] = (analysis.typeDistribution[snippet.type] || 0) + 1;
    });

    // Check for potential issues
    if (analysis.totalSnippets > 10) {
      analysis.optimizationTips.push('Too many structured data snippets may impact performance');
    }

    if (this.snippets.some(s => s.type === 'article') && !this.snippets.some(s => s.type === 'organization')) {
      analysis.optimizationTips.push('Consider adding organization data for better article SEO');
    }

    return analysis;
  }

  static getSettingsSchema(): PluginSettings {
    return RichSnippetPlugin.settingsSchema;
  }
}

// Content Analyzer class for auto-detection
class ContentAnalyzer {
  private settings: any;
  private keywords: Record<string, string[]> = {
    article: ['article', 'blog', 'post', 'news', 'story'],
    product: ['product', 'price', 'buy', 'purchase', 'cart'],
    recipe: ['recipe', 'ingredient', 'cook', 'bake', 'prepare'],
    event: ['event', 'conference', 'workshop', 'seminar', 'meetup'],
    video: ['video', 'watch', 'play', 'duration', 'embed']
  };

  constructor(settings: any) {
    this.settings = settings;
  }

  async analyzePage(): Promise<{ type?: string; data?: any }> {
    if (typeof window === 'undefined') return {};

    const pageContent = document.body.innerText.toLowerCase();
    const pageTitle = document.title.toLowerCase();
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')?.toLowerCase() || '';
    
    const combinedContent = `${pageTitle} ${metaDescription} ${pageContent}`;

    // Analyze content type
    for (const [type, keywords] of Object.entries(this.keywords)) {
      const matches = keywords.filter(keyword => combinedContent.includes(keyword));
      
      if (matches.length >= 2) { // Require at least 2 keyword matches
        return await this.generateStructuredData(type as any, combinedContent);
      }
    }

    return {};
  }

  async analyzeContent(content: any): Promise<{ type?: string; data?: any }> {
    // Analyze specific content data
    if (content.type) {
      return await this.generateStructuredData(content.type as any, content);
    }
    
    return {};
  }

  private async generateStructuredData(type: string, content: string): Promise<{ type: string; data: any }> {
    // Generate basic structured data based on type
    const title = document.title;
    const url = window.location.href;
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    switch (type) {
      case 'article':
        return {
          type: 'article',
          data: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description,
            url,
            datePublished: new Date().toISOString(),
            author: {
              '@type': 'Person',
              name: 'Unknown Author'
            },
            publisher: {
              '@type': 'Organization',
              name: 'Unknown Publisher'
            }
          }
        };

      case 'product':
        return {
          type: 'product',
          data: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: title,
            description,
            url
          }
        };

      default:
        return {
          type: 'website',
          data: {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: title,
            description,
            url
          }
        };
    }
  }
}