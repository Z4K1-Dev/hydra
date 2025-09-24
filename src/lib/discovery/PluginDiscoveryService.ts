import { promises as fs } from 'fs';
import path from 'path';

// Plugin Manifest Interface
export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  entrypoint: string;
  dependencies?: string[];
  capabilities: string[];
  permissions: string[];
  author: string;
  keywords?: string[];
  category?: string;
  icon?: string;
  minimumSystemVersion?: string;
  maximumSystemVersion?: string;
  configSchema?: any;
  settings?: any;
}

// Plugin Metadata Interface
export interface PluginMetadata {
  manifest: PluginManifest;
  path: string;
  isValid: boolean;
  validationErrors: string[];
  lastModified: Date;
  fileSize: number;
  checksum: string;
}

// Discovery Options Interface
export interface DiscoveryOptions {
  directories: string[];
  recursive: boolean;
  includeDevPlugins: boolean;
  excludePatterns: string[];
  maxDepth: number;
  watchMode: boolean;
}

// Default discovery options
const defaultOptions: DiscoveryOptions = {
  directories: ['./plugins', './src/plugins'],
  recursive: true,
  includeDevPlugins: false,
  excludePatterns: ['*.test.*', '*.spec.*', '__tests__', 'node_modules'],
  maxDepth: 5,
  watchMode: false,
};

// Plugin Discovery Service
export class PluginDiscoveryService {
  private options: DiscoveryOptions;
  private cache: Map<string, PluginMetadata[]> = new Map();
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private changeCallbacks: Set<Function> = new Set();

