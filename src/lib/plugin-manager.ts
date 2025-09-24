import { useEffect } from 'react';
import { getGlobalHybridManager, HybridSystemFactory } from '@/lib/hybrid-system';
import { BasePlugin, PluginConfig } from '@/plugins/base-plugin';

// Import all plugins
import { GoogleAnalyticsPlugin } from '@/plugins/google-analytics';
import { SEOToolsPlugin } from '@/plugins/seo-tools';
import { SitemapGeneratorPlugin } from '@/plugins/sitemap-generator';
import { RichSnippetPlugin } from '@/plugins/rich-snippet';
import { GoogleLocalPlugin } from '@/plugins/google-local';
import { KeywordTaggingPlugin } from '@/plugins/keyword-tagging';

// Initialize hybrid system with enhanced configuration
const hybridManager = getGlobalHybridManager() || HybridSystemFactory.create({
  enableDebugMode: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: true,
  maxEventHistory: 1000,
  maxHookCacheSize: 100,
  cleanupInterval: 60000
});

// Register all plugins with hybrid system
const registerPlugins = async () => {
  if (!hybridManager.isInitialized) {
    await hybridManager.initialize();
  }
  
  // Create plugin instances with enhanced configuration
  const plugins = [
    {
      name: 'google-analytics',
      instance: new GoogleAnalyticsPlugin({
        name: 'google-analytics',
        description: 'Google Analytics integration for website tracking',
        version: '1.0.0',
        isActive: false,
        settings: {
          trackingId: '',
          anonymizeIp: true,
          enableDemographics: false
        }
      })
    },
    {
      name: 'seo-tools',
      instance: new SEOToolsPlugin({
        name: 'seo-tools',
        description: 'SEO tools for meta tags and structured data',
        version: '1.0.0',
        isActive: true,
        settings: {
          title: 'My Awesome Website',
          description: 'A modern website with amazing features',
          keywords: 'awesome, website, modern, features',
          author: '',
          ogImage: '',
          twitterCard: 'summary'
        }
      })
    },
    {
      name: 'sitemap-generator',
      instance: new SitemapGeneratorPlugin({
        name: 'sitemap-generator',
        description: 'Automatic sitemap generation for SEO',
        version: '1.0.0',
        isActive: true,
        settings: {
          baseUrl: '',
          autoGenerate: true,
          includeImages: true,
          defaultChangefreq: 'weekly',
          defaultPriority: 0.8
        }
      })
    },
    {
      name: 'rich-snippet',
      instance: new RichSnippetPlugin({
        name: 'rich-snippet',
        description: 'Rich snippet and structured data generation',
        version: '1.0.0',
        isActive: true,
        settings: {
          enableArticle: true,
          enableProduct: true,
          enableLocalBusiness: true,
          enableOrganization: true,
          defaultOrganization: {}
        }
      })
    },
    {
      name: 'google-local',
      instance: new GoogleLocalPlugin({
        name: 'google-local',
        description: 'Google Local Business integration',
        version: '1.0.0',
        isActive: false,
        settings: {
          placeId: '',
          apiKey: '',
          enableReviews: true,
          enableDirections: true,
          enablePhotos: true,
          mapContainerId: 'google-map'
        }
      })
    },
    {
      name: 'keyword-tagging',
      instance: new KeywordTaggingPlugin({
        name: 'keyword-tagging',
        description: 'Keyword analysis and tagging system',
        version: '1.0.0',
        isActive: true,
        settings: {
          primaryKeywords: [],
          secondaryKeywords: [],
          autoTag: true,
          densityThreshold: 0.5,
          maxKeywords: 10,
          enableMetaKeywords: true,
          enableContentAnalysis: true
        }
      })
    }
  ];

  // Load plugins into hybrid system
  for (const plugin of plugins) {
    try {
      await hybridManager.loadPlugin(plugin.instance, plugin.instance.config);
    } catch (error) {
      console.error(`Failed to load plugin ${plugin.name}:`, error);
    }
  }
};

