// Core components
export { PluginEventEmitter } from './EventEmitter';
export { HookManager } from './HookManager';
export { PluginRegistry } from './PluginRegistry';
export { HybridPluginManager } from './HybridPluginManager';

// Factory functions
export { HybridSystemFactory, getGlobalHybridManager, resetGlobalHybridManager } from './factory';

// Types
export type {
  PluginEvent,
  HookCallback,
  PluginMetadata,
  HybridSystemStatus,
  SystemConfig
} from './types';

// Re-export BasePlugin for convenience
export { BasePlugin, PluginConfig, PluginSettings } from '../../plugins/base-plugin';

// Version
export const HYBRID_SYSTEM_VERSION = '1.0.0';