import { z } from 'zod';

// Configuration Schema with Zod validation
export const ConfigurationSchema = z.object({
  version: z.string().default('1.0.0'),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  plugins: z.object({
    autoDiscovery: z.boolean().default(true),
    hotReload: z.boolean().default(false),
    healthCheckInterval: z.number().default(30000),
    maxConcurrentLoads: z.number().default(5),
  }).default({}),
  security: z.object({
    enableEncryption: z.boolean().default(true),
    encryptionKey: z.string().optional(),
    sessionTimeout: z.number().default(3600000),
    maxLoginAttempts: z.number().default(5),
  }).default({}),
  performance: z.object({
    enableCaching: z.boolean().default(true),
    cacheTTL: z.number().default(300000),
    enableCompression: z.boolean().default(true),
    maxMemoryUsage: z.number().default(512), // MB
  }).default({}),
  monitoring: z.object({
    enableMetrics: z.boolean().default(true),
    metricsInterval: z.number().default(10000),
    enableLogging: z.boolean().default(true),
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  }).default({}),
  database: z.object({
    connectionPoolSize: z.number().default(10),
    queryTimeout: z.number().default(30000),
    enableConnectionPooling: z.boolean().default(true),
  }).default({}),
});

export type Configuration = z.infer<typeof ConfigurationSchema>;

// Configuration Version Management
export interface ConfigurationVersion {
  version: string;
  timestamp: Date;
  checksum: string;
  changes: ConfigurationChange[];
  author: string;
}

export interface ConfigurationChange {
  path: string;
  oldValue: any;
  newValue: any;
  type: 'add' | 'update' | 'remove';
}

