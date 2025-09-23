# Hybrid Architecture Migration Guide
## Dari Simple Plugin System ke Event-Driven Hook Architecture

**Ditulis oleh: AI Assistant untuk Diri Sendiri di Masa Depan**  
**Tanggal: 2025-06-18**  
**Version: 1.0.0**

---

## 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Target Hybrid Architecture](#target-hybrid-architecture)
4. [Migration Strategy](#migration-strategy)
5. [Implementation Plan](#implementation-plan)
6. [Code Examples](#code-examples)
7. [Testing Strategy](#testing-strategy)
8. [Rollback Plan](#rollback-plan)
9. [Performance Considerations](#performance-considerations)
10. [Future Extensions](#future-extensions)

---

## 🎯 Executive Summary

### Why This Migration?

**Hai Masa Depan!** Ingat ketika kita memutuskan untuk migrasi dari simple plugin system ke hybrid architecture? Ini bukanlah keputusan yang dibuat secara sembarangan. Berikut alasan-alasan strategisnya:

1. **Scalability Issues**: Plugin system lama tidak bisa scale untuk multi-tenant SaaS architecture
2. **Plugin Coupling**: Plugin terlalu tightly coupled, sulit untuk maintenance
3. **Event-Driven Nature**: SEO operations本质上 adalah event-driven, bukan procedural
4. **WordPress-like Flexibility**: Kita ingin fleksibilitas WordPress tapi tanpa copy-paste code mereka
5. **Type Safety**: TypeScript support yang lebih baik untuk plugin development

### What We're Building

Kita membangun **Hybrid Event-Driven Hook Architecture** yang menggabungkan:
- **Event Emitters** untuk cross-plugin communication dan async operations
- **Hook System** untuk content transformation dan sequential processing
- **Plugin Registry** untuk dependency injection dan lifecycle management

---

## 🔍 Current Architecture Analysis

### What We Have Now (June 2025)

#### Plugin Structure
```typescript
// Current simple plugin system
export abstract class BasePlugin {
  public config: PluginConfig;
  public isLoaded: boolean = false;
  
  abstract load(): Promise<void>;
  abstract unload(): Promise<void>;
  
  // Direct method calls - NO event system
  protected injectScript(src: string): Promise<void> { /* ... */ }
  protected injectMetaTag(name: string, content: string): void { /* ... */ }
}
```

#### Current Problems
1. **No Event System**: Plugin communicate via direct method calls
2. **No Hook System**: Content transformation must be done manually
3. **Tight Coupling**: Plugin know about each other's existence
4. **Limited Extensibility**: Sulit menambahkan plugin baru tanpa modify existing code
5. **No Priority System**: Tidak ada cara untuk mengatur urutan execution

#### Current Plugin Examples

**Google Analytics Plugin**:
```typescript
// Problem: Direct method calls, no event integration
export class GoogleAnalyticsPlugin extends BasePlugin {
  trackEvent(eventName: string, eventParams?: Record<string, any>): void {
    // Direct call - no event system
    if (typeof window === 'undefined' || !this.isLoaded) return;
    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', eventName, eventParams);
    }
  }
}
```

**SEO Tools Plugin**:
```typescript
// Problem: Manual meta tag injection, no content transformation
export class SEOToolsPlugin extends BasePlugin {
  updateTitle(title: string): void {
    // Direct DOM manipulation - no hook system
    if (typeof window === 'undefined' || !this.isLoaded) return;
    document.title = title;
    this.injectMetaTag('og:title', title);
  }
}
```

### Why Current Architecture Fails for SaaS

1. **Multi-Tenant Issues**: Setiap tenant butuh konfigurasi plugin yang berbeda
2. **Performance Issues**: Semua plugin loaded sekaligus, tidak ada lazy loading
3. **Maintenance Nightmare**: Menambah fitur baru butuh modify banyak plugin
4. **Testing Complexity**: Sulit untuk unit test karena tight coupling
5. **Type Safety Issues**: Banyak `any` types dan runtime errors

---

## 🚀 Target Hybrid Architecture

### The Hybrid System Components

#### 1. Event Emitter System 📡

**Purpose**: Cross-plugin communication dan async operations

```typescript
// src/lib/hybrid-system/EventEmitter.ts
export interface PluginEvent {
  type: string;
  data?: any;
  timestamp: number;
  source: string;
}

export class PluginEventEmitter {
  private listeners: Map<string, Function[]> = new Map();
  private onceListeners: Map<string, Function[]> = new Map();
  private eventHistory: PluginEvent[] = [];
  
  // Event registration
  on(event: string, callback: Function): void { /* ... */ }
  once(event: string, callback: Function): void { /* ... */ }
  off(event: string, callback: Function): void { /* ... */ }
  
  // Event emission
  emit(event: string, data?: any): any[] { /* ... */ }
  
  // Event history for debugging
  getEventHistory(): PluginEvent[] { /* ... */ }
  
  // Wildcard events
  onAny(callback: Function): void { /* ... */ }
}
```

#### 2. Hook System 🪝

**Purpose**: Content transformation dan sequential processing

```typescript
// src/lib/hybrid-system/HookManager.ts
export interface HookCallback {
  callback: Function;
  priority: number;
  pluginName: string;
}

export class HookManager {
  private hooks: Map<string, HookCallback[]> = new Map();
  
  // Hook registration with priority
  addFilter(
    hookName: string, 
    callback: Function, 
    priority: number = 10,
    pluginName: string = 'unknown'
  ): void { /* ... */ }
  
  addAction(
    hookName: string, 
    callback: Function, 
    priority: number = 10,
    pluginName: string = 'unknown'
  ): void { /* ... */ }
  
  // Hook execution
  applyFilters(hookName: string, value: any, ...args: any[]): any { /* ... */ }
  doAction(hookName: string, ...args: any[]): void { /* ... */ }
  
  // Hook management
  removeHook(hookName: string, callback: Function): void { /* ... */ }
  hasHook(hookName: string): boolean { /* ... */ }
  getHooks(hookName: string): HookCallback[] { /* ... */ }
}
```

#### 3. Plugin Registry 📋

**Purpose**: Dependency injection dan lifecycle management

```typescript
// src/lib/hybrid-system/PluginRegistry.ts
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  dependencies: string[];
  capabilities: string[];
  settings: PluginSettings;
}

export class PluginRegistry {
  private plugins: Map<string, PluginMetadata> = new Map();
  private instances: Map<string, BasePlugin> = new Map();
  private dependencyGraph: Map<string, string[]> = new Map();
  
  // Plugin registration
  register(plugin: BasePlugin, metadata: PluginMetadata): void { /* ... */ }
  unregister(pluginName: string): void { /* ... */ }
  
  // Dependency resolution
  resolveDependencies(pluginName: string): string[] { /* ... */ }
  validateDependencies(): boolean { /* ... */ }
  
  // Plugin lifecycle
  async activatePlugin(name: string): Promise<void> { /* ... */ }
  async deactivatePlugin(name: string): Promise<void> { /* ... */ }
  
  // Plugin queries
  getPlugin(name: string): BasePlugin | undefined { /* ... */ }
  getPluginsByCapability(capability: string): BasePlugin[] { /* ... */ }
  getAllPlugins(): BasePlugin[] { /* ... */ }
}
```

#### 4. Hybrid Plugin Manager 🎛️

**Purpose**: Orchestrate semua komponen hybrid

```typescript
// src/lib/hybrid-system/HybridPluginManager.ts
export class HybridPluginManager {
  constructor(
    private eventEmitter: PluginEventEmitter,
    private hookManager: HookManager,
    private registry: PluginRegistry
  ) {}
  
  // Initialize the hybrid system
  async initialize(): Promise<void> { /* ... */ }
  
  // Plugin lifecycle with hybrid support
  async loadPlugin(plugin: BasePlugin): Promise<void> { /* ... */ }
  async unloadPlugin(plugin: BasePlugin): Promise<void> { /* ... */ }
  
  // Event-Hook bridge
  createEventHookBridge(eventName: string, hookName: string): void { /* ... */ }
  
  // System-wide operations
  async loadActivePlugins(): Promise<void> { /* ... */ }
  getSystemStatus(): HybridSystemStatus { /* ... */ }
}
```

### How Components Work Together

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Plugin        │    │   Event Emitter │    │   Hook Manager  │
│                 │    │                 │    │                 │
│  - load()       │───▶│  - on()         │    │  - addFilter()  │
│  - unload()     │    │  - emit()       │    │  - applyFilters()│
│  - trackEvent() │◀───│  - off()        │    │  - addAction()   │
│  - updateTitle()│    │  - once()       │    │  - doAction()    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Plugin Registry│
                    │                 │
                    │  - register()   │
                    │  - activate()   │
                    │  - dependencies │
                    └─────────────────┘
```

### Event Flow in Hybrid System

1. **User Action**: User visits a page
2. **Event Emission**: System emits `page:load` event
3. **Plugin Response**: SEO Tools listens and updates meta tags
4. **Hook Execution**: Content transformation hooks process page content
5. **Cross-Plugin Communication**: Analytics plugin tracks page view

### Hook Flow in Hybrid System

1. **Content Generation**: System generates page content
2. **Filter Chain**: Content passes through SEO optimization filters
3. **Transformation**: Each plugin transforms content based on priority
4. **Final Output**: Optimized content delivered to user

---

## 🔄 Migration Strategy

### Migration Phases

#### Phase 1: Foundation Setup (Week 1-2)
**Goal**: Build hybrid system infrastructure

**Tasks**:
1. Create Event Emitter system
2. Create Hook Manager system
3. Create Plugin Registry
4. Create Hybrid Plugin Manager
5. Write comprehensive tests
6. Documentation

**Deliverables**:
- `src/lib/hybrid-system/EventEmitter.ts`
- `src/lib/hybrid-system/HookManager.ts`
- `src/lib/hybrid-system/PluginRegistry.ts`
- `src/lib/hybrid-system/HybridPluginManager.ts`
- Test coverage > 90%
- API documentation

#### Phase 2: Base Plugin Migration (Week 3)
**Goal**: Update BasePlugin to support hybrid system

**Tasks**:
1. Modify `BasePlugin` abstract class
2. Add hybrid system integration
3. Update plugin lifecycle methods
4. Add event listener registration
5. Add hook registration methods
6. Backward compatibility layer

**Deliverables**:
- Updated `src/plugins/base-plugin.ts`
- Migration guide for existing plugins
- Compatibility tests

#### Phase 3: Plugin Migration (Week 4-5)
**Goal**: Migrate existing plugins to hybrid system

**Tasks**:
1. Migrate Google Analytics Plugin
2. Migrate SEO Tools Plugin
3. Migrate Sitemap Generator Plugin
4. Migrate Rich Snippet Plugin
5. Migrate Google Local Plugin
6. Migrate Keyword Tagging Plugin

**Deliverables**:
- 6 migrated plugins
- Plugin-specific tests
- Performance benchmarks

#### Phase 4: System Integration (Week 6)
**Goal**: Integrate hybrid system with main application

**Tasks**:
1. Update Plugin Manager
2. Update API endpoints
3. Update admin panel
4. Update client-side integration
5. Update server-side integration
6. End-to-end testing

**Deliverables**:
- Updated `src/lib/plugin-manager.ts`
- Updated API endpoints
- Updated admin panel
- Integration tests

#### Phase 5: Testing & Optimization (Week 7-8)
**Goal**: Ensure system stability and performance

**Tasks**:
1. Load testing
2. Performance optimization
3. Memory leak testing
4. Security testing
5. Documentation completion
6. Training materials

**Deliverables**:
- Performance report
- Security audit
- Complete documentation
- Training materials

### Migration Approach

#### Incremental Migration with Compatibility Layer

```typescript
// Compatibility layer for smooth migration
export class HybridPluginManager extends PluginManager {
  private hybridManager: HybridPluginManager;
  
  constructor() {
    super();
    this.hybridManager = new HybridPluginManager(
      new PluginEventEmitter(),
      new HookManager(),
      new PluginRegistry()
    );
  }
  
  // Backward compatibility
  async loadPlugin(name: string, config: PluginConfig): Promise<void> {
    // Try old system first
    await super.loadPlugin(name, config);
    
    // Then try hybrid system
    await this.hybridManager.loadPlugin(/* ... */);
  }
}
```

#### Feature Flags for Gradual Rollout

```typescript
// Feature flags for migration control
export const MigrationFlags = {
  USE_HYBRID_SYSTEM: process.env.USE_HYBRID_SYSTEM === 'true',
  ENABLE_EVENT_SYSTEM: process.env.ENABLE_EVENT_SYSTEM === 'true',
  ENABLE_HOOK_SYSTEM: process.env.ENABLE_HOOK_SYSTEM === 'true',
  ENABLE_PLUGIN_REGISTRY: process.env.ENABLE_PLUGIN_REGISTRY === 'true',
};
```

---

## 💻 Implementation Plan

### Step 1: Create Hybrid System Infrastructure

#### Event Emitter Implementation

```typescript
// src/lib/hybrid-system/EventEmitter.ts
export class PluginEventEmitter {
  private listeners: Map<string, Function[]> = new Map();
  private onceListeners: Map<string, Function[]> = new Map();
  private eventHistory: PluginEvent[] = [];
  private maxHistory: number = 1000;
  
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    
    // Log for debugging
    console.log(`[EventEmitter] Listener registered for event: ${event}`);
  }
  
  once(event: string, callback: Function): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, []);
    }
    this.onceListeners.get(event)!.push(callback);
  }
  
  off(event: string, callback: Function): void {
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
  }
  
  emit(event: string, data?: any): any[] {
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
    
    const results: any[] = [];
    
    // Execute regular listeners
    const regularListeners = this.listeners.get(event) || [];
    for (const callback of regularListeners) {
      try {
        const result = callback(data);
        results.push(result);
      } catch (error) {
        console.error(`[EventEmitter] Error in listener for event ${event}:`, error);
      }
    }
    
    // Execute once listeners
    const onceListeners = this.onceListeners.get(event) || [];
    for (const callback of onceListeners) {
      try {
        const result = callback(data);
        results.push(result);
      } catch (error) {
        console.error(`[EventEmitter] Error in once listener for event ${event}:`, error);
      }
    }
    
    // Clear once listeners
    this.onceListeners.delete(event);
    
    return results;
  }
  
  getEventHistory(): PluginEvent[] {
    return [...this.eventHistory];
  }
  
  clearHistory(): void {
    this.eventHistory = [];
  }
}
```

#### Hook Manager Implementation

```typescript
// src/lib/hybrid-system/HookManager.ts
export class HookManager {
  private hooks: Map<string, HookCallback[]> = new Map();
  
  addFilter(
    hookName: string, 
    callback: Function, 
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
    
    console.log(`[HookManager] Filter added to hook: ${hookName} (priority: ${priority})`);
  }
  
  addAction(
    hookName: string, 
    callback: Function, 
    priority: number = 10,
    pluginName: string = 'unknown'
  ): void {
    // Actions use the same mechanism as filters but don't return values
    this.addFilter(hookName, callback, priority, pluginName);
  }
  
  applyFilters(hookName: string, value: any, ...args: any[]): any {
    const hookCallbacks = this.hooks.get(hookName) || [];
    
    let result = value;
    for (const hookCallback of hookCallbacks) {
      try {
        result = hookCallback.callback(result, ...args);
      } catch (error) {
        console.error(`[HookManager] Error in filter ${hookName} for plugin ${hookCallback.pluginName}:`, error);
      }
    }
    
    return result;
  }
  
  doAction(hookName: string, ...args: any[]): void {
    const hookCallbacks = this.hooks.get(hookName) || [];
    
    for (const hookCallback of hookCallbacks) {
      try {
        hookCallback.callback(...args);
      } catch (error) {
        console.error(`[HookManager] Error in action ${hookName} for plugin ${hookCallback.pluginName}:`, error);
      }
    }
  }
  
  removeHook(hookName: string, callback: Function): void {
    const hookCallbacks = this.hooks.get(hookName);
    if (hookCallbacks) {
      const index = hookCallbacks.findIndex(hc => hc.callback === callback);
      if (index > -1) {
        hookCallbacks.splice(index, 1);
      }
    }
  }
  
  hasHook(hookName: string): boolean {
    const hookCallbacks = this.hooks.get(hookName);
    return hookCallbacks ? hookCallbacks.length > 0 : false;
  }
  
  getHooks(hookName: string): HookCallback[] {
    return this.hooks.get(hookName) || [];
  }
  
  getAllHooks(): Map<string, HookCallback[]> {
    return new Map(this.hooks);
  }
}
```

### Step 2: Update Base Plugin

```typescript
// src/plugins/base-plugin.ts (Updated)
export abstract class BasePlugin {
  public config: PluginConfig;
  public isLoaded: boolean = false;
  
  // Hybrid system integration
  protected eventEmitter: PluginEventEmitter;
  protected hookManager: HookManager;
  protected registry: PluginRegistry;
  
  constructor(
    config: PluginConfig,
    eventEmitter: PluginEventEmitter,
    hookManager: HookManager,
    registry: PluginRegistry
  ) {
    this.config = config;
    this.eventEmitter = eventEmitter;
    this.hookManager = hookManager;
    this.registry = registry;
  }
  
  abstract load(): Promise<void>;
  abstract unload(): Promise<void>;
  
  // Hybrid system integration methods
  protected registerEventListeners(): void {
    // Override in subclasses to register event listeners
  }
  
  protected registerHooks(): void {
    // Override in subclasses to register hooks
  }
  
  protected unregisterEventListeners(): void {
    // Override in subclasses to cleanup event listeners
  }
  
  protected unregisterHooks(): void {
    // Override in subclasses to cleanup hooks
  }
  
  // Enhanced utility methods with event integration
  protected async injectScript(src: string, async: boolean = true): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Emit event before script injection
    this.eventEmitter.emit('script:before:inject', { src, async });
    
    try {
      await super.injectScript(src, async);
      
      // Emit event after successful injection
      this.eventEmitter.emit('script:after:inject', { src, async, success: true });
    } catch (error) {
      // Emit event on failure
      this.eventEmitter.emit('script:after:inject', { src, async, success: false, error });
      throw error;
    }
  }
  
  protected injectMetaTag(name: string, content: string): void {
    if (typeof window === 'undefined') return;
    
    // Apply filters to meta tag content
    const filteredContent = this.hookManager.applyFilters('meta:content', content, name);
    
    // Emit event before meta tag injection
    this.eventEmitter.emit('meta:before:inject', { name, content: filteredContent });
    
    try {
      super.injectMetaTag(name, filteredContent);
      
      // Emit event after successful injection
      this.eventEmitter.emit('meta:after:inject', { name, content: filteredContent, success: true });
    } catch (error) {
      // Emit event on failure
      this.eventEmitter.emit('meta:after:inject', { name, content: filteredContent, success: false, error });
      throw error;
    }
  }
  
  protected injectStructuredData(data: any): void {
    if (typeof window === 'undefined') return;
    
    // Apply filters to structured data
    const filteredData = this.hookManager.applyFilters('structured:data', data);
    
    // Emit event before structured data injection
    this.eventEmitter.emit('structured:before:inject', { data: filteredData });
    
    try {
      super.injectStructuredData(filteredData);
      
      // Emit event after successful injection
      this.eventEmitter.emit('structured:after:inject', { data: filteredData, success: true });
    } catch (error) {
      // Emit event on failure
      this.eventEmitter.emit('structured:after:inject', { data: filteredData, success: false, error });
      throw error;
    }
  }
}
```

### Step 3: Migrate Google Analytics Plugin

```typescript
// src/plugins/google-analytics/index.ts (Migrated)
export class GoogleAnalyticsPlugin extends BasePlugin {
  private static settingsSchema: PluginSettings = {
    trackingId: {
      type: 'string',
      label: 'Google Analytics Tracking ID',
      required: true,
      description: 'Your Google Analytics tracking ID (e.g., UA-XXXXXXXXX-X)'
    },
    anonymizeIp: {
      type: 'boolean',
      label: 'Anonymize IP',
      required: false,
      default: true,
      description: 'Enable IP anonymization'
    },
    enableDemographics: {
      type: 'boolean',
      label: 'Enable Demographics',
      required: false,
      default: false,
      description: 'Enable demographics and interests reports'
    }
  };

  constructor(
    config: PluginConfig,
    eventEmitter: PluginEventEmitter,
    hookManager: HookManager,
    registry: PluginRegistry
  ) {
    super(config, eventEmitter, hookManager, registry);
  }

  protected registerEventListeners(): void {
    // Listen to page load events
    this.eventEmitter.on('page:load', (pageData) => {
      this.trackPageView(pageData);
    });
    
    // Listen to user interaction events
    this.eventEmitter.on('user:interaction', (interactionData) => {
      this.trackEvent(interactionData.eventName, interactionData.eventParams);
    });
    
    // Listen to conversion events
    this.eventEmitter.on('conversion:complete', (conversionData) => {
      this.trackConversion(conversionData.id, conversionData.label);
    });
  }

  protected registerHooks(): void {
    // Add filter for tracking data
    this.hookManager.addFilter('analytics:tracking:data', (data) => {
      // Enhance tracking data with plugin-specific information
      return {
        ...data,
        plugin: 'google-analytics',
        version: '1.0.0',
        timestamp: Date.now()
      };
    }, 10, 'google-analytics');
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const { trackingId, anonymizeIp, enableDemographics } = this.config.settings || {};

      if (!trackingId) {
        console.error('Google Analytics tracking ID is required');
        return;
      }

      // Emit event before loading
      this.eventEmitter.emit('analytics:before:load', { trackingId });

      // Load Google Analytics script
      await this.injectScript(`https://www.googletagmanager.com/gtag/js?id=${trackingId}`);

      // Initialize data layer
      const dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer = dataLayer;
      
      // Define gtag function
      const gtag = (...args: any[]) => {
        dataLayer.push(args);
      };

      // Make gtag globally available
      (window as any).gtag = gtag;

      // Initialize Google Analytics
      gtag('js', new Date());
      gtag('config', trackingId, {
        anonymize_ip: anonymizeIp || false,
        send_page_view: true
      });

      // Enable demographics if requested
      if (enableDemographics) {
        gtag('config', trackingId, {
          custom_map: { dimension1: 'demographics' }
        });
      }

      this.isLoaded = true;
      
      // Emit event after successful loading
      this.eventEmitter.emit('analytics:after:load', { trackingId, success: true });
      
      console.log('Google Analytics plugin loaded successfully');
    } catch (error) {
      // Emit event on failure
      this.eventEmitter.emit('analytics:after:load', { 
        trackingId: this.config.settings?.trackingId, 
        success: false, 
        error 
      });
      
      console.error('Failed to load Google Analytics plugin:', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      // Emit event before unloading
      this.eventEmitter.emit('analytics:before:unload', {});

      // Remove Google Analytics scripts
      const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
      scripts.forEach(script => script.remove());

      // Clear data layer
      if (window.dataLayer) {
        window.dataLayer = [];
      }

      // Remove gtag from global scope
      delete (window as any).gtag;

      this.isLoaded = false;
      
      // Emit event after successful unloading
      this.eventEmitter.emit('analytics:after:unload', { success: true });
      
      console.log('Google Analytics plugin unloaded successfully');
    } catch (error) {
      // Emit event on failure
      this.eventEmitter.emit('analytics:after:unload', { success: false, error });
      
      console.error('Failed to unload Google Analytics plugin:', error);
    }
  }

  private trackPageView(pageData: any): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      // Apply filters to tracking data
      const trackingData = this.hookManager.applyFilters('analytics:tracking:data', {
        page_path: pageData.path || window.location.pathname,
        page_title: pageData.title || document.title,
        page_location: window.location.href
      });

      gtag('event', 'page_view', trackingData);
      
      // Emit event after tracking
      this.eventEmitter.emit('analytics:page:view:tracked', trackingData);
    }
  }

  // Public methods for tracking events
  trackEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      // Apply filters to event data
      const eventData = this.hookManager.applyFilters('analytics:tracking:data', {
        event_name: eventName,
        event_params: eventParams
      });

      gtag('event', eventName, eventData.event_params);
      
      // Emit event after tracking
      this.eventEmitter.emit('analytics:event:tracked', eventData);
    }
  }

  trackConversion(conversionId: string, conversionLabel: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      // Apply filters to conversion data
      const conversionData = this.hookManager.applyFilters('analytics:tracking:data', {
        conversion_id: conversionId,
        conversion_label: conversionLabel
      });

      gtag('event', 'conversion', {
        send_to: `${conversionId}/${conversionLabel}`
      });
      
      // Emit event after tracking
      this.eventEmitter.emit('analytics:conversion:tracked', conversionData);
    }
  }

  protected unregisterEventListeners(): void {
    // Clean up event listeners
    this.eventEmitter.off('page:load', this.trackPageView);
    this.eventEmitter.off('user:interaction', this.trackEvent);
    this.eventEmitter.off('conversion:complete', this.trackConversion);
  }

  protected unregisterHooks(): void {
    // Clean up hooks
    this.hookManager.removeHook('analytics:tracking:data', this.hookManager.getHooks('analytics:tracking:data')[0]?.callback);
  }

  static getSettingsSchema(): PluginSettings {
    return GoogleAnalyticsPlugin.settingsSchema;
  }
}
```

---

## 🧪 Testing Strategy

### Unit Testing

#### Event Emitter Tests
```typescript
// src/lib/hybrid-system/__tests__/EventEmitter.test.ts
describe('PluginEventEmitter', () => {
  let emitter: PluginEventEmitter;
  
  beforeEach(() => {
    emitter = new PluginEventEmitter();
  });
  
  test('should register and emit events', () => {
    const mockCallback = jest.fn();
    emitter.on('test', mockCallback);
    
    emitter.emit('test', { data: 'test' });
    
    expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
  });
  
  test('should handle once listeners', () => {
    const mockCallback = jest.fn();
    emitter.once('test', mockCallback);
    
    emitter.emit('test', { data: 'test' });
    emitter.emit('test', { data: 'test2' });
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
  });
  
  test('should maintain event history', () => {
    emitter.emit('event1', { data: 'test1' });
    emitter.emit('event2', { data: 'test2' });
    
    const history = emitter.getEventHistory();
    expect(history).toHaveLength(2);
    expect(history[0].type).toBe('event1');
    expect(history[1].type).toBe('event2');
  });
});
```

#### Hook Manager Tests
```typescript
// src/lib/hybrid-system/__tests__/HookManager.test.ts
describe('HookManager', () => {
  let hookManager: HookManager;
  
  beforeEach(() => {
    hookManager = new HookManager();
  });
  
  test('should add and apply filters in priority order', () => {
    const filter1 = jest.fn((value) => `${value}_1`);
    const filter2 = jest.fn((value) => `${value}_2`);
    
    hookManager.addFilter('test', filter2, 20);
    hookManager.addFilter('test', filter1, 10);
    
    const result = hookManager.applyFilters('test', 'initial');
    
    expect(result).toBe('initial_1_2');
    expect(filter1).toHaveBeenCalledWith('initial');
    expect(filter2).toHaveBeenCalledWith('initial_1');
  });
  
  test('should execute actions', () => {
    const action1 = jest.fn();
    const action2 = jest.fn();
    
    hookManager.addAction('test', action1, 10);
    hookManager.addAction('test', action2, 20);
    
    hookManager.doAction('test', 'arg1', 'arg2');
    
    expect(action1).toHaveBeenCalledWith('arg1', 'arg2');
    expect(action2).toHaveBeenCalledWith('arg1', 'arg2');
  });
});
```

### Integration Testing

#### Plugin Integration Tests
```typescript
// src/plugins/__tests__/GoogleAnalyticsPlugin.test.ts
describe('GoogleAnalyticsPlugin Integration', () => {
  let plugin: GoogleAnalyticsPlugin;
  let eventEmitter: PluginEventEmitter;
  let hookManager: HookManager;
  let registry: PluginRegistry;
  
  beforeEach(() => {
    eventEmitter = new PluginEventEmitter();
    hookManager = new HookManager();
    registry = new PluginRegistry();
    
    plugin = new GoogleAnalyticsPlugin(
      {
        name: 'google-analytics',
        description: 'Google Analytics Plugin',
        version: '1.0.0',
        isActive: true,
        settings: { trackingId: 'UA-TEST' }
      },
      eventEmitter,
      hookManager,
      registry
    );
  });
  
  test('should respond to page load events', async () => {
    await plugin.load();
    
    const mockTrackPageView = jest.spyOn(plugin as any, 'trackPageView');
    
    eventEmitter.emit('page:load', { path: '/test', title: 'Test Page' });
    
    expect(mockTrackPageView).toHaveBeenCalledWith({ path: '/test', title: 'Test Page' });
  });
  
  test('should apply filters to tracking data', () => {
    hookManager.addFilter('analytics:tracking:data', (data) => ({
      ...data,
      enhanced: true
    }));
    
    const result = hookManager.applyFilters('analytics:tracking:data', {
      page_path: '/test'
    });
    
    expect(result).toEqual({
      page_path: '/test',
      enhanced: true
    });
  });
});
```

### End-to-End Testing

#### System Integration Tests
```typescript
// src/lib/hybrid-system/__tests__/HybridSystem.test.ts
describe('Hybrid System Integration', () => {
  let hybridManager: HybridPluginManager;
  let gaPlugin: GoogleAnalyticsPlugin;
  let seoPlugin: SEOToolsPlugin;
  
  beforeEach(async () => {
    hybridManager = new HybridPluginManager(
      new PluginEventEmitter(),
      new HookManager(),
      new PluginRegistry()
    );
    
    await hybridManager.initialize();
    
    gaPlugin = new GoogleAnalyticsPlugin(
      {
        name: 'google-analytics',
        description: 'Google Analytics Plugin',
        version: '1.0.0',
        isActive: true,
        settings: { trackingId: 'UA-TEST' }
      },
      hybridManager.getEventEmitter(),
      hybridManager.getHookManager(),
      hybridManager.getRegistry()
    );
    
    seoPlugin = new SEOToolsPlugin(
      {
        name: 'seo-tools',
        description: 'SEO Tools Plugin',
        version: '1.0.0',
        isActive: true,
        settings: { title: 'Test Title' }
      },
      hybridManager.getEventEmitter(),
      hybridManager.getHookManager(),
      hybridManager.getRegistry()
    );
  });
  
  test('should handle cross-plugin communication', async () => {
    await hybridManager.loadPlugin(gaPlugin);
    await hybridManager.loadPlugin(seoPlugin);
    
    // Simulate page load
    hybridManager.getEventEmitter().emit('page:load', { 
      path: '/test', 
      title: 'Test Page' 
    });
    
    // Verify both plugins responded
    expect(gaPlugin.isLoaded).toBe(true);
    expect(seoPlugin.isLoaded).toBe(true);
  });
});
```

---

## 🔄 Rollback Plan

### Rollback Triggers

1. **Performance Degradation**: >20% increase in load time
2. **Memory Leaks**: Memory usage grows >50MB over 1 hour
3. **Plugin Failures**: >10% of plugins fail to load
4. **Event System Failure**: Event delivery success rate <95%
5. **Hook System Failure**: Hook execution success rate <95%

### Rollback Procedure

#### Phase 1: Feature Flag Rollback
```bash
# Disable hybrid system
export USE_HYBRID_SYSTEM=false
export ENABLE_EVENT_SYSTEM=false
export ENABLE_HOOK_SYSTEM=false
export ENABLE_PLUGIN_REGISTRY=false

