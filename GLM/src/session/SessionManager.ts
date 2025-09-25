import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../utils/Logger';

export interface Session {
  id: string;
  name: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  metadata: Record<string, any>;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class SessionManager {
  private logger: Logger;
  private sessionsPath: string;
  private sessions: Map<string, Session>;
  private autoSave: boolean;
  private saveInterval: number;
  private saveTimer?: NodeJS.Timeout;

  constructor(sessionsPath?: string) {
    this.logger = new Logger('SessionManager');
    this.sessionsPath = sessionsPath || path.join(process.cwd(), 'sessions');
    this.sessions = new Map();
    this.autoSave = true;
    this.saveInterval = 30000; // 30 seconds
  }

  async initialize(): Promise<void> {
    try {
      // Create sessions directory
      await fs.mkdir(this.sessionsPath, { recursive: true });

      // Load existing sessions
      await this.loadSessions();

      // Setup auto-save
      if (this.autoSave) {
        this.setupAutoSave();
      }

      this.logger.info('Session Manager initialized');
      this.logger.info(`Loaded ${this.sessions.size} sessions`);

    } catch (error) {
      this.logger.error('Failed to initialize Session Manager:', error);
      throw error;
    }
  }

  private async loadSessions(): Promise<void> {
    try {
      const files = await fs.readdir(this.sessionsPath);
      const sessionFiles = files.filter(file => file.endsWith('.json'));

      for (const file of sessionFiles) {
        try {
          const filePath = path.join(this.sessionsPath, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const session = JSON.parse(data);
          
          // Convert date strings back to Date objects
          session.createdAt = new Date(session.createdAt);
          session.updatedAt = new Date(session.updatedAt);
          session.messages = session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));

          this.sessions.set(session.id, session);
        } catch (error) {
          this.logger.warn(`Failed to load session from ${file}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to load sessions:', error);
    }
  }

  private setupAutoSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }

    this.saveTimer = setInterval(async () => {
      await this.saveAllSessions();
    }, this.saveInterval);

    this.logger.debug(`Auto-save setup with interval: ${this.saveInterval}ms`);
  }

  async createSession(name: string, model: string, metadata?: Record<string, any>): Promise<Session> {
    try {
      const session: Session = {
        id: this.generateSessionId(),
        name,
        model,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        metadata: metadata || {}
      };

      this.sessions.set(session.id, session);
      await this.saveSession(session.id);

      this.logger.info(`Created session: ${name} (${session.id})`);
      return session;

    } catch (error) {
      this.logger.error('Failed to create session:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getSessionByName(name: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.name === name) {
        return session;
      }
    }
    return null;
  }

  async listSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async getLastSession(): Promise<Session | null> {
    const sessions = await this.listSessions();
    return sessions[0] || null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return false;
      }

      // Delete from memory
      this.sessions.delete(sessionId);

      // Delete from disk
      const filePath = this.getSessionFilePath(sessionId);
      await fs.unlink(filePath);

      this.logger.info(`Deleted session: ${session.name} (${sessionId})`);
      return true;

    } catch (error) {
      this.logger.error('Failed to delete session:', error);
      return false;
    }
  }

  async addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const message: Message = {
        id: this.generateMessageId(),
        role,
        content,
        timestamp: new Date(),
        metadata
      };

      session.messages.push(message);
      session.updatedAt = new Date();

      // Auto-save if enabled
      if (this.autoSave) {
        await this.saveSession(sessionId);
      }

      this.logger.debug(`Added message to session ${sessionId}: ${role} (${content.length} chars)`);

    } catch (error) {
      this.logger.error('Failed to add message:', error);
      throw error;
    }
  }

  async getMessages(sessionId: string, limit?: number): Promise<Message[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const messages = session.messages;
    if (limit) {
      return messages.slice(-limit);
    }
    return messages;
  }

  async updateSessionMetadata(sessionId: string, metadata: Record<string, any>): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      session.metadata = { ...session.metadata, ...metadata };
      session.updatedAt = new Date();

      await this.saveSession(sessionId);
      this.logger.debug(`Updated metadata for session ${sessionId}`);

    } catch (error) {
      this.logger.error('Failed to update session metadata:', error);
      throw error;
    }
  }

  async saveSession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const filePath = this.getSessionFilePath(sessionId);
      const sessionDir = path.dirname(filePath);
      await fs.mkdir(sessionDir, { recursive: true });

      await fs.writeFile(filePath, JSON.stringify(session, null, 2));
      this.logger.debug(`Saved session: ${session.name} (${sessionId})`);

    } catch (error) {
      this.logger.error('Failed to save session:', error);
      throw error;
    }
  }

  async saveAllSessions(): Promise<void> {
    try {
      const savePromises = Array.from(this.sessions.keys()).map(sessionId => 
        this.saveSession(sessionId)
      );

      await Promise.all(savePromises);
      this.logger.debug(`Saved all ${this.sessions.size} sessions`);

    } catch (error) {
      this.logger.error('Failed to save all sessions:', error);
    }
  }

  async exportSession(sessionId: string, format: 'json' | 'md' | 'txt'): Promise<string> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      switch (format) {
        case 'json':
          return JSON.stringify(session, null, 2);

        case 'md':
          return this.exportToMarkdown(session);

        case 'txt':
          return this.exportToText(session);

        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

    } catch (error) {
      this.logger.error('Failed to export session:', error);
      throw error;
    }
  }

  private exportToMarkdown(session: Session): string {
    let md = `# Session: ${session.name}\n\n`;
    md += `**Model:** ${session.model}\n`;
    md += `**Created:** ${session.createdAt.toISOString()}\n`;
    md += `**Updated:** ${session.updatedAt.toISOString()}\n\n`;

    if (Object.keys(session.metadata).length > 0) {
      md += `## Metadata\n\n`;
      md += `\`\`\`json\n${JSON.stringify(session.metadata, null, 2)}\n\`\`\`\n\n`;
    }

    md += `## Conversation\n\n`;

    for (const message of session.messages) {
      const role = message.role === 'user' ? 'User' : 'Assistant';
      md += `### ${role} (${message.timestamp.toISOString()})\n\n`;
      md += `${message.content}\n\n`;
    }

    return md;
  }

  private exportToText(session: Session): string {
    let txt = `Session: ${session.name}\n`;
    txt += `Model: ${session.model}\n`;
    txt += `Created: ${session.createdAt.toISOString()}\n`;
    txt += `Updated: ${session.updatedAt.toISOString()}\n\n`;

    for (const message of session.messages) {
      const role = message.role === 'user' ? 'User' : 'Assistant';
      txt += `${role} (${message.timestamp.toISOString()}):\n`;
      txt += `${message.content}\n\n`;
    }

    return txt;
  }

  async importSession(sessionData: string, format: 'json' = 'json'): Promise<Session> {
    try {
      let session: Session;

      if (format === 'json') {
        session = JSON.parse(sessionData);
        // Convert date strings back to Date objects
        session.createdAt = new Date(session.createdAt);
        session.updatedAt = new Date(session.updatedAt);
        session.messages = session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } else {
        throw new Error(`Unsupported import format: ${format}`);
      }

      // Generate new ID to avoid conflicts
      session.id = this.generateSessionId();

      // Save the imported session
      this.sessions.set(session.id, session);
      await this.saveSession(session.id);

      this.logger.info(`Imported session: ${session.name} (${session.id})`);
      return session;

    } catch (error) {
      this.logger.error('Failed to import session:', error);
      throw error;
    }
  }

  async getSessionCount(): Promise<number> {
    return this.sessions.size;
  }

  async checkConnection(): Promise<boolean> {
    try {
      await fs.access(this.sessionsPath);
      return true;
    } catch {
      return false;
    }
  }

  private getSessionFilePath(sessionId: string): string {
    return path.join(this.sessionsPath, `${sessionId}.json`);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup methods
  async cleanupOldSessions(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const now = Date.now();
      const cutoffTime = now - maxAge;
      let deletedCount = 0;

      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.updatedAt.getTime() < cutoffTime) {
          await this.deleteSession(sessionId);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        this.logger.info(`Cleaned up ${deletedCount} old sessions`);
      }

      return deletedCount;

    } catch (error) {
      this.logger.error('Failed to cleanup old sessions:', error);
      return 0;
    }
  }

  // Statistics
  async getSessionStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    oldestSession: Date | null;
    newestSession: Date | null;
    modelUsage: Record<string, number>;
  }> {
    const sessions = Array.from(this.sessions.values());
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        oldestSession: null,
        newestSession: null,
        modelUsage: {}
      };
    }

    const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);
    const timestamps = sessions.map(s => s.updatedAt.getTime());
    const modelUsage = sessions.reduce((acc, session) => {
      acc[session.model] = (acc[session.model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSessions: sessions.length,
      totalMessages,
      oldestSession: new Date(Math.min(...timestamps)),
      newestSession: new Date(Math.max(...timestamps)),
      modelUsage
    };
  }

  // Destroy
  async destroy(): Promise<void> {
    try {
      if (this.saveTimer) {
        clearInterval(this.saveTimer);
        this.saveTimer = undefined;
      }

      await this.saveAllSessions();
      this.logger.info('Session Manager destroyed');

    } catch (error) {
      this.logger.error('Failed to destroy Session Manager:', error);
    }
  }
}