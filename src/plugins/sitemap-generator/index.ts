import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export interface SitemapURL {
  loc: string;
  lastmod: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
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
    }
  };

  private urls: SitemapURL[] = [];

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

      // Initialize with default pages
      this.addURL('/', {
        changefreq: settings.defaultChangefreq || 'weekly',
        priority: settings.defaultPriority || 0.8
      });

      // Auto-generate sitemap if enabled
      if (settings.autoGenerate) {
        this.generateSitemap();
      }

      this.isLoaded = true;
      console.log('Sitemap Generator plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Sitemap Generator plugin:', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      this.urls = [];
      this.isLoaded = false;
      console.log('Sitemap Generator plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload Sitemap Generator plugin:', error);
    }
  }

  addURL(path: string, options?: {
    changefreq?: SitemapURL['changefreq'];
    priority?: number;
    lastmod?: string;
  }): void {
    const settings = this.config.settings || {};
    const baseUrl = settings.baseUrl || '';
    
    const url: SitemapURL = {
      loc: `${baseUrl}${path}`,
      lastmod: options?.lastmod || new Date().toISOString().split('T')[0],
      changefreq: options?.changefreq || settings.defaultChangefreq || 'weekly',
      priority: options?.priority || settings.defaultPriority || 0.8
    };

    // Remove existing URL if it exists
    this.urls = this.urls.filter(u => u.loc !== url.loc);
    
    // Add new URL
    this.urls.push(url);

    // Auto-generate sitemap if enabled
    if (settings.autoGenerate) {
      this.generateSitemap();
    }
  }

  removeURL(path: string): void {
    const settings = this.config.settings || {};
    const baseUrl = settings.baseUrl || '';
    const loc = `${baseUrl}${path}`;
    
    this.urls = this.urls.filter(url => url.loc !== loc);

    // Auto-generate sitemap if enabled
    if (settings.autoGenerate) {
      this.generateSitemap();
    }
  }

  generateSitemap(): string {
    const settings = this.config.settings || {};
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

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
      
      sitemap += `
  </url>`;
    }

    sitemap += `
</urlset>`;

    return sitemap;
  }

  generateSitemapIndex(sitemaps: string[]): string {
    const settings = this.config.settings || {};
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

    return sitemapIndex;
  }

  generateRobotsTxt(): string {
    const settings = this.config.settings || {};
    const baseUrl = settings.baseUrl || '';
    
    return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Method to get all URLs
  getURLs(): SitemapURL[] {
    return [...this.urls];
  }

  // Method to clear all URLs
  clearURLs(): void {
    this.urls = [];
  }

  static getSettingsSchema(): PluginSettings {
    return SitemapGeneratorPlugin.settingsSchema;
  }
}