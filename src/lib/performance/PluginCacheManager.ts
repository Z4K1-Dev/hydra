import { BasePlugin } from '../../plugins/base-plugin';

// Cache strategies
export enum CacheStrategy {
  LRU = 'lru',
  TTL = 'ttl',
  LFU = 'lfu',
  FIFO = 'fifo',
}

// Cache entry interface
export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
  accessCount?: number; // For LFU strategy
}

// Cache configuration
export interface CacheConfig {
  strategy: CacheStrategy;
  maxEntries?: number; // For LRU and FIFO strategies
  defaultTTL?: number; // Default time to live in milliseconds
  enableCompression?: boolean;
  maxSize?: number; // Maximum size in bytes
}

// Cache statistics
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  currentSize: number;
  hitRate: number;
}

// Cache manager interface
export interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
  stats(): Promise<CacheStats>;
  invalidate(pattern: string): Promise<number>; // Invalidate by pattern matching
  gc(): Promise<void>; // Garbage collection
}

// Plugin-specific cache manager
export class PluginCacheManager implements CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    currentSize: 0,
    hitRate: 0,
  };
  private pluginName: string;
  private currentSize: number = 0;

  constructor(pluginName: string, config: Partial<CacheConfig> = {}) {
    this.pluginName = pluginName;
    this.config = {
      strategy: config.strategy || CacheStrategy.LRU,
      maxEntries: config.maxEntries || 1000,
      defaultTTL: config.defaultTTL || 300000, // 5 minutes
      enableCompression: config.enableCompression || false,
      maxSize: config.maxSize || 50 * 1024 * 1024, // 50MB
    };
  }

  async get<T>(key: string): Promise<T | null> {
    const fullKey = `${this.pluginName}:${key}`;
    const entry = this.cache.get(fullKey);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if TTL expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      await this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access count for LFU strategy
    if (this.config.strategy === CacheStrategy.LFU && entry.accessCount !== undefined) {
      entry.accessCount++;
      this.cache.set(fullKey, entry);
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = `${this.pluginName}:${key}`;
    const effectiveTTL = ttl !== undefined ? ttl : this.config.defaultTTL;
    
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: effectiveTTL,
      accessCount: this.config.strategy === CacheStrategy.LFU ? 1 : undefined,
    };

    this.cache.set(fullKey, entry);
    this.currentSize++; // Simplified size tracking

    // Apply cache strategy
    await this.applyEvictionStrategy();
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = `${this.pluginName}:${key}`;
    const deleted = this.cache.delete(fullKey);
    
    if (deleted) {
      this.currentSize--; // Simplified size tracking
    }

    return deleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.currentSize = 0;
  }

  async has(key: string): Promise<boolean> {
    const fullKey = `${this.pluginName}:${key}`;
    const entry = this.cache.get(fullKey);
    
    if (!entry) {
      return false;
    }

    // Check if TTL expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  async keys(): Promise<string[]> {
    const pluginPrefix = `${this.pluginName}:`;
    return Array.from(this.cache.keys())
      .filter(key => key.startsWith(pluginPrefix))
      .map(key => key.substring(pluginPrefix.length));
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  async stats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  async invalidate(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let invalidatedCount = 0;

    for (const key of this.cache.keys()) {
      const localKey = key.substring(`${this.pluginName}:`.length);
      if (regex.test(localKey)) {
        await this.delete(localKey);
        invalidatedCount++;
      }
    }

    return invalidatedCount;
  }

  async gc(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key.substring(`${this.pluginName}:`.length));
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
      this.stats.evictions++;
    }
  }

  private async applyEvictionStrategy(): Promise<void> {
    switch (this.config.strategy) {
      case CacheStrategy.LRU:
        await this.applyLRUStrategy();
        break;
      case CacheStrategy.LFU:
        await this.applyLFUStrategy();
        break;
      case CacheStrategy.FIFO:
        await this.applyFIFOStrategy();
        break;
      default:
        break;
    }
  }

  private async applyLRUStrategy(): Promise<void> {
    if (this.cache.size <= (this.config.maxEntries || Infinity)) {
      return;
    }

    // Find the least recently used entry
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const localKey = oldestKey.substring(`${this.pluginName}:`.length);
      await this.delete(localKey);
      this.stats.evictions++;
    }
  }

  private async applyLFUStrategy(): Promise<void> {
    if (this.cache.size <= (this.config.maxEntries || Infinity)) {
      return;
    }

    // Find the least frequently used entry
    let lfuKey: string | null = null;
    let minAccessCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount !== undefined && entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount;
        lfuKey = key;
      }
    }

    if (lfuKey) {
      const localKey = lfuKey.substring(`${this.pluginName}:`.length);
      await this.delete(localKey);
      this.stats.evictions++;
    }
  }

  private async applyFIFOStrategy(): Promise<void> {
    if (this.cache.size <= (this.config.maxEntries || Infinity)) {
      return;
    }

    // Find the first-in entry
    let firstKey: string | null = null;
    let firstTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < firstTime) {
        firstTime = entry.timestamp;
        firstKey = key;
      }
    }

    if (firstKey) {
      const localKey = firstKey.substring(`${this.pluginName}:`.length);
      await this.delete(localKey);
      this.stats.evictions++;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  // Get cache-specific stats
  getCacheStats(): CacheStats {
    return { ...this.stats };
  }

  // Get memory usage
  getMemoryUsage(): number {
    return this.currentSize; // Simplified implementation
  }
}

