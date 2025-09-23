import { PluginEventEmitter } from './EventEmitter';
import { HookManager } from './HookManager';
import { PluginRegistry } from './PluginRegistry';
import { HybridPluginManager } from './HybridPluginManager';
import { SystemConfig } from './types';

/**
 * Factory for creating hybrid system components
 */
export class HybridSystemFactory {
  /**
   * Create complete hybrid system with default configuration
   */
  static create(config?: Partial<SystemConfig>): HybridPluginManager {
    const eventEmitter = new PluginEventEmitter(config?.maxEventHistory);
    const hookManager = new HookManager();
    const registry = new PluginRegistry();
    
    return new HybridPluginManager(
      eventEmitter,
      hookManager,
      registry,
      config
    );
  }
  
  /**
   * Create individual components
   */
  static createEventEmitter(maxHistory?: number): PluginEventEmitter {
    return new PluginEventEmitter(maxHistory);
  }
  
  static createHookManager(): HookManager {
    return new HookManager();
  }
  
  static createRegistry(): PluginRegistry {
    return new PluginRegistry();
  }
  
  /**
   * Create system with custom components
   */
  static createWithComponents(
    eventEmitter: PluginEventEmitter,
    hookManager: HookManager,
    registry: PluginRegistry,
    config?: Partial<SystemConfig>
  ): HybridPluginManager {
    return new HybridPluginManager(
      eventEmitter,
      hookManager,
      registry,
      config
    );
  }
}

/**
 * Singleton instance for global access
 */
let globalHybridManager: HybridPluginManager | null = null;

/**
 * Get or create global hybrid manager instance
 */
export function getGlobalHybridManager(config?: Partial<SystemConfig>): HybridPluginManager {
  if (!globalHybridManager) {
    globalHybridManager = HybridSystemFactory.create(config);
  }
  
  return globalHybridManager;
}

/**
 * Reset global instance (for testing)
 */
export function resetGlobalHybridManager(): void {
  globalHybridManager = null;
}