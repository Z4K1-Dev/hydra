import { 
  PluginEventEmitter, 
  HookManager, 
  PluginRegistry,
  HybridPluginManager,
  PluginConfig as HybridPluginConfig,
  EventData,
  HookData,
  PluginMetadata
} from '@/lib/hybrid-system';

export interface PluginConfig {
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  settings?: Record<string, any>;
  dependencies?: string[];
  hooks?: string[];
  events?: string[];
}

export interface PluginSettings {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    label: string;
    required: boolean;
    default?: any;
    description?: string;
  };
}

export abstract class BasePlugin {
  public config: PluginConfig;
  public isLoaded: boolean = false;
  public eventEmitter: PluginEventEmitter;
  public hookManager: HookManager;
  public pluginRegistry: PluginRegistry;
  public hybridManager: HybridPluginManager;
  private eventListeners: Map<string, ((data?: any) => any)[]> = new Map();
  private registeredHooks: Map<string, (...args: any[]) => any> = new Map();
  
  constructor(config: PluginConfig) {
    this.config = config;
    
    // Initialize hybrid system components
    this.eventEmitter = new PluginEventEmitter();
    this.hookManager = new HookManager();
    this.pluginRegistry = new PluginRegistry();
    this.hybridManager = new HybridPluginManager(
      this.eventEmitter,
      this.hookManager,
      this.pluginRegistry
    );
    
    // Register plugin with hybrid system
    this.registerWithHybridSystem();
  }

  private registerWithHybridSystem(): void {
    const metadata: PluginMetadata = {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      dependencies: this.config.dependencies || [],
      hooks: this.config.hooks || [],
      events: this.config.events || [],
      isActive: this.config.isActive
    };

    this.pluginRegistry.register(this, metadata);
    console.log(`Plugin ${this.config.name} registered with hybrid system`);
  }

  abstract load(): Promise<void>;
  abstract unload(): Promise<void>;
  
