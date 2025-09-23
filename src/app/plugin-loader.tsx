'use client';

import { useEffect } from 'react';
import { pluginManager } from '@/lib/plugin-manager';

// Simple plugin loader without dynamic imports for now
export function PluginLoader() {
  useEffect(() => {
    console.log('Plugin loader initialized');
    // For now, we'll skip automatic loading of active plugins
    // This prevents conflicts with admin pages
    // pluginManager.loadActivePlugins();
  }, []);

  return null;
}