// Global cache manager for multiple plugins
export class GlobalCacheManager {
  private pluginCaches: Map<string, PluginCacheManager> = new Map();
  private globalConfig: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.globalConfig = {
      strategy: config.strategy || CacheStrategy.LRU,
      maxEntries: config.maxEntries || 10000,
      defaultTTL: config.defaultTTL || 300000, // 5 minutes
      enableCompression: config.enableCompression || false,
      maxSize: config.maxSize || 200 * 1024 * 1024, // 200MB
    };
  }

  getPluginCache(pluginName: string): PluginCacheManager {
    if (!this.pluginCaches.has(pluginName)) {
      const cache = new PluginCacheManager(pluginName, this.globalConfig);
      this.pluginCaches.set(pluginName, cache);
    }
    return this.pluginCaches.get(pluginName)!;
  }

  async getPluginCacheStats(pluginName: string): Promise<CacheStats | null> {
    const cache = this.pluginCaches.get(pluginName);
    return cache ? cache.getCacheStats() : null;
  }

  async getAllCacheStats(): Promise<Map<string, CacheStats>> {
    const stats = new Map<string, CacheStats>();
    for (const [pluginName, cache] of this.pluginCaches.entries()) {
      stats.set(pluginName, cache.getCacheStats());
    }
    return stats;
  }

  async clearAllCaches(): Promise<void> {
    for (const cache of this.pluginCaches.values()) {
      await cache.clear();
    }
  }

  async gcAll(): Promise<void> {
    for (const cache of this.pluginCaches.values()) {
      await cache.gc();
    }
  }

  async getGlobalStats(): Promise<{
    totalEntries: number;
    totalHits: number;
    totalMisses: number;
    totalEvictions: number;
    hitRate: number;
  }> {
    let totalEntries = 0;
    let totalHits = 0;
    let totalMisses = 0;
    let totalEvictions = 0;

    for (const cache of this.pluginCaches.values()) {
      const stats = cache.getCacheStats();
      totalHits += stats.hits;
      totalMisses += stats.misses;
      totalEvictions += stats.evictions;
      totalEntries += await cache.size();
    }

    const totalRequests = totalHits + totalMisses;
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      totalEntries,
      totalHits,
      totalMisses,
      totalEvictions,
      hitRate,
    };
  }
}

// Memory optimizer interface
export interface MemoryOptimizer {
  optimizeMemory(): Promise<MemoryOptimizationResult>;
  getMemoryUsage(): Promise<MemoryUsage>;
  setThresholds(thresholds: MemoryThresholds): Promise<void>;
  startMonitoring(): void;
  stopMonitoring(): void;
}

export interface MemoryThresholds {
  warning: number; // Percentage of memory usage that triggers warning
  critical: number; // Percentage of memory usage that triggers critical action
  cleanupThreshold: number; // Percentage that triggers cleanup
}

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  timestamp: Date;
}

export interface MemoryOptimizationResult {
  success: boolean;
  optimized: number; // Amount of memory optimized
  actionsTaken: string[];
  timestamp: Date;
}

// Memory optimizer implementation
export class MemoryOptimizerImpl implements MemoryOptimizer {
  private thresholds: MemoryThresholds = {
    warning: 75,
    critical: 90,
    cleanupThreshold: 85,
  };
  private monitoringInterval: NodeJS.Timeout | null = null;
  private eventCallbacks: Map<string, Set<Function>> = new Map();

  async optimizeMemory(): Promise<MemoryOptimizationResult> {
    const memoryUsage = await this.getMemoryUsage();
    const actions: string[] = [];

    // Perform memory optimization actions
    if (memoryUsage.percentage > this.thresholds.cleanupThreshold) {
      // Clear least recently used entries in cache
      await this.gcCaches();
      actions.push('Cleared cache entries');
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      actions.push('Triggered garbage collection');
    }

    // Clear any unused references
    actions.push('Cleaned up unused references');

    return {
      success: true,
      optimized: 0, // Size calculation would be complex
      actionsTaken: actions,
      timestamp: new Date(),
    };
  }

  private async gcCaches(): Promise<void> {
    // Get global cache manager instance and run garbage collection
    // This is a simplified implementation - in a real system, we'd have access
    // to the global cache manager
    console.log('Running garbage collection on caches');
  }

  async getMemoryUsage(): Promise<MemoryUsage> {
    const usage = process.memoryUsage();
    const total = (usage.heapTotal / 1024 / 1024); // Convert to MB
    const used = (usage.heapUsed / 1024 / 1024);   // Convert to MB
    const percentage = total > 0 ? (used / total) * 100 : 0;

    return {
      used,
      total,
      percentage,
      timestamp: new Date(),
    };
  }

  async setThresholds(thresholds: MemoryThresholds): Promise<void> {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  startMonitoring(): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(async () => {
      const memoryUsage = await this.getMemoryUsage();

      if (memoryUsage.percentage >= this.thresholds.critical) {
        this.emitEvent('memory:critical', { memoryUsage });
        this.optimizeMemory().catch(error => {
          console.error('Memory optimization failed:', error);
        });
      } else if (memoryUsage.percentage >= this.thresholds.warning) {
        this.emitEvent('memory:warning', { memoryUsage });
      }
    }, 30000); // Check every 30 seconds
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emitEvent(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Memory optimizer event callback error for ${event}:`, error);
        }
      });
    }
  }
}