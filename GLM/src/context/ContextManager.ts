import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';

export interface ContextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens?: number;
}

export interface ContextData {
  sessionId: string;
  messages: ContextMessage[];
  summary?: string;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    totalTokens: number;
    compressed: boolean;
  };
}

export class ContextManager extends EventEmitter {
  private logger: Logger;
  private contexts: Map<string, ContextData> = new Map();
  private maxTokens: number = 4000;
  private compressionThreshold: number = 3500;

  constructor() {
    super();
    this.logger = new Logger('ContextManager');
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Context Manager...');
      
      // Load configuration
      this.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4000');
      this.compressionThreshold = Math.floor(this.maxTokens * 0.85);
      
      this.logger.info('Context Manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Context Manager:', error);
      throw error;
    }
  }

  async createContext(sessionId: string): Promise<void> {
    try {
      const contextData: ContextData = {
        sessionId,
        messages: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          totalTokens: 0,
          compressed: false
        }
      };

      this.contexts.set(sessionId, contextData);
      this.logger.info(`Created context for session: ${sessionId}`);
      this.emit('contextCreated', sessionId);
    } catch (error) {
      this.logger.error('Failed to create context:', error);
      throw error;
    }
  }

  async loadContext(sessionId: string): Promise<ContextData> {
    try {
      let context = this.contexts.get(sessionId);
      
      if (!context) {
        // Try to load from persistent storage
        const loadedContext = await this.loadFromStorage(sessionId);
        if (loadedContext) {
          this.contexts.set(sessionId, loadedContext);
          context = loadedContext;
          this.logger.info(`Loaded context from storage for session: ${sessionId}`);
        } else {
          throw new Error(`Context not found for session: ${sessionId}`);
        }
      }
      
      return context;
    } catch (error) {
      this.logger.error('Failed to load context:', error);
      throw error;
    }
  }

  async getContext(sessionId: string): Promise<ContextMessage[]> {
    try {
      const context = await this.loadContext(sessionId);
      return context.messages;
    } catch (error) {
      this.logger.error('Failed to get context:', error);
      throw error;
    }
  }

  async addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    try {
      const context = await this.loadContext(sessionId);
      
      const message: ContextMessage = {
        role,
        content,
        timestamp: new Date(),
        tokens: this.estimateTokens(content)
      };

      context.messages.push(message);
      context.metadata.totalTokens += message.tokens || 0;
      context.metadata.updatedAt = new Date();

      this.logger.debug(`Added ${role} message to context: ${sessionId}`);
      this.emit('messageAdded', { sessionId, message });
    } catch (error) {
      this.logger.error('Failed to add message to context:', error);
      throw error;
    }
  }

  async getContextSize(sessionId: string): Promise<number> {
    try {
      const context = await this.loadContext(sessionId);
      return context.metadata.totalTokens;
    } catch (error) {
      this.logger.error('Failed to get context size:', error);
      throw error;
    }
  }

  async compressContext(sessionId: string): Promise<void> {
    try {
      const context = await this.loadContext(sessionId);
      
      if (context.metadata.totalTokens < this.compressionThreshold) {
        return; // No compression needed
      }

      this.logger.info(`Compressing context for session: ${sessionId} (${context.metadata.totalTokens} tokens)`);

      // Generate summary of recent conversation
      const summary = await this.generateSummary(context.messages);
      
      // Keep recent messages and older important ones
      const compressedMessages = await this.selectImportantMessages(context.messages, summary);
      
      // Update context
      context.messages = compressedMessages;
      context.summary = summary;
      context.metadata.compressed = true;
      context.metadata.updatedAt = new Date();
      
      // Recalculate token count
      context.metadata.totalTokens = context.messages.reduce((total, msg) => total + (msg.tokens || 0), 0);

      this.logger.info(`Context compressed: ${context.metadata.totalTokens} tokens remaining`);
      this.emit('contextCompressed', { sessionId, originalTokens: context.metadata.totalTokens, compressedTokens: context.metadata.totalTokens });
    } catch (error) {
      this.logger.error('Failed to compress context:', error);
      throw error;
    }
  }

  async saveContext(sessionId: string): Promise<void> {
    try {
      const context = this.contexts.get(sessionId);
      if (!context) {
        throw new Error(`Context not found for session: ${sessionId}`);
      }

      await this.saveToStorage(sessionId, context);
      this.logger.info(`Saved context for session: ${sessionId}`);
      this.emit('contextSaved', sessionId);
    } catch (error) {
      this.logger.error('Failed to save context:', error);
      throw error;
    }
  }

  async searchContext(sessionId: string, query: string, limit: number = 5): Promise<ContextMessage[]> {
    try {
      // Fallback to simple keyword search
      const context = await this.loadContext(sessionId);
      const queryLower = query.toLowerCase();
      
      return context.messages
        .filter(msg => msg.content.toLowerCase().includes(queryLower))
        .slice(-limit)
        .reverse();
    } catch (error) {
      this.logger.error('Failed to search context:', error);
      throw error;
    }
  }

  async clearContext(sessionId: string): Promise<void> {
    try {
      const context = this.contexts.get(sessionId);
      if (context) {
        context.messages = [];
        context.summary = undefined;
        context.metadata.totalTokens = 0;
        context.metadata.compressed = false;
        context.metadata.updatedAt = new Date();
        
        this.logger.info(`Cleared context for session: ${sessionId}`);
        this.emit('contextCleared', sessionId);
      }
    } catch (error) {
      this.logger.error('Failed to clear context:', error);
      throw error;
    }
  }

  private async generateSummary(messages: ContextMessage[]): Promise<string> {
    // Simple summarization - in production, you'd use AI for this
    const recentMessages = messages.slice(-10); // Last 10 messages
    const userMessages = recentMessages.filter(m => m.role === 'user');
    const assistantMessages = recentMessages.filter(m => m.role === 'assistant');
    
    return `Conversation summary: ${userMessages.length} user messages, ${assistantMessages.length} assistant responses. ` +
           `Topics discussed: ${this.extractTopics(recentMessages).join(', ')}. ` +
           `Last discussed: ${recentMessages[recentMessages.length - 1]?.content.substring(0, 100)}...`;
  }

  private extractTopics(messages: ContextMessage[]): string[] {
    // Simple topic extraction - in production, use NLP
    const allText = messages.map(m => m.content).join(' ').toLowerCase();
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = allText.split(/\s+/).filter(word => word.length > 3 && !commonWords.includes(word));
    
    // Count word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Return top 5 most frequent words
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private async selectImportantMessages(messages: ContextMessage[], summary: string): Promise<ContextMessage[]> {
    // Keep system messages
    const systemMessages = messages.filter(m => m.role === 'system');
    
    // Keep recent messages (last 5)
    const recentMessages = messages.slice(-5);
    
    // Select important older messages based on keywords and length
    const olderMessages = messages.slice(0, -5);
    const importantOlder = olderMessages
      .filter(msg => {
        const content = msg.content.toLowerCase();
        // Keep messages with important keywords
        const importantKeywords = ['important', 'note', 'remember', 'key', 'summary', 'conclusion'];
        return importantKeywords.some(keyword => content.includes(keyword)) || 
               msg.content.length > 200; // Keep longer messages
      })
      .slice(-10); // Keep at most 10 important older messages

    return [...systemMessages, ...importantOlder, ...recentMessages];
  }

  private estimateTokens(text: string): number {
    // Rough token estimation (4 chars ≈ 1 token)
    return Math.ceil(text.length / 4);
  }

  private async loadFromStorage(sessionId: string): Promise<ContextData | null> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const contextPath = path.join(process.cwd(), 'data', 'contexts', `${sessionId}.json`);
      
      if (fs.existsSync(contextPath)) {
        const data = fs.readFileSync(contextPath, 'utf8');
        const parsed = JSON.parse(data);
        
        // Convert timestamp strings back to Date objects
        parsed.messages.forEach((msg: any) => {
          msg.timestamp = new Date(msg.timestamp);
        });
        parsed.metadata.createdAt = new Date(parsed.metadata.createdAt);
        parsed.metadata.updatedAt = new Date(parsed.metadata.updatedAt);
        
        return parsed;
      }
      
      return null;
    } catch (error) {
      this.logger.error('Failed to load context from storage:', error);
      return null;
    }
  }

  private async saveToStorage(sessionId: string, context: ContextData): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const dataDir = path.join(process.cwd(), 'data', 'contexts');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const contextPath = path.join(dataDir, `${sessionId}.json`);
      const data = JSON.stringify(context, null, 2);
      
      fs.writeFileSync(contextPath, data);
    } catch (error) {
      this.logger.error('Failed to save context to storage:', error);
      throw error;
    }
  }
}