# Restart application
npm run dev
```

#### Phase 2: Code Rollback
```bash
# Rollback to previous commit
git checkout hybrid-migration-backup

# Restore database
pg_restore -d zadpress backup/pre-migration.sql

# Restart services
npm run dev
```

#### Phase 3: Monitoring Rollback
```typescript
// Monitor system health after rollback
export class RollbackMonitor {
  async checkSystemHealth(): Promise<boolean> {
    const metrics = await this.getSystemMetrics();
    
    return (
      metrics.loadTime < 1000 &&
      metrics.memoryUsage < 100 &&
      metrics.pluginSuccessRate > 0.95 &&
      metrics.eventDeliveryRate > 0.95 &&
      metrics.hookExecutionRate > 0.95
    );
  }
}
```

---

## ⚡ Performance Considerations

### Event System Performance

#### Event Delivery Optimization
```typescript
// Optimized event delivery with batching
export class OptimizedEventEmitter extends PluginEventEmitter {
  private eventQueue: PluginEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private batchSize: number = 10;
  private batchInterval: number = 16; // ~60fps
  
  emit(event: string, data?: any): any[] {
    // Add to queue
    this.eventQueue.push({
      type: event,
      data,
      timestamp: Date.now(),
      source: 'system'
    });
    
    // Process batch if timer not set
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchInterval);
    }
    
    return [];
  }
  
  private processBatch(): void {
    const batch = this.eventQueue.splice(0, this.batchSize);
    
    // Process events in batch
    for (const event of batch) {
      super.emit(event.type, event.data);
    }
    
    // Reset timer if more events in queue
    if (this.eventQueue.length > 0) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchInterval);
    } else {
      this.batchTimer = null;
    }
  }
}
```

#### Hook System Performance

#### Hook Execution Optimization
```typescript
// Optimized hook execution with caching
export class OptimizedHookManager extends HookManager {
  private hookCache: Map<string, Function> = new Map();
  private cacheInvalidationTime: number = 1000; // 1 second
  private lastCacheUpdate: Map<string, number> = new Map();
  
