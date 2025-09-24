import { PluginMetadata } from './types';
import { BasePlugin } from '../../plugins/base-plugin';

export class PluginRegistry {
  private plugins: Map<string, PluginMetadata> = new Map();
  private instances: Map<string, BasePlugin> = new Map();
  private dependencyGraph: Map<string, string[]> = new Map();
  private reverseDependencyGraph: Map<string, string[]> = new Map();
  private activationOrder: string[] = [];
  
  /**
   * Register plugin with metadata
   */
  register(plugin: BasePlugin, metadata: PluginMetadata): void {
    const { name } = metadata;
    
    // Validate plugin name
    if (!name || typeof name !== 'string') {
      throw new Error(`Plugin name is required and must be a string`);
    }
    
    // Check if plugin already registered
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} is already registered`);
    }
    
    // Validate dependencies
    if (metadata.dependencies) {
      for (const dep of metadata.dependencies) {
        if (!this.plugins.has(dep)) {
          console.warn(`[PluginRegistry] ⚠️ Plugin ${name} depends on ${dep} which is not registered`);
        }
      }
    }
    
    // Register plugin
    this.plugins.set(name, metadata);
    this.instances.set(name, plugin);
    
    // Build dependency graph
    this.dependencyGraph.set(name, metadata.dependencies || []);
    
    // Build reverse dependency graph
    for (const dep of metadata.dependencies || []) {
      if (!this.reverseDependencyGraph.has(dep)) {
        this.reverseDependencyGraph.set(dep, []);
      }
      this.reverseDependencyGraph.get(dep)!.push(name);
    }
    
    if (this.isDebugMode()) {
      console.log(`[PluginRegistry] 📝 Plugin registered: ${name} v${metadata.version}`);
      if (metadata.dependencies && metadata.dependencies.length > 0) {
        console.log(`[PluginRegistry] 🔗 Dependencies: ${metadata.dependencies.join(', ')}`);
      }
    }
  }
  
  /**
   * Unregister plugin
   */
  unregister(pluginName: string): void {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }
    
    // Check if plugin has dependents
    const dependents = this.reverseDependencyGraph.get(pluginName) || [];
    if (dependents.length > 0) {
      throw new Error(`Cannot unregister plugin ${pluginName}. It has dependents: ${dependents.join(', ')}`);
    }
    
    // Remove from registries
    this.plugins.delete(pluginName);
    this.instances.delete(pluginName);
    this.dependencyGraph.delete(pluginName);
    this.reverseDependencyGraph.delete(pluginName);
    
    // Remove from activation order
    const index = this.activationOrder.indexOf(pluginName);
    if (index > -1) {
      this.activationOrder.splice(index, 1);
    }
    
    if (this.isDebugMode()) {
      console.log(`[PluginRegistry] 🗑️ Plugin unregistered: ${pluginName}`);
    }
  }
  
  /**
   * Resolve plugin dependencies
   */
  resolveDependencies(pluginName: string): string[] {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }
    
    const visited = new Set<string>();
    const resolved: string[] = [];
    
    const visit = (name: string): void => {
      if (visited.has(name)) {
        if (resolved.includes(name)) {
          return; // Already resolved
        }
        throw new Error(`Circular dependency detected involving plugin ${name}`);
      }
      
      visited.add(name);
      
      const dependencies = this.dependencyGraph.get(name) || [];
      for (const dep of dependencies) {
        visit(dep);
      }
      
      if (!resolved.includes(name)) {
        resolved.push(name);
      }
    };
    
    try {
      visit(pluginName);
      return resolved;
    } catch (error) {
      console.error(`[PluginRegistry] 💥 Dependency resolution failed for ${pluginName}:`, error);
      throw error;
    }
  }
  
  /**
   * Validate all dependencies
   */
  validateDependencies(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for missing dependencies
    for (const [pluginName, metadata] of this.plugins.entries()) {
      for (const dep of metadata.dependencies || []) {
        if (!this.plugins.has(dep)) {
          issues.push(`Plugin ${pluginName} depends on missing plugin ${dep}`);
        }
      }
    }
    
    // Check for circular dependencies
    try {
      for (const pluginName of this.plugins.keys()) {
        this.resolveDependencies(pluginName);
      }
    } catch (error) {
      issues.push(`Circular dependency detected: ${error.message}`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Get plugin by name
   */
  getPlugin(name: string): BasePlugin | undefined {
    return this.instances.get(name);
  }
  
  /**
   * Get plugin metadata
   */
  getPluginMetadata(name: string): PluginMetadata | undefined {
    return this.plugins.get(name);
  }
  
  /**
   * Get plugins by capability
   */
  getPluginsByCapability(capability: string): BasePlugin[] {
    const result: BasePlugin[] = [];
    
    for (const [name, metadata] of this.plugins.entries()) {
      if (metadata.capabilities && metadata.capabilities.includes(capability)) {
        const plugin = this.instances.get(name);
        if (plugin) {
          result.push(plugin);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get all plugins
   */
  getAllPlugins(): BasePlugin[] {
    return Array.from(this.instances.values());
  }
  
  /**
   * Get all plugin metadata
   */
  getAllPluginMetadata(): PluginMetadata[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get plugin names
   */
  getPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }
  
  /**
   * Check if plugin is registered
   */
  isRegistered(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }
  
  /**
   * Check if plugin is active
   */
  isActive(pluginName: string): boolean {
    return this.activationOrder.includes(pluginName);
  }
  
  /**
   * Get activation order
   */
  getActivationOrder(): string[] {
    return [...this.activationOrder];
  }
  
  /**
   * Get dependents of a plugin
   */
  getDependents(pluginName: string): string[] {
    return this.reverseDependencyGraph.get(pluginName) || [];
  }
  
  /**
   * Get dependencies of a plugin
   */
  getDependencies(pluginName: string): string[] {
    return this.dependencyGraph.get(pluginName) || [];
  }
  
  /**
   * Calculate optimal activation order
   */
  calculateActivationOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];
    
    const visit = (pluginName: string): void => {
      if (visited.has(pluginName)) {
        return;
      }
      
      if (visiting.has(pluginName)) {
        throw new Error(`Circular dependency detected: ${pluginName}`);
      }
      
      visiting.add(pluginName);
      
      const dependencies = this.dependencyGraph.get(pluginName) || [];
      for (const dep of dependencies) {
        visit(dep);
      }
      
      visiting.delete(pluginName);
      visited.add(pluginName);
      
      if (!order.includes(pluginName)) {
        order.push(pluginName);
      }
    };
    
    try {
      for (const pluginName of this.plugins.keys()) {
        visit(pluginName);
      }
      
      return order;
    } catch (error) {
      console.error(`[PluginRegistry] 💥 Failed to calculate activation order:`, error);
      throw error;
    }
  }
  
  /**
   * Get system status
   */
  getStatus() {
    const validation = this.validateDependencies();
    
    return {
      registeredPlugins: this.plugins.size,
      activePlugins: this.activationOrder.length,
      dependencyIssues: validation.issues,
      capabilities: this.getAvailableCapabilities(),
      activationOrder: this.activationOrder
    };
  }
  
  /**
   * Get available capabilities
   */
  private getAvailableCapabilities(): string[] {
    const capabilities = new Set<string>();
    
    for (const metadata of this.plugins.values()) {
      if (metadata.capabilities) {
        for (const capability of metadata.capabilities) {
          capabilities.add(capability);
        }
      }
    }
    
    return Array.from(capabilities);
  }
  
  /**
   * Reset registry (for testing)
   */
  reset(): void {
    this.plugins.clear();
    this.instances.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();
    this.activationOrder = [];
    
    if (this.isDebugMode()) {
      console.log(`[PluginRegistry] 🔄 Registry reset`);
    }
  }
  
  /**
   * Check if debug mode is enabled
   */
  private isDebugMode(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.HYBRID_DEBUG === 'true';
  }
}