  constructor(options: Partial<DiscoveryOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Discover all plugins in configured directories
   */
  async discoverPlugins(): Promise<PluginMetadata[]> {
    const allPlugins: PluginMetadata[] = [];
    
    for (const directory of this.options.directories) {
      try {
        const plugins = await this.discoverInDirectory(directory);
        allPlugins.push(...plugins);
      } catch (error) {
        console.error(`Failed to discover plugins in ${directory}:`, error);
      }
    }

    // Cache the results
    this.cache.set('all', allPlugins);
    
    return allPlugins;
  }

  /**
   * Discover plugins in a specific directory
   */
  private async discoverInDirectory(directoryPath: string, currentDepth: number = 0): Promise<PluginMetadata[]> {
    if (currentDepth > this.options.maxDepth) {
      return [];
    }

    const plugins: PluginMetadata[] = [];
    
    try {
      const entries = await fs.readdir(directoryPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);
        
        // Skip excluded patterns
        if (this.shouldExclude(fullPath)) {
          continue;
        }

        if (entry.isDirectory() && this.options.recursive) {
          const subPlugins = await this.discoverInDirectory(fullPath, currentDepth + 1);
          plugins.push(...subPlugins);
        } else if (entry.isFile() && entry.name === 'plugin.json') {
          const plugin = await this.loadPluginManifest(directoryPath);
          if (plugin) {
            plugins.push(plugin);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${directoryPath}:`, error);
    }

    return plugins;
  }

  /**
   * Load plugin manifest from directory
   */
  private async loadPluginManifest(pluginPath: string): Promise<PluginMetadata | null> {
    try {
      const manifestPath = path.join(pluginPath, 'plugin.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      // Validate manifest
      const validation = this.validateManifest(manifest);
      
      // Get file stats
      const stats = await fs.stat(manifestPath);
      
      // Calculate checksum
      const checksum = this.calculateChecksum(manifestContent);

      const metadata: PluginMetadata = {
        manifest,
        path: pluginPath,
        isValid: validation.valid,
        validationErrors: validation.errors,
        lastModified: stats.mtime,
        fileSize: stats.size,
        checksum,
      };

      return metadata;
    } catch (error) {
      console.error(`Failed to load plugin manifest from ${pluginPath}:`, error);
      return null;
    }
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const required = ['name', 'version', 'description', 'entrypoint', 'capabilities'];

    // Check required fields
    for (const field of required) {
      if (!manifest[field]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Validate field types
    if (manifest.name && typeof manifest.name !== 'string') {
      errors.push('Field "name" must be a string');
    }

    if (manifest.version && typeof manifest.version !== 'string') {
      errors.push('Field "version" must be a string');
    }

    // Validate version format (semantic versioning)
    if (manifest.version && !this.isValidVersion(manifest.version)) {
      errors.push('Field "version" must follow semantic versioning (e.g., 1.0.0)');
    }

    // Validate entrypoint exists
    if (manifest.entrypoint) {
      const entrypointPath = path.join(manifest.path || '.', manifest.entrypoint);
      // Note: We can't check file existence here as we don't have the full path context
    }

    // Validate capabilities
    if (manifest.capabilities && !Array.isArray(manifest.capabilities)) {
      errors.push('Field "capabilities" must be an array');
    }

    // Validate permissions
    if (manifest.permissions && !Array.isArray(manifest.permissions)) {
      errors.push('Field "permissions" must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if version follows semantic versioning
   */
  private isValidVersion(version: string): boolean {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+))?$/;
    return semverRegex.test(version);
  }

  /**
   * Calculate checksum of content
   */
  private calculateChecksum(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if path should be excluded
   */
  private shouldExclude(fullPath: string): boolean {
    return this.options.excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(fullPath);
    });
  }

  /**
   * Watch for plugin changes
   */
  async startWatching(): Promise<void> {
    if (!this.options.watchMode) {
      return;
    }

    for (const directory of this.options.directories) {
      try {
        await this.watchDirectory(directory);
      } catch (error) {
        console.error(`Failed to watch directory ${directory}:`, error);
      }
    }
  }

  /**
   * Watch a specific directory for changes
   */
  private async watchDirectory(directoryPath: string, currentDepth: number = 0): Promise<void> {
    if (currentDepth > this.options.maxDepth) {
      return;
    }

    try {
      const watcher = fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {
        if (filename) {
          this.handleFileChange(directoryPath, filename, eventType);
        }
      });

      this.watchers.set(directoryPath, watcher);
      console.log(`Watching for plugin changes in: ${directoryPath}`);

      // Watch subdirectories if recursive
      if (this.options.recursive) {
        const entries = await fs.readdir(directoryPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const subPath = path.join(directoryPath, entry.name);
            await this.watchDirectory(subPath, currentDepth + 1);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to watch directory ${directoryPath}:`, error);
    }
  }

  /**
   * Handle file change events
   */
  private async handleFileChange(directoryPath: string, filename: string, eventType: string): void {
    if (filename === 'plugin.json') {
      console.log(`Plugin manifest changed: ${path.join(directoryPath, filename)}`);
      
      // Notify callbacks
      this.notifyChangeListeners({
        type: 'manifest-changed',
        path: directoryPath,
        filename,
        eventType,
        timestamp: new Date(),
      });

      // Rediscover plugins
      this.discoverPlugins().catch(error => {
        console.error('Failed to rediscover plugins after change:', error);
      });
    }
  }

  /**
   * Stop watching for changes
   */
  stopWatching(): void {
    for (const [path, watcher] of this.watchers) {
      watcher.close();
      console.log(`Stopped watching: ${path}`);
    }
    this.watchers.clear();
  }

  /**
   * Register change callback
   */
  onChange(callback: Function): void {
    this.changeCallbacks.add(callback);
  }

  /**
   * Unregister change callback
   */
  offChange(callback: Function): void {
    this.changeCallbacks.delete(callback);
  }

  /**
   * Notify change listeners
   */
  private notifyChangeListeners(event: any): void {
    for (const callback of this.changeCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Plugin discovery callback error:', error);
      }
    }
  }

  /**
   * Get cached plugins
   */
  getCachedPlugins(): PluginMetadata[] {
    return this.cache.get('all') || [];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get plugin by name
   */
  async getPluginByName(name: string): Promise<PluginMetadata | null> {
    const plugins = await this.discoverPlugins();
    return plugins.find(plugin => plugin.manifest.name === name) || null;
  }

  /**
   * Get plugins by capability
   */
  async getPluginsByCapability(capability: string): Promise<PluginMetadata[]> {
    const plugins = await this.discoverPlugins();
    return plugins.filter(plugin => 
      plugin.manifest.capabilities.includes(capability)
    );
  }

  /**
   * Get plugins by category
   */
  async getPluginsByCategory(category: string): Promise<PluginMetadata[]> {
    const plugins = await this.discoverPlugins();
    return plugins.filter(plugin => 
      plugin.manifest.category === category
    );
  }

  /**
   * Validate plugin dependencies
   */
  async validateDependencies(plugin: PluginMetadata): Promise<{ valid: boolean; missing: string[] }> {
    const dependencies = plugin.manifest.dependencies || [];
    const missing: string[] = [];

    for (const dependency of dependencies) {
      const depPlugin = await this.getPluginByName(dependency);
      if (!depPlugin) {
        missing.push(dependency);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Get plugin statistics
   */
  async getStatistics(): Promise<{
    total: number;
    valid: number;
    invalid: number;
    categories: Record<string, number>;
    capabilities: Record<string, number>;
  }> {
    const plugins = await this.discoverPlugins();
    
    const stats = {
      total: plugins.length,
      valid: plugins.filter(p => p.isValid).length,
      invalid: plugins.filter(p => !p.isValid).length,
      categories: {} as Record<string, number>,
      capabilities: {} as Record<string, number>,
    };

    // Count categories
    for (const plugin of plugins) {
      const category = plugin.manifest.category || 'uncategorized';
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    }

    // Count capabilities
    for (const plugin of plugins) {
      for (const capability of plugin.manifest.capabilities) {
        stats.capabilities[capability] = (stats.capabilities[capability] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Export plugin registry
   */
  async exportRegistry(): Promise<string> {
    const plugins = await this.discoverPlugins();
    const registry = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      plugins: plugins.map(p => ({
        manifest: p.manifest,
        path: p.path,
        checksum: p.checksum,
        lastModified: p.lastModified,
      })),
    };

    return JSON.stringify(registry, null, 2);
  }

  /**
   * Import plugin registry
   */
  async importRegistry(registryData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const registry = JSON.parse(registryData);
      const errors: string[] = [];
      let success = 0;

      for (const pluginData of registry.plugins) {
        try {
          // Validate and import plugin
          // This would involve creating the plugin directory and manifest
          // For now, just validate the structure
          if (pluginData.manifest && pluginData.path) {
            success++;
          } else {
            errors.push(`Invalid plugin data: ${JSON.stringify(pluginData)}`);
          }
        } catch (error) {
          errors.push(`Failed to import plugin: ${error.message}`);
        }
      }

      return { success, errors };
    } catch (error) {
      return { success: 0, errors: [`Invalid registry data: ${error.message}`] };
    }
  }
}