  // Event Listener Methods
  protected on(eventName: string, listener: (data?: any) => any): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)!.push(listener);
    
    // Also register with global event emitter
    this.eventEmitter.on(eventName, listener);
  }
  
  protected off(eventName: string, listener: (data?: any) => any): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
    
    // Also remove from global event emitter
    this.eventEmitter.off(eventName, listener);
  }
  
  protected emit(eventName: string, data?: any): void {
    // Emit to global event emitter
    this.eventEmitter.emit(eventName, data);
    
    // Also emit to plugin-specific listeners
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }
  
  protected once(eventName: string, listener: (data?: any) => any): void {
    const onceWrapper = (data: any) => {
      listener(data);
      this.off(eventName, onceWrapper);
    };
    this.on(eventName, onceWrapper);
  }
  
  // Hook Registration Methods
  protected addHook(hookName: string, callback: (...args: any[]) => any, priority: number = 10): void {
    this.registeredHooks.set(hookName, callback);
    this.hookManager.addHook(hookName, callback, priority);
    console.log(`Plugin ${this.config.name} registered hook: ${hookName} with priority ${priority}`);
  }
  
  protected removeHook(hookName: string): void {
    const callback = this.registeredHooks.get(hookName);
    if (callback) {
      this.hookManager.removeHook(hookName, callback);
      this.registeredHooks.delete(hookName);
      console.log(`Plugin ${this.config.name} removed hook: ${hookName}`);
    }
  }
  
  protected executeHook(hookName: string, data: any, context?: any): any {
    return this.hookManager.executeHook(hookName, data, context);
  }
  
  protected filterHook(hookName: string, data: any, context?: any): any {
    return this.hookManager.filterHook(hookName, data, context);
  }
  
  protected hasHook(hookName: string): boolean {
    return this.registeredHooks.has(hookName);
  }
  
  protected getHookNames(): string[] {
    return Array.from(this.registeredHooks.keys());
  }
  
  // Enhanced Utility Methods for Hybrid Operations
  protected async emitAsync(eventName: string, data?: any): Promise<any[]> {
    return this.eventEmitter.emitAsync(eventName, data);
  }
  
  protected emitToPlugin(pluginName: string, eventName: string, data?: any): void {
    this.eventEmitter.emitToPlugin(pluginName, eventName, data);
  }
  
  protected emitToPluginAsync(pluginName: string, eventName: string, data?: any): Promise<any[]> {
    return this.eventEmitter.emitToPluginAsync(pluginName, eventName, data);
  }
  
  protected getEventNames(): string[] {
    return Array.from(this.eventListeners.keys());
  }
  
  protected getListenerCount(eventName: string): number {
    const listeners = this.eventListeners.get(eventName);
    return listeners ? listeners.length : 0;
  }
  
  protected removeAllListeners(eventName?: string): void {
    if (eventName) {
      const listeners = this.eventListeners.get(eventName);
      if (listeners) {
        listeners.forEach(listener => {
          this.off(eventName, listener);
        });
      }
    } else {
      // Remove all listeners
      this.eventListeners.forEach((listeners, eventName) => {
        listeners.forEach(listener => {
          this.off(eventName, listener);
        });
      });
      this.eventListeners.clear();
    }
  }
  
  protected getHookCount(hookName: string): number {
    return this.hookManager.getHookCount(hookName);
  }
  
  protected getHooksByPriority(hookName: string): Array<{callback: (...args: any[]) => any, priority: number}> {
    return this.hookManager.getHooksByPriority(hookName);
  }
  
  protected clearHooks(hookName?: string): void {
    if (hookName) {
      this.hookManager.clearHooks(hookName);
      this.registeredHooks.delete(hookName);
    } else {
      this.hookManager.clearAllHooks();
      this.registeredHooks.clear();
    }
  }
  
  protected registerDependency(pluginName: string): void {
    console.log(`Dependency registration for ${pluginName} not implemented in current registry`);
  }
  
  protected checkDependencies(): boolean {
    // Simple implementation - return true for now
    // In real implementation, this would check the registry
    return true;
  }
  
  protected getDependentPlugins(): string[] {
    // Return empty array for now
    return [];
  }
  
  protected getPluginDependencies(): string[] {
    // Return config dependencies
    return this.config.dependencies || [];
  }
  
  protected isPluginActive(pluginName: string): boolean {
    // Simple implementation
    return this.pluginRegistry.isActive(pluginName);
  }
  
  protected activatePlugin(pluginName: string): void {
    console.log(`Plugin activation for ${pluginName} not implemented in current registry`);
  }
  
  protected deactivatePlugin(pluginName: string): void {
    console.log(`Plugin deactivation for ${pluginName} not implemented in current registry`);
  }
  
  protected getSystemStats(): any {
    return this.hybridManager.getSystemStats();
  }
  
  protected enableDebugMode(enabled: boolean = true): void {
    this.eventEmitter.enableDebugMode(enabled);
    this.hookManager.enableDebugMode(enabled);
    this.pluginRegistry.enableDebugMode(enabled);
    this.hybridManager.enableDebugMode(enabled);
  }
  
  protected getPerformanceMetrics(): any {
    return {
      events: this.eventEmitter.getPerformanceMetrics(),
      hooks: this.hookManager.getPerformanceMetrics(),
      plugins: this.pluginRegistry.getPerformanceMetrics(),
      system: this.hybridManager.getPerformanceMetrics()
    };
  }
  
  protected async executeWithTimeout<T>(
    operation: () => Promise<T>, 
    timeoutMs: number = 5000,
    operationName: string = 'operation'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout in ${operationName} after ${timeoutMs}ms`));
      }, timeoutMs);
      
      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }
  
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
    operationName: string = 'operation'
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`${operationName} failed after ${maxRetries} attempts: ${error.message}`);
        }
        console.log(`${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error(`${operationName} failed after ${maxRetries} attempts`);
  }
  
  protected validateSettings(settings: Record<string, any>, schema: PluginSettings): boolean {
    for (const [key, setting] of Object.entries(schema)) {
      if (setting.required && settings[key] === undefined) {
        console.error(`Required setting '${key}' is missing for plugin ${this.config.name}`);
        return false;
      }
      
      if (settings[key] !== undefined && typeof settings[key] !== setting.type) {
        console.error(`Setting '${key}' must be of type ${setting.type} for plugin ${this.config.name}`);
        return false;
      }
    }
    return true;
  }
  
  // Migration Compatibility Layer for Existing Plugins
  protected async migrateFromLegacy(): Promise<void> {
    console.log(`Migrating plugin ${this.config.name} to hybrid system...`);
    
    // Emit migration event
    this.emit('plugin:migration:start', { pluginName: this.config.name });
    
    try {
      // Register default hooks for backward compatibility
      this.registerDefaultHooks();
      
      // Register default events for backward compatibility
      this.registerDefaultEvents();
      
      // Setup legacy compatibility methods
      this.setupLegacyCompatibility();
      
      // Emit migration complete event
      this.emit('plugin:migration:complete', { pluginName: this.config.name });
      
      console.log(`Plugin ${this.config.name} successfully migrated to hybrid system`);
    } catch (error) {
      this.emit('plugin:migration:error', { 
        pluginName: this.config.name, 
        error: error.message 
      });
      throw error;
    }
  }
  
  private registerDefaultHooks(): void {
    // Register common hooks that existing plugins might expect
    const defaultHooks = [
      'content:before',
      'content:after',
      'seo:before',
      'seo:after',
      'analytics:before',
      'analytics:after',
      'sitemap:before',
      'sitemap:after'
    ];
    
    defaultHooks.forEach(hookName => {
      if (!this.hasHook(hookName)) {
        this.addHook(hookName, (data: any) => {
          // Default hook implementation - just pass data through
          return data;
        }, 100); // Low priority for default hooks
      }
    });
  }
  
  private registerDefaultEvents(): void {
    // Register common event listeners for backward compatibility
    const defaultEvents = [
      'plugin:loaded',
      'plugin:unloaded',
      'system:ready',
      'system:shutdown'
    ];
    
    defaultEvents.forEach(eventName => {
      this.on(eventName, (data: any) => {
        console.log(`Plugin ${this.config.name} received event: ${eventName}`, data);
      });
    });
  }
  
  private setupLegacyCompatibility(): void {
    // Add legacy method compatibility
    (this as any).legacyEmit = this.emit.bind(this);
    (this as any).legacyOn = this.on.bind(this);
    (this as any).legacyOff = this.off.bind(this);
    
    // Add deprecated method warnings
    this.addDeprecatedMethodWarnings();
  }
  
  private addDeprecatedMethodWarnings(): void {
    const deprecatedMethods = [
      'legacyEmit',
      'legacyOn', 
      'legacyOff'
    ];
    
    deprecatedMethods.forEach(methodName => {
      const originalMethod = (this as any)[methodName];
      if (originalMethod) {
        (this as any)[methodName] = (...args: any[]) => {
          console.warn(`DEPRECATED: ${methodName} is deprecated. Use modern hybrid system methods instead.`);
          return originalMethod.apply(this, args);
        };
      }
    });
  }
  
  // Legacy method wrappers for backward compatibility
  protected legacyLoad(): Promise<void> {
    console.warn(`DEPRECATED: legacyLoad() is deprecated. Use load() with hybrid system features.`);
    return this.load();
  }
  
  protected legacyUnload(): Promise<void> {
    console.warn(`DEPRECATED: legacyUnload() is deprecated. Use unload() with hybrid system features.`);
    return this.unload();
  }
  
  // Enhanced load/unload with hybrid system integration
  async enhancedLoad(): Promise<void> {
    console.log(`Loading plugin ${this.config.name} with hybrid system...`);
    
    // Emit pre-load event
    this.emit('plugin:load:before', { pluginName: this.config.name });
    
    try {
      // Check dependencies
      if (!this.checkDependencies()) {
        throw new Error(`Plugin ${this.config.name} has unmet dependencies`);
      }
      
      // Run migration if needed
      await this.migrateFromLegacy();
      
      // Call original load method
      await this.load();
      
      // Register with hybrid manager
      await this.hybridManager.loadPlugin(this.config.name, this.config);
      
      // Emit post-load event
      this.emit('plugin:load:after', { pluginName: this.config.name });
      
      this.isLoaded = true;
      console.log(`Plugin ${this.config.name} loaded successfully with hybrid system`);
    } catch (error) {
      this.emit('plugin:load:error', { 
        pluginName: this.config.name, 
        error: error.message 
      });
      throw error;
    }
  }
  
  async enhancedUnload(): Promise<void> {
    console.log(`Unloading plugin ${this.config.name} from hybrid system...`);
    
    // Emit pre-unload event
    this.emit('plugin:unload:before', { pluginName: this.config.name });
    
    try {
      // Unregister from hybrid manager
      await this.hybridManager.unloadPlugin(this.config.name);
      
      // Clean up event listeners
      this.removeAllListeners();
      
      // Clean up hooks
      this.clearHooks();
      
      // Call original unload method
      await this.unload();
      
      // Emit post-unload event
      this.emit('plugin:unload:after', { pluginName: this.config.name });
      
      this.isLoaded = false;
      console.log(`Plugin ${this.config.name} unloaded successfully from hybrid system`);
    } catch (error) {
      this.emit('plugin:unload:error', { 
        pluginName: this.config.name, 
        error: error.message 
      });
      throw error;
    }
  }
  
  // Plugin lifecycle hooks
  protected onBeforeLoad(callback: (data?: any) => any): void {
    this.on('plugin:load:before', callback);
  }
  
  protected onAfterLoad(callback: (data?: any) => any): void {
    this.on('plugin:load:after', callback);
  }
  
  protected onBeforeUnload(callback: (data?: any) => any): void {
    this.on('plugin:unload:before', callback);
  }
  
  protected onAfterUnload(callback: (data?: any) => any): void {
    this.on('plugin:unload:after', callback);
  }
  
  // Error handling hooks
  protected onError(callback: (error: Error) => any): void {
    this.on('plugin:load:error', callback);
    this.on('plugin:unload:error', callback);
    this.on('plugin:migration:error', callback);
  }
  
  protected injectScript(src: string, async: boolean = true): Promise<void> {
    if (typeof window === 'undefined') return;
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      
      document.head.appendChild(script);
    });
  }
  
  protected injectMetaTag(name: string, content: string): void {
    if (typeof window === 'undefined') return;
    
    const meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!meta) {
      const newMeta = document.createElement('meta') as HTMLMetaElement;
      newMeta.name = name;
      document.head.appendChild(newMeta);
    } else {
      meta.content = content;
    }
  }
  
  protected injectStructuredData(data: any): void {
    if (typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }
}