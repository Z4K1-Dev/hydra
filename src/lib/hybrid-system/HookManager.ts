import { HookCallback } from './types';

export class HookManager {
  private hooks: Map<string, HookCallback[]> = new Map();
  private hookExecutionTimes: Map<string, number[]> = new Map();
  
  /**
   * Add filter hook (transforms data)
   */
  addFilter(
    hookName: string, 
    callback: (...args: any[]) => any, 
    priority: number = 10,
    pluginName: string = 'unknown'
  ): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    
    const hookCallbacks = this.hooks.get(hookName)!;
    const hookCallback: HookCallback = {
      callback,
      priority,
      pluginName
    };
    
    // Insert in priority order (lower number = higher priority)
    let insertIndex = 0;
    for (let i = 0; i < hookCallbacks.length; i++) {
      if (hookCallbacks[i].priority > priority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }
    
    hookCallbacks.splice(insertIndex, 0, hookCallback);
    
    if (this.isDebugMode()) {
      console.log(`[HookManager] 🔧 Filter added to hook: ${hookName} (priority: ${priority}, plugin: ${pluginName})`);
    }
  }
  
  /**
   * Add action hook (executes function)
   */
  addAction(
    hookName: string, 
    callback: (...args: any[]) => any, 
    priority: number = 10,
    pluginName: string = 'unknown'
  ): void {
    // Actions use the same mechanism as filters
    this.addFilter(hookName, callback, priority, pluginName);
    
    if (this.isDebugMode()) {
      console.log(`[HookManager] ⚡ Action added to hook: ${hookName} (priority: ${priority}, plugin: ${pluginName})`);
    }
  }
  
  /**
   * Apply filters to value (transform data through hook chain)
   */
  applyFilters(hookName: string, value: any, ...args: any[]): any {
    const startTime = performance.now();
    
    const hookCallbacks = this.hooks.get(hookName) || [];
    
    if (hookCallbacks.length === 0) {
      return value;
    }
    
    let result = value;
    
    for (const hookCallback of hookCallbacks) {
      try {
        const hookStartTime = performance.now();
        
        result = hookCallback.callback(result, ...args);
        
        const hookEndTime = performance.now();
        const hookExecutionTime = hookEndTime - hookStartTime;
        
        // Track execution time
        if (!this.hookExecutionTimes.has(hookName)) {
          this.hookExecutionTimes.set(hookName, []);
        }
        this.hookExecutionTimes.get(hookName)!.push(hookExecutionTime);
        
        if (this.isDebugMode()) {
          console.log(`[HookManager] ✅ Filter ${hookName} executed by ${hookCallback.pluginName} (${hookExecutionTime.toFixed(2)}ms)`);
        }
      } catch (error) {
        console.error(`[HookManager] 💥 Error in filter ${hookName} for plugin ${hookCallback.pluginName}:`, error);
        
        // Continue with next hook even if current one fails
        continue;
      }
    }
    
    const endTime = performance.now();
    const totalExecutionTime = endTime - startTime;
    
    if (this.isDebugMode()) {
      console.log(`[HookManager] 🎯 Applied ${hookCallbacks.length} filters to ${hookName} (${totalExecutionTime.toFixed(2)}ms)`);
    }
    
    return result;
  }
  
  /**
   * Execute action hooks (no return value)
   */
  doAction(hookName: string, ...args: any[]): void {
    const startTime = performance.now();
    
    const hookCallbacks = this.hooks.get(hookName) || [];
    
    if (hookCallbacks.length === 0) {
      return;
    }
    
    for (const hookCallback of hookCallbacks) {
      try {
        const hookStartTime = performance.now();
        
        hookCallback.callback(...args);
        
        const hookEndTime = performance.now();
        const hookExecutionTime = hookEndTime - hookStartTime;
        
        // Track execution time
        if (!this.hookExecutionTimes.has(hookName)) {
          this.hookExecutionTimes.set(hookName, []);
        }
        this.hookExecutionTimes.get(hookName)!.push(hookExecutionTime);
        
        if (this.isDebugMode()) {
          console.log(`[HookManager] ⚡ Action ${hookName} executed by ${hookCallback.pluginName} (${hookExecutionTime.toFixed(2)}ms)`);
        }
      } catch (error) {
        console.error(`[HookManager] 💥 Error in action ${hookName} for plugin ${hookCallback.pluginName}:`, error);
        
        // Continue with next hook even if current one fails
        continue;
      }
    }
    
    const endTime = performance.now();
    const totalExecutionTime = endTime - startTime;
    
    if (this.isDebugMode()) {
      console.log(`[HookManager] 🎯 Executed ${hookCallbacks.length} actions for ${hookName} (${totalExecutionTime.toFixed(2)}ms)`);
    }
  }
  
