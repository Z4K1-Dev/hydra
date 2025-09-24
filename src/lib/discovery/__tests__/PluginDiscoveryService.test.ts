import { PluginDiscoveryService, PluginManifest } from '../PluginDiscoveryService';
import { promises as fs } from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('PluginDiscoveryService', () => {
  let discoveryService: PluginDiscoveryService;
  let mockPluginDir: string;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPluginDir = '/test/plugins';
    
    discoveryService = new PluginDiscoveryService({
      directories: [mockPluginDir],
      recursive: true,
      includeDevPlugins: false,
      excludePatterns: ['*.test.*'],
      maxDepth: 3,
      watchMode: false,
    });
  });

  describe('Plugin Discovery', () => {
    it('should discover plugins in configured directories', async () => {
      // Mock file system
      mockFs.readdir.mockResolvedValue([
        { name: 'test-plugin', isDirectory: () => true },
        { name: 'another-plugin', isDirectory: () => true },
      ]);

      mockFs.stat.mockResolvedValue({
        mtime: new Date(),
        size: 1024,
        isFile: () => false,
        isDirectory: () => true,
      } as any);

      mockFs.readFile.mockResolvedValue(JSON.stringify({
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        entrypoint: './index.js',
        capabilities: ['test'],
        permissions: [],
        author: 'Test Author',
      }));

      const plugins = await discoveryService.discoverPlugins();

      expect(plugins).toHaveLength(2);
      expect(plugins[0].manifest.name).toBe('test-plugin');
      expect(plugins[0].isValid).toBe(true);
    });

    it('should handle directory read errors gracefully', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'));

      const plugins = await discoveryService.discoverPlugins();

      expect(plugins).toHaveLength(0);
    });

    it('should skip excluded patterns', async () => {
      mockFs.readdir.mockResolvedValue([
        { name: 'test-plugin', isDirectory: () => true },
        { name: 'test-plugin.test', isDirectory: () => true },
      ]);

      mockFs.stat.mockResolvedValue({
        mtime: new Date(),
        size: 1024,
        isFile: () => false,
        isDirectory: () => true,
      } as any);

      const plugins = await discoveryService.discoverPlugins();

      expect(plugins).toHaveLength(1);
      expect(plugins[0].manifest.name).toBe('test-plugin');
    });
  });

  describe('Plugin Manifest Validation', () => {
    it('should validate correct manifest', () => {
      const validManifest: PluginManifest = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        entrypoint: './index.js',
        capabilities: ['test'],
        permissions: [],
        author: 'Test Author',
      };

      const service = new PluginDiscoveryService();
      const validation = (service as any).validateManifest(validManifest);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject manifest with missing required fields', () => {
      const invalidManifest = {
        name: 'test-plugin',
        // Missing version, description, entrypoint, capabilities
      };

      const service = new PluginDiscoveryService();
      const validation = (service as any).validateManifest(invalidManifest);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate semantic versioning', () => {
      const service = new PluginDiscoveryService();

      const validVersion = (service as any).isValidVersion('1.0.0');
      const validVersionWithPrerelease = (service as any).isValidVersion('1.0.0-alpha.1');
      const invalidVersion = (service as any).isValidVersion('1.0');

      expect(validVersion).toBe(true);
      expect(validVersionWithPrerelease).toBe(true);
      expect(invalidVersion).toBe(false);
    });
  });

  describe('Plugin Loading', () => {
    it('should load plugin manifest successfully', async () => {
      const manifestContent = JSON.stringify({
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        entrypoint: './index.js',
        capabilities: ['test'],
        permissions: [],
        author: 'Test Author',
      });

      mockFs.readFile.mockResolvedValue(manifestContent);
      mockFs.stat.mockResolvedValue({
        mtime: new Date(),
        size: manifestContent.length,
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      const service = new PluginDiscoveryService();
      const metadata = await (service as any).loadPluginManifest('/test/plugin');

      expect(metadata).toBeTruthy();
      expect(metadata!.manifest.name).toBe('test-plugin');
      expect(metadata!.isValid).toBe(true);
    });

    it('should handle manifest loading errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const service = new PluginDiscoveryService();
      const metadata = await (service as any).loadPluginManifest('/test/plugin');

      expect(metadata).toBeNull();
    });
  });

  describe('Plugin Filtering', () => {
    it('should get plugin by name', async () => {
      const mockPlugins = [
        {
          manifest: { name: 'test-plugin' },
          path: '/test/plugin',
          isValid: true,
          validationErrors: [],
          lastModified: new Date(),
          fileSize: 1024,
          checksum: 'abc123',
        },
      ];

      jest.spyOn(discoveryService, 'discoverPlugins').mockResolvedValue(mockPlugins);

      const plugin = await discoveryService.getPluginByName('test-plugin');

      expect(plugin).toBeTruthy();
      expect(plugin!.manifest.name).toBe('test-plugin');
    });

    it('should return null for non-existent plugin', async () => {
      jest.spyOn(discoveryService, 'discoverPlugins').mockResolvedValue([]);

      const plugin = await discoveryService.getPluginByName('non-existent');

      expect(plugin).toBeNull();
    });

    it('should filter plugins by capability', async () => {
      const mockPlugins = [
        {
          manifest: { name: 'plugin1', capabilities: ['analytics'] },
          path: '/test/plugin1',
          isValid: true,
          validationErrors: [],
          lastModified: new Date(),
          fileSize: 1024,
          checksum: 'abc123',
        },
        {
          manifest: { name: 'plugin2', capabilities: ['seo'] },
          path: '/test/plugin2',
          isValid: true,
          validationErrors: [],
          lastModified: new Date(),
          fileSize: 1024,
          checksum: 'def456',
        },
      ];

      jest.spyOn(discoveryService, 'discoverPlugins').mockResolvedValue(mockPlugins);

      const analyticsPlugins = await discoveryService.getPluginsByCapability('analytics');
      const seoPlugins = await discoveryService.getPluginsByCapability('seo');

      expect(analyticsPlugins).toHaveLength(1);
      expect(analyticsPlugins[0].manifest.name).toBe('plugin1');
      expect(seoPlugins).toHaveLength(1);
      expect(seoPlugins[0].manifest.name).toBe('plugin2');
    });
  });

  describe('Dependency Validation', () => {
    it('should validate plugin dependencies successfully', async () => {
      const mockPlugin = {
        manifest: { name: 'plugin1', dependencies: ['plugin2'] },
        path: '/test/plugin1',
        isValid: true,
        validationErrors: [],
        lastModified: new Date(),
        fileSize: 1024,
        checksum: 'abc123',
      };

      const mockDependencyPlugin = {
        manifest: { name: 'plugin2' },
        path: '/test/plugin2',
        isValid: true,
        validationErrors: [],
        lastModified: new Date(),
        fileSize: 1024,
        checksum: 'def456',
      };

      jest.spyOn(discoveryService, 'discoverPlugins').mockResolvedValue([mockDependencyPlugin]);

      const validation = await discoveryService.validateDependencies(mockPlugin);

      expect(validation.valid).toBe(true);
      expect(validation.missing).toHaveLength(0);
    });

    it('should detect missing dependencies', async () => {
      const mockPlugin = {
        manifest: { name: 'plugin1', dependencies: ['plugin2', 'plugin3'] },
        path: '/test/plugin1',
        isValid: true,
        validationErrors: [],
        lastModified: new Date(),
        fileSize: 1024,
        checksum: 'abc123',
      };

      jest.spyOn(discoveryService, 'discoverPlugins').mockResolvedValue([]);

      const validation = await discoveryService.validateDependencies(mockPlugin);

      expect(validation.valid).toBe(false);
      expect(validation.missing).toHaveLength(2);
      expect(validation.missing).toContain('plugin2');
      expect(validation.missing).toContain('plugin3');
    });
  });

  describe('Statistics', () => {
    it('should generate correct statistics', async () => {
      const mockPlugins = [
        {
          manifest: { name: 'plugin1', capabilities: ['analytics'], category: 'analytics' },
          path: '/test/plugin1',
          isValid: true,
          validationErrors: [],
          lastModified: new Date(),
          fileSize: 1024,
          checksum: 'abc123',
        },
        {
          manifest: { name: 'plugin2', capabilities: ['seo'], category: 'seo' },
          path: '/test/plugin2',
          isValid: true,
          validationErrors: [],
          lastModified: new Date(),
          fileSize: 1024,
          checksum: 'def456',
        },
        {
          manifest: { name: 'plugin3', capabilities: ['analytics'], category: 'analytics' },
          path: '/test/plugin3',
          isValid: false,
          validationErrors: ['error'],
          lastModified: new Date(),
          fileSize: 1024,
          checksum: 'ghi789',
        },
      ];

      jest.spyOn(discoveryService, 'discoverPlugins').mockResolvedValue(mockPlugins);

      const stats = await discoveryService.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.valid).toBe(2);
      expect(stats.invalid).toBe(1);
      expect(stats.categories.analytics).toBe(2);
      expect(stats.categories.seo).toBe(1);
      expect(stats.capabilities.analytics).toBe(2);
      expect(stats.capabilities.seo).toBe(1);
    });
  });

  describe('Import/Export', () => {
    it('should export plugin registry', async () => {
      const mockPlugins = [
        {
          manifest: { name: 'plugin1', version: '1.0.0' },
          path: '/test/plugin1',
          isValid: true,
          validationErrors: [],
          lastModified: new Date(),
          fileSize: 1024,
          checksum: 'abc123',
        },
      ];

      jest.spyOn(discoveryService, 'discoverPlugins').mockResolvedValue(mockPlugins);

      const registry = await discoveryService.exportRegistry();

      expect(registry).toContain('"name": "plugin1"');
      expect(registry).toContain('"version": "1.0.0"');
      expect(registry).toContain('"exportedAt"');
    });

    it('should import plugin registry', async () => {
      const registryData = JSON.stringify({
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        plugins: [
          {
            manifest: { name: 'plugin1' },
            path: '/test/plugin1',
            checksum: 'abc123',
            lastModified: new Date(),
          },
        ],
      });

      const result = await discoveryService.importRegistry(registryData);

      expect(result.success).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid registry data', async () => {
      const result = await discoveryService.importRegistry('invalid json');

      expect(result.success).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('File Watching', () => {
    it('should start watching directories', async () => {
      const watchOptions = { ...discoveryService['options'], watchMode: true };
      const service = new PluginDiscoveryService(watchOptions);

      const mockWatcher = {
        close: jest.fn(),
      };

      // Mock fs.watch
      const originalWatch = mockFs.watch;
      mockFs.watch.mockImplementation((path, options, callback) => {
        process.nextTick(() => callback('change', 'plugin.json'));
        return mockWatcher as any;
      });

      mockFs.readdir.mockResolvedValue([]);
      mockFs.stat.mockResolvedValue({
        mtime: new Date(),
        size: 1024,
        isFile: () => false,
        isDirectory: () => true,
      } as any);

      await service.startWatching();

      expect(mockFs.watch).toHaveBeenCalled();
      expect(service['watchers'].size).toBeGreaterThan(0);

      // Cleanup
      service.stopWatching();
      mockFs.watch = originalWatch;
    });

    it('should stop watching directories', () => {
      const mockWatcher = {
        close: jest.fn(),
      };

      discoveryService['watchers'].set('/test', mockWatcher as any);

      discoveryService.stopWatching();

      expect(mockWatcher.close).toHaveBeenCalled();
      expect(discoveryService['watchers'].size).toBe(0);
    });
  });

  describe('Change Notifications', () => {
    it('should notify change listeners', () => {
      const mockCallback = jest.fn();
      
      discoveryService.onChange(mockCallback);
      
      const event = {
        type: 'manifest-changed',
        path: '/test/plugin',
        filename: 'plugin.json',
        eventType: 'change',
        timestamp: new Date(),
      };

      (discoveryService as any).notifyChangeListeners(event);

      expect(mockCallback).toHaveBeenCalledWith(event);
    });

    it('should handle callback errors gracefully', () => {
      const mockCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      discoveryService.onChange(mockCallback);

      const event = {
        type: 'manifest-changed',
        path: '/test/plugin',
        filename: 'plugin.json',
        eventType: 'change',
        timestamp: new Date(),
      };

      expect(() => {
        (discoveryService as any).notifyChangeListeners(event);
      }).not.toThrow();
    });
  });

  describe('Caching', () => {
    it('should cache discovery results', async () => {
      const mockPlugins = [
        {
          manifest: { name: 'test-plugin' },
          path: '/test/plugin',
          isValid: true,
          validationErrors: [],
          lastModified: new Date(),
          fileSize: 1024,
          checksum: 'abc123',
        },
      ];

      jest.spyOn(discoveryService, 'discoverInDirectory').mockResolvedValue(mockPlugins);

      await discoveryService.discoverPlugins();

      const cachedPlugins = discoveryService.getCachedPlugins();

      expect(cachedPlugins).toHaveLength(1);
      expect(cachedPlugins[0].manifest.name).toBe('test-plugin');
    });

    it('should clear cache', () => {
      discoveryService['cache'].set('all', [
        {
          manifest: { name: 'test-plugin' },
          path: '/test/plugin',
          isValid: true,
          validationErrors: [],
          lastModified: new Date(),
          fileSize: 1024,
          checksum: 'abc123',
        },
      ]);

      discoveryService.clearCache();

      expect(discoveryService.getCachedPlugins()).toHaveLength(0);
    });
  });
});