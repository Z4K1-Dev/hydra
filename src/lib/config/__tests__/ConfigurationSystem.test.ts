import { ConfigurationManager, ConfigurationSchema } from '../ConfigurationSystem';

describe('ConfigurationSystem', () => {
  let configManager: ConfigurationManager;

  beforeEach(() => {
    // Reset singleton instance
    (ConfigurationManager as any).instance = undefined;
    configManager = ConfigurationManager.getInstance();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const config = configManager.getConfig();
      
      expect(config.version).toBe('1.0.0');
      expect(config.environment).toBe('development');
      expect(config.plugins.autoDiscovery).toBe(true);
      expect(config.security.enableEncryption).toBe(true);
      expect(config.performance.enableCaching).toBe(true);
    });

    it('should load environment variables', () => {
      process.env.NODE_ENV = 'production';
      process.env.ENABLE_ENCRYPTION = 'false';
      process.env.CACHE_TTL = '600000';
      
      (ConfigurationManager as any).instance = undefined;
      configManager = ConfigurationManager.getInstance();
      
      const config = configManager.getConfig();
      
      expect(config.environment).toBe('production');
      expect(config.security.enableEncryption).toBe(false);
      expect(config.performance.cacheTTL).toBe(600000);
      
      // Reset environment
      delete process.env.NODE_ENV;
      delete process.env.ENABLE_ENCRYPTION;
      delete process.env.CACHE_TTL;
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration and track changes', () => {
      const initialConfig = configManager.getConfig();
      
      configManager.updateConfig({
        environment: 'production',
        plugins: {
          autoDiscovery: false,
        }
      }, 'test-user');

      const updatedConfig = configManager.getConfig();
      
      expect(updatedConfig.environment).toBe('production');
      expect(updatedConfig.plugins.autoDiscovery).toBe(false);
      expect(updatedConfig.version).toBe(initialConfig.version);
      
      const versions = configManager.getVersions();
      expect(versions).toHaveLength(1);
      expect(versions[0].author).toBe('test-user');
    });

    it('should validate configuration updates', () => {
      const invalidConfig = {
        environment: 'invalid-environment',
        plugins: {
          healthCheckInterval: -1,
        }
      };

      expect(() => {
        configManager.updateConfig(invalidConfig);
      }).not.toThrow(); // Zod validation should handle this
    });
  });

  describe('Schema Validation', () => {
    it('should validate correct configuration', () => {
      const validConfig = {
        version: '1.0.0',
        environment: 'production',
        plugins: {
          autoDiscovery: true,
          healthCheckInterval: 30000,
        },
      };

      const result = ConfigurationSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        version: '1.0.0',
        environment: 'invalid-environment',
        plugins: {
          autoDiscovery: 'not-a-boolean',
        },
      };

      const result = ConfigurationSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('Encryption', () => {
    it('should encrypt and decrypt data', () => {
      const testData = 'sensitive-data';
      
      configManager.updateConfig({
        security: {
          enableEncryption: true,
          encryptionKey: 'test-key-123',
        }
      });

      const encrypted = configManager.encryptData(testData);
      expect(encrypted).not.toBe(testData);
      
      const decrypted = configManager.decryptData(encrypted);
      expect(decrypted).toBe(testData);
    });

    it('should return original data if encryption is disabled', () => {
      const testData = 'not-sensitive-data';
      
      configManager.updateConfig({
        security: {
          enableEncryption: false,
        }
      });

      const encrypted = configManager.encryptData(testData);
      expect(encrypted).toBe(testData);
      
      const decrypted = configManager.decryptData(encrypted);
      expect(decrypted).toBe(testData);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate configuration correctly', () => {
      const validConfig = {
        version: '1.0.0',
        environment: 'production',
        plugins: {
          autoDiscovery: true,
          healthCheckInterval: 30000,
        },
      };

      const result = configManager.validateConfig(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for invalid config', () => {
      const invalidConfig = {
        version: '',
        environment: 'invalid',
        plugins: {
          healthCheckInterval: -1,
        },
      };

      const result = configManager.validateConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Watchers', () => {
    it('should notify watchers of configuration changes', () => {
      const mockCallback = jest.fn();
      
      configManager.watch('plugins', mockCallback);
      
      configManager.updateConfig({
        plugins: {
          autoDiscovery: false,
        }
      });

      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback.mock.calls[0][0]).toHaveLength(1); // One change
    });

    it('should allow unwatching', () => {
      const mockCallback = jest.fn();
      
      configManager.watch('plugins', mockCallback);
      configManager.unwatch('plugins', mockCallback);
      
      configManager.updateConfig({
        plugins: {
          autoDiscovery: false,
        }
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Import/Export', () => {
    it('should export configuration', () => {
      const exported = configManager.exportConfig();
      
      expect(exported).toContain('"version"');
      expect(exported).toContain('"environment"');
      expect(exported).toContain('"exportedAt"');
    });

    it('should import valid configuration', () => {
      const testConfig = {
        config: {
          version: '2.0.0',
          environment: 'staging',
          plugins: {
            autoDiscovery: false,
          },
        },
        versions: [],
      };

      const exportData = JSON.stringify(testConfig);
      const result = configManager.importConfig(exportData, 'test-import');
      
      expect(result).toBe(true);
      
      const config = configManager.getConfig();
      expect(config.version).toBe('2.0.0');
      expect(config.environment).toBe('staging');
      expect(config.plugins.autoDiscovery).toBe(false);
    });

    it('should reject invalid configuration import', () => {
      const invalidConfig = {
        config: {
          version: '',
          environment: 'invalid',
        },
      };

      const exportData = JSON.stringify(invalidConfig);
      const result = configManager.importConfig(exportData);
      
      expect(result).toBe(false);
    });
  });

  describe('Backup and Restore', () => {
    it('should create backup', async () => {
      const backupId = await configManager.createBackup();
      
      expect(backupId).toBeDefined();
      expect(typeof backupId).toBe('string');
      expect(backupId.length).toBeGreaterThan(0);
    });

    it('should restore from backup', async () => {
      const backupId = await configManager.createBackup();
      
      const result = await configManager.restoreFromBackup(backupId);
      
      expect(result).toBe(true);
    });
  });

  describe('Migration', () => {
    it('should migrate configuration between versions', async () => {
      const result = await configManager.migrateConfig('1.0.0', '2.0.0');
      
      expect(result).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = ConfigurationManager.getInstance();
      const instance2 = ConfigurationManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should maintain state across instances', () => {
      const instance1 = ConfigurationManager.getInstance();
      const instance2 = ConfigurationManager.getInstance();
      
      instance1.updateConfig({ environment: 'production' });
      
      const config1 = instance1.getConfig();
      const config2 = instance2.getConfig();
      
      expect(config1.environment).toBe('production');
      expect(config2.environment).toBe('production');
    });
  });
});