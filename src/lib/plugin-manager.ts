import { useEffect } from 'react';
import { pluginManager } from '@/plugins/base-plugin';

// Import all plugins
import { GoogleAnalyticsPlugin } from '@/plugins/google-analytics';
import { SEOToolsPlugin } from '@/plugins/seo-tools';
import { SitemapGeneratorPlugin } from '@/plugins/sitemap-generator';
import { RichSnippetPlugin } from '@/plugins/rich-snippet';
import { GoogleLocalPlugin } from '@/plugins/google-local';
import { KeywordTaggingPlugin } from '@/plugins/keyword-tagging';

// Register all plugins
pluginManager.registerPlugin('google-analytics', GoogleAnalyticsPlugin);
pluginManager.registerPlugin('seo-tools', SEOToolsPlugin);
pluginManager.registerPlugin('sitemap-generator', SitemapGeneratorPlugin);
pluginManager.registerPlugin('rich-snippet', RichSnippetPlugin);
pluginManager.registerPlugin('google-local', GoogleLocalPlugin);
pluginManager.registerPlugin('keyword-tagging', KeywordTaggingPlugin);

// Make plugin manager globally available
if (typeof window !== 'undefined') {
  (window as any).pluginManager = pluginManager;
}

// Hook for loading plugins
export const usePlugins = () => {
  useEffect(() => {
    const loadActivePlugins = async () => {
      try {
        // Try to fetch active plugins from API
        const response = await fetch('/api/plugins/active');
        if (response.ok) {
          const activePlugins = await response.json();
          
          // Load each active plugin
          for (const plugin of activePlugins) {
            if (plugin.isActive) {
              await pluginManager.loadPlugin(plugin.name, plugin.config);
            }
          }
        } else {
          // Fallback to default plugins if API fails
          await loadDefaultPlugins();
        }
      } catch (error) {
        console.error('Error loading active plugins:', error);
        // Fallback to default plugins
        await loadDefaultPlugins();
      }
    };

    const loadDefaultPlugins = async () => {
      // Load default plugins with basic configuration
      const defaultPlugins = [
        {
          name: 'seo-tools',
          config: {
            name: 'seo-tools',
            description: 'SEO Tools Plugin',
            version: '1.0.0',
            isActive: true,
            settings: {
              title: 'My Awesome Website',
              description: 'A modern website with amazing features',
              keywords: 'awesome, website, modern, features',
              enableStructuredData: true
            }
          }
        }
      ];

      for (const plugin of defaultPlugins) {
        await pluginManager.loadPlugin(plugin.name, plugin.config);
      }
    };

    loadActivePlugins();
  }, []);
};

// Hook for managing plugins
export const usePluginManager = () => {
  const loadPlugin = async (name: string, config: any) => {
    await pluginManager.loadPlugin(name, config);
  };

  const unloadPlugin = async (name: string) => {
    await pluginManager.unloadPlugin(name);
  };

  const getPluginConfig = (name: string) => {
    return pluginManager.getPluginConfig(name);
  };

  const getEventEmitter = () => {
    return pluginManager.getEventEmitter();
  };

  const getHookManager = () => {
    return pluginManager.getHookManager();
  };

  return {
    loadPlugin,
    unloadPlugin,
    getPluginConfig,
    getEventEmitter,
    getHookManager,
    pluginManager
  };
};

// Hook for Google Analytics
export const useGoogleAnalytics = () => {
  const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    const plugin = pluginManager.getRegistry().getInstance('google-analytics');
    if (plugin && typeof (plugin as any).trackEvent === 'function') {
      (plugin as any).trackEvent(eventName, eventParams);
    }
  };

  const trackConversion = (conversionId: string, conversionLabel: string) => {
    const plugin = pluginManager.getRegistry().getInstance('google-analytics');
    if (plugin && typeof (plugin as any).trackConversion === 'function') {
      (plugin as any).trackConversion(conversionId, conversionLabel);
    }
  };

  return { trackEvent, trackConversion };
};

// Hook for SEO Tools
export const useSEOTools = () => {
  const updateTitle = (title: string) => {
    const plugin = pluginManager.getRegistry().getInstance('seo-tools');
    if (plugin && typeof (plugin as any).updateTitle === 'function') {
      (plugin as any).updateTitle(title);
    }
  };

  const updateDescription = (description: string) => {
    const plugin = pluginManager.getRegistry().getInstance('seo-tools');
    if (plugin && typeof (plugin as any).updateDescription === 'function') {
      (plugin as any).updateDescription(description);
    }
  };

  const updateKeywords = (keywords: string) => {
    const plugin = pluginManager.getRegistry().getInstance('seo-tools');
    if (plugin && typeof (plugin as any).updateKeywords === 'function') {
      (plugin as any).updateKeywords(keywords);
    }
  };

  const analyzePageSEO = () => {
    const plugin = pluginManager.getRegistry().getInstance('seo-tools');
    if (plugin && typeof (plugin as any).analyzePageSEO === 'function') {
      return (plugin as any).analyzePageSEO();
    }
    return null;
  };

  return { updateTitle, updateDescription, updateKeywords, analyzePageSEO };
};

