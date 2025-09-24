import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export interface KeywordData {
  keyword: string;
  density: number;
  count: number;
  position: number[];
  relevance: number;
  category?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface KeywordAnalysis {
  totalWords: number;
  totalKeywords: number;
  keywordDensity: number;
  topKeywords: KeywordData[];
  keywordCategories: Record<string, KeywordData[]>;
  readabilityScore: number;
  suggestions: string[];
}

export interface KeywordTaggingOptions {
  autoTag: boolean;
  densityAnalysis: boolean;
  readabilityAnalysis: boolean;
  sentimentAnalysis: boolean;
  categoryAnalysis: boolean;
  minKeywordLength: number;
  maxKeywordLength: number;
  stopWords: string[];
  customKeywords: string[];
  densityThreshold: number;
  relevanceThreshold: number;
}

export class KeywordTaggingPlugin extends BasePlugin {
  private static settingsSchema: PluginSettings = {
    autoTag: {
      type: 'boolean',
      label: 'Auto Tag Content',
      required: false,
      default: true,
      description: 'Automatically tag content with keywords'
    },
    densityAnalysis: {
      type: 'boolean',
      label: 'Density Analysis',
      required: false,
      default: true,
      description: 'Analyze keyword density in content'
    },
    readabilityAnalysis: {
      type: 'boolean',
      label: 'Readability Analysis',
      required: false,
      default: true,
      description: 'Analyze content readability'
    },
    sentimentAnalysis: {
      type: 'boolean',
      label: 'Sentiment Analysis',
      required: false,
      default: false,
      description: 'Analyze sentiment of keywords'
    },
    categoryAnalysis: {
      type: 'boolean',
      label: 'Category Analysis',
      required: false,
      default: true,
      description: 'Categorize keywords by topic'
    },
    minKeywordLength: {
      type: 'number',
      label: 'Min Keyword Length',
      required: false,
      default: 3,
      description: 'Minimum length for keywords'
    },
    maxKeywordLength: {
      type: 'number',
      label: 'Max Keyword Length',
      required: false,
      default: 50,
      description: 'Maximum length for keywords'
    },
    stopWords: {
      type: 'array',
      label: 'Stop Words',
      required: false,
      default: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
      description: 'Words to exclude from keyword analysis'
    },
    customKeywords: {
      type: 'array',
      label: 'Custom Keywords',
      required: false,
      default: [],
      description: 'Custom keywords to prioritize'
    },
    densityThreshold: {
      type: 'number',
      label: 'Density Threshold',
      required: false,
      default: 2,
      description: 'Minimum keyword density percentage'
    },
    relevanceThreshold: {
      type: 'number',
      label: 'Relevance Threshold',
      required: false,
      default: 0.5,
      description: 'Minimum relevance score for keywords'
    },
    targetKeywords: {
      type: 'array',
      label: 'Target Keywords',
      required: false,
      default: [],
      description: 'Target keywords for SEO optimization'
    },
    keywordCategories: {
      type: 'object',
      label: 'Keyword Categories',
      required: false,
      default: {},
      description: 'Custom keyword categories'
    }
  };

  private keywordData: KeywordData[] = [];
  private contentAnalysis: KeywordAnalysis | null = null;
  private mutationObserver: MutationObserver | null = null;
  private contentAnalyzer: ContentAnalyzer | null = null;
  private keywordExtractor: KeywordExtractor | null = null;

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const settings = this.config.settings || {};
      
      // Validate settings
      const isValid = this.validateSettings(settings, KeywordTaggingPlugin.settingsSchema);
      if (!isValid) {
        console.error('Invalid Keyword Tagging settings');
        return;
      }

      // Initialize components
      this.contentAnalyzer = new ContentAnalyzer(settings);
      this.keywordExtractor = new KeywordExtractor(settings);

      // Setup content monitoring
      this.setupContentMonitoring();

      // Register hooks
      this.registerHooks();

      // Add event listeners
      this.addEventListeners();

      // Analyze current page content
      if (settings.autoTag) {
        await this.analyzeCurrentPage();
      }

      // Emit plugin loaded event
      this.getEventEmitter().emit('keywordTaggingLoaded', this.config);

      this.isLoaded = true;
      console.log('Keyword Tagging plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Keyword Tagging plugin:', error);
      this.getEventEmitter().emit('keywordTaggingError', error);
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

      // Clear data
      this.keywordData = [];
      this.contentAnalysis = null;
      this.contentAnalyzer = null;
      this.keywordExtractor = null;

      // Remove keyword tags from DOM
      this.removeKeywordTags();

      // Emit plugin unloaded event
      this.getEventEmitter().emit('keywordTaggingUnloaded', this.config);

      this.isLoaded = false;
      console.log('Keyword Tagging plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload Keyword Tagging plugin:', error);
      this.getEventEmitter().emit('keywordTaggingError', error);
    }
  }

  private setupContentMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'subtree') {
          this.handleContentChange();
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  private handleContentChange(): void {
    const settings = this.config.settings || {};
    
    if (settings.autoTag) {
      // Debounce content analysis
      clearTimeout((this as any).contentAnalysisTimeout);
      (this as any).contentAnalysisTimeout = setTimeout(() => {
        this.analyzeCurrentPage();
      }, 1000);
    }
  }

  private registerHooks(): void {
    const hookManager = this.getHookManager();
    
    hookManager.addHook('analyzeKeywords', this.analyzeKeywords.bind(this));
    hookManager.addHook('extractKeywords', this.extractKeywords.bind(this));
    hookManager.addHook('getKeywordAnalysis', this.getKeywordAnalysis.bind(this));
    hookManager.addHook('getTopKeywords', this.getTopKeywords.bind(this));
    hookManager.addHook('addCustomKeyword', this.addCustomKeyword.bind(this));
    hookManager.addHook('removeKeyword', this.removeKeyword.bind(this));
    hookManager.addHook('updateKeywordRelevance', this.updateKeywordRelevance.bind(this));
    hookManager.addHook('categorizeKeywords', this.categorizeKeywords.bind(this));
  }

  private unregisterHooks(): void {
    const hookManager = this.getHookManager();
    
    hookManager.removeHook('analyzeKeywords', this.analyzeKeywords.bind(this));
    hookManager.removeHook('extractKeywords', this.extractKeywords.bind(this));
    hookManager.removeHook('getKeywordAnalysis', this.getKeywordAnalysis.bind(this));
    hookManager.removeHook('getTopKeywords', this.getTopKeywords.bind(this));
    hookManager.removeHook('addCustomKeyword', this.addCustomKeyword.bind(this));
    hookManager.removeHook('removeKeyword', this.removeKeyword.bind(this));
    hookManager.removeHook('updateKeywordRelevance', this.updateKeywordRelevance.bind(this));
    hookManager.removeHook('categorizeKeywords', this.categorizeKeywords.bind(this));
  }

  private addEventListeners(): void {
    const eventEmitter = this.getEventEmitter();
    
    eventEmitter.on('contentUpdated', this.handleContentUpdate.bind(this));
    eventEmitter.on('pageChanged', this.handlePageChange.bind(this));
    eventEmitter.on('keywordAnalysisRequested', this.handleKeywordAnalysisRequest.bind(this));
  }

  private removeEventListeners(): void {
    const eventEmitter = this.getEventEmitter();
    
    eventEmitter.off('contentUpdated', this.handleContentUpdate.bind(this));
    eventEmitter.off('pageChanged', this.handlePageChange.bind(this));
    eventEmitter.off('keywordAnalysisRequested', this.handleKeywordAnalysisRequest.bind(this));
  }

  private handleContentUpdate(contentData: any): void {
    const settings = this.config.settings || {};
    
    if (settings.autoTag && contentData.content) {
      this.analyzeContent(contentData.content);
    }
  }

  private handlePageChange(pageData: any): void {
    // Clear previous analysis
    this.keywordData = [];
    this.contentAnalysis = null;
    
    // Analyze new page
    const settings = this.config.settings || {};
    if (settings.autoTag) {
      this.analyzeCurrentPage();
    }
  }

  private handleKeywordAnalysisRequest(request: any): void {
    const { content, options } = request;
    if (content) {
      this.analyzeContent(content, options);
    }
  }

  private async analyzeCurrentPage(): Promise<void> {
    if (typeof window === 'undefined') return;

    const content = this.extractPageContent();
    await this.analyzeContent(content);
  }

  private extractPageContent(): string {
    // Extract content from main content areas
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content'
    ];

    let content = '';
    
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        content += element.textContent + ' ';
      }
    }

    // Also extract from headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      content += heading.textContent + ' ';
    });

    // Extract from paragraphs
    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach(paragraph => {
      content += paragraph.textContent + ' ';
    });

    return content.trim();
  }

  private async analyzeContent(content: string, options?: any): Promise<KeywordAnalysis> {
    if (!this.contentAnalyzer || !this.keywordExtractor) {
      throw new Error('Content analyzer not initialized');
    }

    try {
      const settings = this.config.settings || {};
      
      // Extract keywords
      const keywords = await this.keywordExtractor.extract(content);
      
      // Analyze keywords
      const analysis = await this.contentAnalyzer.analyze(content, keywords);
      
      // Store results
      this.keywordData = keywords;
      this.contentAnalysis = analysis;
      
      // Apply keyword tags if enabled
      if (settings.autoTag) {
        this.applyKeywordTags(keywords);
      }
      
      // Emit events
      this.getEventEmitter().emit('keywordsAnalyzed', { keywords, analysis });
      this.getEventEmitter().emit('contentAnalysisCompleted', analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing content:', error);
      this.getEventEmitter().emit('keywordAnalysisError', error);
      throw error;
    }
  }

  private applyKeywordTags(keywords: KeywordData[]): void {
    if (typeof window === 'undefined') return;

    const settings = this.config.settings || {};
    
    // Remove existing keyword tags
    this.removeKeywordTags();
    
    // Add meta keywords tag
    const topKeywords = keywords
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10)
      .map(k => k.keyword)
      .join(', ');
    
    if (topKeywords) {
      this.injectMetaTag('keywords', topKeywords);
    }
    
    // Add keyword data attributes to content
    if (settings.densityAnalysis) {
      this.highlightKeywords(keywords);
    }
  }

  private removeKeywordTags(): void {
    // Remove keywords meta tag
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
      keywordsMeta.remove();
    }
    
    // Remove keyword highlights
    const highlights = document.querySelectorAll('.keyword-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
        parent.normalize();
      }
    });
  }

  private highlightKeywords(keywords: KeywordData[]): void {
    if (typeof window === 'undefined') return;

    const settings = this.config.settings || {};
    const topKeywords = keywords
      .filter(k => k.density >= (settings.densityThreshold || 2))
      .slice(0, 20);
    
    // Get content elements
    const contentElements = document.querySelectorAll('p, span, div, article, section');
    
    contentElements.forEach(element => {
      const text = element.textContent || '';
      let modifiedText = text;
      
      // Highlight keywords
      topKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.keyword}\\b`, 'gi');
        modifiedText = modifiedText.replace(regex, `<span class="keyword-highlight" data-keyword="${keyword.keyword}" data-density="${keyword.density}">${keyword.keyword}</span>`);
      });
      
      // Update element if text was modified
      if (modifiedText !== text) {
        element.innerHTML = modifiedText;
      }
    });
  }

  // Public API methods
  async analyzeKeywords(content: string): Promise<KeywordAnalysis> {
    return await this.analyzeContent(content);
  }

  async extractKeywords(content: string): Promise<KeywordData[]> {
    if (!this.keywordExtractor) {
      throw new Error('Keyword extractor not initialized');
    }
    
    return await this.keywordExtractor.extract(content);
  }

  getKeywordAnalysis(): KeywordAnalysis | null {
    return this.contentAnalysis ? { ...this.contentAnalysis } : null;
  }

  getTopKeywords(limit: number = 10): KeywordData[] {
    return this.keywordData
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  addCustomKeyword(keyword: string, category?: string): void {
    const settings = this.config.settings || {};
    
    // Add to custom keywords
    if (!settings.customKeywords.includes(keyword)) {
      settings.customKeywords.push(keyword);
    }
    
    // Update keyword data
    const existingKeyword = this.keywordData.find(k => k.keyword.toLowerCase() === keyword.toLowerCase());
    if (existingKeyword) {
      existingKeyword.relevance = Math.max(existingKeyword.relevance, 1.0);
      if (category) {
        existingKeyword.category = category;
      }
    } else {
      const newKeyword: KeywordData = {
        keyword,
        density: 0,
        count: 0,
        position: [],
        relevance: 1.0,
        category
      };
      this.keywordData.push(newKeyword);
    }
    
    this.getEventEmitter().emit('customKeywordAdded', { keyword, category });
  }

  removeKeyword(keyword: string): void {
    this.keywordData = this.keywordData.filter(k => k.keyword !== keyword);
    this.getEventEmitter().emit('keywordRemoved', keyword);
  }

  updateKeywordRelevance(keyword: string, relevance: number): void {
    const keywordData = this.keywordData.find(k => k.keyword === keyword);
    if (keywordData) {
      keywordData.relevance = relevance;
      this.getEventEmitter().emit('keywordRelevanceUpdated', { keyword, relevance });
    }
  }

  categorizeKeywords(keywords: string[]): Record<string, string[]> {
    const settings = this.config.settings || {};
    const categories: Record<string, string[]> = {};
    
    // Use custom categories if available
    if (settings.keywordCategories && Object.keys(settings.keywordCategories).length > 0) {
      for (const [category, categoryKeywords] of Object.entries(settings.keywordCategories)) {
        categories[category] = keywords.filter(keyword => 
          (categoryKeywords as string[]).some(ck => 
            keyword.toLowerCase().includes(ck.toLowerCase())
          )
        );
      }
    } else {
      // Default categorization
      categories['general'] = keywords;
      categories['important'] = keywords.filter(k => 
        this.keywordData.find(kd => kd.keyword === k && kd.relevance > 0.7)
      );
    }
    
    return categories;
  }

  // Utility methods
  getKeywordDensity(keyword: string): number {
    const keywordData = this.keywordData.find(k => k.keyword === keyword);
    return keywordData ? keywordData.density : 0;
  }

  getKeywordCount(keyword: string): number {
    const keywordData = this.keywordData.find(k => k.keyword === keyword);
    return keywordData ? keywordData.count : 0;
  }

  getKeywordPositions(keyword: string): number[] {
    const keywordData = this.keywordData.find(k => k.keyword === keyword);
    return keywordData ? [...keywordData.position] : [];
  }

  getKeywordsByCategory(category: string): KeywordData[] {
    return this.keywordData.filter(k => k.category === category);
  }

  getKeywordsBySentiment(sentiment: 'positive' | 'negative' | 'neutral'): KeywordData[] {
    return this.keywordData.filter(k => k.sentiment === sentiment);
  }

  getReadabilityScore(): number {
    return this.contentAnalysis ? this.contentAnalysis.readabilityScore : 0;
  }

  getSuggestions(): string[] {
    return this.contentAnalysis ? [...this.contentAnalysis.suggestions] : [];
  }

  exportKeywordData(): any {
    return {
      keywords: this.keywordData,
      analysis: this.contentAnalysis,
      settings: this.config.settings,
      timestamp: new Date().toISOString()
    };
  }

  importKeywordData(data: any): void {
    if (data.keywords) {
      this.keywordData = data.keywords;
    }
    
    if (data.analysis) {
      this.contentAnalysis = data.analysis;
    }
    
    this.getEventEmitter().emit('keywordDataImported', data);
  }

  // Analysis methods
  analyzeSEOPerformance(): any {
    if (!this.contentAnalysis) {
      return null;
    }

    const settings = this.config.settings || {};
    const targetKeywords = settings.targetKeywords || [];
    
    const performance = {
      keywordCoverage: 0,
      targetKeywordUsage: 0,
      densityScore: 0,
      readabilityScore: this.contentAnalysis.readabilityScore,
      recommendations: [] as string[]
    };

    // Calculate keyword coverage
    const usedKeywords = this.keywordData.map(k => k.keyword.toLowerCase());
    const targetKeywordsLower = targetKeywords.map(k => k.toLowerCase());
    const usedTargetKeywords = targetKeywordsLower.filter(k => usedKeywords.includes(k));
    
    performance.targetKeywordUsage = targetKeywords.length > 0 
      ? (usedTargetKeywords.length / targetKeywords.length) * 100 
      : 0;

    // Calculate density score
    const averageDensity = this.keywordData.reduce((sum, k) => sum + k.density, 0) / this.keywordData.length;
    performance.densityScore = Math.min(averageDensity / 3 * 100, 100); // Optimal density around 3%

    // Generate recommendations
    if (performance.targetKeywordUsage < 50) {
      performance.recommendations.push('Consider using more target keywords in your content');
    }
    
    if (performance.densityScore < 50) {
      performance.recommendations.push('Keyword density is low, consider adding more keywords');
    }
    
    if (performance.densityScore > 100) {
      performance.recommendations.push('Keyword density is too high, may be considered keyword stuffing');
    }
    
    if (performance.readabilityScore < 60) {
      performance.recommendations.push('Content readability is low, consider simplifying the text');
    }

    return performance;
  }

  static getSettingsSchema(): PluginSettings {
    return KeywordTaggingPlugin.settingsSchema;
  }
}

// Content Analyzer class
class ContentAnalyzer {
  private settings: any;

  constructor(settings: any) {
    this.settings = settings;
  }

  async analyze(content: string, keywords: KeywordData[]): Promise<KeywordAnalysis> {
    const totalWords = this.countWords(content);
    const totalKeywords = keywords.length;
    const keywordDensity = totalWords > 0 ? (keywords.reduce((sum, k) => sum + k.count, 0) / totalWords) * 100 : 0;

    const topKeywords = keywords
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 20);

    const keywordCategories = this.categorizeKeywords(keywords);
    const readabilityScore = this.calculateReadabilityScore(content);
    const suggestions = this.generateSuggestions(keywords, readabilityScore);

    return {
      totalWords,
      totalKeywords,
      keywordDensity,
      topKeywords,
      keywordCategories,
      readabilityScore,
      suggestions
    };
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private categorizeKeywords(keywords: KeywordData[]): Record<string, KeywordData[]> {
    const categories: Record<string, KeywordData[]> = {};
    
    const settings = this.settings;
    if (settings.keywordCategories && Object.keys(settings.keywordCategories).length > 0) {
      for (const [category, categoryKeywords] of Object.entries(settings.keywordCategories)) {
        categories[category] = keywords.filter(keyword => 
          (categoryKeywords as string[]).some(ck => 
            keyword.keyword.toLowerCase().includes(ck.toLowerCase())
          )
        );
      }
    } else {
      categories['general'] = keywords;
      categories['high-relevance'] = keywords.filter(k => k.relevance > 0.7);
      categories['medium-relevance'] = keywords.filter(k => k.relevance > 0.4 && k.relevance <= 0.7);
      categories['low-relevance'] = keywords.filter(k => k.relevance <= 0.4);
    }
    
    return categories;
  }

  private calculateReadabilityScore(content: string): number {
    // Simple readability score based on sentence length and word complexity
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = words.reduce((sum, word) => {
      return sum + this.countSyllables(word);
    }, 0) / words.length;
    
    // Flesch Reading Ease formula (simplified)
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    
    return matches ? matches.length : 1;
  }

  private generateSuggestions(keywords: KeywordData[], readabilityScore: number): string[] {
    const suggestions: string[] = [];
    
    const avgDensity = keywords.length > 0 
      ? keywords.reduce((sum, k) => sum + k.density, 0) / keywords.length 
      : 0;
    
    if (avgDensity < 1) {
      suggestions.push('Consider adding more relevant keywords to improve SEO');
    }
    
    if (avgDensity > 5) {
      suggestions.push('Keyword density is high, may be considered keyword stuffing');
    }
    
    if (readabilityScore < 60) {
      suggestions.push('Content readability is low, consider using shorter sentences and simpler words');
    }
    
    if (readabilityScore > 90) {
      suggestions.push('Content may be too simple, consider adding more detailed information');
    }
    
    const highRelevanceKeywords = keywords.filter(k => k.relevance > 0.8);
    if (highRelevanceKeywords.length === 0) {
      suggestions.push('No highly relevant keywords found, consider adding more target keywords');
    }
    
    return suggestions;
  }
}

// Keyword Extractor class
class KeywordExtractor {
  private settings: any;

  constructor(settings: any) {
    this.settings = settings;
  }

  async extract(content: string): Promise<KeywordData[]> {
    const words = this.tokenize(content);
    const filteredWords = this.filterWords(words);
    const keywordFreq = this.calculateFrequency(filteredWords);
    const keywordPositions = this.calculatePositions(content, filteredWords);
    
    const totalWords = words.length;
    const keywords: KeywordData[] = [];

    for (const [keyword, freq] of Object.entries(keywordFreq)) {
      const positions = keywordPositions[keyword] || [];
      const density = totalWords > 0 ? (freq / totalWords) * 100 : 0;
      const relevance = this.calculateRelevance(keyword, freq, density, positions);
      
      keywords.push({
        keyword,
        density,
        count: freq,
        position: positions,
        relevance,
        sentiment: this.settings.sentimentAnalysis ? this.analyzeSentiment(keyword) : undefined
      });
    }

    // Apply custom keyword relevance boost
    this.applyCustomKeywordBoost(keywords);

    return keywords;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private filterWords(words: string[]): string[] {
    const settings = this.settings;
    const minLength = settings.minKeywordLength || 3;
    const maxLength = settings.maxKeywordLength || 50;
    const stopWords = new Set(settings.stopWords || []);
    
    return words.filter(word => 
      word.length >= minLength &&
      word.length <= maxLength &&
      !stopWords.has(word) &&
      !/^\d+$/.test(word) // Exclude pure numbers
    );
  }

  private calculateFrequency(words: string[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return frequency;
  }

  private calculatePositions(content: string, words: string[]): Record<string, number[]> {
    const positions: Record<string, number[]> = {};
    const contentLower = content.toLowerCase();
    
    words.forEach(word => {
      positions[word] = [];
      let index = contentLower.indexOf(word);
      
      while (index !== -1) {
        positions[word].push(index);
        index = contentLower.indexOf(word, index + 1);
      }
    });
    
    return positions;
  }

  private calculateRelevance(keyword: string, freq: number, density: number, positions: number[]): number {
    let relevance = 0;
    
    // Frequency relevance
    relevance += Math.min(freq / 5, 1) * 0.3;
    
    // Density relevance
    relevance += Math.min(density / 3, 1) * 0.3;
    
    // Position relevance (keywords in first half of content are more relevant)
    if (positions.length > 0) {
      const avgPosition = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
      const positionScore = Math.max(0, 1 - (avgPosition / 10000)); // Normalize by content length
      relevance += positionScore * 0.2;
    }
    
    // Length relevance (medium-length keywords are often more relevant)
    const lengthScore = keyword.length >= 4 && keyword.length <= 12 ? 1 : 0.5;
    relevance += lengthScore * 0.2;
    
    return Math.min(relevance, 1);
  }

  private applyCustomKeywordBoost(keywords: KeywordData[]): void {
    const settings = this.settings;
    const customKeywords = settings.customKeywords || [];
    const targetKeywords = settings.targetKeywords || [];
    
    const boostKeywords = [...customKeywords, ...targetKeywords];
    
    keywords.forEach(keyword => {
      if (boostKeywords.includes(keyword.keyword)) {
        keyword.relevance = Math.min(keyword.relevance * 1.5, 1);
      }
    });
  }

  private analyzeSentiment(keyword: string): 'positive' | 'negative' | 'neutral' {
    // Simple sentiment analysis based on keyword lists
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'best', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'boring', 'disappointing'];
    
    const lowerKeyword = keyword.toLowerCase();
    
    if (positiveWords.some(word => lowerKeyword.includes(word))) {
      return 'positive';
    }
    
    if (negativeWords.some(word => lowerKeyword.includes(word))) {
      return 'negative';
    }
    
    return 'neutral';
  }
}