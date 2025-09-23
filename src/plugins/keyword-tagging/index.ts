import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export interface KeywordData {
  keyword: string;
  density: number;
  count: number;
  position: number[];
  type: 'primary' | 'secondary' | 'tertiary' | 'lsi';
}

export class KeywordTaggingPlugin extends BasePlugin {
  private static settingsSchema: PluginSettings = {
    primaryKeywords: {
      type: 'array',
      label: 'Primary Keywords',
      required: false,
      default: [],
      description: 'Primary keywords for the page'
    },
    secondaryKeywords: {
      type: 'array',
      label: 'Secondary Keywords',
      required: false,
      default: [],
      description: 'Secondary keywords for the page'
    },
    autoTag: {
      type: 'boolean',
      label: 'Auto Tag Content',
      required: false,
      default: true,
      description: 'Automatically tag content with keywords'
    },
    densityThreshold: {
      type: 'number',
      label: 'Density Threshold',
      required: false,
      default: 0.5,
      description: 'Minimum keyword density percentage (0.1-5.0)'
    },
    maxKeywords: {
      type: 'number',
      label: 'Maximum Keywords',
      required: false,
      default: 10,
      description: 'Maximum number of keywords to extract'
    },
    enableMetaKeywords: {
      type: 'boolean',
      label: 'Enable Meta Keywords',
      required: false,
      default: true,
      description: 'Add keywords to meta keywords tag'
    },
    enableContentAnalysis: {
      type: 'boolean',
      label: 'Enable Content Analysis',
      required: false,
      default: true,
      description: 'Analyze content for keyword optimization'
    }
  };

  private keywordData: KeywordData[] = [];
  private contentKeywords: KeywordData[] = [];

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const settings = this.config.settings || {};
      
      // Initialize with configured keywords
      this.initializeKeywords();

      // Analyze current page content if auto-tag is enabled
      if (settings.autoTag) {
        await this.analyzePageContent();
      }

      // Apply meta keywords if enabled
      if (settings.enableMetaKeywords) {
        this.applyMetaKeywords();
      }

      this.isLoaded = true;
      console.log('Keyword Tagging plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Keyword Tagging plugin:', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      // Remove meta keywords
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.remove();
      }

