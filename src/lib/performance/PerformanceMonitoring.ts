import { BasePlugin } from '../../plugins/base-plugin';

// Performance metric types
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
  TIMER = 'timer',
}

// Basic metric interface
export interface Metric {
  name: string;
  type: MetricType;
  value: number | number[];
  labels: Record<string, string>;
  timestamp: Date;
}

// Performance metrics interface
export interface PerformanceMetrics {
  executionTime: number; // in milliseconds
  memoryUsage: number; // in MB
  cpuUsage: number; // percentage
  requestsPerSecond: number;
  errorRate: number; // percentage
  cacheHitRate: number; // percentage
  databaseQueryTime: number; // average in milliseconds
  databaseQueryCount: number;
  networkLatency: number; // in milliseconds
  customMetrics: Record<string, number>;
}

// Performance monitoring options
export interface PerformanceMonitoringOptions {
  enableMetricsCollection: boolean;
  enableProfiling: boolean;
  metricsCollectionInterval: number; // milliseconds
  maxMetricsHistory: number;
  enableDatabaseMetrics: boolean;
  enableNetworkMetrics: boolean;
  enableCacheMetrics: boolean;
  customMetrics: string[];
}

// Default options
const defaultOptions: PerformanceMonitoringOptions = {
  enableMetricsCollection: true,
  enableProfiling: true,
  metricsCollectionInterval: 10000, // 10 seconds
  maxMetricsHistory: 100,
  enableDatabaseMetrics: true,
  enableNetworkMetrics: true,
  enableCacheMetrics: true,
  customMetrics: [],
};

// Performance monitoring service
export class PerformanceMonitoringService {
  private options: PerformanceMonitoringOptions;
  private metricsHistory: Map<string, PerformanceMetrics[]> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  private eventCallbacks: Map<string, Set<(data: any) => void>> = new Map();
  private performanceTimers: Map<string, { start: number; pluginName: string }> = new Map();

