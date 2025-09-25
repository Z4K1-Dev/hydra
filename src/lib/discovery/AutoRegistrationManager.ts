import { PluginDiscoveryService, PluginMetadata } from './PluginDiscoveryService';
import { PluginLoader, PluginLoadResult } from './PluginLoader';
import { BasePlugin } from '../../plugins/base-plugin';

// Registration Status Enum
export enum RegistrationStatus {
  NOT_REGISTERED = 'not_registered',
  REGISTERING = 'registering',
  REGISTERED = 'registered',
  FAILED = 'failed',
  UNREGISTERING = 'unregistering',
}

// Registration Info Interface
export interface RegistrationInfo {
  pluginName: string;
  status: RegistrationStatus;
  metadata: PluginMetadata;
  plugin?: BasePlugin;
  error?: string;
  registeredAt?: Date;
  lastUpdated?: Date;
  loadTime?: number;
  retryCount: number;
}

// Auto Registration Options Interface
export interface AutoRegistrationOptions {
  autoRegisterOnDiscovery: boolean;
  autoRetryFailed: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
  enableHealthChecks: boolean;
  healthCheckInterval: number;
  enableDependencyResolution: boolean;
  enableHotReload: boolean;
}

// Default options
const defaultOptions: AutoRegistrationOptions = {
  autoRegisterOnDiscovery: true,
  autoRetryFailed: true,
  maxRetryAttempts: 3,
  retryDelay: 5000, // 5 seconds
  enableHealthChecks: true,
  healthCheckInterval: 30000, // 30 seconds
  enableDependencyResolution: true,
  enableHotReload: false,
};

// Auto Registration Manager Class
export class AutoRegistrationManager {
  private discoveryService: PluginDiscoveryService;
  private pluginLoader: PluginLoader;
  private options: AutoRegistrationOptions;
  private registrations: Map<string, RegistrationInfo> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private eventCallbacks: Map<string, Set<(data: any) => void>> = new Map();

  constructor(
    discoveryService: PluginDiscoveryService,
    pluginLoader: PluginLoader,
    options: Partial<AutoRegistrationOptions> = {}
  ) {
    this.discoveryService = discoveryService;
    this.pluginLoader = pluginLoader;
    this.options = { ...defaultOptions, ...options };
    
    this.setupEventHandlers();
  }

  /**
   * Initialize auto-registration
   */
  async initialize(): Promise<void> {
    console.log('Initializing auto-registration manager...');

    // Start watching for plugin changes
    if (this.options.enableHotReload) {
      await this.discoveryService.startWatching();
    }

    // Discover and register existing plugins
    await this.discoverAndRegisterPlugins();

    // Start health checks if enabled
    if (this.options.enableHealthChecks) {
      this.startHealthChecks();
    }

    console.log('Auto-registration manager initialized successfully');
  }

  /**
   * Discover and register all plugins
   */
  private async discoverAndRegisterPlugins(): Promise<void> {
    try {
      const plugins = await this.discoveryService.discoverPlugins();
      
      for (const plugin of plugins) {
        if (this.options.autoRegisterOnDiscovery) {
          await this.registerPlugin(plugin);
        }
      }
    } catch (error) {
      console.error('Failed to discover and register plugins:', error);
    }
  }

