// Core types for Hybrid System
export interface PluginEvent {
  type: string;
  data?: any;
  timestamp: number;
  source: string;
}

export interface HookCallback {
  callback: (...args: any[]) => any;
  priority: number;
  pluginName: string;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  capabilities: string[];
  settings: any;
}

export interface HybridSystemStatus {
  eventEmitter: {
    listenersCount: number;
    eventsEmitted: number;
    eventHistorySize: number;
  };
  hookManager: {
    hooksCount: number;
    filtersCount: number;
    actionsCount: number;
  };
  registry: {
    registeredPlugins: number;
    activePlugins: number;
    dependencyIssues: string[];
  };
  performance: {
    memoryUsage: number;
    averageEventTime: number;
    averageHookTime: number;
  };
}

export interface SystemConfig {
  maxEventHistory: number;
  maxHookCacheSize: number;
  cleanupInterval: number;
  enableDebugMode: boolean;
  enablePerformanceMonitoring: boolean;
}