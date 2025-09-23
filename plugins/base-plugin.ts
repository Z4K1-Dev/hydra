export interface PluginConfig {
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  settings?: Record<string, any>;
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

// Plugin Event Emitter
export class PluginEventEmitter {
  private events: Map<string, ((...args: any[]) => void)[]> = new Map();
  
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }
  
  off(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
  
  getEvents(): string[] {
    return Array.from(this.events.keys());
  }
  
  clearEvents(): void {
    this.events.clear();
  }
}

// Hook Manager
export class HookManager {
  private hooks: Map<string, ((...args: any[]) => any)[]> = new Map();
  
  addHook(hookName: string, callback: (...args: any[]) => any): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName)!.push(callback);
  }
  
  removeHook(hookName: string, callback: (...args: any[]) => any): void {
    const hooks = this.hooks.get(hookName);
    if (hooks) {
      const index = hooks.indexOf(callback);
      if (index > -1) {
        hooks.splice(index, 1);
      }
    }
  }
  
  executeHook(hookName: string, ...args: any[]): any[] {
    const hooks = this.hooks.get(hookName);
    if (!hooks) return [];
    
    return hooks.map(hook => {
      try {
        return hook(...args);
      } catch (error) {
        console.error(`Error executing hook ${hookName}:`, error);
        return null;
      }
    }).filter(result => result !== null);
  }
  
  getHooks(): string[] {
    return Array.from(this.hooks.keys());
  }
  
  clearHooks(): void {
    this.hooks.clear();
  }
}

// Plugin Registry
export class PluginRegistry {
  private plugins: Map<string, typeof BasePlugin> = new Map();
  private instances: Map<string, BasePlugin> = new Map();
  
  register(name: string, pluginClass: typeof BasePlugin): void {
    this.plugins.set(name, pluginClass);
    console.log(`Plugin ${name} registered`);
  }
  
  unregister(name: string): void {
    this.plugins.delete(name);
    this.instances.delete(name);
    console.log(`Plugin ${name} unregistered`);
  }
  
  get(name: string): typeof BasePlugin | undefined {
    return this.plugins.get(name);
  }
  
  getAll(): string[] {
    return Array.from(this.plugins.keys());
  }
  
  createInstance(name: string, config: PluginConfig): BasePlugin | undefined {
    const PluginClass = this.plugins.get(name);
    if (!PluginClass) return undefined;
    
    const instance = new PluginClass(config);
    this.instances.set(name, instance);
    return instance;
  }
  
  getInstance(name: string): BasePlugin | undefined {
    return this.instances.get(name);
  }
  
  isRegistered(name: string): boolean {
    return this.plugins.has(name);
  }
}

// Hybrid Plugin Manager
export class HybridPluginManager {
  private registry: PluginRegistry;
  private eventEmitter: PluginEventEmitter;
  private hookManager: HookManager;
  
  constructor() {
    this.registry = new PluginRegistry();
    this.eventEmitter = new PluginEventEmitter();
    this.hookManager = new HookManager();
  }
  
  registerPlugin(name: string, pluginClass: typeof BasePlugin): void {
    this.registry.register(name, pluginClass);
  }
  
  async loadPlugin(name: string, config: PluginConfig): Promise<void> {
    const instance = this.registry.createInstance(name, config);
    if (!instance) {
      console.error(`Plugin ${name} not found`);
      return;
    }
    
    await instance.load();
    this.eventEmitter.emit('pluginLoaded', name);
  }
  
  async unloadPlugin(name: string): Promise<void> {
    const instance = this.registry.getInstance(name);
    if (!instance) return;
    
    await instance.unload();
    this.eventEmitter.emit('pluginUnloaded', name);
  }
  
  getEventEmitter(): PluginEventEmitter {
    return this.eventEmitter;
  }
  
  getHookManager(): HookManager {
    return this.hookManager;
  }
  
  getRegistry(): PluginRegistry {
    return this.registry;
  }
}

// Plugin Manager Singleton
export class PluginManager {
  private static instance: PluginManager;
  private hybridManager: HybridPluginManager;
  private pluginConfigs: Map<string, PluginConfig> = new Map();
  
  private constructor() {
    this.hybridManager = new HybridPluginManager();
  }
  
  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }
  
  registerPlugin(name: string, pluginClass: typeof BasePlugin): void {
    this.hybridManager.registerPlugin(name, pluginClass);
  }
  
  async loadPlugin(name: string, config: PluginConfig): Promise<void> {
    this.pluginConfigs.set(name, config);
    await this.hybridManager.loadPlugin(name, config);
  }
  
  async unloadPlugin(name: string): Promise<void> {
    await this.hybridManager.unloadPlugin(name);
    this.pluginConfigs.delete(name);
  }
  
  getEventEmitter(): PluginEventEmitter {
    return this.hybridManager.getEventEmitter();
  }
  
  getHookManager(): HookManager {
    return this.hybridManager.getHookManager();
  }
  
  getPluginConfig(name: string): PluginConfig | undefined {
    return this.pluginConfigs.get(name);
  }
}

export const pluginManager = PluginManager.getInstance();

// Base Plugin Class
export abstract class BasePlugin {
  public config: PluginConfig;
  public isLoaded: boolean = false;
  
  constructor(config: PluginConfig) {
    this.config = config;
  }
  
  abstract load(): Promise<void>;
  abstract unload(): Promise<void>;
  
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
    
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  }
  
  protected injectStructuredData(data: any): void {
    if (typeof window === 'undefined') return;
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }
  
  protected getEventEmitter(): PluginEventEmitter {
    return pluginManager.getEventEmitter();
  }
  
  protected getHookManager(): HookManager {
    return pluginManager.getHookManager();
  }
}