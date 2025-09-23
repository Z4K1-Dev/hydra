import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export interface SitemapURL {
  loc: string;
  lastmod: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  image?: string[];
  video?: any[];
}

export class SitemapGeneratorPlugin extends BasePlugin {
  private static settingsSchema: PluginSettings = {
    baseUrl: {
      type: 'string',
      label: 'Base URL',
      required: true,
      description: 'Your website base URL (e.g., https://example.com)'
    },
    autoGenerate: {
      type: 'boolean',
      label: 'Auto Generate',
      required: false,
      default: true,
      description: 'Automatically generate sitemap on page changes'
    },
    includeImages: {
      type: 'boolean',
      label: 'Include Images',
      required: false,
      default: true,
      description: 'Include image URLs in sitemap'
    },
    defaultChangefreq: {
      type: 'string',
      label: 'Default Change Frequency',
      required: false,
      default: 'weekly',
      description: 'Default change frequency for pages'
    },
    defaultPriority: {
      type: 'number',
      label: 'Default Priority',
      required: false,
      default: 0.8,
      description: 'Default priority for pages (0.0 to 1.0)'
    },
    generateIndex: {
      type: 'boolean',
      label: 'Generate Sitemap Index',
      required: false,
      default: false,
      description: 'Generate sitemap index for large websites'
    },
    maxUrlsPerSitemap: {
      type: 'number',
      label: 'Max URLs per Sitemap',
      required: false,
      default: 50000,
      description: 'Maximum URLs per sitemap file'
    }
  };

  private urls: SitemapURL[] = [];
  private isGenerating: boolean = false;
  private generationQueue: Array<() => Promise<void>> = [];
  private routeChangeListener: ((event: any) => void) | null = null;

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const settings = this.config.settings || {};
      
      if (!settings.baseUrl) {
        console.error('Base URL is required for Sitemap Generator');
        return;
      }

      // Validate settings
      const isValid = this.validateSettings(settings, SitemapGeneratorPlugin.settingsSchema);
      if (!isValid) {
        console.error('Invalid Sitemap Generator settings');
        return;
      }

      // Initialize with default pages
      this.initializeDefaultPages();

      // Setup route change listeners
      this.setupRouteChangeListeners();

      // Register hooks
      this.registerHooks();

      // Add event listeners
      this.addEventListeners();

      // Auto-generate sitemap if enabled
      if (settings.autoGenerate) {
        await this.generateSitemap();
      }

      // Emit plugin loaded event
      this.getEventEmitter().emit('sitemapGeneratorLoaded', this.config);