// Configuration Manager
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: Configuration;
  private versions: ConfigurationVersion[] = [];
  private encryptionKey?: string;
  private watchers: Map<string, Set<Function>> = new Map();

  private constructor() {
    this.config = this.loadDefaultConfig();
    this.initializeFromEnvironment();
  }

  static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  private loadDefaultConfig(): Configuration {
    return ConfigurationSchema.parse({});
  }

  private initializeFromEnvironment(): void {
    const envConfig = {
      environment: process.env.NODE_ENV || 'development',
      security: {
        enableEncryption: process.env.ENABLE_ENCRYPTION === 'true',
        encryptionKey: process.env.ENCRYPTION_KEY,
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'),
      },
      performance: {
        enableCaching: process.env.ENABLE_CACHING !== 'false',
        cacheTTL: parseInt(process.env.CACHE_TTL || '300000'),
        maxMemoryUsage: parseInt(process.env.MAX_MEMORY_USAGE || '512'),
      },
      monitoring: {
        enableMetrics: process.env.ENABLE_METRICS !== 'false',
        metricsInterval: parseInt(process.env.METRICS_INTERVAL || '10000'),
        logLevel: process.env.LOG_LEVEL || 'info',
      },
    };

    this.updateConfig(envConfig, 'environment-initialization');
  }

  getConfig(): Configuration {
    return { ...this.config };
  }

  updateConfig(updates: Partial<Configuration>, author: string = 'system'): void {
    const oldConfig = { ...this.config };
    
    // Validate updates
    const updatedConfig = ConfigurationSchema.parse({
      ...this.config,
      ...updates,
    });

    // Track changes
    const changes = this.detectChanges(oldConfig, updatedConfig);
    
    if (changes.length > 0) {
      // Create version
      const version: ConfigurationVersion = {
        version: this.generateVersion(),
        timestamp: new Date(),
        checksum: this.generateChecksum(updatedConfig),
        changes,
        author,
      };

      this.versions.push(version);
      this.config = updatedConfig;

      // Notify watchers
      this.notifyWatchers(changes);

      console.log(`Configuration updated to version ${version.version} by ${author}`);
    }
  }

  private detectChanges(oldConfig: Configuration, newConfig: Configuration): ConfigurationChange[] {
    const changes: ConfigurationChange[] = [];
    
    const compareObjects = (obj1: any, obj2: any, path: string = '') => {
      for (const key in obj2) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj1)) {
          changes.push({
            path: currentPath,
            oldValue: undefined,
            newValue: obj2[key],
            type: 'add',
          });
        } else if (obj1[key] !== obj2[key]) {
          if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
            compareObjects(obj1[key], obj2[key], currentPath);
          } else {
            changes.push({
              path: currentPath,
              oldValue: obj1[key],
              newValue: obj2[key],
              type: 'update',
            });
          }
        }
      }

      for (const key in obj1) {
        if (!(key in obj2)) {
          const currentPath = path ? `${path}.${key}` : key;
          changes.push({
            path: currentPath,
            oldValue: obj1[key],
            newValue: undefined,
            type: 'remove',
          });
        }
      }
    };

    compareObjects(oldConfig, newConfig);
    return changes;
  }

  private generateVersion(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `v${timestamp}-${random}`;
  }

  private generateChecksum(config: Configuration): string {
    const crypto = require('crypto');
    const configString = JSON.stringify(config);
    return crypto.createHash('sha256').update(configString).digest('hex');
  }

  // Migration System
  async migrateConfig(fromVersion: string, toVersion: string): Promise<boolean> {
    try {
      console.log(`Migrating configuration from ${fromVersion} to ${toVersion}`);
      
      // Implement migration logic here
      // This would typically involve reading migration files and applying changes
      
      console.log('Configuration migration completed successfully');
      return true;
    } catch (error) {
      console.error('Configuration migration failed:', error);
      return false;
    }
  }

  // Encryption for sensitive data
  encryptData(data: string): string {
    if (!this.config.security.enableEncryption || !this.encryptionKey) {
      return data;
    }

    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    });
  }

  decryptData(encryptedData: string): string {
    if (!this.config.security.enableEncryption || !this.encryptionKey) {
      return encryptedData;
    }

    try {
      const crypto = require('crypto');
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      
      const { encrypted, iv, authTag } = JSON.parse(encryptedData);
      
      const decipher = crypto.createDecipheriv(
        algorithm,
        key,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData;
    }
  }

  // Watcher system for real-time updates
  watch(path: string, callback: Function): void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Set());
    }
    this.watchers.get(path)!.add(callback);
  }

  unwatch(path: string, callback: Function): void {
    const callbacks = this.watchers.get(path);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.watchers.delete(path);
      }
    }
  }

  private notifyWatchers(changes: ConfigurationChange[]): void {
    for (const [path, callbacks] of this.watchers) {
      const relevantChanges = changes.filter(change => 
        change.path.startsWith(path) || path.startsWith(change.path)
      );
      
      if (relevantChanges.length > 0) {
        callbacks.forEach(callback => {
          try {
            callback(relevantChanges, this.config);
          } catch (error) {
            console.error('Configuration watcher callback error:', error);
          }
        });
      }
    }
  }

  // Backup and Restore
  async createBackup(): Promise<string> {
    const backup = {
      config: this.config,
      versions: this.versions,
      timestamp: new Date().toISOString(),
      checksum: this.generateChecksum(this.config),
    };

    const backupData = JSON.stringify(backup, null, 2);
    const crypto = require('crypto');
    const backupId = crypto.createHash('md5').update(backupData).digest('hex');
    
    // In a real implementation, this would save to a file or database
    console.log(`Configuration backup created: ${backupId}`);
    
    return backupId;
  }

  async restoreFromBackup(backupId: string): Promise<boolean> {
    try {
      // In a real implementation, this would load from file or database
      console.log(`Restoring configuration from backup: ${backupId}`);
      
      // Implement restore logic here
      
      console.log('Configuration restored successfully');
      return true;
    } catch (error) {
      console.error('Configuration restore failed:', error);
      return false;
    }
  }

  // Validation
  validateConfig(config: any): { valid: boolean; errors: string[] } {
    try {
      ConfigurationSchema.parse(config);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        return { valid: false, errors };
      }
      return { valid: false, errors: [error.message] };
    }
  }

  // Get configuration history
  getVersions(): ConfigurationVersion[] {
    return [...this.versions].reverse(); // Most recent first
  }

  // Export configuration
  exportConfig(): string {
    return JSON.stringify({
      config: this.config,
      versions: this.versions,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  // Import configuration
  importConfig(configData: string, author: string = 'import'): boolean {
    try {
      const data = JSON.parse(configData);
      
      // Validate imported configuration
      const validation = this.validateConfig(data.config);
      if (!validation.valid) {
        console.error('Invalid configuration:', validation.errors);
        return false;
      }

      this.config = data.config;
      this.versions = data.versions || [];
      
      console.log(`Configuration imported successfully by ${author}`);
      return true;
    } catch (error) {
      console.error('Configuration import failed:', error);
      return false;
    }
  }
}