  applyFilters(hookName: string, value: any, ...args: any[]): any {
    const now = Date.now();
    const lastUpdate = this.lastCacheUpdate.get(hookName) || 0;
    
    // Check if cache is valid
    if (now - lastUpdate > this.cacheInvalidationTime) {
      // Rebuild cached function
      const hookCallbacks = this.hooks.get(hookName) || [];
      const cachedFunction = (inputValue: any, ...hookArgs: any[]) => {
        return hookCallbacks.reduce((result, hookCallback) => {
          try {
            return hookCallback.callback(result, ...hookArgs);
          } catch (error) {
            console.error(`[HookManager] Error in cached hook ${hookName}:`, error);
            return result;
          }
        }, inputValue);
      };
      
      this.hookCache.set(hookName, cachedFunction);
      this.lastCacheUpdate.set(hookName, now);
    }
    
    // Execute cached function
    const cachedFunction = this.hookCache.get(hookName);
    if (cachedFunction) {
      return cachedFunction(value, ...args);
    }
    
    return value;
  }
}
```

### Memory Management

#### Memory Leak Prevention
```typescript
// Memory management for hybrid system
export class HybridSystemMemoryManager {
  private maxEventHistory: number = 1000;
  private maxHookCacheSize: number = 100;
  private cleanupInterval: number = 60000; // 1 minute
  