  constructor(options: Partial<PerformanceMonitoringOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.options.enableMetricsCollection) {
      this.metricsInterval = setInterval(() => {
        this.collectMetrics().catch(error => {
          console.error('Performance metrics collection failed:', error);
        });
      }, this.options.metricsCollectionInterval);
    }

    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    console.log('Performance monitoring stopped');
  }

  /**
   * Collect metrics for a specific plugin
   */
  async collectMetricsForPlugin(pluginName: string): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const currentMemory = memoryUsage.heapUsed / 1024 / 1024; // Convert to MB
    
    // Get CPU usage (approximation using process.uptime and time difference)
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage ? process.cpuUsage() : { user: 0, system: 0 };
    
    // Calculate metrics
    const metrics: PerformanceMetrics = {
      executionTime: performance.now() - startTime,
      memoryUsage: currentMemory,
      cpuUsage: cpuUsage.user / 1000000, // Convert to percentage approximation
      requestsPerSecond: 0, // Would need to track requests
      errorRate: 0, // Would need to track errors
      cacheHitRate: 0, // Would need to access cache manager
      databaseQueryTime: 0, // Would need to track database queries
      databaseQueryCount: 0, // Would need to track database queries
      networkLatency: 0, // Would need to track network requests
      customMetrics: {},
    };

    // Add to history
    if (!this.metricsHistory.has(pluginName)) {
      this.metricsHistory.set(pluginName, []);
    }
    
    const history = this.metricsHistory.get(pluginName)!;
    history.push(metrics);
    
    if (history.length > this.options.maxMetricsHistory) {
      history.shift(); // Remove oldest entry
    }

    // Emit metrics collected event
    this.emitEvent('metrics:collected', { pluginName, metrics });

    return metrics;
  }

  /**
   * Collect metrics for all tracked plugins
   */
  async collectMetrics(): Promise<Map<string, PerformanceMetrics>> {
    const results = new Map<string, PerformanceMetrics>();
    
    for (const pluginName of this.metricsHistory.keys()) {
      const metrics = await this.collectMetricsForPlugin(pluginName);
      results.set(pluginName, metrics);
    }

    return results;
  }

  /**
   * Get historical metrics for a plugin
   */
  getMetricsHistory(pluginName: string): PerformanceMetrics[] {
    return this.metricsHistory.get(pluginName) || [];
  }

  /**
   * Get aggregated metrics for a plugin
   */
  getAggregatedMetrics(pluginName: string): PerformanceMetrics | null {
    const history = this.metricsHistory.get(pluginName);
    if (!history || history.length === 0) {
      return null;
    }

    // Calculate averages
    const aggregated: PerformanceMetrics = {
      executionTime: history.reduce((sum, m) => sum + m.executionTime, 0) / history.length,
      memoryUsage: history.reduce((sum, m) => sum + m.memoryUsage, 0) / history.length,
      cpuUsage: history.reduce((sum, m) => sum + m.cpuUsage, 0) / history.length,
      requestsPerSecond: history.reduce((sum, m) => sum + m.requestsPerSecond, 0) / history.length,
      errorRate: history.reduce((sum, m) => sum + m.errorRate, 0) / history.length,
      cacheHitRate: history.reduce((sum, m) => sum + m.cacheHitRate, 0) / history.length,
      databaseQueryTime: history.reduce((sum, m) => sum + m.databaseQueryTime, 0) / history.length,
      databaseQueryCount: history.reduce((sum, m) => sum + m.databaseQueryCount, 0) / history.length,
      networkLatency: history.reduce((sum, m) => sum + m.networkLatency, 0) / history.length,
      customMetrics: {},
    };

    // Aggregate custom metrics
    const customMetricNames = new Set<string>();
    for (const metrics of history) {
      for (const name in metrics.customMetrics) {
        customMetricNames.add(name);
      }
    }

    for (const name of customMetricNames) {
      const sum = history.reduce((sum, m) => sum + (m.customMetrics[name] || 0), 0);
      aggregated.customMetrics[name] = sum / history.length;
    }

    return aggregated;
  }

  /**
   * Start timing a specific operation
   */
  startTimer(operationName: string, pluginName: string): void {
    this.performanceTimers.set(operationName, {
      start: performance.now(),
      pluginName,
    });
  }

  /**
   * End timing and record the result
   */
  endTimer(operationName: string): number | null {
    const timer = this.performanceTimers.get(operationName);
    if (!timer) {
      return null;
    }

    const duration = performance.now() - timer.start;
    this.performanceTimers.delete(operationName);

    // Record the timing metric
    this.recordCustomMetric(timer.pluginName, `${operationName}.duration`, duration);

    return duration;
  }

  /**
   * Record a custom metric
   */
  recordCustomMetric(pluginName: string, metricName: string, value: number): void {
    // Add to history
    if (!this.metricsHistory.has(pluginName)) {
      this.metricsHistory.set(pluginName, []);
    }

    const history = this.metricsHistory.get(pluginName)!;
    if (history.length > 0) {
      const lastMetrics = history[history.length - 1];
      lastMetrics.customMetrics[metricName] = value;
    }
  }

  /**
   * Get performance report for a plugin
   */
  async getPerformanceReport(pluginName: string): Promise<string> {
    const aggregated = this.getAggregatedMetrics(pluginName);
    if (!aggregated) {
      return `No performance data available for plugin: ${pluginName}`;
    }

    return `
Performance Report for ${pluginName}:
=======================================
Execution Time: ${aggregated.executionTime.toFixed(2)} ms
Memory Usage: ${aggregated.memoryUsage.toFixed(2)} MB
CPU Usage: ${aggregated.cpuUsage.toFixed(2)}%
Cache Hit Rate: ${(aggregated.cacheHitRate * 100).toFixed(2)}%
Database Query Time: ${aggregated.databaseQueryTime.toFixed(2)} ms
Error Rate: ${(aggregated.errorRate * 100).toFixed(2)}%
Requests/Sec: ${aggregated.requestsPerSecond.toFixed(2)}
Network Latency: ${aggregated.networkLatency.toFixed(2)} ms
    `.trim();
  }

  /**
   * Event handling methods
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
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
          console.error(`Performance monitoring event callback error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get performance statistics
   */
  getStatistics(): {
    totalPluginsMonitored: number;
    totalMetricsRecords: number;
    averageMetricsPerPlugin: number;
  } {
    const totalPlugins = this.metricsHistory.size;
    let totalRecords = 0;
    
    for (const history of this.metricsHistory.values()) {
      totalRecords += history.length;
    }

    return {
      totalPluginsMonitored: totalPlugins,
      totalMetricsRecords: totalRecords,
      averageMetricsPerPlugin: totalPlugins > 0 ? totalRecords / totalPlugins : 0,
    };
  }

  /**
   * Clear metrics history
   */
  clearHistory(pluginName?: string): void {
    if (pluginName) {
      this.metricsHistory.delete(pluginName);
    } else {
      this.metricsHistory.clear();
    }
  }

  /**
   * Get all monitored plugin names
   */
  getMonitoredPlugins(): string[] {
    return Array.from(this.metricsHistory.keys());
  }
}

