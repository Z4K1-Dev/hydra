import { PluginEventEmitter } from './EventEmitter';
import { HookManager } from './HookManager';
import { PluginRegistry } from './PluginRegistry';
import { BasePlugin } from '../../plugins/base-plugin';
import { PluginConfig, HybridSystemStatus, SystemConfig } from './types';

export class HybridPluginManager {
  private isInitialized: boolean = false;
  private config: SystemConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private performanceMetrics: {
    eventTimes: number[];
    hookTimes: number[];
    memoryUsage: number[];
  } = {
    eventTimes: [],
    hookTimes: [],
    memoryUsage: []
  };
  
  constructor(
    private eventEmitter: PluginEventEmitter,
    private hookManager: HookManager,
    private registry: PluginRegistry,
    config?: Partial<SystemConfig>
  ) {
    this.config = {
      maxEventHistory: 1000,
      maxHookCacheSize: 100,
      cleanupInterval: 60000, // 1 minute
      enableDebugMode: false,
      enablePerformanceMonitoring: true,
      ...config
    };
  }
  
  /**
   * Initialize the hybrid system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[HybridPluginManager] ⚠️ System already initialized');
      return;
    }
    
    try {
      if (this.config.enableDebugMode) {
        console.log('[HybridPluginManager] 🚀 Initializing hybrid system...');
      }
      
      // Setup system-wide event listeners
      this.setupSystemEventListeners();
      
      // Start cleanup timer
      this.startCleanupTimer();
      
      // Enable performance monitoring if configured
      if (this.config.enablePerformanceMonitoring) {
        this.startPerformanceMonitoring();
      }
      
      this.isInitialized = true;
      
      if (this.config.enableDebugMode) {
        console.log('[HybridPluginManager] ✅ Hybrid system initialized successfully');
      }
    } catch (error) {
      console.error('[HybridPluginManager] 💥 Failed to initialize hybrid system:', error);
      throw error;
    }
  }
  
  /**
   * Load plugin with hybrid system support
   */
  async loadPlugin(plugin: BasePlugin, config: PluginConfig): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Hybrid system not initialized');
    }
    
    const startTime = performance.now();
    
    try {
      if (this.config.enableDebugMode) {
        console.log(`[HybridPluginManager] 📦 Loading plugin: ${config.name}`);
      }
      
      // Register plugin with metadata
      const metadata = {
        name: config.name,
        version: config.version || '1.0.0',
        description: config.description || '',
        dependencies: [],
        capabilities: this.extractCapabilities(plugin),
        settings: config.settings || {}
      };
      
      this.registry.register(plugin, metadata);
      
      // Validate dependencies
      const validation = this.registry.validateDependencies();
      if (!validation.valid) {
        console.warn(`[HybridPluginManager] ⚠️ Dependency issues for ${config.name}:`, validation.issues);
      }
      
      // Activate plugin with proper dependency order
      await this.activatePlugin(config.name);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Track performance metrics
      this.performanceMetrics.eventTimes.push(loadTime);
      
      if (this.config.enableDebugMode) {
        console.log(`[HybridPluginManager] ✅ Plugin ${config.name} loaded successfully (${loadTime.toFixed(2)}ms)`);
      }
      
      // Emit plugin loaded event
      this.eventEmitter.emit('plugin:loaded', {
        name: config.name,
        loadTime,
        metadata
      });
      
    } catch (error) {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      console.error(`[HybridPluginManager] 💥 Failed to load plugin ${config.name}:`, error);
      
      // Emit plugin load failed event
      this.eventEmitter.emit('plugin:load:failed', {
        name: config.name,
        loadTime,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Unload plugin
   */
  async unloadPlugin(pluginName: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Hybrid system not initialized');
    }
    
    const startTime = performance.now();
    
    try {
      if (this.config.enableDebugMode) {
        console.log(`[HybridPluginManager] 📤 Unloading plugin: ${pluginName}`);
      }
      
      // Check if plugin is registered
      if (!this.registry.isRegistered(pluginName)) {
        throw new Error(`Plugin ${pluginName} is not registered`);
      }
      
      // Deactivate plugin
      await this.deactivatePlugin(pluginName);
      
      // Unregister plugin
      this.registry.unregister(pluginName);
      
      const endTime = performance.now();
      const unloadTime = endTime - startTime;
      
      // Track performance metrics
      this.performanceMetrics.eventTimes.push(unloadTime);
      
      if (this.config.enableDebugMode) {
        console.log(`[HybridPluginManager] ✅ Plugin ${pluginName} unloaded successfully (${unloadTime.toFixed(2)}ms)`);
      }
      
      // Emit plugin unloaded event
      this.eventEmitter.emit('plugin:unloaded', {
        name: pluginName,
        unloadTime
      });
      
    } catch (error) {
      const endTime = performance.now();
      const unloadTime = endTime - startTime;
      
      console.error(`[HybridPluginManager] 💥 Failed to unload plugin ${pluginName}:`, error);
      
      // Emit plugin unload failed event
      this.eventEmitter.emit('plugin:unload:failed', {
        name: pluginName,
        unloadTime,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Activate plugin with dependency resolution
   */
  private async activatePlugin(pluginName: string): Promise<void> {
    const plugin = this.registry.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    
    // Resolve dependencies
    const dependencyOrder = this.registry.resolveDependencies(pluginName);
    
    // Activate dependencies first
    for (const depName of dependencyOrder) {
      if (depName === pluginName) continue;
      
      if (!this.registry.isActive(depName)) {
        await this.activatePlugin(depName);
      }
    }
    
    // Activate the plugin
    if (!this.registry.isActive(pluginName)) {
      // Call plugin's load method
      await plugin.load();
      
      // Add to activation order
      const activationOrder = this.registry.getActivationOrder();
      if (!activationOrder.includes(pluginName)) {
        activationOrder.push(pluginName);
      }
      
      // Emit plugin activated event
      this.eventEmitter.emit('plugin:activated', {
        name: pluginName,
        activationOrder
      });
    }
  }
  
  /**
   * Deactivate plugin
   */
  private async deactivatePlugin(pluginName: string): Promise<void> {
    const plugin = this.registry.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    
    // Check if plugin has active dependents
    const dependents = this.registry.getDependents(pluginName);
    const activeDependents = dependents.filter(dep => this.registry.isActive(dep));
    
    if (activeDependents.length > 0) {
      throw new Error(`Cannot deactivate plugin ${pluginName}. Active dependents: ${activeDependents.join(', ')}`);
    }
    
    // Deactivate the plugin
    if (this.registry.isActive(pluginName)) {
      // Call plugin's unload method
      await plugin.unload();
      
      // Remove from activation order
      const activationOrder = this.registry.getActivationOrder();
      const index = activationOrder.indexOf(pluginName);
      if (index > -1) {
        activationOrder.splice(index, 1);
      }
      
      // Emit plugin deactivated event
      this.eventEmitter.emit('plugin:deactivated', {
        name: pluginName
      });
    }
  }
  
  /**
   * Create event-hook bridge
   */
  createEventHookBridge(eventName: string, hookName: string): void {
    this.eventEmitter.on(eventName, (data) => {
      this.hookManager.doAction(hookName, data);
    });
    
    if (this.config.enableDebugMode) {
      console.log(`[HybridPluginManager] 🔗 Created bridge: ${eventName} → ${hookName}`);
    }
  }
  
  /**
   * Load active plugins (from configuration)
   */
  async loadActivePlugins(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Hybrid system not initialized');
    }
    
    try {
      // In a real implementation, this would load from database or config
      // For now, we'll load all registered plugins
      const plugins = this.registry.getAllPlugins();
      
      for (const plugin of plugins) {
        const metadata = this.registry.getPluginMetadata(plugin.config.name);
        if (metadata && metadata.isActive !== false) {
          await this.loadPlugin(plugin, plugin.config);
        }
      }
      
      if (this.config.enableDebugMode) {
        console.log(`[HybridPluginManager] ✅ Loaded ${plugins.length} active plugins`);
      }
      
    } catch (error) {
      console.error('[HybridPluginManager] 💥 Failed to load active plugins:', error);
      throw error;
    }
  }
  
  /**
   * Get system status
   */
  getSystemStatus(): HybridSystemStatus {
    const eventStatus = this.eventEmitter.getStatus();
    const hookStatus = this.hookManager.getStatus();
    const registryStatus = this.registry.getStatus();
    
    return {
      eventEmitter: eventStatus,
      hookManager: hookStatus,
      registry: registryStatus,
      performance: {
        memoryUsage: this.getCurrentMemoryUsage(),
        averageEventTime: this.getAverageEventTime(),
        averageHookTime: this.getAverageHookTime()
      }
    };
  }
  
  /**
   * Get event emitter
   */
  getEventEmitter(): PluginEventEmitter {
    return this.eventEmitter;
  }
  
  /**
   * Get hook manager
   */
  getHookManager(): HookManager {
    return this.hookManager;
  }
  
  /**
   * Get registry
   */
  getRegistry(): PluginRegistry {
    return this.registry;
  }
  
  /**
   * Setup system event listeners
   */
  private setupSystemEventListeners(): void {
    // System lifecycle events
    this.eventEmitter.on('system:shutdown', () => {
      this.shutdown();
    });
    
    // Error handling
    this.eventEmitter.on('error', (error) => {
      console.error('[HybridPluginManager] 💥 System error:', error);
    });
    
    if (this.config.enableDebugMode) {
      console.log('[HybridPluginManager] 🎧 System event listeners setup complete');
    }
  }
  
  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
    
    if (this.config.enableDebugMode) {
      console.log(`[HybridPluginManager] 🧹 Cleanup timer started (${this.config.cleanupInterval}ms interval)`);
    }
  }
  
  /**
   * Perform cleanup
   */
  private performCleanup(): void {
    try {
      // Clean event history
      const eventHistory = this.eventEmitter.getEventHistory();
      if (eventHistory.length > this.config.maxEventHistory) {
        this.eventEmitter.clearHistory();
      }
      
      // Clean performance metrics
      if (this.performanceMetrics.eventTimes.length > 1000) {
        this.performanceMetrics.eventTimes = this.performanceMetrics.eventTimes.slice(-500);
      }
      
      if (this.performanceMetrics.hookTimes.length > 1000) {
        this.performanceMetrics.hookTimes = this.performanceMetrics.hookTimes.slice(-500);
      }
      
      if (this.config.enableDebugMode) {
        console.log('[HybridPluginManager] 🧹 Cleanup completed');
      }
      
    } catch (error) {
      console.error('[HybridPluginManager] 💥 Cleanup failed:', error);
    }
  }
  
  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor memory usage
    setInterval(() => {
      const memoryUsage = this.getCurrentMemoryUsage();
      this.performanceMetrics.memoryUsage.push(memoryUsage);
      
      if (this.performanceMetrics.memoryUsage.length > 1000) {
        this.performanceMetrics.memoryUsage = this.performanceMetrics.memoryUsage.slice(-500);
      }
    }, 30000); // Every 30 seconds
    
    if (this.config.enableDebugMode) {
      console.log('[HybridPluginManager] 📊 Performance monitoring started');
    }
  }
  
  /**
   * Extract capabilities from plugin
   */
  private extractCapabilities(plugin: BasePlugin): string[] {
    // This is a simple heuristic - in a real implementation, 
    // plugins would declare their capabilities
    const capabilities: string[] = [];
    
    // Add capability based on plugin class name
    const className = plugin.constructor.name.toLowerCase();
    
    if (className.includes('analytics')) {
      capabilities.push('analytics', 'tracking');
    }
    
    if (className.includes('seo')) {
      capabilities.push('seo', 'meta-tags', 'optimization');
    }
    
    if (className.includes('sitemap')) {
      capabilities.push('sitemap', 'xml', 'crawling');
    }
    
    if (className.includes('snippet')) {
      capabilities.push('structured-data', 'schema', 'rich-snippets');
    }
    
    if (className.includes('local')) {
      capabilities.push('local-business', 'maps', 'local-seo');
    }
    
    if (className.includes('keyword')) {
      capabilities.push('keywords', 'content-analysis', 'seo-analysis');
    }
    
    return capabilities;
  }
  
  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    
    return 0;
  }
  
  /**
   * Get average event time
   */
  private getAverageEventTime(): number {
    const times = this.performanceMetrics.eventTimes;
    if (times.length === 0) return 0;
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }
  
  /**
   * Get average hook time
   */
  private getAverageHookTime(): number {
    const times = this.performanceMetrics.hookTimes;
    if (times.length === 0) return 0;
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }
  
  /**
   * Shutdown system
   */
  private shutdown(): void {
    try {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }
      
      // Unload all plugins
      const activationOrder = [...this.registry.getActivationOrder()].reverse();
      for (const pluginName of activationOrder) {
        try {
          this.unloadPlugin(pluginName);
        } catch (error) {
          console.error(`[HybridPluginManager] 💥 Failed to unload plugin ${pluginName} during shutdown:`, error);
        }
      }
      
      this.isInitialized = false;
      
      if (this.config.enableDebugMode) {
        console.log('[HybridPluginManager] 🔌 System shutdown complete');
      }
      
    } catch (error) {
      console.error('[HybridPluginManager] 💥 Shutdown failed:', error);
    }
  }
}