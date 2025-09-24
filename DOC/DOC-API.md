# Dokumentasi API Sistem Plugin Hybrid

## Daftar Isi
1. [Pendahuluan](#pendahuluan)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Phase 1: Base Plugin System](#phase-1-base-plugin-system)
4. [Phase 2: Hybrid System Integration](#phase-2-hybrid-system-integration)
5. [API Reference](#api-reference)
6. [Panduan Implementasi Plugin](#panduan-implementasi-plugin)
7. [Contoh Implementasi](#contoh-implementasi)
8. [Troubleshooting](#troubleshooting)

---

## Pendahuluan

Halo diriku di masa depan! 😄

Apa kabar? Semoga kamu masih ingat dengan proyek keren ini. Jika lupa, biar aku ingatkan lagi: ini adalah dokumentasi API untuk Sistem Plugin Hybrid yang kita bangun untuk aplikasi Next.js. Sistem ini memungkinkan fitur-fitur SEO dan analitik diimplementasikan sebagai plugin yang dapat diaktifkan/dinonaktifkan melalui admin panel.

### Kenapa Kita Membangun Ini?

Kita ingin:
1. Modularitas - Setiap fitur sebagai plugin terpisah
2. Performa - JavaScript hanya dimuat saat diperlukan
3. Fleksibilitas - User bisa pilih fitur yang diinginkan
4. Maintainability - Kode terorganisir dan mudah dikelola

### Overview Phase

- **Phase 1**: Membangun Base Plugin System dasar
- **Phase 2**: Mengintegrasikan Hybrid System (CSR + SSR)
- **Phase 3**: Migrasi plugin-plugin spesifik (Google Analytics, SEO Tools, dll.)

---

## Arsitektur Sistem

### Komponen Utama

```
Sistem Plugin Hybrid
├── BasePlugin (Kelas dasar untuk semua plugin)
├── PluginEventEmitter (Sistem event)
├── HookManager (Manajemen hook)
├── PluginRegistry (Registrasi plugin)
├── HybridPluginManager (Manajer hybrid)
└── PluginManager (Singleton untuk aplikasi)
```

### Alur Kerja

1. **Registrasi Plugin**: Plugin diregistrasi ke sistem
2. **Konfigurasi**: User mengaktifkan plugin melalui admin panel
3. **Loading**: Plugin dimuat sesuai konfigurasi
4. **Eksekusi**: Plugin berjalan di client/server sesuai kebutuhan
5. **Event & Hook**: Plugin berinteraksi melalui event dan hook

---

## Phase 1: Base Plugin System

### BasePlugin Class

`BasePlugin` adalah kelas abstrak yang menjadi dasar untuk semua plugin.

```typescript
export abstract class BasePlugin {
  public config: PluginConfig;
  public isLoaded: boolean = false;
  
  constructor(config: PluginConfig) {
    this.config = config;
  }
  
  abstract load(): Promise<void>;
  abstract unload(): Promise<void>;
  
  // Utility methods
  protected validateSettings(settings: Record<string, any>, schema: PluginSettings): boolean;
  protected injectScript(src: string, async: boolean = true): Promise<void>;
  protected injectMetaTag(name: string, content: string): void;
  protected injectStructuredData(data: any): void;
}
```

### PluginConfig Interface

```typescript
export interface PluginConfig {
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  settings?: Record<string, any>;
}
```

### PluginSettings Interface

```typescript
export interface PluginSettings {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    label: string;
    required: boolean;
    default?: any;
    description?: string;
  };
}
```

---

## Phase 2: Hybrid System Integration

### PluginEventEmitter

Sistem event yang memungkinkan plugin berkomunikasi satu sama lain.

```typescript
export class PluginEventEmitter {
  private events: Map<string, Function[]> = new Map();
  
  // Register event listener
  on(event: string, callback: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }
  
  // Remove event listener
  off(event: string, callback: Function): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  // Emit event
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
  
  // Get all events
  getEvents(): string[] {
    return Array.from(this.events.keys());
  }
  
  // Clear all events
  clearEvents(): void {
    this.events.clear();
  }
}
```

### HookManager

Manajemen hook untuk ekstensi fungsionalitas.

```typescript
export class HookManager {
  private hooks: Map<string, Function[]> = new Map();
  
  // Add hook
  addHook(hookName: string, callback: Function): void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName)!.push(callback);
  }
  
  // Remove hook
  removeHook(hookName: string, callback: Function): void {
    const hooks = this.hooks.get(hookName);
    if (hooks) {
      const index = hooks.indexOf(callback);
      if (index > -1) {
        hooks.splice(index, 1);
      }
    }
  }
  
  // Execute hook
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
  
  // Get all hooks
  getHooks(): string[] {
    return Array.from(this.hooks.keys());
  }
  
  // Clear all hooks
  clearHooks(): void {
    this.hooks.clear();
  }
}
```

### PluginRegistry

Registrasi dan manajemen plugin.

```typescript
export class PluginRegistry {
  private plugins: Map<string, typeof BasePlugin> = new Map();
  private instances: Map<string, BasePlugin> = new Map();
  
  // Register plugin class
  register(name: string, pluginClass: typeof BasePlugin): void {
    this.plugins.set(name, pluginClass);
    console.log(`Plugin ${name} registered`);
  }
  
  // Unregister plugin
  unregister(name: string): void {
    this.plugins.delete(name);
    // Also remove instance if exists
    this.instances.delete(name);
    console.log(`Plugin ${name} unregistered`);
  }
  
  // Get plugin class
  get(name: string): typeof BasePlugin | undefined {
    return this.plugins.get(name);
  }
  
  // Get all registered plugins
  getAll(): string[] {
    return Array.from(this.plugins.keys());
  }
  
  // Create plugin instance
  createInstance(name: string, config: PluginConfig): BasePlugin | undefined {
    const PluginClass = this.plugins.get(name);
    if (!PluginClass) return undefined;
    
    const instance = new PluginClass(config);
    this.instances.set(name, instance);
    return instance;
  }
  
  // Get plugin instance
  getInstance(name: string): BasePlugin | undefined {
    return this.instances.get(name);
  }
  
  // Check if plugin is registered
  isRegistered(name: string): boolean {
    return this.plugins.has(name);
  }
}
```

### HybridPluginManager

Manajer utama untuk sistem hybrid.

```typescript
export class HybridPluginManager {
  private registry: PluginRegistry;
  private eventEmitter: PluginEventEmitter;
  private hookManager: HookManager;
  
  constructor() {
    this.registry = new PluginRegistry();
    this.eventEmitter = new PluginEventEmitter();
    this.hookManager = new HookManager();
  }
  
  // Register plugin
  registerPlugin(name: string, pluginClass: typeof BasePlugin): void {
    this.registry.register(name, pluginClass);
  }
  
  // Load plugin
  async loadPlugin(name: string, config: PluginConfig): Promise<void> {
    const instance = this.registry.createInstance(name, config);
    if (!instance) {
      console.error(`Plugin ${name} not found`);
      return;
    }
    
    await instance.load();
    this.eventEmitter.emit('pluginLoaded', name);
  }
  
  // Unload plugin
  async unloadPlugin(name: string): Promise<void> {
    const instance = this.registry.getInstance(name);
    if (!instance) return;
    
    await instance.unload();
    this.eventEmitter.emit('pluginUnloaded', name);
  }
  
  // Get event emitter
  getEventEmitter(): PluginEventEmitter {
    return this.eventEmitter;
  }
  
  // Get hook manager
  getHookManager(): HookManager {
    return this.hookManager;
  }
  
  // Get registry
  getRegistry(): PluginRegistry {
    return this.registry;
  }
}
```

### PluginManager (Singleton)

Singleton untuk aplikasi.

```typescript
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
  
  // Register plugin
  registerPlugin(name: string, pluginClass: typeof BasePlugin): void {
    this.hybridManager.registerPlugin(name, pluginClass);
  }
  
  // Load plugin
  async loadPlugin(name: string, config: PluginConfig): Promise<void> {
    this.pluginConfigs.set(name, config);
    await this.hybridManager.loadPlugin(name, config);
  }
  
  // Unload plugin
  async unloadPlugin(name: string): Promise<void> {
    await this.hybridManager.unloadPlugin(name);
    this.pluginConfigs.delete(name);
  }
  
  // Get event emitter
  getEventEmitter(): PluginEventEmitter {
    return this.hybridManager.getEventEmitter();
  }
  
  // Get hook manager
  getHookManager(): HookManager {
    return this.hybridManager.getHookManager();
  }
  
  // Get plugin config
  getPluginConfig(name: string): PluginConfig | undefined {
    return this.pluginConfigs.get(name);
  }
}
```

---

## API Reference

### Cara Registrasi Plugin

```typescript
// 1. Buat kelas plugin yang extends BasePlugin
class MyPlugin extends BasePlugin {
  constructor(config: PluginConfig) {
    super(config);
  }
  
  async load(): Promise<void> {
    // Implementasi loading plugin
    console.log('MyPlugin loaded');
  }
  
  async unload(): Promise<void> {
    // Implementasi unloading plugin
    console.log('MyPlugin unloaded');
  }
}

// 2. Registrasi plugin ke sistem
const pluginManager = PluginManager.getInstance();
pluginManager.registerPlugin('my-plugin', MyPlugin);

// 3. Load plugin dengan konfigurasi
const config: PluginConfig = {
  name: 'my-plugin',
  description: 'My awesome plugin',
  version: '1.0.0',
  isActive: true,
  settings: {
    apiKey: '12345'
  }
};

await pluginManager.loadPlugin('my-plugin', config);
```

### Cara Menambah Event Listener

```typescript
const pluginManager = PluginManager.getInstance();
const eventEmitter = pluginManager.getEventEmitter();

// 1. Definisikan callback function
const onPluginLoaded = (pluginName: string) => {
  console.log(`Plugin ${pluginName} was loaded`);
};

// 2. Register event listener
eventEmitter.on('pluginLoaded', onPluginLoaded);

// 3. Emit event (biasanya dilakukan oleh sistem)
eventEmitter.emit('pluginLoaded', 'my-plugin');

// 4. Remove event listener (jika diperlukan)
eventEmitter.off('pluginLoaded', onPluginLoaded);
```

### Cara Menambah Hook

```typescript
const pluginManager = PluginManager.getInstance();
const hookManager = pluginManager.getHookManager();

// 1. Definisikan hook function
const beforePageLoad = (pageData: any) => {
  console.log('Before page load:', pageData);
  // Modify pageData if needed
  return pageData;
};

// 2. Register hook
hookManager.addHook('beforePageLoad', beforePageLoad);

// 3. Execute hook (biasanya dilakukan oleh sistem)
const modifiedData = hookManager.executeHook('beforePageLoad', pageData);

// 4. Remove hook (jika diperlukan)
hookManager.removeHook('beforePageLoad', beforePageLoad);
```

### Cara Menggunakan Utility Methods

```typescript
class MyPlugin extends BasePlugin {
  async load(): Promise<void> {
    // Inject external script
    await this.injectScript('https://example.com/script.js');
    
    // Inject meta tag
    this.injectMetaTag('description', 'My awesome page');
    
    // Inject structured data
    this.injectStructuredData({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'My Website'
    });
    
    // Validate settings
    const isValid = this.validateSettings(this.config.settings || {}, MyPlugin.getSettingsSchema());
    if (!isValid) {
      console.error('Invalid settings');
    }
  }
  
  static getSettingsSchema(): PluginSettings {
    return {
      apiKey: {
        type: 'string',
        label: 'API Key',
        required: true,
        description: 'Your API key'
      },
      enableFeature: {
        type: 'boolean',
        label: 'Enable Feature',
        required: false,
        default: true
      }
    };
  }
}
```

---

## Panduan Implementasi Plugin

### 1. Struktur Plugin

```
plugins/
├── my-plugin/
│   ├── index.ts          // Implementasi plugin
│   ├── config.json       // Konfigurasi plugin
│   └── types.ts          // Type definitions (optional)
└── base-plugin.ts        // BasePlugin class
```

### 2. Template Plugin

```typescript
// plugins/my-plugin/index.ts
import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export class MyPlugin extends BasePlugin {
  private static settingsSchema: PluginSettings = {
    // Define your settings schema
  };

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Your plugin loading logic here
      console.log('Loading MyPlugin...');
      
      // Example: Inject script
      await this.injectScript('https://example.com/script.js');
      
      // Example: Add event listeners
      const eventEmitter = this.getEventEmitter();
      eventEmitter.on('someEvent', this.handleEvent.bind(this));
      
      // Example: Add hooks
      const hookManager = this.getHookManager();
      hookManager.addHook('beforePageLoad', this.beforePageLoad.bind(this));
      
      this.isLoaded = true;
      console.log('MyPlugin loaded successfully');
    } catch (error) {
      console.error('Failed to load MyPlugin:', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      // Your plugin unloading logic here
      console.log('Unloading MyPlugin...');
      
      // Example: Remove event listeners
      const eventEmitter = this.getEventEmitter();
      eventEmitter.off('someEvent', this.handleEvent.bind(this));
      
      // Example: Remove hooks
      const hookManager = this.getHookManager();
      hookManager.removeHook('beforePageLoad', this.beforePageLoad.bind(this));
      
      this.isLoaded = false;
      console.log('MyPlugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload MyPlugin:', error);
    }
  }

  // Event handler
  private handleEvent(data: any): void {
    console.log('Event received:', data);
  }

  // Hook handler
  private beforePageLoad(pageData: any): any {
    console.log('Before page load hook:', pageData);
    // Modify pageData if needed
    return pageData;
  }

  // Helper methods
  private getEventEmitter(): PluginEventEmitter {
    // Get event emitter from plugin manager
    return (globalThis as any).pluginManager?.getEventEmitter();
  }

  private getHookManager(): HookManager {
    // Get hook manager from plugin manager
    return (globalThis as any).pluginManager?.getHookManager();
  }

  static getSettingsSchema(): PluginSettings {
    return MyPlugin.settingsSchema;
  }
}
```

### 3. Konfigurasi Plugin

```json
// plugins/my-plugin/config.json
{
  "name": "My Plugin",
  "description": "This is my awesome plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "homepage": "https://example.com",
  "settings": {
    "apiKey": {
      "type": "string",
      "label": "API Key",
      "required": true,
      "description": "Your API key for the service"
    },
    "enableFeature": {
      "type": "boolean",
      "label": "Enable Feature",
      "required": false,
      "default": true,
      "description": "Enable the awesome feature"
    },
    "timeout": {
      "type": "number",
      "label": "Timeout",
      "required": false,
      "default": 5000,
      "description": "Request timeout in milliseconds"
    }
  }
}
```

### 4. Integrasi dengan Aplikasi

```typescript
// src/lib/plugin-manager.ts
import { PluginManager } from '@/plugins/base-plugin';
import { MyPlugin } from '@/plugins/my-plugin';

// Initialize plugin manager
const pluginManager = PluginManager.getInstance();

// Register plugins
pluginManager.registerPlugin('my-plugin', MyPlugin);

// Make it globally available (if needed)
(globalThis as any).pluginManager = pluginManager;

export { pluginManager };
```

```typescript
// src/app/layout.tsx
import { useEffect } from 'react';
import { pluginManager } from '@/lib/plugin-manager';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Load active plugins on app start
    const loadActivePlugins = async () => {
      try {
        const response = await fetch('/api/plugins/active');
        const activePlugins = await response.json();
        
        for (const plugin of activePlugins) {
          if (plugin.isActive) {
            await pluginManager.loadPlugin(plugin.name, plugin.config);
          }
        }
      } catch (error) {
        console.error('Error loading active plugins:', error);
      }
    };

    loadActivePlugins();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

## Contoh Implementasi

### Google Analytics Plugin

```typescript
// plugins/google-analytics/index.ts
import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

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
    }
  };

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const { trackingId, anonymizeIp } = this.config.settings || {};

      if (!trackingId) {
        console.error('Google Analytics tracking ID is required');
        return;
      }

      // Load Google Analytics script
      await this.injectScript(`https://www.googletagmanager.com/gtag/js?id=${trackingId}`);

      // Initialize data layer
      window.dataLayer = window.dataLayer || [];
      
      // Define gtag function
      const gtag = (...args: any[]) => {
        window.dataLayer.push(args);
      };

      // Make gtag globally available
      (window as any).gtag = gtag;

      // Initialize Google Analytics
      gtag('js', new Date());
      gtag('config', trackingId, {
        anonymize_ip: anonymizeIp || false,
        send_page_view: true
      });

      // Track page views
      this.trackPageView();

      this.isLoaded = true;
      console.log('Google Analytics plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load Google Analytics plugin:', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
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
      console.log('Google Analytics plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload Google Analytics plugin:', error);
    }
  }

  private trackPageView(): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', 'page_view', {
        page_path: window.location.pathname,
        page_title: document.title
      });
    }
  }

  // Public methods for tracking events
  trackEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;

    const gtag = (window as any).gtag;
    if (gtag) {
      gtag('event', eventName, eventParams);
    }
  }

  static getSettingsSchema(): PluginSettings {
    return GoogleAnalyticsPlugin.settingsSchema;
  }
}
```

### SEO Tools Plugin

```typescript
// plugins/seo-tools/index.ts
import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export class SEOToolsPlugin extends BasePlugin {
  private static settingsSchema: PluginSettings = {
    title: {
      type: 'string',
      label: 'Default Title',
      required: false,
      default: '',
      description: 'Default meta title for pages'
    },
    description: {
      type: 'string',
      label: 'Default Description',
      required: false,
      default: '',
      description: 'Default meta description for pages'
    },
    keywords: {
      type: 'string',
      label: 'Default Keywords',
      required: false,
      default: '',
      description: 'Default meta keywords (comma-separated)'
    }
  };

  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;

    try {
      const settings = this.config.settings || {};
      
      // Apply default SEO meta tags
      if (settings.title) {
        this.injectMetaTag('title', settings.title);
        document.title = settings.title;
      }
      
      if (settings.description) {
        this.injectMetaTag('description', settings.description);
      }
      
      if (settings.keywords) {
        this.injectMetaTag('keywords', settings.keywords);
      }

      // Apply Open Graph meta tags
      this.injectMetaTag('og:title', settings.title || document.title);
      this.injectMetaTag('og:description', settings.description || '');
      this.injectMetaTag('og:type', 'website');
      this.injectMetaTag('og:url', window.location.href);

      // Apply Twitter Card meta tags
      this.injectMetaTag('twitter:card', 'summary');
      this.injectMetaTag('twitter:title', settings.title || document.title);
      this.injectMetaTag('twitter:description', settings.description || '');

      this.isLoaded = true;
      console.log('SEO Tools plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load SEO Tools plugin:', error);
    }
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;

    try {
      // Remove SEO meta tags
      const seoMetaTags = [
        'title', 'description', 'keywords', 'robots', 'googlebot',
        'og:title', 'og:description', 'og:type', 'og:url', 'og:image',
        'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'
      ];

      seoMetaTags.forEach(tagName => {
        const meta = document.querySelector(`meta[name="${tagName}"]`);
        if (meta) {
          meta.remove();
        }
      });

      this.isLoaded = false;
      console.log('SEO Tools plugin unloaded successfully');
    } catch (error) {
      console.error('Failed to unload SEO Tools plugin:', error);
    }
  }

  // Public methods for dynamic SEO updates
  updateTitle(title: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;
    
    document.title = title;
    this.injectMetaTag('og:title', title);
    this.injectMetaTag('twitter:title', title);
  }

  updateDescription(description: string): void {
    if (typeof window === 'undefined' || !this.isLoaded) return;
    
    this.injectMetaTag('description', description);
    this.injectMetaTag('og:description', description);
    this.injectMetaTag('twitter:description', description);
  }

  static getSettingsSchema(): PluginSettings {
    return SEOToolsPlugin.settingsSchema;
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Plugin Tidak Terload

**Problem**: Plugin tidak terload meskipun sudah diaktifkan di admin panel.

**Solution**:
- Periksa console untuk error message
- Pastikan plugin sudah diregistrasi dengan benar
- Validasi konfigurasi plugin
- Cek apakah `isActive` bernilai `true`

```typescript
// Debug: Check registered plugins
const pluginManager = PluginManager.getInstance();
console.log('Registered plugins:', pluginManager.getRegistry().getAll());

// Debug: Check plugin config
const config = pluginManager.getPluginConfig('my-plugin');
console.log('Plugin config:', config);
```

#### 2. Event Listener Tidak Berfungsi

**Problem**: Event listener tidak dipanggil saat event di-emit.

**Solution**:
- Pastikan event listener sudah diregistrasi sebelum event di-emit
- Cek nama event (case-sensitive)
- Pastikan callback function valid

```typescript
// Debug: Check registered events
const eventEmitter = pluginManager.getEventEmitter();
console.log('Registered events:', eventEmitter.getEvents());

// Debug: Test event emission
eventEmitter.emit('testEvent', 'test data');
```

#### 3. Hook Tidak Dieksekusi

**Problem**: Hook tidak dieksekusi saat dipanggil.

**Solution**:
- Pastikan hook sudah diregistrasi
- Cek nama hook (case-sensitive)
- Validasi parameter yang dikirim ke hook

```typescript
// Debug: Check registered hooks
const hookManager = pluginManager.getHookManager();
console.log('Registered hooks:', hookManager.getHooks());

// Debug: Test hook execution
const results = hookManager.executeHook('testHook', 'test data');
console.log('Hook results:', results);
```

#### 4. Error Saat Inject Script

**Problem**: Error saat mencoba inject external script.

**Solution**:
- Pastikan URL script valid
- Cek network tab di browser dev tools
- Handle CORS issues jika ada

```typescript
// Debug: Check script injection
try {
  await this.injectScript('https://example.com/script.js');
} catch (error) {
  console.error('Script injection failed:', error);
}
```

#### 5. Plugin Tidak Terunload dengan Benar

**Problem**: Plugin tidak terunload dengan benar, meninggalkan sisa-sisa.

**Solution**:
- Pastikan semua event listener dan hook di-remove
- Hapus semua DOM elements yang ditambahkan plugin
- Clear semua references dan timers

```typescript
// Debug: Check plugin state
console.log('Plugin isLoaded:', this.isLoaded);

// Debug: Check remaining DOM elements
const scripts = document.querySelectorAll('script[src*="plugin-name"]');
console.log('Remaining scripts:', scripts.length);
```

### Best Practices

1. **Error Handling**: Selalu wrap async operations dalam try-catch
2. **Cleanup**: Pastikan semua resources dibersihkan saat unload
3. **Validation**: Validasi input dan konfigurasi sebelum digunakan
4. **Logging**: Log important events untuk debugging
5. **Testing**: Test plugin di berbagai kondisi (load/unload/reload)

### Performance Tips

1. **Lazy Loading**: Gunakan dynamic imports untuk plugin yang jarang digunakan
2. **Debouncing**: Debounce event handlers yang sering dipanggil
3. **Memory Management**: Hapus references yang tidak digunakan
4. **Bundle Size**: Monitor bundle size dan optimalkan jika perlu

---

## Kesimpulan

Nah, itu dia dokumentasi lengkap untuk Sistem Plugin Hybrid kita. Semoga dokumentasi ini membantu diriku di masa depan saat lupa bagaimana sistem ini bekerja. 😄

### Yang Sudah Kita Capai:

1. ✅ **Base Plugin System**: Dasar untuk semua plugin
2. ✅ **Event System**: Komunikasi antar plugin
3. ✅ **Hook System**: Ekstensi fungsionalitas
4. ✅ **Registry System**: Manajemen plugin
5. ✅ **Hybrid Manager**: Koordinasi semua komponen
6. ✅ **Singleton Pattern**: Akses global yang konsisten

### Yang Akan Datang:

- 🔄 **Phase 3**: Migrasi plugin-plugin spesifik
- 🚀 **Optimasi**: Performa dan bundle size
- 🎨 **UI/UX**: Admin panel yang lebih baik
- 📊 **Analytics**: Monitoring plugin performance

Semoga dokumentasi ini membantu! Jika ada yang kurang jelas, tanyakan saja ke diriku yang sekarang (waktu nulis dokumentasi ini). Good luck, diriku di masa depan! 🎉

---

*Dibuat dengan ❤️ oleh dirimu di masa lalu*  
*Tanggal: [Tanggal pembuatan dokumentasi]*  
*Version: 1.0.0*