      this.keywordData = [];
      this.contentKeywords = [];
      this.isLoaded = false;
      console.log('Keyword Tagging plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload Keyword Tagging plugin:', error);
    }
  }

  private initializeKeywords(): void {
    const settings = this.config.settings || {};
    
    this.keywordData = [];
    
    // Add primary keywords
    if (settings.primaryKeywords) {
      settings.primaryKeywords.forEach((keyword: string) => {
        this.keywordData.push({
          keyword: keyword.toLowerCase(),
          density: 0,
          count: 0,
          position: [],
          type: 'primary'
        });
      });
    }

    // Add secondary keywords
    if (settings.secondaryKeywords) {
      settings.secondaryKeywords.forEach((keyword: string) => {
        this.keywordData.push({
          keyword: keyword.toLowerCase(),
          density: 0,
          count: 0,
          position: [],
          type: 'secondary'
        });
      });
    }
  }

  private async analyzePageContent(): Promise<void> {
    const settings = this.config.settings || {};
    
    // Get page content
    const content = this.getPageContent();
    if (!content) return;

    // Extract keywords from content
    const extractedKeywords = this.extractKeywords(content);
    
    // Filter and rank keywords
    const filteredKeywords = this.filterKeywords(extractedKeywords);
    
    // Update content keywords
    this.contentKeywords = filteredKeywords;

    // Calculate density for all keywords
    this.calculateKeywordDensity(content);

    // Log analysis results
    if (settings.enableContentAnalysis) {
      this.logAnalysisResults();
    }
  }

  private getPageContent(): string {
    const title = document.title;
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const h1 = document.querySelector('h1')?.textContent || '';
    const h2s = Array.from(document.querySelectorAll('h2')).map(h2 => h2.textContent || '').join(' ');
    const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.textContent || '').join(' ');
    
    return `${title} ${description} ${h1} ${h2s} ${paragraphs}`;
  }

  private extractKeywords(content: string): KeywordData[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const wordCount = words.length;
    const wordFrequency: { [key: string]: number } = {};

    // Count word frequency
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

    // Convert to keyword data
    const keywords: KeywordData[] = [];
    for (const [word, count] of Object.entries(wordFrequency)) {
      keywords.push({
        keyword: word,
        density: (count / wordCount) * 100,
        count,
        position: this.findWordPositions(content, word),
        type: 'lsi'
      });
    }

    return keywords;
  }

  private findWordPositions(content: string, word: string): number[] {
    const positions: number[] = [];
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      positions.push(match.index);
    }
    
    return positions;
  }

  private filterKeywords(keywords: KeywordData[]): KeywordData[] {
    const settings = this.config.settings || {};
    const threshold = settings.densityThreshold || 0.5;
    const maxKeywords = settings.maxKeywords || 10;

    // Filter by density threshold
    const filtered = keywords.filter(k => k.density >= threshold);

    // Sort by density and count
    filtered.sort((a, b) => {
      if (a.density !== b.density) {
        return b.density - a.density;
      }
      return b.count - a.count;
    });

    // Limit to max keywords
    return filtered.slice(0, maxKeywords);
  }

  private calculateKeywordDensity(content: string): void {
    const totalWords = content.split(/\s+/).length;

    // Calculate density for configured keywords
    this.keywordData.forEach(keyword => {
      const matches = content.toLowerCase().match(new RegExp(`\\b${keyword.keyword}\\b`, 'g'));
      keyword.count = matches ? matches.length : 0;
      keyword.density = totalWords > 0 ? (keyword.count / totalWords) * 100 : 0;
      keyword.position = this.findWordPositions(content, keyword.keyword);
    });

    // Merge with content keywords
    const allKeywords = [...this.keywordData, ...this.contentKeywords];
    
    // Remove duplicates and sort
    const uniqueKeywords = this.removeDuplicateKeywords(allKeywords);
    uniqueKeywords.sort((a, b) => b.density - a.density);
    
    // Update keyword data
    this.keywordData = uniqueKeywords;
  }

  private removeDuplicateKeywords(keywords: KeywordData[]): KeywordData[] {
    const seen = new Set();
    return keywords.filter(keyword => {
      if (seen.has(keyword.keyword)) {
        return false;
      }
      seen.add(keyword.keyword);
      return true;
    });
  }

  private applyMetaKeywords(): void {
    const settings = this.config.settings || {};
    if (!settings.enableMetaKeywords) return;

    const topKeywords = this.keywordData
      .slice(0, 10)
      .map(k => k.keyword)
      .join(', ');

    if (topKeywords) {
      this.injectMetaTag('keywords', topKeywords);
    }
  }

  private logAnalysisResults(): void {
    console.log('=== Keyword Analysis Results ===');
    console.log('Top Keywords:');
    this.keywordData.slice(0, 5).forEach((keyword, index) => {
      console.log(`${index + 1}. "${keyword.keyword}" (${keyword.type})`);
      console.log(`   Density: ${keyword.density.toFixed(2)}%`);
      console.log(`   Count: ${keyword.count}`);
      console.log(`   Positions: ${keyword.position.length > 0 ? keyword.position.slice(0, 3).join(', ') + '...' : 'N/A'}`);
    });
  }

  // Public methods
  addKeyword(keyword: string, type: 'primary' | 'secondary' | 'tertiary' = 'secondary'): void {
    this.keywordData.push({
      keyword: keyword.toLowerCase(),
      density: 0,
      count: 0,
      position: [],
      type
    });

    if (this.isLoaded) {
      this.analyzePageContent();
      this.applyMetaKeywords();
    }
  }

  removeKeyword(keyword: string): void {
    this.keywordData = this.keywordData.filter(k => k.keyword !== keyword.toLowerCase());

    if (this.isLoaded) {
      this.applyMetaKeywords();
    }
  }

  getKeywords(): KeywordData[] {
    return [...this.keywordData];
  }

  getKeywordsByType(type: string): KeywordData[] {
    return this.keywordData.filter(k => k.type === type);
  }

  getTopKeywords(count: number = 10): KeywordData[] {
    return this.keywordData.slice(0, count);
  }

  getKeywordDensity(keyword: string): number {
    const found = this.keywordData.find(k => k.keyword === keyword.toLowerCase());
    return found ? found.density : 0;
  }

  analyzeText(text: string): KeywordData[] {
    const extractedKeywords = this.extractKeywords(text);
    const filteredKeywords = this.filterKeywords(extractedKeywords);
    
    // Calculate density
    const totalWords = text.split(/\s+/).length;
    filteredKeywords.forEach(keyword => {
      keyword.density = totalWords > 0 ? (keyword.count / totalWords) * 100 : 0;
    });

    return filteredKeywords;
  }

  static getSettingsSchema(): PluginSettings {
    return KeywordTaggingPlugin.settingsSchema;
  }
}