// Performance profiler interface
export interface PerformanceProfiler {
  startProfiling(pluginName: string, operation: string): void;
  stopProfiling(pluginName: string, operation: string): number | null;
  getProfileReport(pluginName: string): Promise<string>;
  enableProfiling(): void;
  disableProfiling(): void;
  isProfilingEnabled(): boolean;
}

// Performance profiler implementation
export class PerformanceProfilerImpl implements PerformanceProfiler {
  private profiles: Map<string, Map<string, number[]>> = new Map(); // plugin -> operation -> durations
  private activeProfiles: Map<string, { start: number; pluginName: string }> = new Map(); // operation -> {start, plugin}
  private profilingEnabled: boolean = true;

  startProfiling(pluginName: string, operation: string): void {
    if (!this.profilingEnabled) {
      return;
    }

    const operationKey = `${pluginName}:${operation}`;
    this.activeProfiles.set(operationKey, {
      start: performance.now(),
      pluginName,
    });
  }

  stopProfiling(pluginName: string, operation: string): number | null {
    if (!this.profilingEnabled) {
      return null;
    }

    const operationKey = `${pluginName}:${operation}`;
    const profile = this.activeProfiles.get(operationKey);

    if (!profile) {
      return null;
    }

    const duration = performance.now() - profile.start;
    this.activeProfiles.delete(operationKey);

    // Store the profile
    if (!this.profiles.has(pluginName)) {
      this.profiles.set(pluginName, new Map());
    }

    const pluginProfiles = this.profiles.get(pluginName)!;
    if (!pluginProfiles.has(operation)) {
      pluginProfiles.set(operation, []);
    }

    const operationProfiles = pluginProfiles.get(operation)!;
    operationProfiles.push(duration);

    // Keep only last 1000 profiles per operation to avoid memory issues
    if (operationProfiles.length > 1000) {
      operationProfiles.shift();
    }

    return duration;
  }

  async getProfileReport(pluginName: string): Promise<string> {
    const pluginProfiles = this.profiles.get(pluginName);
    if (!pluginProfiles || pluginProfiles.size === 0) {
      return `No profiling data available for plugin: ${pluginName}`;
    }

    let report = `Performance Profiling Report for ${pluginName}:\n`;
    report += "=============================================\n";

    for (const [operation, durations] of pluginProfiles.entries()) {
      if (durations.length === 0) continue;

      const min = Math.min(...durations);
      const max = Math.max(...durations);
      const avg = durations.reduce((sum, val) => sum + val, 0) / durations.length;
      const median = durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)];

      report += `${operation}:\n`;
      report += `  Count: ${durations.length}\n`;
      report += `  Min: ${min.toFixed(2)}ms\n`;
      report += `  Max: ${max.toFixed(2)}ms\n`;
      report += `  Avg: ${avg.toFixed(2)}ms\n`;
      report += `  Median: ${median.toFixed(2)}ms\n\n`;
    }

    return report.trim();
  }

  enableProfiling(): void {
    this.profilingEnabled = true;
  }

  disableProfiling(): void {
    this.profilingEnabled = false;
  }

  isProfilingEnabled(): boolean {
    return this.profilingEnabled;
  }

  /**
   * Get profiling statistics
   */
  getStatistics(): {
    totalProfiles: number;
    totalOperations: number;
    averageOperationsPerPlugin: number;
  } {
    let totalProfiles = 0;
    let totalOperations = 0;

    for (const pluginProfiles of this.profiles.values()) {
      totalOperations += pluginProfiles.size;
      for (const durations of pluginProfiles.values()) {
        totalProfiles += durations.length;
      }
    }

    const totalPlugins = this.profiles.size;
    const avgOperationsPerPlugin = totalPlugins > 0 ? totalOperations / totalPlugins : 0;

    return {
      totalProfiles,
      totalOperations,
      averageOperationsPerPlugin: avgOperationsPerPlugin,
    };
  }

  /**
   * Clear profiling data
   */
  clearProfiles(pluginName?: string): void {
    if (pluginName) {
      this.profiles.delete(pluginName);
    } else {
      this.profiles.clear();
    }
  }

  /**
   * Get all profiled plugin names
   */
  getProfiledPlugins(): string[] {
    return Array.from(this.profiles.keys());
  }
}

