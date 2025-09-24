import { BasePlugin, PluginConfig, PluginSettings } from '../base-plugin';

export class SimpleGoogleAnalyticsPlugin extends BasePlugin {
  constructor(config: PluginConfig) {
    super(config);
  }

  async load(): Promise<void> {
    if (typeof window === 'undefined' || this.isLoaded) return;
    
    console.log('Simple Google Analytics plugin loaded');
    this.isLoaded = true;
  }

  async unload(): Promise<void> {
    if (!this.isLoaded) return;
    
    console.log('Simple Google Analytics plugin unloaded');
    this.isLoaded = false;
  }
}