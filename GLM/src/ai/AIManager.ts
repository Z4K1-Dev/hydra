import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';

export interface AIModel {
  name: string;
  provider: 'openai' | 'anthropic';
  maxTokens: number;
  supportsStreaming: boolean;
  costPer1kTokens: number;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  timestamp: Date;
}

export class AIManager extends EventEmitter {
  private logger: Logger;
  private currentModel: string;
  private models: Map<string, AIModel>;
  private apiKeys: Map<string, string>;
  private baseUrl?: string;

  constructor() {
    super();
    this.logger = new Logger('AIManager');
    this.currentModel = 'gpt-4';
    this.models = new Map();
    this.apiKeys = new Map();
    this.initializeModels();
  }

  private initializeModels(): void {
    // OpenAI Models
    this.models.set('gpt-4', {
      name: 'GPT-4',
      provider: 'openai',
      maxTokens: 8192,
      supportsStreaming: true,
      costPer1kTokens: 0.06
    });

    this.models.set('gpt-3.5-turbo', {
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      maxTokens: 4096,
      supportsStreaming: true,
      costPer1kTokens: 0.002
    });

    // Anthropic Models
    this.models.set('claude-3', {
      name: 'Claude 3',
      provider: 'anthropic',
      maxTokens: 100000,
      supportsStreaming: true,
      costPer1kTokens: 0.015
    });

    this.models.set('claude-2', {
      name: 'Claude 2',
      provider: 'anthropic',
      maxTokens: 100000,
      supportsStreaming: true,
      costPer1kTokens: 0.01
    });
  }