// Hook for Sitemap Generator
export const useSitemapGenerator = () => {
  const addURL = (path: string, options?: any) => {
    const plugin = pluginManager.getRegistry().getInstance('sitemap-generator');
    if (plugin && typeof (plugin as any).addURL === 'function') {
      (plugin as any).addURL(path, options);
    }
  };

  const removeURL = (path: string) => {
    const plugin = pluginManager.getRegistry().getInstance('sitemap-generator');
    if (plugin && typeof (plugin as any).removeURL === 'function') {
      (plugin as any).removeURL(path);
    }
  };

  const generateSitemap = async () => {
    const plugin = pluginManager.getRegistry().getInstance('sitemap-generator');
    if (plugin && typeof (plugin as any).generateSitemap === 'function') {
      return await (plugin as any).generateSitemap();
    }
    return null;
  };

  const getURLs = () => {
    const plugin = pluginManager.getRegistry().getInstance('sitemap-generator');
    if (plugin && typeof (plugin as any).getURLs === 'function') {
      return (plugin as any).getURLs();
    }
    return [];
  };

  return { addURL, removeURL, generateSitemap, getURLs };
};

// Hook for Rich Snippet
export const useRichSnippet = () => {
  const addArticleSnippet = (data: any) => {
    const plugin = pluginManager.getRegistry().getInstance('rich-snippet');
    if (plugin && typeof (plugin as any).addArticleSnippet === 'function') {
      (plugin as any).addArticleSnippet(data);
    }
  };

  const addProductSnippet = (data: any) => {
    const plugin = pluginManager.getRegistry().getInstance('rich-snippet');
    if (plugin && typeof (plugin as any).addProductSnippet === 'function') {
      (plugin as any).addProductSnippet(data);
    }
  };

  const addLocalBusinessSnippet = (data: any) => {
    const plugin = pluginManager.getRegistry().getInstance('rich-snippet');
    if (plugin && typeof (plugin as any).addLocalBusinessSnippet === 'function') {
      (plugin as any).addLocalBusinessSnippet(data);
    }
  };

  const getSnippets = () => {
    const plugin = pluginManager.getRegistry().getInstance('rich-snippet');
    if (plugin && typeof (plugin as any).getSnippets === 'function') {
      return (plugin as any).getSnippets();
    }
    return [];
  };

  return { addArticleSnippet, addProductSnippet, addLocalBusinessSnippet, getSnippets };
};

// Hook for Google Local
export const useGoogleLocal = () => {
  const getDirections = async (destination?: string) => {
    const plugin = pluginManager.getRegistry().getInstance('google-local');
    if (plugin && typeof (plugin as any).getDirections === 'function') {
      return await (plugin as any).getDirections(destination);
    }
    return null;
  };

  const calculateDistance = async (destination?: string) => {
    const plugin = pluginManager.getRegistry().getInstance('google-local');
    if (plugin && typeof (plugin as any).calculateDistance === 'function') {
      return await (plugin as any).calculateDistance(destination);
    }
    return null;
  };

  const getOpeningStatus = () => {
    const plugin = pluginManager.getRegistry().getInstance('google-local');
    if (plugin && typeof (plugin as any).getOpeningStatus === 'function') {
      return (plugin as any).getOpeningStatus();
    }
    return null;
  };

  const showMap = (container: string | HTMLElement, options?: any) => {
    const plugin = pluginManager.getRegistry().getInstance('google-local');
    if (plugin && typeof (plugin as any).showMap === 'function') {
      (plugin as any).showMap(container, options);
    }
  };

  return { getDirections, calculateDistance, getOpeningStatus, showMap };
};

// Hook for Keyword Tagging
export const useKeywordTagging = () => {
  const analyzeKeywords = async (content: string) => {
    const plugin = pluginManager.getRegistry().getInstance('keyword-tagging');
    if (plugin && typeof (plugin as any).analyzeKeywords === 'function') {
      return await (plugin as any).analyzeKeywords(content);
    }
    return null;
  };

  const getTopKeywords = (limit?: number) => {
    const plugin = pluginManager.getRegistry().getInstance('keyword-tagging');
    if (plugin && typeof (plugin as any).getTopKeywords === 'function') {
      return (plugin as any).getTopKeywords(limit);
    }
    return [];
  };

  const addCustomKeyword = (keyword: string, category?: string) => {
    const plugin = pluginManager.getRegistry().getInstance('keyword-tagging');
    if (plugin && typeof (plugin as any).addCustomKeyword === 'function') {
      (plugin as any).addCustomKeyword(keyword, category);
    }
  };

  const analyzeSEOPerformance = () => {
    const plugin = pluginManager.getRegistry().getInstance('keyword-tagging');
    if (plugin && typeof (plugin as any).analyzeSEOPerformance === 'function') {
      return (plugin as any).analyzeSEOPerformance();
    }
    return null;
  };

  return { analyzeKeywords, getTopKeywords, addCustomKeyword, analyzeSEOPerformance };
};

// Event utilities
export const usePluginEvents = () => {
  const eventEmitter = pluginManager.getEventEmitter();

  const on = (event: string, callback: (...args: any[]) => void) => {
    eventEmitter.on(event, callback);
  };

  const off = (event: string, callback: (...args: any[]) => void) => {
    eventEmitter.off(event, callback);
  };

  const emit = (event: string, ...args: any[]) => {
    eventEmitter.emit(event, ...args);
  };

  return { on, off, emit };
};

// Hook utilities
export const usePluginHooks = () => {
  const hookManager = pluginManager.getHookManager();

  const addHook = (hookName: string, callback: (...args: any[]) => any) => {
    hookManager.addHook(hookName, callback);
  };

  const removeHook = (hookName: string, callback: (...args: any[]) => any) => {
    hookManager.removeHook(hookName, callback);
  };

  const executeHook = (hookName: string, ...args: any[]) => {
    return hookManager.executeHook(hookName, ...args);
  };

  return { addHook, removeHook, executeHook };
};