  constructor(
    private eventEmitter: PluginEventEmitter,
    private hookManager: HookManager
  ) {
    this.startCleanupTimer();
  }
  
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }
  
  private cleanup(): void {
    // Clean up event history
    const eventHistory = this.eventEmitter.getEventHistory();
    if (eventHistory.length > this.maxEventHistory) {
      this.eventEmitter.clearHistory();
    }
    
    // Clean up hook cache
    const hookCache = (this.hookManager as any).hookCache;
    if (hookCache && hookCache.size > this.maxHookCacheSize) {
      hookCache.clear();
    }
    
    // Force garbage collection if available
    if (typeof global.gc === 'function') {
      global.gc();
    }
  }
}
```

---

## 🔮 Future Extensions

### Plugin Marketplace

```typescript
// Future: Plugin marketplace integration
export class PluginMarketplace {
  async installPlugin(pluginId: string): Promise<void> {
    // Download plugin from marketplace
    const pluginData = await this.downloadPlugin(pluginId);
    
    // Validate plugin
    await this.validatePlugin(pluginData);
    
    // Install plugin
    await this.installPluginFiles(pluginData);
    
    // Register plugin
    await this.registerPlugin(pluginData);
  }
  
  async updatePlugin(pluginId: string): Promise<void> {
    // Update plugin logic
  }
  