  async initialize(model: string, apiKey: string, baseUrl?: string): Promise<void> {
    try {
      this.currentModel = model;
      this.apiKeys.set(this.getModelProvider(model), apiKey);
      if (baseUrl) {
        this.baseUrl = baseUrl;
      }

      // Validate API key
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to AI service');
      }

      this.logger.info(`AI Manager initialized with model: ${model}`);
      this.emit('initialized', { model, provider: this.getModelProvider(model) });

    } catch (error) {
      this.logger.error('Failed to initialize AI Manager:', error);
      throw error;
    }
  }

  async generateResponse(prompt: string, context?: any, options?: any): Promise<AIResponse> {
    try {
      this.logger.debug('Generating AI response', { prompt: prompt.substring(0, 100), model: this.currentModel });

      const model = this.models.get(this.currentModel);
      if (!model) {
        throw new Error(`Unknown model: ${this.currentModel}`);
      }

      let response: AIResponse;

      switch (model.provider) {
        case 'openai':
          response = await this.callOpenAI(prompt, context, options);
          break;
        case 'anthropic':
          response = await this.callAnthropic(prompt, context, options);
          break;
        default:
          throw new Error(`Unsupported provider: ${model.provider}`);
      }

      this.logger.info('AI response generated', {
        model: response.model,
        tokens: response.usage.totalTokens,
        cost: this.calculateCost(response.usage.totalTokens, model)
      });

      this.emit('response', response);
      return response;

    } catch (error) {
      this.logger.error('Failed to generate AI response:', error);
      throw error;
    }
  }

  private async callOpenAI(prompt: string, context?: any, options?: any): Promise<AIResponse> {
    const apiKey = this.apiKeys.get('openai');
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: this.baseUrl
    });

    const messages = this.buildMessages(prompt, context);
    
    const completion = await openai.chat.completions.create({
      model: this.currentModel,
      messages: messages,
      max_tokens: options?.maxTokens || 4000,
      temperature: options?.temperature || 0.7,
      stream: options?.stream || false
    });

    return {
      content: completion.choices[0]?.message?.content || '',
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      },
      model: this.currentModel,
      timestamp: new Date()
    };
  }

  private async callAnthropic(prompt: string, context?: any, options?: any): Promise<AIResponse> {
    const apiKey = this.apiKeys.get('anthropic');
    if (!apiKey) {
      throw new Error('Anthropic API key not found');
    }

    const { Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: apiKey
    });

    const systemPrompt = this.buildSystemPrompt(context);
    
    const message = await anthropic.messages.create({
      model: this.currentModel,
      max_tokens: options?.maxTokens || 4000,
      temperature: options?.temperature || 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return {
      content: message.content[0]?.text || '',
      usage: {
        promptTokens: message.usage?.input_tokens || 0,
        completionTokens: message.usage?.output_tokens || 0,
        totalTokens: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0)
      },
      model: this.currentModel,
      timestamp: new Date()
    };
  }

  private buildMessages(prompt: string, context?: any): any[] {
    const messages: any[] = [];

    // Add system message if context provides it
    if (context?.systemPrompt) {
      messages.push({
        role: 'system',
        content: context.systemPrompt
      });
    }

    // Add conversation history
    if (context?.conversation && Array.isArray(context.conversation)) {
      context.conversation.forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    return messages;
  }

  private buildSystemPrompt(context?: any): string {
    if (context?.systemPrompt) {
      return context.systemPrompt;
    }

    // Default system prompt
    return `You are GLM, a helpful AI assistant. You are knowledgeable, friendly, and professional. 
You provide accurate and useful information while maintaining a conversational tone.
You have access to various tools and can help with a wide range of tasks including:
- Programming and technical assistance
- Analysis and problem-solving
- Creative writing and content generation
- Research and information gathering
- System administration and Linux commands

Always be helpful, accurate, and considerate in your responses.`;
  }

  async switchModel(modelName: string): Promise<void> {
    try {
      const model = this.models.get(modelName);
      if (!model) {
        throw new Error(`Unknown model: ${modelName}`);
      }

      const provider = model.provider;
      const apiKey = this.apiKeys.get(provider);
      if (!apiKey) {
        throw new Error(`API key not found for provider: ${provider}`);
      }

      // Test connection with new model
      this.currentModel = modelName;
      const isConnected = await this.checkConnection();
      
      if (!isConnected) {
        throw new Error(`Failed to connect with model: ${modelName}`);
      }

      this.logger.info(`Switched to model: ${modelName}`);
      this.emit('modelChanged', { model: modelName, provider });

    } catch (error) {
      this.logger.error('Failed to switch model:', error);
      throw error;
    }
  }

  async getCurrentModel(): Promise<string> {
    return this.currentModel;
  }

  async getAvailableModels(): Promise<AIModel[]> {
    return Array.from(this.models.values());
  }

  async checkConnection(): Promise<boolean> {
    try {
      const model = this.models.get(this.currentModel);
      if (!model) {
        return false;
      }

      const apiKey = this.apiKeys.get(model.provider);
      if (!apiKey) {
        return false;
      }

      // Simple test request
      await this.generateResponse('test', undefined, { maxTokens: 10 });
      return true;

    } catch (error) {
      this.logger.warn('Connection check failed:', error);
      return false;
    }
  }

  private calculateCost(tokens: number, model: AIModel): number {
    return (tokens / 1000) * model.costPer1kTokens;
  }

  private getModelProvider(modelName: string): 'openai' | 'anthropic' {
    const model = this.models.get(modelName);
    return model?.provider || 'openai';
  }

  // Streaming support
  async generateResponseStream(prompt: string, context?: any, options?: any): Promise<AsyncIterable<string>> {
    const model = this.models.get(this.currentModel);
    if (!model?.supportsStreaming) {
      throw new Error(`Model ${this.currentModel} does not support streaming`);
    }

    if (model.provider === 'openai') {
      return this.openAIStream(prompt, context, options);
    } else {
      throw new Error(`Streaming not implemented for provider: ${model.provider}`);
    }
  }

  private async* openAIStream(prompt: string, context?: any, options?: any): AsyncIterable<string> {
    const apiKey = this.apiKeys.get('openai');
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: this.baseUrl
    });

    const messages = this.buildMessages(prompt, context);
    
    const stream = await openai.chat.completions.create({
      model: this.currentModel,
      messages: messages,
      max_tokens: options?.maxTokens || 4000,
      temperature: options?.temperature || 0.7,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }

  // Cost tracking
  async getUsageStats(): Promise<{
    totalTokens: number;
    totalCost: number;
    modelUsage: Record<string, { tokens: number; cost: number }>;
  }> {
    // This would typically track usage in a database
    // For now, return placeholder data
    return {
      totalTokens: 0,
      totalCost: 0,
      modelUsage: {}
    };
  }

  // Model capabilities
  async getModelCapabilities(modelName: string): Promise<{
    maxTokens: number;
    supportsStreaming: boolean;
    supportsVision: boolean;
    supportsFunctions: boolean;
  }> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    return {
      maxTokens: model.maxTokens,
      supportsStreaming: model.supportsStreaming,
      supportsVision: ['gpt-4', 'claude-3'].includes(modelName),
      supportsFunctions: model.provider === 'openai'
    };
  }
}