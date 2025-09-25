import { BasePlugin } from '../../plugins/base-plugin';
import { PluginDiscoveryService } from '../discovery/PluginDiscoveryService';

// Plugin version interface
export interface PluginVersion {
  version: string;
  changelog: string;
  breakingChanges: boolean;
  dependencies: string[];
  releaseDate: Date;
  checksum: string;
  author: string;
  description: string;
}

// Rollback point interface
export interface RollbackPoint {
  version: string;
  timestamp: Date;
  description: string;
  configBackup: any;
  stateBackup: any;
}

// Plugin lifecycle event types
export enum PluginLifecycleEvent {
  INSTALLING = 'plugin:installing',
  INSTALLED = 'plugin:installed',
  UPGRADING = 'plugin:upgrading',
  UPGRADED = 'plugin:upgraded',
  DOWNGRADING = 'plugin:downgrading',
  DOWNGRADED = 'plugin:downgraded',
  UNINSTALLING = 'plugin:uninstalling',
  UNINSTALLED = 'plugin:uninstalled',
  ACTIVATING = 'plugin:activating',
  ACTIVATED = 'plugin:activated',
  DEACTIVATING = 'plugin:deactivating',
  DEACTIVATED = 'plugin:deactivated',
  STARTING = 'plugin:starting',
  STARTED = 'plugin:started',
  STOPPING = 'plugin:stopping',
  STOPPED = 'plugin:stopped',
  ERROR = 'plugin:error',
}

// Plugin lifecycle event data
export interface PluginLifecycleEventData {
  pluginName: string;
  version?: string;
  fromVersion?: string;
  toVersion?: string;
  timestamp: Date;
  error?: Error;
  metadata?: Record<string, any>;
}

// Plugin lifecycle manager options
export interface PluginLifecycleOptions {
  enableVersioning: boolean;
  enableRollback: boolean;
  enableBackup: boolean;
  maxRollbackPoints: number;
  autoMigrate: boolean;
  dependencyCheck: boolean;
}

// Default options
const defaultOptions: PluginLifecycleOptions = {
  enableVersioning: true,
  enableRollback: true,
  enableBackup: true,
  maxRollbackPoints: 5,
  autoMigrate: true,
  dependencyCheck: true,
};

// Plugin lifecycle manager
export class PluginLifecycleManager {
  private options: PluginLifecycleOptions;
  private versions: Map<string, PluginVersion[]> = new Map(); // pluginName -> versions
  private rollbackHistory: Map<string, RollbackPoint[]> = new Map(); // pluginName -> rollbackPoints
  private pluginStates: Map<string, any> = new Map(); // pluginName -> state
  private pluginConfigs: Map<string, any> = new Map(); // pluginName -> config
  private discoveryService: PluginDiscoveryService;
  private eventCallbacks: Map<string, Set<(data: PluginLifecycleEventData) => void>> = new Map();
  private pluginInstances: Map<string, BasePlugin> = new Map();