  async uninstallPlugin(pluginId: string): Promise<void> {
    // Uninstall plugin logic
  }
}
```

### AI-Powered Plugin Optimization

```typescript
// Future: AI-powered plugin optimization
export class AIPluginOptimizer {
  async optimizePluginConfiguration(plugin: BasePlugin): Promise<void> {
    // Analyze plugin usage patterns
    const usageData = await this.analyzeUsage(plugin);
    
    // Generate optimization suggestions
    const suggestions = await this.generateSuggestions(usageData);
    
    // Apply optimizations
    await this.applyOptimizations(plugin, suggestions);
  }
  
  async predictPluginConflicts(plugins: BasePlugin[]): Promise<ConflictPrediction[]> {
    // Predict potential conflicts between plugins
    return [];
  }
}
```

### Real-time Plugin Monitoring

```typescript
// Future: Real-time plugin monitoring
export class PluginMonitor {
  private metrics: Map<string, PluginMetrics> = new Map();
  
  trackPluginEvent(pluginName: string, event: string, data: any): void {
    if (!this.metrics.has(pluginName)) {
      this.metrics.set(pluginName, new PluginMetrics());
    }
    
    const metrics = this.metrics.get(pluginName)!;
    metrics.trackEvent(event, data);
  }
  
  getPluginMetrics(pluginName: string): PluginMetrics | undefined {
    return this.metrics.get(pluginName);
  }
  
