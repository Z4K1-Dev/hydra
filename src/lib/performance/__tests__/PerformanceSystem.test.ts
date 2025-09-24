import { 
  PluginCacheManager, 
  GlobalCacheManager, 
  MemoryOptimizerImpl,
  CacheStrategy,
  PerformanceMonitoringService,
  PerformanceProfilerImpl,
  PerformanceOptimizationManager
} from '../index';

describe('Performance Optimization System', () => {
  describe('PluginCacheManager', () => {
    let cacheManager: PluginCacheManager;

    beforeEach(() => {
      cacheManager = new PluginCacheManager('test-plugin', {
        strategy: CacheStrategy.LRU,
        maxEntries: 100,
        defaultTTL: 300000, // 5 minutes
      });
    });

    afterEach(async () => {
      await cacheManager.clear();
    });

    it('should store and retrieve values', async () => {
      await cacheManager.set('key1', 'value1');
      const result = await cacheManager.get<string>('key1');
      
      expect(result).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheManager.get<string>('non-existent');
      
      expect(result).toBeNull();
    });

    it('should respect TTL expiration', async () => {
      jest.useFakeTimers();
      
      await cacheManager.set('expiring-key', 'expiring-value', 1000); // 1 second TTL
      
      // Advance time by 2 seconds
      jest.advanceTimersByTime(2000);
      
      const result = await cacheManager.get<string>('expiring-key');
      
      expect(result).toBeNull();
      jest.useRealTimers();
    });

    it('should handle different cache strategies', async () => {
      const lruCache = new PluginCacheManager('lru-plugin', { strategy: CacheStrategy.LRU, maxEntries: 2 });

      // Fill LRU cache
      await lruCache.set('key1', 'value1');
      await lruCache.set('key2', 'value2');
      
      // Check that both keys exist initially
      expect(await lruCache.has('key1')).toBe(true);
      expect(await lruCache.has('key2')).toBe(true);

      // Add another item, which should trigger eviction based on LRU strategy
      await lruCache.set('key3', 'value3');

      // After adding the 3rd key, one should have been evicted
      const hasKey1 = await lruCache.has('key1');
      const hasKey2 = await lruCache.has('key2');
      const hasKey3 = await lruCache.has('key3');

      // One of key1 or key2 should have been evicted
      expect(hasKey3).toBe(true); // The new key should exist
      expect(hasKey1 || hasKey2).toBe(true); // At least one of the original keys should remain
      expect(hasKey1 && hasKey2).toBe(false); // But not both

      await lruCache.clear();
    });

    it('should track cache statistics', async () => {
      await cacheManager.set('key1', 'value1');
      const value1 = await cacheManager.get<string>('key1'); // This should be a hit
      const value2 = await cacheManager.get<string>('key2'); // This should be a miss

      expect(value1).toBe('value1');
      expect(value2).toBeNull();

      const stats = cacheManager.getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should invalidate keys by pattern', async () => {
      await cacheManager.set('user:123', { id: 123, name: 'John' });
      await cacheManager.set('user:456', { id: 456, name: 'Jane' });
      await cacheManager.set('post:789', { id: 789, title: 'Test' });

      const invalidatedCount = await cacheManager.invalidate('user:*');
      expect(invalidatedCount).toBe(2);

      const hasUser123 = await cacheManager.has('user:123');
      const hasUser456 = await cacheManager.has('user:456');
      const hasPost789 = await cacheManager.has('post:789');

      expect(hasUser123).toBe(false);
      expect(hasUser456).toBe(false);
      expect(hasPost789).toBe(true);
    });

    it('should perform garbage collection', async () => {
      const shortTTLCache = new PluginCacheManager('short-ttl', { defaultTTL: 100 }); // 100ms TTL
      
      await shortTTLCache.set('short-lived', 'value', 100);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      await shortTTLCache.gc(); // This should remove expired entries
      
      const hasKey = await shortTTLCache.has('short-lived');
      expect(hasKey).toBe(false);
    });
  });

  describe('GlobalCacheManager', () => {
    let globalCache: GlobalCacheManager;

    beforeEach(() => {
      globalCache = new GlobalCacheManager({
        strategy: CacheStrategy.LRU,
        maxEntries: 100,
        defaultTTL: 300000,
      });
    });

    afterEach(async () => {
      await globalCache.clearAllCaches();
    });

    it('should manage multiple plugin caches', async () => {
      const cache1 = globalCache.getPluginCache('plugin1');
      const cache2 = globalCache.getPluginCache('plugin2');

      await cache1.set('key1', 'value1');
      await cache2.set('key2', 'value2');

      const result1 = await cache1.get<string>('key1');
      const result2 = await cache2.get<string>('key2');

      expect(result1).toBe('value1');
      expect(result2).toBe('value2');
    });

    it('should provide global statistics', async () => {
      const cache1 = globalCache.getPluginCache('plugin1');
      const cache2 = globalCache.getPluginCache('plugin2');

      await cache1.set('key1', 'value1');
      await cache2.set('key2', 'value2');

      const globalStats = await globalCache.getGlobalStats();
      expect(globalStats.totalEntries).toBeGreaterThanOrEqual(2);
    });

    it('should run garbage collection on all caches', async () => {
      const shortTTLCache = globalCache.getPluginCache('short-ttl');
      await shortTTLCache.set('short-lived', 'value', 100);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      await globalCache.gcAll();
      const hasKey = await shortTTLCache.has('short-lived');
      expect(hasKey).toBe(false);
    });
  });

  describe('MemoryOptimizerImpl', () => {
    let memoryOptimizer: MemoryOptimizerImpl;

    beforeEach(() => {
      memoryOptimizer = new MemoryOptimizerImpl();
    });

    it('should get memory usage', async () => {
      const memoryUsage = await memoryOptimizer.getMemoryUsage();
      
      expect(memoryUsage).toHaveProperty('used');
      expect(memoryUsage).toHaveProperty('total');
      expect(memoryUsage).toHaveProperty('percentage');
      expect(memoryUsage).toHaveProperty('timestamp');
      expect(memoryUsage.used).toBeGreaterThanOrEqual(0);
      expect(memoryUsage.total).toBeGreaterThanOrEqual(memoryUsage.used);
      expect(memoryUsage.percentage).toBeGreaterThanOrEqual(0);
      expect(memoryUsage.percentage).toBeLessThanOrEqual(100);
    });

    it('should set thresholds', async () => {
      const thresholds = {
        warning: 80,
        critical: 95,
        cleanupThreshold: 90,
      };

      await memoryOptimizer.setThresholds(thresholds);
      // For this test, we're just checking that it doesn't throw
      expect(true).toBe(true);
    });

    it('should trigger optimization when memory is high', async () => {
      // Mock memory usage to simulate high usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        rss: 100000000,
        heapTotal: 100000000,
        heapUsed: 95000000, // 95% usage
        external: 1000000,
        arrayBuffers: 100000,
      } as any);

      const result = await memoryOptimizer.optimizeMemory();
      
      expect(result.success).toBe(true);
      expect(result.actionsTaken).toBeInstanceOf(Array);
      
      // Restore original memory usage
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('PerformanceMonitoringService', () => {
    let monitoringService: PerformanceMonitoringService;

    beforeEach(() => {
      monitoringService = new PerformanceMonitoringService({
        enableMetricsCollection: false, // Disable automatic collection for tests
        metricsCollectionInterval: 10000,
        maxMetricsHistory: 10,
      });
    });

    afterEach(() => {
      monitoringService.stopMonitoring();
    });

    it('should collect metrics for a plugin', async () => {
      const metrics = await monitoringService.collectMetricsForPlugin('test-plugin');
      
      expect(metrics).toHaveProperty('executionTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('requestsPerSecond');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('cacheHitRate');
      expect(metrics).toHaveProperty('databaseQueryTime');
      expect(metrics).toHaveProperty('databaseQueryCount');
      expect(metrics).toHaveProperty('networkLatency');
      expect(metrics).toHaveProperty('customMetrics');
    });

    it('should track timing operations', async () => {
      monitoringService.startTimer('operation1', 'test-plugin');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const duration = monitoringService.endTimer('operation1');
      
      expect(duration).toBeGreaterThanOrEqual(10);
    });

    it('should record custom metrics', async () => {
      // First collect metrics to establish history
      await monitoringService.collectMetricsForPlugin('test-plugin');
      
      // Then record a custom metric
      monitoringService.recordCustomMetric('test-plugin', 'custom.metric', 42);
      
      const history = monitoringService.getMetricsHistory('test-plugin');
      expect(history).toHaveLength(1);
      expect(history[0].customMetrics['custom.metric']).toBe(42);
    });

    it('should provide aggregated metrics', async () => {
      await monitoringService.collectMetricsForPlugin('test-plugin');
      await monitoringService.collectMetricsForPlugin('test-plugin');
      
      const aggregated = monitoringService.getAggregatedMetrics('test-plugin');
      expect(aggregated).not.toBeNull();
      expect(aggregated).toHaveProperty('executionTime');
    });
  });

  describe('PerformanceProfilerImpl', () => {
    let profiler: PerformanceProfilerImpl;

    beforeEach(() => {
      profiler = new PerformanceProfilerImpl();
    });

    it('should profile operations', () => {
      profiler.startProfiling('test-plugin', 'operation1');
      
      // Simulate some work using performance.now() for better precision
      const start = performance.now();
      const durationToSimulate = 5; // 5ms
      while (performance.now() - start < durationToSimulate) {} // Busy wait
      
      const duration = profiler.stopProfiling('test-plugin', 'operation1');
      
      expect(duration).toBeGreaterThanOrEqual(1); // Should be at least 1ms
    });

    it('should generate profile reports', async () => {
      profiler.startProfiling('test-plugin', 'operation1');
      const end = Date.now() + 5;
      while (Date.now() < end) {}
      profiler.stopProfiling('test-plugin', 'operation1');
      
      const report = await profiler.getProfileReport('test-plugin');
      expect(report).toContain('test-plugin');
      expect(report).toContain('operation1');
    });

    it('should manage profiling state', () => {
      expect(profiler.isProfilingEnabled()).toBe(true);
      profiler.disableProfiling();
      expect(profiler.isProfilingEnabled()).toBe(false);
      profiler.enableProfiling();
      expect(profiler.isProfilingEnabled()).toBe(true);
    });
  });

  describe('PerformanceOptimizationManager', () => {
    let optimizationManager: PerformanceOptimizationManager;
    let cacheManager: GlobalCacheManager;
    let monitoringService: PerformanceMonitoringService;
    let profiler: PerformanceProfilerImpl;
    let memoryOptimizer: MemoryOptimizerImpl;

    beforeEach(() => {
      cacheManager = new GlobalCacheManager();
      monitoringService = new PerformanceMonitoringService();
      profiler = new PerformanceProfilerImpl();
      memoryOptimizer = new MemoryOptimizerImpl();
      
      optimizationManager = new PerformanceOptimizationManager(
        cacheManager,
        monitoringService,
        profiler,
        memoryOptimizer
      );
    });

    afterEach(async () => {
      monitoringService.stopMonitoring();
      memoryOptimizer.stopMonitoring();
      await cacheManager.clearAllCaches();
    });

    it('should optimize plugin performance', async () => {
      const result = await optimizationManager.optimizePluginPerformance('test-plugin');
      
      expect(result).toHaveProperty('cacheStats');
      expect(result).toHaveProperty('monitoringStats');
      expect(result).toHaveProperty('profilingStats');
      expect(result).toHaveProperty('memoryStats');
      expect(result).toHaveProperty('recommendations');
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should generate optimization reports', async () => {
      const report = await optimizationManager.getOptimizationReport();
      
      expect(report).toContain('Performance Optimization Report');
      expect(report).toContain('Global Cache');
      expect(report).toContain('Monitoring');
      expect(report).toContain('Profiling');
      expect(report).toContain('Memory');
    });

    it('should run optimization', async () => {
      await expect(optimizationManager.runOptimization()).resolves.not.toThrow();
    });
  });
});