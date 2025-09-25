import { EventEmitter } from 'events';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from '../utils/Logger';

const execAsync = promisify(exec);

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
  duration: number;
}

export interface ToolPermission {
  allowed: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
}

export class ToolsManager extends EventEmitter {
  private logger: Logger;
  private allowedCommands: Set<string>;
  private blockedCommands: Set<string>;
  private requireConfirmation: Set<string>;
  private maxExecutionTime: number = 30000; // 30 seconds
  private maxOutputLength: number = 10000; // 10k characters

  constructor() {
    super();
    this.logger = new Logger('ToolsManager');
    this.allowedCommands = new Set([
      'ls', 'cd', 'pwd', 'cat', 'echo', 'mkdir', 'rm', 'cp', 'mv',
      'grep', 'find', 'head', 'tail', 'wc', 'sort', 'uniq', 'cut',
      'sed', 'awk', 'tr', 'nl', 'tac', 'rev', 'shuf', 'tee',
      'ps', 'top', 'htop', 'df', 'du', 'free', 'uname', 'whoami',
      'date', 'cal', 'timedatectl', 'uptime', 'which', 'whereis',
      'file', 'stat', 'lsblk', 'fdisk', 'mount', 'umount',
      'curl', 'wget', 'ssh', 'scp', 'rsync', 'git', 'npm', 'bun',
      'node', 'python', 'python3', 'pip', 'pip3', 'docker', 'docker-compose',
      'systemctl', 'journalctl', 'service', 'crontab', 'at', 'batch',
      'chmod', 'chown', 'chgrp', 'touch', 'ln', 'readlink', 'realpath',
      'tar', 'zip', 'unzip', 'gzip', 'gunzip', 'bzip2', 'bunzip2',
      'ssh-keygen', 'ssh-copy-id', 'ssh-agent', 'ssh-add'
    ]);
    
    this.blockedCommands = new Set([
      'rm -rf /', 'dd', 'mkfs', 'fdisk /dev/sda', 'format',
      'shutdown', 'reboot', 'halt', 'poweroff', 'init 0', 'init 6',
      ':(){ :|:& };:', 'fork bomb', 'chmod 777 /', 'chown root:root /',
      'passwd', 'userdel', 'groupdel', 'visudo', 'chmod +s',
      'iptables -F', 'ufw disable', 'systemctl stop firewall'
    ]);
    
    this.requireConfirmation = new Set([
      'rm -rf', 'dd if=', 'mkfs', 'fdisk', 'format', 'chmod 777',
      'chown root', 'systemctl stop', 'service stop', 'reboot',
      'shutdown', 'halt', 'poweroff'
    ]);
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Tools Manager...');
      
      // Load configuration from environment
      this.maxExecutionTime = parseInt(process.env.TOOL_MAX_EXECUTION_TIME || '30000');
      this.maxOutputLength = parseInt(process.env.TOOL_MAX_OUTPUT_LENGTH || '10000');
      
      // Load custom allowed/blocked commands from config
      await this.loadCustomConfig();
      
      this.logger.info('Tools Manager initialized successfully');
      this.logger.info(`Allowed commands: ${this.allowedCommands.size}`);
      this.logger.info(`Blocked commands: ${this.blockedCommands.size}`);
      this.logger.info(`Commands requiring confirmation: ${this.requireConfirmation.size}`);
    } catch (error) {
      this.logger.error('Failed to initialize Tools Manager:', error);
      throw error;
    }
  }

  async executeCommand(command: string, options: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    confirm?: boolean;
  } = {}): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // Check permissions
      const permission = this.checkPermission(command);
      if (!permission.allowed) {
        return {
          success: false,
          output: '',
          error: permission.reason || 'Command not allowed',
          duration: Date.now() - startTime
        };
      }
      
      // Ask for confirmation if required
      if (permission.requiresConfirmation && !options.confirm) {
        const confirmed = await this.requestConfirmation(command);
        if (!confirmed) {
          return {
            success: false,
            output: '',
            error: 'Command execution cancelled by user',
            duration: Date.now() - startTime
          };
        }
      }
      
      this.logger.info(`Executing command: ${command}`);
      this.emit('commandExecuting', { command, options });
      
      // Execute the command
      const result = await this.executeSafely(command, {
        cwd: options.cwd || process.cwd(),
        env: { ...options.env } as Record<string, string>,
        timeout: options.timeout || this.maxExecutionTime
      });
      
      const duration = Date.now() - startTime;
      this.logger.info(`Command completed in ${duration}ms`);
      this.emit('commandExecuted', { command, result, duration });
      
      return {
        ...result,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Command execution failed:', error);
      this.emit('commandFailed', { command, error, duration });
      
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  async executeFileScript(scriptPath: string, args: string[] = []): Promise<ToolResult> {
    try {
      // Check if script exists and is executable
      const fs = await import('fs');
      const path = await import('path');
      
      if (!fs.existsSync(scriptPath)) {
        throw new Error(`Script not found: ${scriptPath}`);
      }
      
      const stats = fs.statSync(scriptPath);
      if (!stats.isFile()) {
        throw new Error(`Not a file: ${scriptPath}`);
      }
      
      // Check file extension for security
      const ext = path.extname(scriptPath).toLowerCase();
      const allowedExtensions = ['.sh', '.py', '.js', '.ts', '.bash', '.zsh'];
      
      if (!allowedExtensions.includes(ext)) {
        throw new Error(`File type not allowed: ${ext}`);
      }
      
      // Build command based on file type
      let command: string;
      switch (ext) {
        case '.sh':
        case '.bash':
        case '.zsh':
          command = `bash "${scriptPath}" ${args.join(' ')}`;
          break;
        case '.py':
          command = `python3 "${scriptPath}" ${args.join(' ')}`;
          break;
        case '.js':
          command = `node "${scriptPath}" ${args.join(' ')}`;
          break;
        case '.ts':
          command = `bun run "${scriptPath}" ${args.join(' ')}`;
          break;
        default:
          command = `"${scriptPath}" ${args.join(' ')}`;
      }
      
      return await this.executeCommand(command);
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      };
    }
  }

  async executeShellCommand(command: string, shell: string = 'bash'): Promise<ToolResult> {
    try {
      const fullCommand = `${shell} -c "${command.replace(/"/g, '\\"')}"`;
      return await this.executeCommand(fullCommand);
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      };
    }
  }

  async listAvailableTools(): Promise<string[]> {
    return [
      'exec', 'file', 'shell', 'system',
      'fs-ls', 'fs-read', 'fs-write', 'fs-delete',
      'proc-list', 'proc-kill', 'net-info', 'net-test'
    ];
  }

  async getSystemInfo(): Promise<Record<string, any>> {
    try {
      const os = await import('os');
      const fs = await import('fs');
      
      const info = {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: os.uptime(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpus: os.cpus().length,
        homedir: os.homedir(),
        cwd: process.cwd(),
        user: process.env.USER || process.env.USERNAME || 'unknown'
      };
      
      return info;
    } catch (error) {
      this.logger.error('Failed to get system info:', error);
      return {};
    }
  }

  private checkPermission(command: string): ToolPermission {
    const trimmedCommand = command.trim().toLowerCase();
    
    // Check blocked commands first
    for (const blocked of this.blockedCommands) {
      if (trimmedCommand.includes(blocked.toLowerCase())) {
        return {
          allowed: false,
          reason: `Command blocked: ${blocked}`
        };
      }
    }
    
    // Extract the base command
    const baseCommand = trimmedCommand.split(' ')[0];
    
    // Check if command is allowed
    if (!this.allowedCommands.has(baseCommand)) {
      return {
        allowed: false,
        reason: `Command not allowed: ${baseCommand}`
      };
    }
    
    // Check if confirmation is required
    for (const confirmCmd of this.requireConfirmation) {
      if (trimmedCommand.includes(confirmCmd.toLowerCase())) {
        return {
          allowed: true,
          requiresConfirmation: true,
          reason: `Command requires confirmation: ${confirmCmd}`
        };
      }
    }
    
    return {
      allowed: true
    };
  }

  private async requestConfirmation(command: string): Promise<boolean> {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question(`⚠️  Confirm execution of potentially dangerous command: ${command} [y/N] `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  private async executeSafely(command: string, options: {
    cwd: string;
    env: Record<string, string>;
    timeout: number;
  }): Promise<ToolResult> {
    return new Promise((resolve, reject) => {
      const child = spawn('bash', ['-c', command], {
        cwd: options.cwd,
        env: options.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let error = '';
      
      if (child.stdout) {
        child.stdout.on('data', (data: Buffer) => {
          output += data.toString();
          // Limit output length
          if (output.length > this.maxOutputLength) {
            output = output.substring(0, this.maxOutputLength) + '\n...[output truncated]';
            if (child.kill) child.kill();
          }
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data: Buffer) => {
          error += data.toString();
          // Limit error length
          if (error.length > this.maxOutputLength) {
            error = error.substring(0, this.maxOutputLength) + '\n...[error truncated]';
            if (child.kill) child.kill();
          }
        });
      }
      
      const timeout = setTimeout(() => {
        if (child.kill) child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${options.timeout}ms`));
      }, options.timeout);
      
      if (child.on) {
        child.on('close', (code: number, signal: string) => {
          clearTimeout(timeout);
          
          if (signal === 'SIGTERM') {
            reject(new Error('Command terminated due to timeout'));
            return;
          }
          
          resolve({
            success: code === 0,
            output: output.trim(),
            error: error.trim() || undefined,
            exitCode: code,
            duration: 0 // Will be set by caller
          });
        });
      }
      
      if (child.on) {
        child.on('error', (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        });
      }
    });
  }

  private async loadCustomConfig(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const configPath = path.join(process.cwd(), 'config', 'tools.json');
      
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        if (config.allowedCommands) {
          config.allowedCommands.forEach((cmd: string) => {
            this.allowedCommands.add(cmd);
          });
        }
        
        if (config.blockedCommands) {
          config.blockedCommands.forEach((cmd: string) => {
            this.blockedCommands.add(cmd);
          });
        }
        
        if (config.requireConfirmation) {
          config.requireConfirmation.forEach((cmd: string) => {
            this.requireConfirmation.add(cmd);
          });
        }
        
        if (config.maxExecutionTime) {
          this.maxExecutionTime = config.maxExecutionTime;
        }
        
        if (config.maxOutputLength) {
          this.maxOutputLength = config.maxOutputLength;
        }
        
        this.logger.info('Loaded custom tools configuration');
      }
    } catch (error) {
      this.logger.warn('Failed to load custom tools configuration:', error);
    }
  }
}