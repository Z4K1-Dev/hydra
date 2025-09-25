// Performance optimization system index file
export { 
  PluginCacheManager, 
  GlobalCacheManager, 
  MemoryOptimizerImpl,
  CacheStrategy,
  CacheConfig,
  CacheEntry,
  CacheStats,
  MemoryOptimizer,
  MemoryThresholds,
  MemoryUsage,
  MemoryOptimizationResult
} from './PluginCacheManager';

export {
  PerformanceMonitoringService,
  PerformanceProfilerImpl,
  PerformanceOptimizationManager,
  PerformanceMetrics,
  PerformanceMonitoringOptions,
  Metric,
  MetricType
} from './PerformanceMonitoring';

// Main performance optimization manager that coordinates all performance systems
export class PerformanceManager {
  private cacheManager: GlobalCacheManager;
  private monitoringService: PerformanceMonitoringService;
  private profiler: PerformanceProfilerImpl;
  private memoryOptimizer: MemoryOptimizerImpl;
  private optimizationManager: PerformanceOptimizationManager;

  constructor() {
    this.cacheManager = new GlobalCacheManager();
    this.monitoringService = new PerformanceMonitoringService();
    this.profiler = new PerformanceProfilerImpl();
    this.memoryOptimizer = new MemoryOptimizerImpl();
    this.optimizationManager = new PerformanceOptimizationManager(
      this.cacheManager,
      this.monitoringService,
      this.profiler,
      this.memoryOptimizer
    );
  }

  /**
   * Initialize all performance systems
   */
  async initialize(): Promise<void> {
    // Start all services
    this.monitoringService.startMonitoring();
    this.memoryOptimizer.startMonitoring();
    
    console.log('Performance optimization system initialized');
  }

  /**
   * Shutdown all performance systems
   */
  async shutdown(): Promise<void> {
    this.monitoringService.stopMonitoring();
    this.memoryOptimizer.stopMonitoring();
    
    console.log('Performance optimization system shutdown complete');
  }

  /**
   * Get the cache manager for plugin-specific caching
   */
  getCacheManager(): GlobalCacheManager {
    return this.cacheManager;
  }

  /**
   * Get the monitoring service
   */
  getMonitoringService(): PerformanceMonitoringService {
    return this.monitoringService;
  }

  /**
   * Get the profiler
   */
  getProfiler(): PerformanceProfilerImpl {
    return this.profiler;
  }

  /**
   * Get the memory optimizer
   */
  getMemoryOptimizer(): MemoryOptimizerImpl {
    return this.memoryOptimizer;
  }

  /**
   * Get the optimization manager
   */
  getOptimizationManager(): PerformanceOptimizationManager {
    return this.optimizationManager;
  }

  /**
   * Get a plugin-specific cache
   */
  getPluginCache(pluginName: string) {
    return this.cacheManager.getPluginCache(pluginName);
  }

  /**
   * Start timing an operation
   */
  startTimer(operationName: string, pluginName: string): void {
    this.monitoringService.startTimer(operationName, pluginName);
  }

  /**
   * End timing an operation
   */
  endTimer(operationName: string): number | null {
    return this.monitoringService.endTimer(operationName);
  }

  /**
   * Start profiling an operation
   */
  startProfiling(pluginName: string, operation: string): void {
    this.profiler.startProfiling(pluginName, operation);
  }

  /**
   * Stop profiling an operation
   */
  stopProfiling(pluginName: string, operation: string): number | null {
    return this.profiler.stopProfiling(pluginName, operation);
  }

  /**
   * Get optimization report
   */
  async getOptimizationReport(): Promise<string> {
    return this.optimizationManager.getOptimizationReport();
  }

  /**
   * Run optimization
   */
  async runOptimization(): Promise<void> {
    await this.optimizationManager.runOptimization();
  }
}

// Singleton instance
let performanceManager: PerformanceManager | null = null;

export function getGlobalPerformanceManager(): PerformanceManager {
  if (!performanceManager) {
    performanceManager = new PerformanceManager();
  }
  return performanceManager;
}