  getAllMetrics(): Map<string, PluginMetrics> {
    return new Map(this.metrics);
  }
}
```

### Multi-Tenant Plugin Isolation

```typescript
// Future: Multi-tenant plugin isolation
export class TenantPluginManager {
  private tenantManagers: Map<string, HybridPluginManager> = new Map();
  
  async getTenantManager(tenantId: string): Promise<HybridPluginManager> {
    if (!this.tenantManagers.has(tenantId)) {
      const manager = new HybridPluginManager(
        new PluginEventEmitter(),
        new HookManager(),
        new PluginRegistry()
      );
      
      await manager.initialize();
      this.tenantManagers.set(tenantId, manager);
    }
    
    return this.tenantManagers.get(tenantId)!;
  }
  
  async isolateTenant(tenantId: string): Promise<void> {
    // Isolate tenant plugins
    const manager = await this.getTenantManager(tenantId);
    await manager.isolate();
  }
}
```

---

## 📝 Conclusion

**Hai Masa Depan!**

Ini adalah dokumentasi komprehensif tentang migrasi dari simple plugin system ke hybrid event-driven hook architecture. Migration ini bukanlah tentang mengikuti trend, tapi tentang membangun fondasi yang kokoh untuk masa depan ZadPress.

### Key Takeaways:

1. **Event Emitters are perfect for SEO** - SEO operations本质上 adalah event-driven
2. **Hooks are perfect for content transformation** - Sequential processing dengan priority
3. **Hybrid approach gives us the best of both worlds** - Fleksibilitas + Performance
4. **Type Safety is crucial** - TypeScript support yang robust
5. **Scalability is built-in** - Ready untuk multi-tenant SaaS architecture

### Why This Matters for Future:

- **Plugin Marketplace** - Hybrid system siap untuk plugin marketplace
- **AI Integration** - Mudah untuk menambahkan AI-powered optimization
- **Real-time Monitoring** - Built-in monitoring dan metrics
- **Multi-Tenant Support** - Tenant isolation siap pakai
- **Performance** - Optimized untuk high-traffic scenarios

### Lessons Learned:

1. **Don't copy WordPress** - Pelajari konsepnya tapi buat implementasi yang lebih baik
2. **Type Safety first** - TypeScript bukan optional requirement
3. **Event-driven thinking** - Ubah mindset dari procedural ke event-driven
4. **Performance matters** - Optimasi dari awal, bukan setelah terlambat
5. **Testing is mandatory** - Comprehensive testing untuk complex system

### Final Thoughts:

Migration ini adalah investasi untuk masa depan. Hybrid system yang kita bangun sekarang akan menjadi fondasi untuk:
- Plugin marketplace
- AI-powered features
- Real-time collaboration
- Multi-tenant scalability
- Advanced analytics

**Keep building, keep innovating, and remember: the best code is code that makes future development easier.**

---

**End of Documentation**  
**Created: 2025-06-18**  
**Version: 1.0.0**  
**Next Review: 2025-12-18**