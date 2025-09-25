import * as fs from 'fs/promises';
import * as path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private serviceName: string;
  private logLevel: LogLevel;
  private logFile?: string;

  constructor(serviceName: string, logLevel: LogLevel = 'info', logFile?: string) {
    this.serviceName = serviceName;
    this.logLevel = logLevel;
    this.logFile = logFile;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}]`;
    
    if (data) {
      return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`;
    }
    
    return `${prefix} ${message}`;
  }

  private async writeToFile(formattedMessage: string): Promise<void> {
    if (!this.logFile) return;
    
    try {
      const logDir = path.dirname(this.logFile);
      await fs.mkdir(logDir, { recursive: true });
      await fs.appendFile(this.logFile, formattedMessage + '\n');
    } catch (error) {
      // Don't use logger here to avoid infinite recursion
      console.error('Failed to write to log file:', error);
    }
  }

  debug(message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;
    
    const formattedMessage = this.formatMessage('debug', message, data);
    console.log(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  info(message: string, data?: any): void {
    if (!this.shouldLog('info')) return;
    
    const formattedMessage = this.formatMessage('info', message, data);
    console.log(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  warn(message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;
    
    const formattedMessage = this.formatMessage('warn', message, data);
    console.warn(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  error(message: string, error?: any): void {
    if (!this.shouldLog('error')) return;
    
    let formattedMessage: string;
    if (error) {
      formattedMessage = this.formatMessage('error', message, {
        message: error.message,
        stack: error.stack,
        ...error
      });
    } else {
      formattedMessage = this.formatMessage('error', message);
    }
    
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level changed to ${level}`);
  }

  setLogFile(logFile: string): void {
    this.logFile = logFile;
    this.info(`Log file set to ${logFile}`);
  }

  // Static methods for global logger
  static createGlobalLogger(serviceName: string, level: LogLevel = 'info', logFile?: string): Logger {
    return new Logger(serviceName, level, logFile);
  }

  // Utility method for HTTP request logging
  logRequest(method: string, url: string, statusCode: number, duration: number): void {
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;
    
    if (statusCode >= 500) {
      this.error(message);
    } else if (statusCode >= 400) {
      this.warn(message);
    } else {
      this.debug(message);
    }
  }

  // Utility method for performance logging
  logPerformance(operation: string, duration: number): void {
    const message = `Performance: ${operation} took ${duration}ms`;
    
    if (duration > 5000) {
      this.warn(message);
    } else if (duration > 1000) {
      this.info(message);
    } else {
      this.debug(message);
    }
  }

  // Utility method for memory usage logging
  logMemoryUsage(context?: string): void {
    const usage = process.memoryUsage();
    const message = context ? `Memory usage (${context})` : 'Memory usage';
    
    this.debug(message, {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`
    });
  }
}