  /**
   * Register a single plugin
   */
  async registerPlugin(metadata: PluginMetadata): Promise<boolean> {
    const existingRegistration = this.registrations.get(metadata.manifest.name);
    
    // Skip if already registered
    if (existingRegistration?.status === RegistrationStatus.REGISTERED) {
      return true;
    }

    // Update status to registering
    this.updateRegistrationStatus(metadata.manifest.name, RegistrationStatus.REGISTERING);

    try {
      // Load the plugin
      const loadResult = await this.pluginLoader.loadPlugin(metadata);

      if (loadResult.success) {
        // Update registration info
        this.registrations.set(metadata.manifest.name, {
          pluginName: metadata.manifest.name,
          status: RegistrationStatus.REGISTERED,
          metadata,
          plugin: loadResult.plugin,
          registeredAt: new Date(),
          lastUpdated: new Date(),
          loadTime: loadResult.loadTime,
          retryCount: 0,
        });

        this.emitEvent('plugin:registered', {
          pluginName: metadata.manifest.name,
          metadata,
          loadTime: loadResult.loadTime,
        });

        console.log(`Plugin registered successfully: ${metadata.manifest.name}`);
        return true;
      } else {
        throw new Error(loadResult.error || 'Unknown error during plugin loading');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Update registration info with error
      this.registrations.set(metadata.manifest.name, {
        pluginName: metadata.manifest.name,
        status: RegistrationStatus.FAILED,
        metadata,
        error: errorMessage,
        lastUpdated: new Date(),
        retryCount: (existingRegistration?.retryCount || 0) + 1,
      });

      this.emitEvent('plugin:registration_failed', {
        pluginName: metadata.manifest.name,
        error: errorMessage,
        metadata,
      });

      console.error(`Failed to register plugin ${metadata.manifest.name}:`, errorMessage);

      // Auto-retry if enabled
      if (this.options.autoRetryFailed && this.shouldRetry(metadata.manifest.name)) {
        setTimeout(() => {
          this.retryRegistration(metadata.manifest.name);
        }, this.options.retryDelay);
      }

      return false;
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginName: string): Promise<boolean> {
    const registration = this.registrations.get(pluginName);
    
    if (!registration) {
      console.warn(`Plugin ${pluginName} is not registered`);
      return false;
    }

    // Update status to unregistering
    this.updateRegistrationStatus(pluginName, RegistrationStatus.UNREGISTERING);

    try {
      // Unload the plugin
      const success = await this.pluginLoader.unloadPlugin(pluginName);

      if (success) {
        // Remove registration
        this.registrations.delete(pluginName);

        this.emitEvent('plugin:unregistered', {
          pluginName,
        });

        console.log(`Plugin unregistered successfully: ${pluginName}`);
        return true;
      } else {
        throw new Error('Failed to unload plugin');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Revert status
      this.updateRegistrationStatus(pluginName, registration.status);

      console.error(`Failed to unregister plugin ${pluginName}:`, errorMessage);
      return false;
    }
  }

  /**
   * Retry plugin registration
   */
  private async retryRegistration(pluginName: string): Promise<void> {
    const registration = this.registrations.get(pluginName);
    
    if (!registration || registration.status !== RegistrationStatus.FAILED) {
      return;
    }

    if (!this.shouldRetry(pluginName)) {
      console.log(`Max retry attempts reached for plugin ${pluginName}`);
      return;
    }

    console.log(`Retrying plugin registration: ${pluginName}`);
    await this.registerPlugin(registration.metadata);
  }

  /**
   * Check if should retry registration
   */
  private shouldRetry(pluginName: string): boolean {
    const registration = this.registrations.get(pluginName);
    
    if (!registration) {
      return false;
    }

    return registration.retryCount < this.options.maxRetryAttempts;
  }

  /**
   * Update registration status
   */
  private updateRegistrationStatus(pluginName: string, status: RegistrationStatus): void {
    const registration = this.registrations.get(pluginName);
    
    if (registration) {
      registration.status = status;
      registration.lastUpdated = new Date();
      this.registrations.set(pluginName, registration);
    }
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.options.healthCheckInterval);

    console.log(`Health checks started with interval: ${this.options.healthCheckInterval}ms`);
  }

  /**
   * Perform health checks on all registered plugins
   */
  private async performHealthChecks(): Promise<void> {
    const registrations = Array.from(this.registrations.values());
    
    for (const registration of registrations) {
      if (registration.status === RegistrationStatus.REGISTERED) {
        await this.checkPluginHealth(registration);
      }
    }
  }

  /**
   * Check health of a specific plugin
   */
  private async checkPluginHealth(registration: RegistrationInfo): Promise<void> {
    try {
      const plugin = registration.plugin;
      if (!plugin) {
        throw new Error('Plugin instance not found');
      }

      // Basic health check - check if plugin is still responsive
      const isHealthy = await this.isPluginHealthy(plugin);

      if (!isHealthy) {
        console.warn(`Plugin ${registration.pluginName} health check failed`);
        
        // Attempt to reload the plugin
        await this.handleUnhealthyPlugin(registration);
      }
    } catch (error) {
      console.error(`Health check failed for plugin ${registration.pluginName}:`, error);
      await this.handleUnhealthyPlugin(registration);
    }
  }

  /**
   * Check if plugin is healthy
   */
  private async isPluginHealthy(plugin: BasePlugin): Promise<boolean> {
    try {
      // Basic health check - plugin should have isLoaded property
      if (typeof plugin.isLoaded !== 'boolean') {
        return false;
      }

      // Additional health checks can be added here
      // For example, check if plugin responds to ping, etc.

      return plugin.isLoaded;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle unhealthy plugin
   */
  private async handleUnhealthyPlugin(registration: RegistrationInfo): Promise<void> {
    console.log(`Attempting to recover unhealthy plugin: ${registration.pluginName}`);

    // Try to unload and reload the plugin
    try {
      await this.unregisterPlugin(registration.pluginName);
      await this.registerPlugin(registration.metadata);
    } catch (error) {
      console.error(`Failed to recover plugin ${registration.pluginName}:`, error);
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Listen to plugin discovery changes
    this.discoveryService.onChange(async (event) => {
      if (event.type === 'manifest-changed') {
        await this.handleManifestChange(event);
      }
    });
  }

  /**
   * Handle manifest change events
   */
  private async handleManifestChange(event: any): Promise<void> {
    try {
      // Rediscover plugins
      const plugins = await this.discoveryService.discoverPlugins();
      
      // Find the changed plugin
      const changedPlugin = plugins.find(p => 
        p.path === event.path && p.manifest.name === event.filename.replace('.json', '')
      );

      if (changedPlugin) {
        // Reload the plugin if it was registered
        if (this.registrations.has(changedPlugin.manifest.name)) {
          console.log(`Reloading changed plugin: ${changedPlugin.manifest.name}`);
          await this.unregisterPlugin(changedPlugin.manifest.name);
          await this.registerPlugin(changedPlugin);
        }
      }
    } catch (error) {
      console.error('Failed to handle manifest change:', error);
    }
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
          console.error(`Event callback error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get registration info
   */
  getRegistration(pluginName: string): RegistrationInfo | undefined {
    return this.registrations.get(pluginName);
  }

  /**
   * Get all registrations
   */
  getAllRegistrations(): RegistrationInfo[] {
    return Array.from(this.registrations.values());
  }

  /**
   * Get registrations by status
   */
  getRegistrationsByStatus(status: RegistrationStatus): RegistrationInfo[] {
    return Array.from(this.registrations.values()).filter(r => r.status === status);
  }

  /**
   * Get registration statistics
   */
  getStatistics(): {
    total: number;
    registered: number;
    failed: number;
    registering: number;
    averageLoadTime: number;
    retryRate: number;
  } {
    const registrations = Array.from(this.registrations.values());
    const total = registrations.length;
    const registered = registrations.filter(r => r.status === RegistrationStatus.REGISTERED).length;
    const failed = registrations.filter(r => r.status === RegistrationStatus.FAILED).length;
    const registering = registrations.filter(r => r.status === RegistrationStatus.REGISTERING).length;
    
    const loadTimes = registrations
      .filter(r => r.loadTime !== undefined)
      .map(r => r.loadTime!);
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;
    
    const retryRate = total > 0 
      ? registrations.filter(r => r.retryCount > 0).length / total 
      : 0;

    return {
      total,
      registered,
      failed,
      registering,
      averageLoadTime,
      retryRate,
    };
  }

  /**
   * Shutdown the auto-registration manager
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down auto-registration manager...');

    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Stop watching for changes
    this.discoveryService.stopWatching();

    // Unregister all plugins
    const unregisterPromises = Array.from(this.registrations.keys()).map(name =>
      this.unregisterPlugin(name)
    );
    
    await Promise.allSettled(unregisterPromises);

    // Clear registrations
    this.registrations.clear();

    console.log('Auto-registration manager shutdown completed');
  }
}