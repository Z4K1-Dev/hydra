import { EventEmitter } from 'events';
import chalk from 'chalk';
import { SessionManager } from '../session/SessionManager';
import { ContextManager } from '../context/ContextManager';
import { AIManager } from '../ai/AIManager';
import { ToolsManager } from '../tools/ToolsManager';
import { ConfigManager } from '../config/ConfigManager';
import { Logger } from '../utils/Logger';

export interface GLMStatus {
  api: boolean;
  database: boolean;
  sessionCount: number;
  currentModel: string;
  memoryUsage: number;
}

export class GLMCore extends EventEmitter {
  private sessionManager: SessionManager;
  private contextManager: ContextManager;
  private aiManager: AIManager;
  private toolsManager: ToolsManager;
  private config: ConfigManager;
  private logger: Logger;
  private currentSession: string | null = null;

  constructor() {
    super();
    this.logger = new Logger('GLMCore');
    this.config = new ConfigManager();
    this.sessionManager = new SessionManager();
    this.contextManager = new ContextManager();
    this.aiManager = new AIManager();
    this.toolsManager = new ToolsManager();
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing GLM Core...');
      
      // Initialize configuration
      await this.config.initialize();
      
      // Initialize AI manager
      const aiModel = this.config.get('ai.model');
      const aiApiKey = this.config.get('ai.apiKey');
      await this.aiManager.initialize(aiModel, aiApiKey);
      
      // Initialize session manager
      await this.sessionManager.initialize();
      
      // Initialize context manager
      await this.contextManager.initialize();
      
      // Initialize tools manager
      await this.toolsManager.initialize();
      
      this.logger.info('GLM Core initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize GLM Core:', error);
      throw error;
    }
  }

  async startNewSession(sessionName?: string, model?: string): Promise<void> {
    try {
      const name = sessionName || `session_${Date.now()}`;
      const aiModel = model || this.config.get('ai.defaultModel', 'gpt-4');
      
      this.logger.info(`Starting new session: ${name}`);
      
      // Create new session
      const session = await this.sessionManager.createSession(name, aiModel);
      this.currentSession = session.id;
      
      // Initialize context for session
      await this.contextManager.createContext(session.id);
      
      console.log(chalk.green(`✅ Session '${name}' started with model ${aiModel}`));
      
      // Start interactive mode
      await this.startInteractiveMode(session.id);
      
    } catch (error) {
      this.logger.error('Failed to start new session:', error);
      throw error;
    }
  }

  async continueLastSession(): Promise<void> {
    try {
      const lastSession = await this.sessionManager.getLastSession();
      
      if (!lastSession) {
        console.log(chalk.yellow('⚠️  No previous sessions found'));
        return;
      }
      
      this.logger.info(`Continuing last session: ${lastSession.name}`);
      this.currentSession = lastSession.id;
      
      console.log(chalk.green(`✅ Continuing session: ${lastSession.name}`));
      
      // Load context
      const context = await this.contextManager.loadContext(lastSession.id);
      
      // Start interactive mode
      await this.startInteractiveMode(lastSession.id, context);
      
    } catch (error) {
      this.logger.error('Failed to continue last session:', error);
      throw error;
    }
  }

  async loadSession(sessionName: string): Promise<void> {
    try {
      const session = await this.sessionManager.getSession(sessionName);
      
      if (!session) {
        console.log(chalk.red(`❌ Session '${sessionName}' not found`));
        return;
      }
      
      this.logger.info(`Loading session: ${sessionName}`);
      this.currentSession = session.id;
      
      // Load context
      const context = await this.contextManager.loadContext(session.id);
      
      console.log(chalk.green(`✅ Session '${sessionName}' loaded`));
      
      // Start interactive mode
      await this.startInteractiveMode(session.id, context);
      
    } catch (error) {
      this.logger.error('Failed to load session:', error);
      throw error;
    }
  }

  private async startInteractiveMode(sessionId: string, context?: any): Promise<void> {
    console.log(chalk.blue('\n💬 Starting interactive mode...'));
    console.log(chalk.gray('Type "exit" to end session, "help" for commands\n'));
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('glm> ')
    });
    
    rl.prompt();
    
    rl.on('line', async (input: string) => {
      const command = input.trim();
      
      if (command === 'exit') {
        await this.endSession(sessionId);
        rl.close();
        return;
      }
      
      if (command === 'help') {
        this.showHelp();
        rl.prompt();
        return;
      }
      
      if (command === 'clear') {
        console.clear();
        rl.prompt();
        return;
      }
      
      if (command.startsWith('/')) {
        await this.handleSlashCommand(command, sessionId);
        rl.prompt();
        return;
      }
      
      // Process as AI conversation
      try {
        await this.processUserInput(sessionId, command);
      } catch (error) {
        console.log(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      }
      
      rl.prompt();
    });
    
    rl.on('close', () => {
      console.log(chalk.blue('\n👋 Session ended'));
      process.exit(0);
    });
  }

  private async processUserInput(sessionId: string, input: string): Promise<void> {
    console.log(chalk.gray('🤔 Thinking...'));
    
    try {
      // Get current context
      const context = await this.contextManager.getContext(sessionId);
      
      // Add user message to context
      await this.contextManager.addMessage(sessionId, 'user', input);
      
      // Get AI response
      const response = await this.aiManager.generateResponse(input, context);
      const responseContent = response.content;
      
      // Add AI response to context
      await this.contextManager.addMessage(sessionId, 'assistant', responseContent);
      
      // Display response
      console.log(chalk.green('🤖:'), responseContent);
      
      // Compress context if needed
      await this.contextManager.compressContext(sessionId);
      
    } catch (error) {
      this.logger.error('Error processing user input:', error);
      throw error;
    }
  }

  private async handleSlashCommand(command: string, sessionId: string): Promise<void> {
    const [cmd, ...args] = command.slice(1).split(' ');
    
    switch (cmd) {
      case 'save':
        await this.sessionManager.saveSession(sessionId);
        console.log(chalk.green('✅ Session saved'));
        break;
        
      case 'context':
        const contextSize = await this.contextManager.getContextSize(sessionId);
        console.log(chalk.blue(`📊 Context size: ${contextSize} tokens`));
        break;
        
      case 'model':
        if (args[0]) {
          await this.aiManager.switchModel(args[0]);
          console.log(chalk.green(`✅ Switched to model: ${args[0]}`));
        } else {
          const currentModel = await this.aiManager.getCurrentModel();
          console.log(chalk.blue(`🤖 Current model: ${currentModel}`));
        }
        break;
        
      case 'tools':
        if (args[0] === 'exec' && args[1]) {
          const result = await this.toolsManager.executeCommand(args.slice(1).join(' '));
          console.log(chalk.yellow('🔧 Tool result:'), result);
        } else {
          console.log(chalk.blue('🔧 Available tools: exec, ls, cat, grep, find'));
        }
        break;
        
      case 'export':
        const format = args[0] as 'json' | 'md' | 'txt' || 'md';
        await this.sessionManager.exportSession(sessionId, format);
        console.log(chalk.green(`✅ Session exported as ${format.toUpperCase()}`));
        break;
        
      default:
        console.log(chalk.yellow('❓ Unknown command. Available: save, context, model, tools, export'));
    }
  }

  private async endSession(sessionId: string): Promise<void> {
    try {
      await this.sessionManager.saveSession(sessionId);
      await this.contextManager.saveContext(sessionId);
      console.log(chalk.green('✅ Session ended and saved'));
    } catch (error) {
      this.logger.error('Error ending session:', error);
    }
  }

  private showHelp(): void {
    console.log(chalk.blue('\n📚 Available Commands:'));
    console.log('  exit        - End the session');
    console.log('  help        - Show this help');
    console.log('  clear       - Clear screen');
    console.log('  /save       - Save current session');
    console.log('  /context    - Show context size');
    console.log('  /model      - Show or change AI model');
    console.log('  /tools exec  - Execute Linux command');
    console.log('  /export     - Export session');
  }

  async executeCommand(command: string): Promise<void> {
    try {
      console.log(chalk.gray(`🔧 Executing: ${command}`));
      const result = await this.toolsManager.executeCommand(command);
      console.log(chalk.yellow('Result:'));
      console.log(result);
    } catch (error) {
      console.log(chalk.red('❌ Command execution failed:'), error instanceof Error ? error.message : String(error));
    }
  }

  async getStatus(): Promise<GLMStatus> {
    const apiStatus = await this.aiManager.checkConnection();
    const dbStatus = await this.sessionManager.checkConnection();
    const sessionCount = await this.sessionManager.getSessionCount();
    const currentModel = await this.aiManager.getCurrentModel();
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    
    return {
      api: apiStatus,
      database: dbStatus,
      sessionCount,
      currentModel,
      memoryUsage: Math.round(memoryUsage)
    };
  }
}