  /**
   * Remove specific hook
   */
  removeHook(hookName: string, callback: (...args: any[]) => any): void {
    const hookCallbacks = this.hooks.get(hookName);
    if (hookCallbacks) {
      const index = hookCallbacks.findIndex(hc => hc.callback === callback);
      if (index > -1) {
        hookCallbacks.splice(index, 1);
        
        if (this.isDebugMode()) {
          console.log(`[HookManager] ❌ Hook removed from ${hookName}`);
        }
      }
    }
  }
  
  /**
   * Remove all hooks for specific plugin
   */
  removePluginHooks(pluginName: string): void {
    for (const [hookName, hookCallbacks] of this.hooks.entries()) {
      const initialLength = hookCallbacks.length;
      
      // Remove all hooks for this plugin
      const filteredCallbacks = hookCallbacks.filter(hc => hc.pluginName !== pluginName);
      
      if (filteredCallbacks.length !== initialLength) {
        this.hooks.set(hookName, filteredCallbacks);
        
        if (this.isDebugMode()) {
          console.log(`[HookManager] 🧹 Removed ${initialLength - filteredCallbacks.length} hooks for plugin ${pluginName} from ${hookName}`);
        }
      }
    }
  }
  
  /**
   * Check if hook exists
   */
  hasHook(hookName: string): boolean {
    const hookCallbacks = this.hooks.get(hookName);
    return hookCallbacks ? hookCallbacks.length > 0 : false;
  }
  
  /**
   * Get hooks for specific hook name
   */
  getHooks(hookName: string): HookCallback[] {
    return this.hooks.get(hookName) || [];
  }
  
  /**
   * Get all hooks
   */
  getAllHooks(): Map<string, HookCallback[]> {
    return new Map(this.hooks);
  }
  
  /**
   * Get hook names
   */
  getHookNames(): string[] {
    return Array.from(this.hooks.keys());
  }
  
  /**
   * Get average execution time for hook
   */
  getAverageExecutionTime(hookName: string): number {
    const times = this.hookExecutionTimes.get(hookName);
    if (!times || times.length === 0) {
      return 0;
    }
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }
  
  /**
   * Get system status
   */
  getStatus() {
    let filtersCount = 0;
    let actionsCount = 0;
    
    for (const [hookName, hookCallbacks] of this.hooks.entries()) {
      // Simple heuristic: if hook name contains 'filter' or starts with a noun, it's probably a filter
      if (hookName.includes('filter') || /^[a-z_]+$/.test(hookName)) {
        filtersCount += hookCallbacks.length;
      } else {
        actionsCount += hookCallbacks.length;
      }
    }
    
    return {
      hooksCount: this.hooks.size,
      filtersCount,
      actionsCount,
      averageExecutionTime: this.getOverallAverageExecutionTime()
    };
  }
  
  /**
   * Get overall average execution time
   */
  private getOverallAverageExecutionTime(): number {
    const allTimes: number[] = [];
    
    for (const times of this.hookExecutionTimes.values()) {
      allTimes.push(...times);
    }
    
    if (allTimes.length === 0) {
      return 0;
    }
    
    const sum = allTimes.reduce((acc, time) => acc + time, 0);
    return sum / allTimes.length;
  }
  
  /**
   * Clear all hooks (for testing)
   */
  reset(): void {
    this.hooks.clear();
    this.hookExecutionTimes.clear();
    
    if (this.isDebugMode()) {
      console.log(`[HookManager] 🔄 Hook manager reset`);
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