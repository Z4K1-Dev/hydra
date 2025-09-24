import { PluginEvent } from './types';

export class PluginEventEmitter {
  private listeners: Map<string, ((data?: any) => any)[]> = new Map();
  private onceListeners: Map<string, ((data?: any) => any)[]> = new Map();
  private eventHistory: PluginEvent[] = [];
  private anyListeners: ((event: PluginEvent) => any)[] = [];
  private eventsEmittedCount: number = 0;
  
  constructor(private maxHistory: number = 1000) {}
  
  /**
   * Register event listener
   */
  on(event: string, callback: (data?: any) => any): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    
    if (this.isDebugMode()) {
      console.log(`[EventEmitter] 🎧 Listener registered for event: ${event}`);
    }
  }
  
  /**
   * Register one-time event listener
   */
  once(event: string, callback: (data?: any) => any): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, []);
    }
    this.onceListeners.get(event)!.push(callback);
    
    if (this.isDebugMode()) {
      console.log(`[EventEmitter] ⚡ Once listener registered for event: ${event}`);
    }
  }
  
  /**
   * Register listener for any event
   */
  onAny(callback: (event: PluginEvent) => any): void {
    this.anyListeners.push(callback);
    
    if (this.isDebugMode()) {
      console.log(`[EventEmitter] 🌟 Any listener registered`);
    }
  }
  
  /**
   * Remove event listener
   */
  off(event: string, callback: (data?: any) => any): void {
    // Remove from regular listeners
    const regularListeners = this.listeners.get(event);
    if (regularListeners) {
      const index = regularListeners.indexOf(callback);
      if (index > -1) {
        regularListeners.splice(index, 1);
      }
    }
    
    // Remove from once listeners
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      const index = onceListeners.indexOf(callback);
      if (index > -1) {
        onceListeners.splice(index, 1);
      }
    }
    
    // Remove from any listeners
    const anyIndex = this.anyListeners.indexOf(callback);
    if (anyIndex > -1) {
      this.anyListeners.splice(anyIndex, 1);
    }
    
    if (this.isDebugMode()) {
      console.log(`[EventEmitter] ❌ Listener removed for event: ${event}`);
    }
  }
  
  /**
   * Emit event to all listeners
   */
  emit(event: string, data?: any): any[] {
    const startTime = performance.now();
    const pluginEvent: PluginEvent = {
      type: event,
      data,
      timestamp: Date.now(),
      source: 'system'
    };
    
    // Add to history
    this.eventHistory.push(pluginEvent);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }
    
    this.eventsEmittedCount++;
    
    const results: any[] = [];
    
    // Execute any listeners first
    for (const callback of this.anyListeners) {
      try {
        const result = callback(pluginEvent);
        results.push(result);
      } catch (error) {
        console.error(`[EventEmitter] 💥 Error in any listener for event ${event}:`, error);
      }
    }
    
    // Execute regular listeners
    const regularListeners = this.listeners.get(event) || [];
    for (const callback of regularListeners) {
      try {
        const result = callback(data);
        results.push(result);
      } catch (error) {
        console.error(`[EventEmitter] 💥 Error in listener for event ${event}:`, error);
      }
    }
    
    // Execute once listeners
    const onceListeners = this.onceListeners.get(event) || [];
    for (const callback of onceListeners) {
      try {
        const result = callback(data);
        results.push(result);
      } catch (error) {
        console.error(`[EventEmitter] 💥 Error in once listener for event ${event}:`, error);
      }
    }
    
    // Clear once listeners
    this.onceListeners.delete(event);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    if (this.isDebugMode()) {
      console.log(`[EventEmitter] 📤 Event emitted: ${event} (${executionTime.toFixed(2)}ms)`);
    }
    
    return results;
  }
  
  /**
   * Get event history
   */
  getEventHistory(): PluginEvent[] {
    return [...this.eventHistory];
  }
  
  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    
    if (this.isDebugMode()) {
      console.log(`[EventEmitter] 🧹 Event history cleared`);
    }
  }
  
  /**
   * Get listener count for specific event
   */
  getListenerCount(event: string): number {
    const regularCount = this.listeners.get(event)?.length || 0;
    const onceCount = this.onceListeners.get(event)?.length || 0;
    return regularCount + onceCount;
  }
  
  /**
   * Get total listener count
   */
  getTotalListenerCount(): number {
    let total = 0;
    
    for (const listeners of this.listeners.values()) {
      total += listeners.length;
    }
    
    for (const listeners of this.onceListeners.values()) {
      total += listeners.length;
    }
    
    total += this.anyListeners.length;
    
    return total;
  }
  
  /**
   * Get all registered events
   */
  getRegisteredEvents(): string[] {
    const events = new Set<string>();
    
    for (const event of this.listeners.keys()) {
      events.add(event);
    }
    
    for (const event of this.onceListeners.keys()) {
      events.add(event);
    }
    
    return Array.from(events);
  }
  
  /**
   * Get system status
   */
  getStatus() {
    return {
      listenersCount: this.getTotalListenerCount(),
      eventsEmitted: this.eventsEmittedCount,
      eventHistorySize: this.eventHistory.length,
      registeredEvents: this.getRegisteredEvents().length
    };
  }
  
  /**
   * Reset emitter (for testing)
   */
  reset(): void {
    this.listeners.clear();
    this.onceListeners.clear();
    this.anyListeners = [];
    this.eventHistory = [];
    this.eventsEmittedCount = 0;
    
    if (this.isDebugMode()) {
      console.log(`[EventEmitter] 🔄 Emitter reset`);
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