// Performance optimization manager
export class PerformanceOptimizationManager {
  private cacheManager: GlobalCacheManager;
  private monitoringService: PerformanceMonitoringService;
  private profiler: PerformanceProfilerImpl;
  private memoryOptimizer: MemoryOptimizerImpl;

  constructor(
    cacheManager: GlobalCacheManager,
    monitoringService: PerformanceMonitoringService,
    profiler: PerformanceProfilerImpl,
    memoryOptimizer: MemoryOptimizerImpl
  ) {
    this.cacheManager = cacheManager;
    this.monitoringService = monitoringService;
    this.profiler = profiler;
    this.memoryOptimizer = memoryOptimizer;
  }

  /**
   * Optimize performance for a specific plugin
   */
  async optimizePluginPerformance(pluginName: string): Promise<{
    cacheStats: any;
    monitoringStats: any;
    profilingStats: any;
    memoryStats: any;
    recommendations: string[];
  }> {
    // Collect current stats
    const cacheStats = await this.cacheManager.getPluginCacheStats(pluginName);
    const monitoringStats = this.monitoringService.getAggregatedMetrics(pluginName);
    const profilingStats = await this.profiler.getProfileReport(pluginName);
    
    // Get memory usage
    const memoryStats = await this.memoryOptimizer.getMemoryUsage();

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (cacheStats && cacheStats.hitRate < 0.8) {
      recommendations.push('Increase cache size or improve cache strategy for better hit rate');
    }
    
    if (monitoringStats && monitoringStats.memoryUsage > 100) { // More than 100MB
      recommendations.push('Consider implementing memory optimization strategies');
    }
    
    if (monitoringStats && monitoringStats.executionTime > 100) { // More than 100ms
      recommendations.push('Operation execution time exceeds threshold, review performance');
    }

    return {
      cacheStats,
      monitoringStats,
      profilingStats,
      memoryStats,
      recommendations,
    };
  }

  /**
   * Get overall performance optimization report
   */
  async getOptimizationReport(): Promise<string> {
    const globalCacheStats = await this.cacheManager.getGlobalStats();
    const monitoringStats = this.monitoringService.getStatistics();
    const profilingStats = this.profiler.getStatistics();
    const memoryStats = await this.memoryOptimizer.getMemoryUsage();

    return `
Performance Optimization Report:
================================
Global Cache:
  Total Entries: ${globalCacheStats.totalEntries}
  Total Hits: ${globalCacheStats.totalHits}
  Total Misses: ${globalCacheStats.totalMisses}
  Total Evictions: ${globalCacheStats.totalEvictions}
  Hit Rate: ${(globalCacheStats.hitRate * 100).toFixed(2)}%

Monitoring:
  Plugins Monitored: ${monitoringStats.totalPluginsMonitored}
  Total Records: ${monitoringStats.totalMetricsRecords}
  Avg Metrics/Plugin: ${monitoringStats.averageMetricsPerPlugin.toFixed(2)}

Profiling:
  Total Profiles: ${profilingStats.totalProfiles}
  Total Operations: ${profilingStats.totalOperations}
  Avg Operations/Plugin: ${profilingStats.averageOperationsPerPlugin.toFixed(2)}

Memory:
  Used: ${memoryStats.used.toFixed(2)} MB
  Total: ${memoryStats.total.toFixed(2)} MB
  Percentage: ${memoryStats.percentage.toFixed(2)}%
    `.trim();
  }

  /**
   * Run comprehensive performance optimization
   */
  async runOptimization(): Promise<void> {
    // Run garbage collection on all caches
    await this.cacheManager.gcAll();

    // Run memory optimization
    await this.memoryOptimizer.optimizeMemory();

    // Clear old monitoring data if needed
    // (This would be based on configured retention policies)
  }

  /**
   * Start all performance optimization services
   */
  startAll(): void {
    this.monitoringService.startMonitoring();
    this.memoryOptimizer.startMonitoring();
  }

  /**
   * Stop all performance optimization services
   */
  stopAll(): void {
    this.monitoringService.stopMonitoring();
    this.memoryOptimizer.stopMonitoring();
  }
}