      this.isLoaded = true;
      console.log('Sitemap Generator plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Sitemap Generator plugin:', error);
      this.getEventEmitter().emit('sitemapGeneratorError', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      // Remove route change listeners
      this.removeRouteChangeListeners();

      // Remove hooks
      this.unregisterHooks();

      // Remove event listeners
      this.removeEventListeners();

      // Clear URLs and queue
      this.urls = [];
      this.generationQueue = [];

      // Emit plugin unloaded event
      this.getEventEmitter().emit('sitemapGeneratorUnloaded', this.config);

      this.isLoaded = false;
      console.log('Sitemap Generator plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload Sitemap Generator plugin:', error);
      this.getEventEmitter().emit('sitemapGeneratorError', error);
    }
  }

  private initializeDefaultPages(): void {
    const settings = this.config.settings || {};
    
    // Add home page
    this.addURL('/', {
      changefreq: settings.defaultChangefreq || 'weekly',
      priority: settings.defaultPriority || 0.8
    });

    // Add common pages (these can be customized)
    const commonPages = ['/about', '/contact', '/blog', '/services'];
    commonPages.forEach(page => {
      this.addURL(page, {
        changefreq: 'monthly',
        priority: 0.6
      });
    });
  }

  private setupRouteChangeListeners(): void {
    if (typeof window === 'undefined') return;

    const handleRouteChange = (event: any) => {
      const path = window.location.pathname;
      
      // Add current page to sitemap
      this.addURL(path, {
        lastmod: new Date().toISOString().split('T')[0]
      });

      // Auto-generate sitemap if enabled
      const settings = this.config.settings || {};
      if (settings.autoGenerate) {
        this.queueSitemapGeneration();
      }
    };

    this.routeChangeListener = handleRouteChange;

    // Listen for route changes
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
    if (!this.routeChangeListener) return;

    window.removeEventListener('popstate', this.routeChangeListener);
    
    // For Next.js router events
    if ((window as any).next) {
      const nextRouter = (window as any).next.router;
      if (nextRouter) {
        nextRouter.events.off('routeChangeComplete', this.routeChangeListener);
      }
    }

    this.routeChangeListener = null;
  }

  private registerHooks(): void {
    const hookManager = this.getHookManager();
    
    hookManager.addHook('addSitemapURL', this.addURL.bind(this));
    hookManager.addHook('removeSitemapURL', this.removeURL.bind(this));
    hookManager.addHook('generateSitemap', this.generateSitemap.bind(this));
    hookManager.addHook('getSitemapURLs', this.getURLs.bind(this));
  }

  private unregisterHooks(): void {
    const hookManager = this.getHookManager();
    
    hookManager.removeHook('addSitemapURL', this.addURL.bind(this));
    hookManager.removeHook('removeSitemapURL', this.removeURL.bind(this));
    hookManager.removeHook('generateSitemap', this.generateSitemap.bind(this));
    hookManager.removeHook('getSitemapURLs', this.getURLs.bind(this));
  }

  private addEventListeners(): void {
    const eventEmitter = this.getEventEmitter();
    
    eventEmitter.on('pageAdded', this.handlePageAdded.bind(this));
    eventEmitter.on('pageRemoved', this.handlePageRemoved.bind(this));
    eventEmitter.on('contentUpdated', this.handleContentUpdated.bind(this));
  }

  private removeEventListeners(): void {
    const eventEmitter = this.getEventEmitter();
    
    eventEmitter.off('pageAdded', this.handlePageAdded.bind(this));
    eventEmitter.off('pageRemoved', this.handlePageRemoved.bind(this));
    eventEmitter.off('contentUpdated', this.handleContentUpdated.bind(this));
  }

  private handlePageAdded(pageData: any): void {
    if (pageData.path) {
      this.addURL(pageData.path, {
        changefreq: pageData.changefreq,
        priority: pageData.priority,
        lastmod: pageData.lastmod
      });
    }
  }

  private handlePageRemoved(pageData: any): void {
    if (pageData.path) {
      this.removeURL(pageData.path);
    }
  }

  private handleContentUpdated(contentData: any): void {
    if (contentData.path) {
      this.updateURL(contentData.path, {
        lastmod: new Date().toISOString().split('T')[0]
      });
    }
  }

  private queueSitemapGeneration(): void {
    if (this.isGenerating) {
      // Add to queue if already generating
      this.generationQueue.push(() => this.generateSitemap());
    } else {
      // Generate immediately
      this.generateSitemap();
    }
  }

  addURL(path: string, options?: {
    changefreq?: SitemapURL['changefreq'];
    priority?: number;
    lastmod?: string;
    image?: string[];
    video?: any[];
  }): void {
    const settings = this.config.settings || {};
    const baseUrl = settings.baseUrl || '';
    
    const url: SitemapURL = {
      loc: `${baseUrl}${path}`,
      lastmod: options?.lastmod || new Date().toISOString().split('T')[0],
      changefreq: options?.changefreq || settings.defaultChangefreq || 'weekly',
      priority: options?.priority || settings.defaultPriority || 0.8
    };

    // Add images if enabled
    if (settings.includeImages && options?.image) {
      url.image = options.image;
    }

    // Add videos if provided
    if (options?.video) {
      url.video = options.video;
    }

    // Remove existing URL if it exists
    this.urls = this.urls.filter(u => u.loc !== url.loc);
    
    // Add new URL
    this.urls.push(url);

    // Emit event
    this.getEventEmitter().emit('sitemapURLAdded', url);

    // Auto-generate sitemap if enabled
    if (settings.autoGenerate) {
      this.queueSitemapGeneration();
    }
  }

  removeURL(path: string): void {
    const settings = this.config.settings || {};
    const baseUrl = settings.baseUrl || '';
    const loc = `${baseUrl}${path}`;
    
    const removedURLs = this.urls.filter(url => url.loc === loc);
    this.urls = this.urls.filter(url => url.loc !== loc);

    // Emit event
    removedURLs.forEach(url => {
      this.getEventEmitter().emit('sitemapURLRemoved', url);
    });

    // Auto-generate sitemap if enabled
    if (settings.autoGenerate) {
      this.queueSitemapGeneration();
    }
  }

  updateURL(path: string, updates: {
    changefreq?: SitemapURL['changefreq'];
    priority?: number;
    lastmod?: string;
    image?: string[];
    video?: any[];
  }): void {
    const settings = this.config.settings || {};
    const baseUrl = settings.baseUrl || '';
    const loc = `${baseUrl}${path}`;
    
    const urlIndex = this.urls.findIndex(url => url.loc === loc);
    if (urlIndex === -1) return;

    // Update URL
    this.urls[urlIndex] = { ...this.urls[urlIndex], ...updates };

    // Emit event
    this.getEventEmitter().emit('sitemapURLUpdated', this.urls[urlIndex]);

    // Auto-generate sitemap if enabled
    if (settings.autoGenerate) {
      this.queueSitemapGeneration();
    }
  }

  async generateSitemap(): Promise<string | null> {
    if (this.isGenerating) return null;

    this.isGenerating = true;

    try {
      const settings = this.config.settings || {};
      
      if (settings.generateIndex && this.urls.length > settings.maxUrlsPerSitemap) {
        return await this.generateSitemapIndex();
      } else {
        return this.generateSingleSitemap();
      }
    } catch (error) {
      console.error('Error generating sitemap:', error);
      this.getEventEmitter().emit('sitemapGenerationError', error);
      return null;
    } finally {
      this.isGenerating = false;
      
      // Process queued generations
      if (this.generationQueue.length > 0) {
        const nextGeneration = this.generationQueue.shift();
        if (nextGeneration) {
          nextGeneration();
        }
      }
    }
  }

  private generateSingleSitemap(): string {
    const settings = this.config.settings || {};
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`;

    // Add image namespace if images are included
    if (settings.includeImages) {
      sitemap += ` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`;
    }

    // Add video namespace if videos are included
    if (this.urls.some(url => url.video && url.video.length > 0)) {
      sitemap += ` xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"`;
    }

    sitemap += `>`;

    for (const url of this.urls) {
      sitemap += `
  <url>
    <loc>${this.escapeXML(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>`;
      
      if (url.changefreq) {
        sitemap += `
    <changefreq>${url.changefreq}</changefreq>`;
      }
      
      if (url.priority !== undefined) {
        sitemap += `
    <priority>${url.priority}</priority>`;
      }

      // Add images
      if (url.image && url.image.length > 0) {
        url.image.forEach(imageUrl => {
          sitemap += `
    <image:image>
      <image:loc>${this.escapeXML(imageUrl)}</image:loc>
    </image:image>`;
        });
      }

      // Add videos
      if (url.video && url.video.length > 0) {
        url.video.forEach(video => {
          sitemap += `
    <video:video>
      <video:thumbnail_loc>${this.escapeXML(video.thumbnail_loc)}</video:thumbnail_loc>
      <video:title>${this.escapeXML(video.title)}</video:title>
      <video:description>${this.escapeXML(video.description)}</video:description>`;
          
          if (video.content_loc) {
            sitemap += `
      <video:content_loc>${this.escapeXML(video.content_loc)}</video:content_loc>`;
          }
          
          if (video.duration) {
            sitemap += `
      <video:duration>${video.duration}</video:duration>`;
          }
          
          sitemap += `
    </video:video>`;
        });
      }

      sitemap += `
  </url>`;
    }

    sitemap += `
</urlset>`;

    // Emit event
    this.getEventEmitter().emit('sitemapGenerated', sitemap);

    return sitemap;
  }

  private async generateSitemapIndex(): Promise<string> {
    const settings = this.config.settings || {};
    const maxUrls = settings.maxUrlsPerSitemap || 50000;
    const sitemaps: string[] = [];

    // Split URLs into multiple sitemaps
    for (let i = 0; i < this.urls.length; i += maxUrls) {
      const chunk = this.urls.slice(i, i + maxUrls);
      const sitemapName = `sitemap-${Math.floor(i / maxUrls) + 1}.xml`;
      sitemaps.push(sitemapName);
    }

    // Generate sitemap index
    const baseUrl = settings.baseUrl || '';
    let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    for (const sitemap of sitemaps) {
      sitemapIndex += `
  <sitemap>
    <loc>${baseUrl}/${sitemap}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;
    }

    sitemapIndex += `
</sitemapindex>`;

    // Emit event
    this.getEventEmitter().emit('sitemapIndexGenerated', sitemapIndex);

    return sitemapIndex;
  }

  generateRobotsTxt(): string {
    const settings = this.config.settings || {};
    const baseUrl = settings.baseUrl || '';
    
    let robotsTxt = `User-agent: *
Allow: /

`;

    // Add sitemap reference
    if (settings.generateIndex) {
      robotsTxt += `Sitemap: ${baseUrl}/sitemap-index.xml`;
    } else {
      robotsTxt += `Sitemap: ${baseUrl}/sitemap.xml`;
    }

    return robotsTxt;
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Public methods
  getURLs(): SitemapURL[] {
    return [...this.urls];
  }

  clearURLs(): void {
    this.urls = [];
    this.getEventEmitter().emit('sitemapURLsCleared');
  }

  getURLCount(): number {
    return this.urls.length;
  }

  isURLExists(path: string): boolean {
    const settings = this.config.settings || {};
    const baseUrl = settings.baseUrl || '';
    const loc = `${baseUrl}${path}`;
    
    return this.urls.some(url => url.loc === loc);
  }

  // Method to analyze sitemap
  analyzeSitemap(): any {
    const analysis = {
      totalUrls: this.urls.length,
      changeFrequency: {} as Record<string, number>,
      priorityDistribution: {} as Record<string, number>,
      lastModifiedRange: {
        oldest: null as string | null,
        newest: null as string | null
      },
      hasImages: false,
      hasVideos: false
    };

    // Analyze change frequency distribution
    this.urls.forEach(url => {
      const freq = url.changefreq || 'weekly';
      analysis.changeFrequency[freq] = (analysis.changeFrequency[freq] || 0) + 1;
    });

    // Analyze priority distribution
    this.urls.forEach(url => {
      const priority = url.priority || 0.8;
      const range = priority >= 0.8 ? 'high' : priority >= 0.5 ? 'medium' : 'low';
      analysis.priorityDistribution[range] = (analysis.priorityDistribution[range] || 0) + 1;
    });

    // Analyze last modified dates
    const dates = this.urls.map(url => url.lastmod).filter(date => date);
    if (dates.length > 0) {
      analysis.lastModifiedRange.oldest = dates.reduce((oldest, current) => 
        current < oldest ? current : oldest
      );
      analysis.lastModifiedRange.newest = dates.reduce((newest, current) => 
        current > newest ? current : newest
      );
    }

    // Check for images and videos
    analysis.hasImages = this.urls.some(url => url.image && url.image.length > 0);
    analysis.hasVideos = this.urls.some(url => url.video && url.video.length > 0);

    return analysis;
  }

  static getSettingsSchema(): PluginSettings {
    return SitemapGeneratorPlugin.settingsSchema;
  }
}