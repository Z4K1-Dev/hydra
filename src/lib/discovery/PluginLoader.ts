import { PluginMetadata, PluginManifest } from './PluginDiscoveryService';
import { BasePlugin, PluginConfig } from '../../plugins/base-plugin';

// Plugin Loading Result Interface
export interface PluginLoadResult {
  success: boolean;
  plugin?: BasePlugin;
  error?: string;
  loadTime: number;
  warnings: string[];
}

// Plugin Loader Options Interface
export interface PluginLoaderOptions {
  enableHotReload: boolean;
  enableSandbox: boolean;
  maxLoadTime: number;
  enableDependencyResolution: boolean;
  cacheLoadedPlugins: boolean;
}

// Default loader options
const defaultOptions: PluginLoaderOptions = {
  enableHotReload: false,
  enableSandbox: true,
  maxLoadTime: 30000, // 30 seconds
  enableDependencyResolution: true,
  cacheLoadedPlugins: true,
};

// Plugin Loader Class
export class PluginLoader {
  private options: PluginLoaderOptions;
  private loadedPlugins: Map<string, BasePlugin> = new Map();
  private loadTimes: Map<string, number> = new Map();
  private loadErrors: Map<string, string> = new Map();

  constructor(options: Partial<PluginLoaderOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Load a plugin from metadata
   */
  async loadPlugin(metadata: PluginMetadata): Promise<PluginLoadResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // Check if plugin is already loaded
      if (this.options.cacheLoadedPlugins && this.loadedPlugins.has(metadata.manifest.name)) {
        return {
          success: true,
          plugin: this.loadedPlugins.get(metadata.manifest.name),
          loadTime: 0,
          warnings: ['Plugin was already loaded from cache'],
        };
      }

      // Validate plugin before loading
      const validation = this.validatePluginForLoading(metadata);
      if (!validation.valid) {
        return {
          success: false,
          error: `Plugin validation failed: ${validation.errors.join(', ')}`,
          loadTime: Date.now() - startTime,
          warnings,
        };
      }

      // Check dependencies if enabled
      if (this.options.enableDependencyResolution) {
        const dependencyCheck = await this.checkDependencies(metadata);
        if (!dependencyCheck.valid) {
          return {
            success: false,
            error: `Dependency check failed: ${dependencyCheck.missing.join(', ')}`,
            loadTime: Date.now() - startTime,
            warnings,
          };
        }
      }

      // Load plugin class
      const PluginClass = await this.loadPluginClass(metadata);
      if (!PluginClass) {
        return {
          success: false,
          error: 'Failed to load plugin class',
          loadTime: Date.now() - startTime,
          warnings,
        };
      }

      // Create plugin configuration
      const config = this.createPluginConfig(metadata);

      // Create plugin instance
      let plugin: BasePlugin;
      if (this.options.enableSandbox) {
        plugin = await this.createSandboxedPlugin(PluginClass, config);
      } else {
        plugin = new PluginClass(config);
      }

      // Initialize plugin
      await this.initializePlugin(plugin, metadata);

      // Cache plugin if enabled
      if (this.options.cacheLoadedPlugins) {
        this.loadedPlugins.set(metadata.manifest.name, plugin);
      }

      const loadTime = Date.now() - startTime;
      this.loadTimes.set(metadata.manifest.name, loadTime);

      return {
        success: true,
        plugin,
        loadTime,
        warnings,
      };

    } catch (error) {
      const loadTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.loadErrors.set(metadata.manifest.name, errorMessage);

      return {
        success: false,
        error: errorMessage,
        loadTime,
        warnings,
      };
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginName: string): Promise<boolean> {
    try {
      const plugin = this.loadedPlugins.get(pluginName);
      if (plugin) {
        await plugin.unload();
        this.loadedPlugins.delete(pluginName);
        this.loadTimes.delete(pluginName);
        this.loadErrors.delete(pluginName);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginName}:`, error);
      return false;
    }
  }

  /**
   * Reload a plugin
   */
  async reloadPlugin(pluginName: string): Promise<PluginLoadResult> {
    // Unload first
    await this.unloadPlugin(pluginName);

    // Get plugin metadata (this would need to be passed or rediscovered)
    // For now, we'll return an error
    return {
      success: false,
      error: 'Plugin reload requires metadata. Use loadPlugin with updated metadata.',
      loadTime: 0,
      warnings: [],
    };
  }

  /**
   * Load multiple plugins
   */
  async loadPlugins(plugins: PluginMetadata[]): Promise<{
    successful: PluginLoadResult[];
    failed: PluginLoadResult[];
    totalLoadTime: number;
  }> {
    const successful: PluginLoadResult[] = [];
    const failed: PluginLoadResult[] = [];
    const startTime = Date.now();

    // Load plugins in parallel with concurrency limit
    const concurrencyLimit = this.options.maxLoadTime > 0 ? 3 : 1;
    const chunks = this.chunkArray(plugins, concurrencyLimit);

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map(plugin => this.loadPlugin(plugin))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successful.push(result.value);
          } else {
            failed.push(result.value);
          }
        } else {
          failed.push({
            success: false,
            error: result.reason.message,
            loadTime: 0,
            warnings: [],
          });
        }
      }
    }

    const totalLoadTime = Date.now() - startTime;

    return { successful, failed, totalLoadTime };
  }

  /**
   * Get loaded plugin
   */
  getLoadedPlugin(pluginName: string): BasePlugin | undefined {
    return this.loadedPlugins.get(pluginName);
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): BasePlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Check if plugin is loaded
   */
  isPluginLoaded(pluginName: string): boolean {
    return this.loadedPlugins.has(pluginName);
  }

  /**
   * Get plugin load time
   */
  getPluginLoadTime(pluginName: string): number | undefined {
    return this.loadTimes.get(pluginName);
  }

  /**
   * Get plugin load error
   */
  getPluginLoadError(pluginName: string): string | undefined {
    return this.loadErrors.get(pluginName);
  }

  /**
   * Get loader statistics
   */
  getStatistics(): {
    loadedCount: number;
    totalLoadTime: number;
    averageLoadTime: number;
    errorCount: number;
    cacheHitRate: number;
  } {
    const loadedCount = this.loadedPlugins.size;
    const totalLoadTime = Array.from(this.loadTimes.values()).reduce((sum, time) => sum + time, 0);
    const averageLoadTime = loadedCount > 0 ? totalLoadTime / loadedCount : 0;
    const errorCount = this.loadErrors.size;
    const cacheHitRate = 0; // Would need to track cache hits

    return {
      loadedCount,
      totalLoadTime,
      averageLoadTime,
      errorCount,
      cacheHitRate,
    };
  }

  /**
   * Validate plugin for loading
   */
  private validatePluginForLoading(metadata: PluginMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if plugin is valid
    if (!metadata.isValid) {
      errors.push(...metadata.validationErrors);
    }

    // Check system version compatibility
    if (metadata.manifest.minimumSystemVersion) {
      const currentVersion = '1.0.0'; // Would get from system
      if (!this.isVersionCompatible(currentVersion, metadata.manifest.minimumSystemVersion)) {
        errors.push(`Plugin requires minimum system version ${metadata.manifest.minimumSystemVersion}`);
      }
    }

    // Check maximum system version
    if (metadata.manifest.maximumSystemVersion) {
      const currentVersion = '1.0.0'; // Would get from system
      if (!this.isVersionCompatible(metadata.manifest.maximumSystemVersion, currentVersion)) {
        errors.push(`Plugin is not compatible with system version ${currentVersion}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check plugin dependencies
   */
  private async checkDependencies(metadata: PluginMetadata): Promise<{ valid: boolean; missing: string[] }> {
    const dependencies = metadata.manifest.dependencies || [];
    const missing: string[] = [];

    for (const dependency of dependencies) {
      if (!this.loadedPlugins.has(dependency)) {
        missing.push(dependency);
      }
    }

    return { valid: missing.length === 0, missing };
  }

  /**
   * Load plugin class
   */
  private async loadPluginClass(metadata: PluginMetadata): Promise<typeof BasePlugin | null> {
    try {
      const entrypointPath = path.join(metadata.path, metadata.manifest.entrypoint);
      
      // Dynamic import
      const pluginModule = await import(entrypointPath);
      
      // Get plugin class from module
      let PluginClass = pluginModule.default;
      
      // If default export is not available, try named exports
      if (!PluginClass) {
        PluginClass = pluginModule[metadata.manifest.name];
      }
      
      // If still not found, try to find any class that extends BasePlugin
      if (!PluginClass) {
        for (const exportKey in pluginModule) {
          if (pluginModule[exportKey].prototype instanceof BasePlugin) {
            PluginClass = pluginModule[exportKey];
            break;
          }
        }
      }

      if (!PluginClass) {
        throw new Error(`Plugin class not found in ${entrypointPath}`);
      }

      return PluginClass;
    } catch (error) {
      console.error(`Failed to load plugin class for ${metadata.manifest.name}:`, error);
      return null;
    }
  }

  /**
   * Create plugin configuration
   */
  private createPluginConfig(metadata: PluginMetadata): PluginConfig {
    return {
      name: metadata.manifest.name,
      description: metadata.manifest.description,
      version: metadata.manifest.version,
      isActive: true,
      settings: metadata.manifest.settings || {},
    };
  }

  /**
   * Create sandboxed plugin
   */
  private async createSandboxedPlugin(PluginClass: typeof BasePlugin, config: PluginConfig): Promise<BasePlugin> {
    // In a real implementation, this would create a sandboxed environment
    // For now, just create the plugin normally
    return new PluginClass(config);
  }

  /**
   * Initialize plugin
   */
  private async initializePlugin(plugin: BasePlugin, metadata: PluginMetadata): Promise<void> {
    try {
      // Set timeout for plugin loading
      const loadPromise = plugin.load();
      
      if (this.options.maxLoadTime > 0) {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Plugin load timeout')), this.options.maxLoadTime);
        });

        await Promise.race([loadPromise, timeoutPromise]);
      } else {
        await loadPromise;
      }
    } catch (error) {
      console.error(`Failed to initialize plugin ${metadata.manifest.name}:`, error);
      throw error;
    }
  }

  /**
   * Check version compatibility
   */
  private isVersionCompatible(version1: string, version2: string): boolean {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      
      if (num1 > num2) return true;
      if (num1 < num2) return false;
    }

    return true;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Clear all loaded plugins
   */
  async clearAll(): Promise<void> {
    const unloadPromises = Array.from(this.loadedPlugins.keys()).map(name =>
      this.unloadPlugin(name)
    );
    
    await Promise.allSettled(unloadPromises);
    
    this.loadedPlugins.clear();
    this.loadTimes.clear();
    this.loadErrors.clear();
  }
}

// Import path for dynamic imports
import path from 'path';