// Make hybrid manager globally available for backward compatibility
if (typeof window !== 'undefined') {
  (window as any).hybridManager = hybridManager;
  (window as any).pluginManager = {
    // Backward compatibility methods
    registerPlugin: (name: string, pluginClass: any) => {
      console.warn('Using deprecated plugin registration. Please use hybrid system.');
    },
    loadPlugin: async (name: string, config: PluginConfig) => {
      console.warn('Using deprecated plugin loading. Please use hybrid system.');
    },
    unloadPlugin: async (name: string) => {
      console.warn('Using deprecated plugin unloading. Please use hybrid system.');
    },
    getEventEmitter: () => hybridManager.getEventEmitter(),
    getHookManager: () => hybridManager.getHookManager(),
    getRegistry: () => hybridManager.getRegistry(),
    getPluginConfig: (name: string) => {
      const plugin = hybridManager.getRegistry().getPlugin(name);
      return plugin?.config;
    }
  };
}

// Enhanced hook for loading plugins with retry logic
export const usePlugins = () => {
  useEffect(() => {
    const loadActivePlugins = async () => {
      let retryCount = 0;
      const maxRetries = 3;
      
      const attemptLoad = async (): Promise<boolean> => {
        try {
          // Try to fetch active plugins from API
          const response = await fetch('/api/plugins/active');
          if (response.ok) {
            const activePlugins = await response.json();
            
            // Load each active plugin using hybrid system
            for (const plugin of activePlugins) {
              if (plugin.isActive) {
                try {
                  const pluginInstance = hybridManager.getRegistry().getPlugin(plugin.name);
                  if (pluginInstance) {
                    await hybridManager.loadPlugin(pluginInstance, plugin.config);
                  }
                } catch (pluginError) {
                  console.error(`Failed to load plugin ${plugin.name}:`, pluginError);
                }
              }
            }
            return true;
          } else {
            // Fallback to default plugins if API fails
            await loadDefaultPlugins();
            return true;
          }
        } catch (error) {
          console.error(`Attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return attemptLoad();
          } else {
            // Ultimate fallback
            await loadMinimalPlugins();
            return false;
          }
        }
      };
      
      await attemptLoad();
    };

    const loadDefaultPlugins = async () => {
      try {
        // Load default plugins with basic configuration using hybrid system
        const defaultPlugins = [
          {
            name: 'seo-tools',
            instance: new SEOToolsPlugin({
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
            })
          }
        ];

        for (const plugin of defaultPlugins) {
          try {
            await hybridManager.loadPlugin(plugin.instance, plugin.instance.config);
          } catch (error) {
            console.error(`Failed to load default plugin ${plugin.name}:`, error);
          }
        }
      } catch (error) {
        console.error('Error loading default plugins:', error);
        throw error;
      }
    };

    const loadMinimalPlugins = async () => {
      // Ultimate fallback - minimal plugin set
      try {
        const minimalPlugin = new SEOToolsPlugin({
          name: 'seo-tools',
          description: 'Basic SEO Tools',
          version: '1.0.0',
          isActive: true,
          settings: {
            title: 'Website',
            description: 'A website',
            keywords: 'website',
            enableStructuredData: false
          }
        });
        
        await hybridManager.loadPlugin(minimalPlugin, minimalPlugin.config);
      } catch (error) {
        console.error('Critical: Failed to load minimal plugins:', error);
      }
    };

    // Initialize and register plugins
    registerPlugins().then(() => {
      loadActivePlugins();
    }).catch(error => {
      console.error('Failed to initialize plugin system:', error);
      loadMinimalPlugins();
    });
  }, []);
};

// Enhanced hook for managing plugins with hybrid system
export const usePluginManager = () => {
  const loadPlugin = async (name: string, config: any) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin(name);
      if (plugin) {
        await hybridManager.loadPlugin(plugin, config);
      } else {
        throw new Error(`Plugin ${name} not found in registry`);
      }
    } catch (error) {
      console.error(`Failed to load plugin ${name}:`, error);
      throw error;
    }
  };

  const unloadPlugin = async (name: string) => {
    try {
      await hybridManager.unloadPlugin(name);
    } catch (error) {
      console.error(`Failed to unload plugin ${name}:`, error);
      throw error;
    }
  };

  const getPluginConfig = (name: string) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin(name);
      return plugin?.config;
    } catch (error) {
      console.error(`Failed to get config for plugin ${name}:`, error);
      return undefined;
    }
  };

  const getEventEmitter = () => {
    return hybridManager.getEventEmitter();
  };

  const getHookManager = () => {
    return hybridManager.getHookManager();
  };

  const getSystemStatus = () => {
    return hybridManager.getSystemStatus();
  };

  return {
    loadPlugin,
    unloadPlugin,
    getPluginConfig,
    getEventEmitter,
    getHookManager,
    getSystemStatus,
    hybridManager
  };
};

// Enhanced hook for Google Analytics with hybrid system
export const useGoogleAnalytics = () => {
  const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('google-analytics');
      if (plugin && typeof (plugin as any).trackEvent === 'function') {
        (plugin as any).trackEvent(eventName, eventParams);
        
        // Emit event through hybrid system
        hybridManager.getEventEmitter().emit('analytics:event', {
          eventName,
          eventParams,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  };

  const trackConversion = (conversionId: string, conversionLabel: string) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('google-analytics');
      if (plugin && typeof (plugin as any).trackConversion === 'function') {
        (plugin as any).trackConversion(conversionId, conversionLabel);
        
        // Emit conversion event through hybrid system
        hybridManager.getEventEmitter().emit('analytics:conversion', {
          conversionId,
          conversionLabel,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  };

  const getPluginStatus = () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('google-analytics');
      return {
        isLoaded: plugin ? hybridManager.getRegistry().isActive('google-analytics') : false,
        isActive: plugin?.config.isActive || false
      };
    } catch (error) {
      console.error('Failed to get plugin status:', error);
      return { isLoaded: false, isActive: false };
    }
  };

  return { trackEvent, trackConversion, getPluginStatus };
};

// Enhanced hook for SEO Tools with hybrid system
export const useSEOTools = () => {
  const updateTitle = (title: string) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('seo-tools');
      if (plugin && typeof (plugin as any).updateTitle === 'function') {
        (plugin as any).updateTitle(title);
        
        // Emit SEO update event through hybrid system
        hybridManager.getEventEmitter().emit('seo:title_updated', {
          title,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to update SEO title:', error);
    }
  };

  const updateDescription = (description: string) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('seo-tools');
      if (plugin && typeof (plugin as any).updateDescription === 'function') {
        (plugin as any).updateDescription(description);
        
        // Emit SEO update event through hybrid system
        hybridManager.getEventEmitter().emit('seo:description_updated', {
          description,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to update SEO description:', error);
    }
  };

  const updateKeywords = (keywords: string) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('seo-tools');
      if (plugin && typeof (plugin as any).updateKeywords === 'function') {
        (plugin as any).updateKeywords(keywords);
        
        // Emit SEO update event through hybrid system
        hybridManager.getEventEmitter().emit('seo:keywords_updated', {
          keywords,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to update SEO keywords:', error);
    }
  };

  const analyzePageSEO = () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('seo-tools');
      if (plugin && typeof (plugin as any).analyzePageSEO === 'function') {
        const analysis = (plugin as any).analyzePageSEO();
        
        // Emit SEO analysis event through hybrid system
        hybridManager.getEventEmitter().emit('seo:analysis_completed', {
          analysis,
          timestamp: Date.now()
        });
        
        return analysis;
      }
      return null;
    } catch (error) {
      console.error('Failed to analyze page SEO:', error);
      return null;
    }
  };

  const getPluginStatus = () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('seo-tools');
      return {
        isLoaded: plugin ? hybridManager.getRegistry().isActive('seo-tools') : false,
        isActive: plugin?.config.isActive || false
      };
    } catch (error) {
      console.error('Failed to get SEO plugin status:', error);
      return { isLoaded: false, isActive: false };
    }
  };

  return { updateTitle, updateDescription, updateKeywords, analyzePageSEO, getPluginStatus };
};

// Enhanced hook for Sitemap Generator with hybrid system
export const useSitemapGenerator = () => {
  const addURL = (path: string, options?: any) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('sitemap-generator');
      if (plugin && typeof (plugin as any).addURL === 'function') {
        (plugin as any).addURL(path, options);
        
        // Emit sitemap event through hybrid system
        hybridManager.getEventEmitter().emit('sitemap:url_added', {
          path,
          options,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to add URL to sitemap:', error);
    }
  };

  const removeURL = (path: string) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('sitemap-generator');
      if (plugin && typeof (plugin as any).removeURL === 'function') {
        (plugin as any).removeURL(path);
        
        // Emit sitemap event through hybrid system
        hybridManager.getEventEmitter().emit('sitemap:url_removed', {
          path,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to remove URL from sitemap:', error);
    }
  };

  const generateSitemap = async () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('sitemap-generator');
      if (plugin && typeof (plugin as any).generateSitemap === 'function') {
        const sitemap = await (plugin as any).generateSitemap();
        
        // Emit sitemap generation event through hybrid system
        hybridManager.getEventEmitter().emit('sitemap:generated', {
          sitemap,
          timestamp: Date.now()
        });
        
        return sitemap;
      }
      return null;
    } catch (error) {
      console.error('Failed to generate sitemap:', error);
      return null;
    }
  };

  const getURLs = () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('sitemap-generator');
      if (plugin && typeof (plugin as any).getURLs === 'function') {
        return (plugin as any).getURLs();
      }
      return [];
    } catch (error) {
      console.error('Failed to get sitemap URLs:', error);
      return [];
    }
  };

  const getPluginStatus = () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('sitemap-generator');
      return {
        isLoaded: plugin ? hybridManager.getRegistry().isActive('sitemap-generator') : false,
        isActive: plugin?.config.isActive || false
      };
    } catch (error) {
      console.error('Failed to get sitemap plugin status:', error);
      return { isLoaded: false, isActive: false };
    }
  };

  return { addURL, removeURL, generateSitemap, getURLs, getPluginStatus };
};

// Enhanced hook for Rich Snippet with hybrid system
export const useRichSnippet = () => {
  const addArticleSnippet = (data: any) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('rich-snippet');
      if (plugin && typeof (plugin as any).addArticleSnippet === 'function') {
        (plugin as any).addArticleSnippet(data);
        
        // Emit rich snippet event through hybrid system
        hybridManager.getEventEmitter().emit('rich_snippet:article_added', {
          data,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to add article snippet:', error);
    }
  };

  const addProductSnippet = (data: any) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('rich-snippet');
      if (plugin && typeof (plugin as any).addProductSnippet === 'function') {
        (plugin as any).addProductSnippet(data);
        
        // Emit rich snippet event through hybrid system
        hybridManager.getEventEmitter().emit('rich_snippet:product_added', {
          data,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to add product snippet:', error);
    }
  };

  const addLocalBusinessSnippet = (data: any) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('rich-snippet');
      if (plugin && typeof (plugin as any).addLocalBusinessSnippet === 'function') {
        (plugin as any).addLocalBusinessSnippet(data);
        
        // Emit rich snippet event through hybrid system
        hybridManager.getEventEmitter().emit('rich_snippet:local_business_added', {
          data,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to add local business snippet:', error);
    }
  };

  const getSnippets = () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('rich-snippet');
      if (plugin && typeof (plugin as any).getSnippets === 'function') {
        return (plugin as any).getSnippets();
      }
      return [];
    } catch (error) {
      console.error('Failed to get rich snippets:', error);
      return [];
    }
  };

  const getPluginStatus = () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('rich-snippet');
      return {
        isLoaded: plugin ? hybridManager.getRegistry().isActive('rich-snippet') : false,
        isActive: plugin?.config.isActive || false
      };
    } catch (error) {
      console.error('Failed to get rich snippet plugin status:', error);
      return { isLoaded: false, isActive: false };
    }
  };

  return { addArticleSnippet, addProductSnippet, addLocalBusinessSnippet, getSnippets, getPluginStatus };
};

// Enhanced hook for Google Local with hybrid system
export const useGoogleLocal = () => {
  const getDirections = async (destination?: string) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('google-local');
      if (plugin && typeof (plugin as any).getDirections === 'function') {
        const directions = await (plugin as any).getDirections(destination);
        
        // Emit Google Local event through hybrid system
        hybridManager.getEventEmitter().emit('google_local:directions_requested', {
          destination,
          directions,
          timestamp: Date.now()
        });
        
        return directions;
      }
      return null;
    } catch (error) {
      console.error('Failed to get directions:', error);
      return null;
    }
  };

  const calculateDistance = async (destination?: string) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('google-local');
      if (plugin && typeof (plugin as any).calculateDistance === 'function') {
        const distance = await (plugin as any).calculateDistance(destination);
        
        // Emit Google Local event through hybrid system
        hybridManager.getEventEmitter().emit('google_local:distance_calculated', {
          destination,
          distance,
          timestamp: Date.now()
        });
        
        return distance;
      }
      return null;
    } catch (error) {
      console.error('Failed to calculate distance:', error);
      return null;
    }
  };

  const getOpeningStatus = () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('google-local');
      if (plugin && typeof (plugin as any).getOpeningStatus === 'function') {
        const status = (plugin as any).getOpeningStatus();
        
        // Emit Google Local event through hybrid system
        hybridManager.getEventEmitter().emit('google_local:opening_status_requested', {
          status,
          timestamp: Date.now()
        });
        
        return status;
      }
      return null;
    } catch (error) {
      console.error('Failed to get opening status:', error);
      return null;
    }
  };

  const showMap = (container: string | HTMLElement, options?: any) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('google-local');
      if (plugin && typeof (plugin as any).showMap === 'function') {
        (plugin as any).showMap(container, options);
        
        // Emit Google Local event through hybrid system
        hybridManager.getEventEmitter().emit('google_local:map_shown', {
          container: typeof container === 'string' ? container : container.id,
          options,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to show map:', error);
    }
  };

  const getPluginStatus = () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('google-local');
      return {
        isLoaded: plugin ? hybridManager.getRegistry().isActive('google-local') : false,
        isActive: plugin?.config.isActive || false
      };
    } catch (error) {
      console.error('Failed to get Google Local plugin status:', error);
      return { isLoaded: false, isActive: false };
    }
  };

  return { getDirections, calculateDistance, getOpeningStatus, showMap, getPluginStatus };
};

// Enhanced hook for Keyword Tagging with hybrid system
export const useKeywordTagging = () => {
  const analyzeKeywords = async (content: string) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('keyword-tagging');
      if (plugin && typeof (plugin as any).analyzeKeywords === 'function') {
        const analysis = await (plugin as any).analyzeKeywords(content);
        
        // Emit keyword analysis event through hybrid system
        hybridManager.getEventEmitter().emit('keyword:analysis_completed', {
          content,
          analysis,
          timestamp: Date.now()
        });
        
        return analysis;
      }
      return null;
    } catch (error) {
      console.error('Failed to analyze keywords:', error);
      return null;
    }
  };

  const getTopKeywords = (limit?: number) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('keyword-tagging');
      if (plugin && typeof (plugin as any).getTopKeywords === 'function') {
        return (plugin as any).getTopKeywords(limit);
      }
      return [];
    } catch (error) {
      console.error('Failed to get top keywords:', error);
      return [];
    }
  };

  const addCustomKeyword = (keyword: string, category?: string) => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('keyword-tagging');
      if (plugin && typeof (plugin as any).addCustomKeyword === 'function') {
        (plugin as any).addCustomKeyword(keyword, category);
        
        // Emit keyword event through hybrid system
        hybridManager.getEventEmitter().emit('keyword:custom_added', {
          keyword,
          category,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to add custom keyword:', error);
    }
  };

  const analyzeSEOPerformance = () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('keyword-tagging');
      if (plugin && typeof (plugin as any).analyzeSEOPerformance === 'function') {
        const performance = (plugin as any).analyzeSEOPerformance();
        
        // Emit SEO performance event through hybrid system
        hybridManager.getEventEmitter().emit('keyword:seo_performance_analyzed', {
          performance,
          timestamp: Date.now()
        });
        
        return performance;
      }
      return null;
    } catch (error) {
      console.error('Failed to analyze SEO performance:', error);
      return null;
    }
  };

  const getPluginStatus = () => {
    try {
      const plugin = hybridManager.getRegistry().getPlugin('keyword-tagging');
      return {
        isLoaded: plugin ? hybridManager.getRegistry().isActive('keyword-tagging') : false,
        isActive: plugin?.config.isActive || false
      };
    } catch (error) {
      console.error('Failed to get keyword tagging plugin status:', error);
      return { isLoaded: false, isActive: false };
    }
  };

  return { analyzeKeywords, getTopKeywords, addCustomKeyword, analyzeSEOPerformance, getPluginStatus };
};

// Enhanced event utilities with hybrid system
export const usePluginEvents = () => {
  const eventEmitter = hybridManager.getEventEmitter();

  const on = (event: string, callback: (...args: any[]) => void) => {
    try {
      eventEmitter.on(event, callback);
    } catch (error) {
      console.error(`Failed to register event listener for ${event}:`, error);
    }
  };

  const off = (event: string, callback: (...args: any[]) => void) => {
    try {
      eventEmitter.off(event, callback);
    } catch (error) {
      console.error(`Failed to unregister event listener for ${event}:`, error);
    }
  };

  const emit = (event: string, ...args: any[]) => {
    try {
      eventEmitter.emit(event, ...args);
    } catch (error) {
      console.error(`Failed to emit event ${event}:`, error);
    }
  };

  const getEventHistory = () => {
    try {
      return eventEmitter.getEventHistory();
    } catch (error) {
      console.error('Failed to get event history:', error);
      return [];
    }
  };

  return { on, off, emit, getEventHistory };
};

// Enhanced hook utilities with hybrid system
export const usePluginHooks = () => {
  const hookManager = hybridManager.getHookManager();

  const addHook = (hookName: string, callback: (...args: any[]) => any, priority: number = 10) => {
    try {
      hookManager.addHook(hookName, callback, priority);
    } catch (error) {
      console.error(`Failed to add hook ${hookName}:`, error);
    }
  };

  const removeHook = (hookName: string, callback: (...args: any[]) => any) => {
    try {
      hookManager.removeHook(hookName, callback);
    } catch (error) {
      console.error(`Failed to remove hook ${hookName}:`, error);
    }
  };

  const executeHook = (hookName: string, ...args: any[]) => {
    try {
      return hookManager.executeHook(hookName, ...args);
    } catch (error) {
      console.error(`Failed to execute hook ${hookName}:`, error);
      return [];
    }
  };

  const getHooksStatus = () => {
    try {
      return hookManager.getStatus();
    } catch (error) {
      console.error('Failed to get hooks status:', error);
      return null;
    }
  };

  return { addHook, removeHook, executeHook, getHooksStatus };
};