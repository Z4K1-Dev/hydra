import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../utils/Logger';

export interface Config {
  ai: {
    model: string;
    apiKey: string;
    baseUrl?: string;
    maxTokens: number;
    temperature: number;
  };
  database: {
    path: string;
    maxContextSize: number;
  };
  session: {
    autoSave: boolean;
    saveInterval: number;
    maxSessions: number;
  };
  tools: {
    enabled: boolean;
    safeMode: boolean;
    allowedCommands: string[];
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file: string;
    maxSize: string;
  };
}

export class ConfigManager {
  private configPath: string;
  private config!: Config;
  private logger: Logger;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'config', 'glm.json');
    this.logger = new Logger('ConfigManager');
  }

  async initialize(): Promise<void> {
    try {
      // Create config directory if it doesn't exist
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });

      // Load or create config
      if (await this.fileExists(this.configPath)) {
        const configData = await fs.readFile(this.configPath, 'utf-8');
        this.config = JSON.parse(configData);
        this.logger.info('Configuration loaded from file');
      } else {
        this.config = this.getDefaultConfig();
        await this.saveConfig();
        this.logger.info('Default configuration created');
      }

      // Override with environment variables
      this.loadEnvironmentVariables();

    } catch (error) {
      this.logger.error('Failed to initialize configuration:', error);
      throw error;
    }
  }

  private getDefaultConfig(): Config {
    return {
      ai: {
        model: 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: process.env.OPENAI_BASE_URL,
        maxTokens: 4000,
        temperature: 0.7
      },
      database: {
        path: path.join(process.cwd(), 'data', 'glm.db'),
        maxContextSize: 100000
      },
      session: {
        autoSave: true,
        saveInterval: 30000, // 30 seconds
        maxSessions: 100
      },
      tools: {
        enabled: true,
        safeMode: true,
        allowedCommands: ['ls', 'cat', 'grep', 'find', 'pwd', 'whoami', 'date']
      },
      logging: {
        level: 'info',
        file: path.join(process.cwd(), 'logs', 'glm.log'),
        maxSize: '10MB'
      }
    };
  }

  private loadEnvironmentVariables(): void {
    // AI Configuration
    if (process.env.OPENAI_API_KEY) {
      this.config.ai.apiKey = process.env.OPENAI_API_KEY;
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.config.ai.apiKey = process.env.ANTHROPIC_API_KEY;
      this.config.ai.model = 'claude-3';
    }
    if (process.env.AI_MODEL) {
      this.config.ai.model = process.env.AI_MODEL;
    }
    if (process.env.AI_MAX_TOKENS) {
      this.config.ai.maxTokens = parseInt(process.env.AI_MAX_TOKENS);
    }
    if (process.env.AI_TEMPERATURE) {
      this.config.ai.temperature = parseFloat(process.env.AI_TEMPERATURE);
    }

    // Database Configuration
    if (process.env.DB_PATH) {
      this.config.database.path = process.env.DB_PATH;
    }
    if (process.env.MAX_CONTEXT_SIZE) {
      this.config.database.maxContextSize = parseInt(process.env.MAX_CONTEXT_SIZE);
    }

    // Logging Configuration
    if (process.env.LOG_LEVEL) {
      this.config.logging.level = process.env.LOG_LEVEL as any;
    }
  }

  get(key: string, defaultValue?: any): any {
    const keys = key.split('.');
    let value: any = this.config;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value !== undefined ? value : defaultValue;
  }

  async set(key: string, value: any): Promise<void> {
    const keys = key.split('.');
    let target: any = this.config;
    
    // Navigate to the parent of the target key
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in target)) {
        target[k] = {};
      }
      target = target[k];
    }
    
    // Set the value
    const lastKey = keys[keys.length - 1];
    target[lastKey] = value;
    
    // Save to file
    await this.saveConfig();
    
    this.logger.info(`Configuration updated: ${key} = ${value}`);
  }

  list(): Config {
    return { ...this.config };
  }

  private async saveConfig(): Promise<void> {
    try {
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      this.logger.debug('Configuration saved to file');
    } catch (error) {
      this.logger.error('Failed to save configuration:', error);
      throw error;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Validation methods
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate AI configuration
    if (!this.config.ai.apiKey) {
      errors.push('AI API key is required');
    }
    if (!['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'claude-2'].includes(this.config.ai.model)) {
      errors.push('Invalid AI model');
    }
    if (this.config.ai.maxTokens < 1 || this.config.ai.maxTokens > 100000) {
      errors.push('AI max tokens must be between 1 and 100000');
    }
    if (this.config.ai.temperature < 0 || this.config.ai.temperature > 2) {
      errors.push('AI temperature must be between 0 and 2');
    }

    // Validate database configuration
    if (!this.config.database.path) {
      errors.push('Database path is required');
    }
    if (this.config.database.maxContextSize < 1000) {
      errors.push('Max context size must be at least 1000');
    }

    // Validate session configuration
    if (this.config.session.saveInterval < 1000) {
      errors.push('Save interval must be at least 1000ms');
    }
    if (this.config.session.maxSessions < 1) {
      errors.push('Max sessions must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Reset to default configuration
  async reset(): Promise<void> {
    this.config = this.getDefaultConfig();
    await this.saveConfig();
    this.logger.info('Configuration reset to defaults');
  }

  // Export configuration
  async export(format: 'json' | 'env' = 'json'): Promise<string> {
    if (format === 'json') {
      return JSON.stringify(this.config, null, 2);
    } else if (format === 'env') {
      let env = '';
      Object.entries(this.config.ai).forEach(([key, value]) => {
        env += `AI_${key.toUpperCase()}=${value}\n`;
      });
      return env;
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Import configuration
  async import(configData: string, format: 'json' | 'env' = 'json'): Promise<void> {
    try {
      if (format === 'json') {
        const imported = JSON.parse(configData);
        this.config = { ...this.config, ...imported };
      } else if (format === 'env') {
        // Parse environment variables format
        const lines = configData.split('\n');
        for (const line of lines) {
          const match = line.match(/^AI_(\w+)=(.+)$/);
          if (match) {
            const [, key, value] = match;
            this.config.ai[key.toLowerCase()] = value;
          }
        }
      } else {
        throw new Error(`Unsupported import format: ${format}`);
      }
      
      await this.saveConfig();
      this.logger.info('Configuration imported successfully');
    } catch (error) {
      this.logger.error('Failed to import configuration:', error);
      throw error;
    }
  }
}