  constructor(discoveryService: PluginDiscoveryService, options: Partial<PluginLifecycleOptions> = {}) {
    this.discoveryService = discoveryService;
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Install a plugin
   */
  async installPlugin(pluginPath: string, version?: string): Promise<boolean> {
    try {
      this.emitEvent(PluginLifecycleEvent.INSTALLING, {
        pluginName: pluginPath,
        version,
        timestamp: new Date(),
      });

      // Load plugin manifest
      const manifest = await this.loadPluginManifest(pluginPath);
      if (!manifest) {
        throw new Error(`Could not load plugin manifest from ${pluginPath}`);
      }

      // Check dependencies if enabled
      if (this.options.dependencyCheck) {
        const dependenciesSatisfied = await this.checkDependencies(manifest);
        if (!dependenciesSatisfied) {
          throw new Error(`Dependency check failed for plugin ${manifest.name}`);
        }
      }

      // Register plugin version
      if (this.options.enableVersioning) {
        await this.registerPluginVersion(manifest.name, {
          version: version || manifest.version,
          changelog: '',
          breakingChanges: false,
          dependencies: manifest.dependencies || [],
          releaseDate: new Date(),
          checksum: await this.calculateChecksum(pluginPath),
          author: manifest.author,
          description: manifest.description,
        });
      }

      this.emitEvent(PluginLifecycleEvent.INSTALLED, {
        pluginName: manifest.name,
        version: version || manifest.version,
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      this.emitEvent(PluginLifecycleEvent.ERROR, {
        pluginName: pluginPath,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return false;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginName: string): Promise<boolean> {
    try {
      this.emitEvent(PluginLifecycleEvent.UNINSTALLING, {
        pluginName,
        timestamp: new Date(),
      });

      // Deactivate plugin if active
      if (await this.isPluginActive(pluginName)) {
        await this.deactivatePlugin(pluginName);
      }

      // Remove from version registry
      this.versions.delete(pluginName);

      // Remove from rollback history
      this.rollbackHistory.delete(pluginName);

      // Remove from state storage
      this.pluginStates.delete(pluginName);
      this.pluginConfigs.delete(pluginName);

      this.emitEvent(PluginLifecycleEvent.UNINSTALLED, {
        pluginName,
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      this.emitEvent(PluginLifecycleEvent.ERROR, {
        pluginName,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return false;
    }
  }

  /**
   * Upgrade a plugin to a new version
   */
  async upgradePlugin(pluginName: string, newVersion: string, pluginPath?: string): Promise<UpgradeResult> {
    try {
      // Get current version
      const currentVersion = await this.getCurrentVersion(pluginName);
      if (!currentVersion) {
        throw new Error(`Plugin ${pluginName} is not installed`);
      }

      this.emitEvent(PluginLifecycleEvent.UPGRADING, {
        pluginName,
        fromVersion: currentVersion,
        toVersion: newVersion,
        timestamp: new Date(),
      });

      // Create backup if rollback is enabled
      if (this.options.enableRollback) {
        await this.createRollbackPoint(pluginName, 'Before upgrade');
      }

      // Backup current config and state
      if (this.options.enableBackup) {
        await this.backupPluginState(pluginName);
        await this.backupPluginConfig(pluginName);
      }

      // Load and install new version
      if (pluginPath) {
        const success = await this.installPlugin(pluginPath, newVersion);
        if (!success) {
          throw new Error(`Failed to install new version of plugin ${pluginName}`);
        }
      } else {
        // Load from discovered locations
        const plugin = await this.discoveryService.getPluginByName(pluginName);
        if (!plugin) {
          throw new Error(`Plugin ${pluginName} not found in discovery`);
        }
      }

      // Perform migration if enabled
      if (this.options.autoMigrate) {
        await this.migratePlugin(pluginName, currentVersion, newVersion);
      }

      this.emitEvent(PluginLifecycleEvent.UPGRADED, {
        pluginName,
        fromVersion: currentVersion,
        toVersion: newVersion,
        timestamp: new Date(),
      });

      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: newVersion,
        migrated: true,
        backupCreated: true,
      };
    } catch (error) {
      this.emitEvent(PluginLifecycleEvent.ERROR, {
        pluginName,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: { operation: 'upgrade' },
      });
      
      return {
        success: false,
        fromVersion: await this.getCurrentVersion(pluginName),
        toVersion: newVersion,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Downgrade a plugin to a previous version
   */
  async downgradePlugin(pluginName: string, targetVersion?: string): Promise<RollbackResult> {
    try {
      const currentVersion = await this.getCurrentVersion(pluginName);
      if (!currentVersion) {
        throw new Error(`Plugin ${pluginName} is not installed`);
      }

      this.emitEvent(PluginLifecycleEvent.DOWNGRADING, {
        pluginName,
        fromVersion: currentVersion,
        toVersion: targetVersion,
        timestamp: new Date(),
      });

      // Get rollback point
      const rollbackPoint = await this.getRollbackPoint(pluginName, targetVersion);
      if (!rollbackPoint) {
        throw new Error(`No rollback point found for plugin ${pluginName}${targetVersion ? ` version ${targetVersion}` : ''}`);
      }

      // Restore state and config from backup
      if (this.options.enableBackup) {
        await this.restorePluginState(rollbackPoint);
        await this.restorePluginConfig(rollbackPoint);
      }

      this.emitEvent(PluginLifecycleEvent.DOWNGRADED, {
        pluginName,
        fromVersion: currentVersion,
        toVersion: rollbackPoint.version,
        timestamp: new Date(),
      });

      return {
        success: true,
        fromVersion: currentVersion,
        toVersion: rollbackPoint.version,
        restoredState: true,
        restoredConfig: true,
      };
    } catch (error) {
      this.emitEvent(PluginLifecycleEvent.ERROR, {
        pluginName,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: { operation: 'downgrade' },
      });
      
      return {
        success: false,
        fromVersion: await this.getCurrentVersion(pluginName),
        toVersion: targetVersion,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(pluginName: string): Promise<boolean> {
    try {
      this.emitEvent(PluginLifecycleEvent.ACTIVATING, {
        pluginName,
        timestamp: new Date(),
      });

      // Get plugin instance
      const plugin = this.pluginInstances.get(pluginName);
      if (!plugin) {
        throw new Error(`Plugin ${pluginName} instance not found`);
      }

      // Start the plugin
      await plugin.enhancedLoad();

      // Store current config and state
      await this.backupPluginConfig(pluginName);
      await this.backupPluginState(pluginName);

      this.emitEvent(PluginLifecycleEvent.ACTIVATED, {
        pluginName,
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      this.emitEvent(PluginLifecycleEvent.ERROR, {
        pluginName,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: { operation: 'activate' },
      });
      return false;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginName: string): Promise<boolean> {
    try {
      this.emitEvent(PluginLifecycleEvent.DEACTIVATING, {
        pluginName,
        timestamp: new Date(),
      });

      // Get plugin instance
      const plugin = this.pluginInstances.get(pluginName);
      if (plugin) {
        // Save state before deactivation
        await this.backupPluginState(pluginName);
        
        // Stop the plugin
        await plugin.enhancedUnload();
      }

      this.emitEvent(PluginLifecycleEvent.DEACTIVATED, {
        pluginName,
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      this.emitEvent(PluginLifecycleEvent.ERROR, {
        pluginName,
        timestamp: new Date(),
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: { operation: 'deactivate' },
      });
      return false;
    }
  }

  /**
   * Check if plugin is active
   */
  async isPluginActive(pluginName: string): Promise<boolean> {
    const plugin = this.pluginInstances.get(pluginName);
    return plugin ? plugin.isLoaded : false;
  }

  /**
   * Get plugin history
   */
  async getPluginHistory(pluginName: string): Promise<PluginHistory> {
    const versions = this.versions.get(pluginName) || [];
    const rollbackPoints = this.rollbackHistory.get(pluginName) || [];

    return {
      versions: versions.sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime()),
      rollbackPoints: rollbackPoints.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
      currentState: this.pluginStates.get(pluginName),
      currentConfig: this.pluginConfigs.get(pluginName),
    };
  }

  /**
   * Create a backup of plugin
   */
  async createBackup(pluginName: string, description?: string): Promise<BackupResult> {
    try {
      // Create rollback point
      if (this.options.enableRollback) {
        await this.createRollbackPoint(pluginName, description || 'Manual backup');
      }

      // Backup state and config
      if (this.options.enableBackup) {
        await this.backupPluginState(pluginName);
        await this.backupPluginConfig(pluginName);
      }

      return {
        success: true,
        pluginName,
        timestamp: new Date(),
        description: description || 'Manual backup',
      };
    } catch (error) {
      return {
        success: false,
        pluginName,
        timestamp: new Date(),
        description: description || 'Manual backup',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get all installed plugins with their versions
   */
  async getInstalledPlugins(): Promise<PluginVersion[]> {
    const allVersions: PluginVersion[] = [];
    
    for (const versions of this.versions.values()) {
      if (versions.length > 0) {
        // Get latest version for each plugin
        const latest = versions.reduce((latest, current) => 
          current.releaseDate > latest.releaseDate ? current : latest
        );
        allVersions.push(latest);
      }
    }
    
    return allVersions;
  }

  /**
   * Get current version of a plugin
   */
  async getCurrentVersion(pluginName: string): Promise<string | null> {
    const versions = this.versions.get(pluginName);
    if (!versions || versions.length === 0) {
      return null;
    }

    // Get the most recent version
    const latest = versions.reduce((latest, current) => 
      current.releaseDate > latest.releaseDate ? current : latest
    );
    
    return latest.version;
  }

  /**
   * Register plugin version
   */
  private async registerPluginVersion(pluginName: string, version: PluginVersion): Promise<void> {
    if (!this.versions.has(pluginName)) {
      this.versions.set(pluginName, []);
    }

    const versions = this.versions.get(pluginName)!;
    
    // Check if version already exists
    const existingIndex = versions.findIndex(v => v.version === version.version);
    if (existingIndex !== -1) {
      versions[existingIndex] = version; // Update existing
    } else {
      versions.push(version);
    }
  }

  /**
   * Create a rollback point for a plugin
   */
  private async createRollbackPoint(pluginName: string, description: string): Promise<void> {
    const plugin = this.pluginInstances.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} instance not found for rollback`);
    }

    if (!this.rollbackHistory.has(pluginName)) {
      this.rollbackHistory.set(pluginName, []);
    }

    const rollbackPoints = this.rollbackHistory.get(pluginName)!;
    
    // Create rollback point
    const rollbackPoint: RollbackPoint = {
      version: await this.getCurrentVersion(pluginName) || 'unknown',
      timestamp: new Date(),
      description,
      configBackup: this.pluginConfigs.get(pluginName),
      stateBackup: this.pluginStates.get(pluginName),
    };

    // Add to history
    rollbackPoints.push(rollbackPoint);

    // Keep only max rollback points
    if (rollbackPoints.length > this.options.maxRollbackPoints) {
      rollbackPoints.shift(); // Remove oldest
    }
  }

  /**
   * Get a specific rollback point
   */
  private async getRollbackPoint(pluginName: string, version?: string): Promise<RollbackPoint | null> {
    const rollbackPoints = this.rollbackHistory.get(pluginName) || [];
    
    if (version) {
      // Find specific version
      const point = rollbackPoints.find(rp => rp.version === version);
      return point || null;
    } else if (rollbackPoints.length > 0) {
      // Get most recent
      return rollbackPoints[rollbackPoints.length - 1];
    }

    return null;
  }

  /**
   * Backup plugin configuration
   */
  private async backupPluginConfig(pluginName: string): Promise<void> {
    const plugin = this.pluginInstances.get(pluginName);
    if (plugin) {
      this.pluginConfigs.set(pluginName, { ...plugin.config });
    }
  }

  /**
   * Restore plugin configuration
   */
  private async restorePluginConfig(rollbackPoint: RollbackPoint): Promise<void> {
    if (rollbackPoint.configBackup) {
      this.pluginConfigs.set(rollbackPoint.version, rollbackPoint.configBackup);
    }
  }

  /**
   * Backup plugin state
   */
  private async backupPluginState(pluginName: string): Promise<void> {
    const plugin = this.pluginInstances.get(pluginName);
    if (plugin) {
      // For now, we'll store a simple state snapshot
      // In a real implementation, this would capture the actual plugin state
      this.pluginStates.set(pluginName, {
        isActive: await this.isPluginActive(pluginName),
        timestamp: new Date(),
      });
    }
  }

  /**
   * Restore plugin state
   */
  private async restorePluginState(rollbackPoint: RollbackPoint): Promise<void> {
    if (rollbackPoint.stateBackup) {
      this.pluginStates.set(rollbackPoint.version, rollbackPoint.stateBackup);
    }
  }

  /**
   * Migrate plugin from one version to another
   */
  private async migratePlugin(pluginName: string, fromVersion: string, toVersion: string): Promise<void> {
    // In a real implementation, this would run migration scripts
    // For now, we'll just log the migration
    console.log(`Migrating plugin ${pluginName} from ${fromVersion} to ${toVersion}`);
  }

  /**
   * Check plugin dependencies
   */
  private async checkDependencies(manifest: any): Promise<boolean> {
    const dependencies = manifest.dependencies || [];
    
    for (const dependency of dependencies) {
      // Check if dependency is installed and satisfies version requirements
      const installedVersion = await this.getCurrentVersion(dependency);
      if (!installedVersion) {
        return false;
      }
      
      // In a real implementation, check version compatibility
      // For now, assume any installed version is compatible
    }
    
    return true;
  }

  /**
   * Load plugin manifest from path
   */
  private async loadPluginManifest(pluginPath: string): Promise<any> {
    // In a real implementation, this would load the plugin manifest
    // For now, we'll simulate loading from a JSON file in the plugin directory
    try {
      // This is a simplified implementation - in reality would need to properly load the manifest
      // Return a mock manifest for testing purposes
      return {
        name: pluginPath.split('/').pop() || pluginPath,
        version: '1.0.0',
        description: 'Mock plugin for testing',
        author: 'Test Author',
        dependencies: []
      };
    } catch (error) {
      console.error(`Failed to load plugin manifest from ${pluginPath}:`, error);
      return null;
    }
  }

  /**
   * Calculate checksum for a plugin
   */
  private async calculateChecksum(pluginPath: string): Promise<string> {
    // In a real implementation, this would calculate a proper checksum
    // For now, return a mock checksum
    return `checksum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event handling
   */
  on(event: PluginLifecycleEvent, callback: (data: PluginLifecycleEventData) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);
  }

  off(event: PluginLifecycleEvent, callback: (data: PluginLifecycleEventData) => void): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emitEvent(event: PluginLifecycleEvent, data: PluginLifecycleEventData): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Plugin lifecycle event callback error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Register a plugin instance
   */
  registerPluginInstance(plugin: BasePlugin): void {
    this.pluginInstances.set(plugin.config.name, plugin);
  }

  /**
   * Unregister a plugin instance
   */
  unregisterPluginInstance(pluginName: string): void {
    this.pluginInstances.delete(pluginName);
  }

  /**
   * Get lifecycle statistics
   */
  getStatistics(): {
    installedPlugins: number;
    totalVersions: number;
    rollbackPoints: number;
    activePlugins: number;
  } {
    return {
      installedPlugins: this.versions.size,
      totalVersions: Array.from(this.versions.values()).reduce((sum, versions) => sum + versions.length, 0),
      rollbackPoints: Array.from(this.rollbackHistory.values()).reduce((sum, points) => sum + points.length, 0),
      activePlugins: Array.from(this.pluginInstances.values()).filter(p => p.isLoaded).length,
    };
  }

  /**
   * Get plugin upgrade compatibility
   */
  async getUpgradeCompatibility(pluginName: string, targetVersion: string): Promise<{
    compatible: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Get current version
    const currentVersion = await this.getCurrentVersion(pluginName);
    if (!currentVersion) {
      issues.push(`Plugin ${pluginName} is not currently installed`);
      return { compatible: false, issues, warnings };
    }

    // Check if target version is newer than current
    const currentVersionNum = this.versionToNumber(currentVersion);
    const targetVersionNum = this.versionToNumber(targetVersion);

    if (targetVersionNum <= currentVersionNum) {
      issues.push(`Target version ${targetVersion} is not newer than current version ${currentVersion}`);
    }

    // In a real implementation, check for breaking changes
    // For now, just return results
    return {
      compatible: issues.length === 0,
      issues,
      warnings,
    };
  }

  /**
   * Convert version string to number for comparison
   */
  private versionToNumber(version: string): number {
    // Convert semantic version to a comparable number
    // For example: "1.2.3" becomes 1002003
    const parts = version.split('.').map(Number);
    return parts[0] * 1000000 + (parts[1] || 0) * 1000 + (parts[2] || 0);
  }
}

// Result interfaces
export interface UpgradeResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  migrated?: boolean;
  backupCreated?: boolean;
  error?: string;
}

export interface RollbackResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  restoredState?: boolean;
  restoredConfig?: boolean;
  error?: string;
}

export interface BackupResult {
  success: boolean;
  pluginName: string;
  timestamp: Date;
  description: string;
  error?: string;
}

export interface PluginHistory {
  versions: PluginVersion[];
  rollbackPoints: RollbackPoint[];
  currentState: any;
  currentConfig: any;
}