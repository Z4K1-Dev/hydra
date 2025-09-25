// Error Recovery Manager with Self-Healing Capabilities

// Error Severity Levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error Category Types
export enum ErrorCategory {
  PLUGIN_LOAD = 'plugin_load',
  PLUGIN_EXECUTION = 'plugin_execution',
  CONFIGURATION = 'configuration',
  NETWORK = 'network',
  DATABASE = 'database',
  MEMORY = 'memory',
  SECURITY = 'security',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

// Error Interface
export interface SystemError {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context: Record<string, any>;
  source: string;
  component?: string;
  plugin?: string;
  userId?: string;
  sessionId?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolutionMethod?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

// Recovery Strategy Interface
export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  applicableCategories: ErrorCategory[];
  applicableSeverities: ErrorSeverity[];
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  actions: RecoveryAction[];
  conditions: RecoveryCondition[];
  priority: number;
  timeout: number;
}

// Recovery Action Interface
export interface RecoveryAction {
  type: 'restart' | 'reload' | 'rollback' | 'disable' | 'notify' | 'escalate' | 'custom';
  target: string;
  parameters?: Record<string, any>;
  timeout?: number;
  rollbackAction?: RecoveryAction;
}

// Recovery Condition Interface
export interface RecoveryCondition {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than' | 'exists';
  value: any;
}

// Health Check Interface
export interface HealthCheck {
  id: string;
  name: string;
  description: string;
  component: string;
  checkInterval: number;
  timeout: number;
  enabled: boolean;
  lastCheck?: Date;
  lastResult?: HealthCheckResult;
  consecutiveFailures: number;
  maxConsecutiveFailures: number;
}

// Health Check Result Interface
export interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  message?: string;
  metrics?: Record<string, number>;
  timestamp: Date;
}

// Circuit Breaker State
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

// Circuit Breaker Interface
export interface CircuitBreaker {
  id: string;
  name: string;
  component: string;
  state: CircuitBreakerState;
  failureCount: number;
  failureThreshold: number;
  recoveryTimeout: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  requestCount: number;
  successCount: number;
}

// Error Recovery Manager Options
export interface ErrorRecoveryOptions {
  enableAutoRecovery: boolean;
  enableCircuitBreakers: boolean;
  enableHealthChecks: boolean;
  enableErrorLogging: boolean;
  enableNotification: boolean;
  maxConcurrentRecoveries: number;
  recoveryTimeout: number;
  healthCheckInterval: number;
  errorRetentionPeriod: number;
  notificationChannels: string[];
}

// Default options
const defaultOptions: ErrorRecoveryOptions = {
  enableAutoRecovery: true,
  enableCircuitBreakers: true,
  enableHealthChecks: true,
  enableErrorLogging: true,
  enableNotification: true,
  maxConcurrentRecoveries: 3,
  recoveryTimeout: 30000, // 30 seconds
  healthCheckInterval: 60000, // 1 minute
  errorRetentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
  notificationChannels: ['console', 'log'],
};

// Error Recovery Manager Class
export class ErrorRecoveryManager {
  private options: ErrorRecoveryOptions;
  private errors: Map<string, SystemError> = new Map();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private activeRecoveries: Map<string, Promise<void>> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private eventCallbacks: Map<string, Set<(data: any) => void>> = new Map();

  constructor(options: Partial<ErrorRecoveryOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize the error recovery manager
   */
  async initialize(): Promise<void> {
    console.log('Initializing Error Recovery Manager...');

    // Start health checks if enabled
    if (this.options.enableHealthChecks) {
      this.startHealthChecks();
    }

    console.log('Error Recovery Manager initialized successfully');
  }

  /**
   * Report an error to the recovery system
   */
  async reportError(error: Omit<SystemError, 'id' | 'timestamp' | 'resolved' | 'retryCount'>): Promise<string> {
    const errorId = this.generateErrorId();
    const systemError: SystemError = {
      ...error,
      id: errorId,
      timestamp: new Date(),
      resolved: false,
      retryCount: 0,
    };

    this.errors.set(errorId, systemError);

    // Log error if enabled
    if (this.options.enableErrorLogging) {
      this.logError(systemError);
    }

    // Attempt auto-recovery if enabled
    if (this.options.enableAutoRecovery) {
      this.attemptRecovery(errorId).catch(recoveryError => {
        console.error(`Auto-recovery failed for error ${errorId}:`, recoveryError);
      });
    }

    // Emit error event
    this.emitEvent('error:reported', systemError);

    return errorId;
  }

  /**
   * Attempt to recover from an error
   */
  private async attemptRecovery(errorId: string): Promise<void> {
    const error = this.errors.get(errorId);
    if (!error || error.resolved) {
      return;
    }

    // Check if already recovering
    if (this.activeRecoveries.has(errorId)) {
      return;
    }

    // Check circuit breaker
    const circuitBreaker = this.getCircuitBreakerForError(error);
    if (circuitBreaker && circuitBreaker.state === CircuitBreakerState.OPEN) {
      console.log(`Circuit breaker open for ${circuitBreaker.component}, skipping recovery`);
      return;
    }

    // Find applicable recovery strategies
    const strategies = this.findApplicableStrategies(error);
    if (strategies.length === 0) {
      console.log(`No recovery strategy found for error ${errorId}`);
      return;
    }

    // Execute recovery with timeout
    const recoveryPromise = this.executeRecovery(error, strategies[0]);
    this.activeRecoveries.set(errorId, recoveryPromise);

    try {
      await Promise.race([
        recoveryPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Recovery timeout')), this.options.recoveryTimeout)
        )
      ]);
    } catch (recoveryError) {
      console.error(`Recovery failed for error ${errorId}:`, recoveryError);
      this.handleRecoveryFailure(errorId, recoveryError as Error);
    } finally {
      this.activeRecoveries.delete(errorId);
    }
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecovery(error: SystemError, strategy: RecoveryStrategy): Promise<void> {
    console.log(`Executing recovery strategy ${strategy.name} for error ${error.id}`);

    // Check retry count
    if (error.retryCount >= strategy.maxRetries) {
      throw new Error(`Max retries (${strategy.maxRetries}) exceeded`);
    }

    // Apply backoff delay
    if (error.retryCount > 0) {
      const delay = this.calculateBackoffDelay(strategy, error.retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Execute recovery actions
    for (const action of strategy.actions) {
      await this.executeRecoveryAction(error, action);
    }

    // Mark error as resolved
    error.resolved = true;
    error.resolvedAt = new Date();
    error.resolutionMethod = strategy.name;
    this.errors.set(error.id, error);

    // Update circuit breaker on success
    const circuitBreaker = this.getCircuitBreakerForError(error);
    if (circuitBreaker) {
      this.updateCircuitBreakerSuccess(circuitBreaker);
    }

    this.emitEvent('error:recovered', { error, strategy });
    console.log(`Error ${error.id} recovered successfully using ${strategy.name}`);
  }

  /**
   * Execute recovery action
   */
  private async executeRecoveryAction(error: SystemError, action: RecoveryAction): Promise<void> {
    console.log(`Executing recovery action ${action.type} on ${action.target}`);

    switch (action.type) {
      case 'restart':
        await this.restartComponent(action.target);
        break;
      case 'reload':
        await this.reloadComponent(action.target);
        break;
      case 'rollback':
        await this.rollbackComponent(action.target, action.parameters);
        break;
      case 'disable':
        await this.disableComponent(action.target);
        break;
      case 'notify':
        await this.notifyError(error, action.parameters);
        break;
      case 'escalate':
        await this.escalateError(error, action.parameters);
        break;
      case 'custom':
        await this.executeCustomAction(action.target, action.parameters);
        break;
      default:
        throw new Error(`Unknown recovery action type: ${action.type}`);
    }
  }

  /**
   * Handle recovery failure
   */
  private handleRecoveryFailure(errorId: string, recoveryError: Error): void {
    const error = this.errors.get(errorId);
    if (!error) {
      return;
    }

    error.retryCount++;
    this.errors.set(errorId, error);

    // Update circuit breaker on failure
    const circuitBreaker = this.getCircuitBreakerForError(error);
    if (circuitBreaker) {
      this.updateCircuitBreakerFailure(circuitBreaker);
    }

    this.emitEvent('error:recovery_failed', { error, recoveryError });

    // Escalate if max retries reached
    if (error.retryCount >= 3) {
      this.escalateError(error, { reason: 'Max recovery retries reached' });
    }
  }

  /**
   * Find applicable recovery strategies for an error
   */
  private findApplicableStrategies(error: SystemError): RecoveryStrategy[] {
    return Array.from(this.recoveryStrategies.values())
      .filter(strategy => 
        strategy.applicableCategories.includes(error.category) &&
        strategy.applicableSeverities.includes(error.severity) &&
        this.checkRecoveryConditions(strategy, error)
      )
      .sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  /**
   * Check if recovery conditions are met
   */
  private checkRecoveryConditions(strategy: RecoveryStrategy, error: SystemError): boolean {
    return strategy.conditions.every(condition => {
      const fieldValue = this.getNestedValue(error.context, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'contains':
          return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
        case 'matches':
          return new RegExp(condition.value).test(String(fieldValue));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'exists':
          return fieldValue !== undefined;
        default:
          return false;
      }
    });
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Calculate backoff delay
   */
  private calculateBackoffDelay(strategy: RecoveryStrategy, retryCount: number): number {
    const baseDelay = 1000; // 1 second

    switch (strategy.backoffStrategy) {
      case 'linear':
        return baseDelay * retryCount;
      case 'exponential':
        return baseDelay * Math.pow(2, retryCount - 1);
      case 'fixed':
        return baseDelay;
      default:
        return baseDelay;
    }
  }

  /**
   * Get circuit breaker for error
   */
  private getCircuitBreakerForError(error: SystemError): CircuitBreaker | undefined {
    if (error.plugin) {
      return this.circuitBreakers.get(`plugin:${error.plugin}`);
    }
    if (error.component) {
      return this.circuitBreakers.get(`component:${error.component}`);
    }
    return undefined;
  }

  /**
   * Update circuit breaker on success
   */
  private updateCircuitBreakerSuccess(circuitBreaker: CircuitBreaker): void {
    circuitBreaker.successCount++;
    circuitBreaker.requestCount++;

    // Reset failure count on success
    if (circuitBreaker.failureCount > 0) {
      circuitBreaker.failureCount = Math.max(0, circuitBreaker.failureCount - 1);
    }

    // Close circuit breaker if enough successes
    if (circuitBreaker.state === CircuitBreakerState.HALF_OPEN && circuitBreaker.successCount >= 3) {
      circuitBreaker.state = CircuitBreakerState.CLOSED;
      console.log(`Circuit breaker closed for ${circuitBreaker.component}`);
    }

    this.circuitBreakers.set(circuitBreaker.id, circuitBreaker);
  }

  /**
   * Update circuit breaker on failure
   */
  private updateCircuitBreakerFailure(circuitBreaker: CircuitBreaker): void {
    circuitBreaker.failureCount++;
    circuitBreaker.requestCount++;
    circuitBreaker.lastFailureTime = new Date();

    // Open circuit breaker if threshold reached
    if (circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
      circuitBreaker.state = CircuitBreakerState.OPEN;
      circuitBreaker.nextAttemptTime = new Date(
        Date.now() + circuitBreaker.recoveryTimeout
      );
      console.log(`Circuit breaker opened for ${circuitBreaker.component}`);
    }

    this.circuitBreakers.set(circuitBreaker.id, circuitBreaker);
  }

  /**
   * Recovery action implementations
   */
  private async restartComponent(component: string): Promise<void> {
    console.log(`Restarting component: ${component}`);
    // Implementation would depend on the component type
    // This is a placeholder for actual restart logic
  }

  private async reloadComponent(component: string): Promise<void> {
    console.log(`Reloading component: ${component}`);
    // Implementation would depend on the component type
    // This is a placeholder for actual reload logic
  }

  private async rollbackComponent(component: string, parameters?: Record<string, any>): Promise<void> {
    console.log(`Rolling back component: ${component}`, parameters);
    // Implementation would depend on the component type
    // This is a placeholder for actual rollback logic
  }

  private async disableComponent(component: string): Promise<void> {
    console.log(`Disabling component: ${component}`);
    // Implementation would depend on the component type
    // This is a placeholder for actual disable logic
  }

  private async notifyError(error: SystemError, parameters?: Record<string, any>): Promise<void> {
    console.log(`Notifying error: ${error.message}`, parameters);
    // Implementation would send notifications
    this.emitEvent('error:notify', { error, parameters });
  }

  private async escalateError(error: SystemError, parameters?: Record<string, any>): Promise<void> {
    console.log(`Escalating error: ${error.message}`, parameters);
    // Implementation would escalate to higher priority systems
    this.emitEvent('error:escalate', { error, parameters });
  }

  private async executeCustomAction(target: string, parameters?: Record<string, any>): Promise<void> {
    console.log(`Executing custom action: ${target}`, parameters);
    // Implementation would execute custom logic
  }

  /**
   * Health Check Methods
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.options.healthCheckInterval);

    console.log(`Health checks started with interval: ${this.options.healthCheckInterval}ms`);
  }

  private async performHealthChecks(): Promise<void> {
    const healthChecks = Array.from(this.healthChecks.values()).filter(check => check.enabled);
    
    for (const healthCheck of healthChecks) {
      try {
        await this.performHealthCheck(healthCheck);
      } catch (error) {
        console.error(`Health check failed for ${healthCheck.id}:`, error);
      }
    }
  }

  private async performHealthCheck(healthCheck: HealthCheck): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Execute health check with timeout
      const result = await Promise.race([
        this.executeHealthCheck(healthCheck),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), healthCheck.timeout)
        )
      ]);

      const responseTime = Date.now() - startTime;
      
      // Update health check result
      healthCheck.lastCheck = new Date();
      healthCheck.lastResult = {
        ...result,
        responseTime,
        timestamp: new Date(),
      };

      // Reset consecutive failures on success
      if (result.healthy) {
        healthCheck.consecutiveFailures = 0;
      } else {
        healthCheck.consecutiveFailures++;
        
        // Trigger recovery if too many consecutive failures
        if (healthCheck.consecutiveFailures >= healthCheck.maxConsecutiveFailures) {
          await this.handleHealthCheckFailure(healthCheck);
        }
      }

      this.healthChecks.set(healthCheck.id, healthCheck);
      this.emitEvent('health:check_completed', { healthCheck, result });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Update health check result with failure
      healthCheck.lastCheck = new Date();
      healthCheck.lastResult = {
        healthy: false,
        responseTime,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
      
      healthCheck.consecutiveFailures++;
      
      this.healthChecks.set(healthCheck.id, healthCheck);
      this.emitEvent('health:check_failed', { healthCheck, error });

      // Trigger recovery if too many consecutive failures
      if (healthCheck.consecutiveFailures >= healthCheck.maxConsecutiveFailures) {
        await this.handleHealthCheckFailure(healthCheck);
      }
    }
  }

  private async executeHealthCheck(healthCheck: HealthCheck): Promise<HealthCheckResult> {
    // This is a placeholder for actual health check logic
    // In a real implementation, this would check the actual health of the component
    
    return {
      healthy: true,
      responseTime: 50,
      message: 'Component is healthy',
      timestamp: new Date(),
    };
  }

  private async handleHealthCheckFailure(healthCheck: HealthCheck): Promise<void> {
    console.error(`Health check failure threshold reached for ${healthCheck.component}`);
    
    // Report error for recovery
    await this.reportError({
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SYSTEM,
      message: `Health check failure for ${healthCheck.component}`,
      context: {
        healthCheckId: healthCheck.id,
        consecutiveFailures: healthCheck.consecutiveFailures,
      },
      source: 'health-check',
      component: healthCheck.component,
    });
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeDefaultStrategies(): void {
    // Plugin load failure strategy
    this.addRecoveryStrategy({
      id: 'plugin-load-retry',
      name: 'Plugin Load Retry',
      description: 'Retry loading failed plugins',
      applicableCategories: [ErrorCategory.PLUGIN_LOAD],
      applicableSeverities: [ErrorSeverity.LOW, ErrorSeverity.MEDIUM],
      maxRetries: 3,
      backoffStrategy: 'exponential',
      priority: 10,
      timeout: 30000,
      actions: [
        {
          type: 'reload',
          target: 'plugin',
        },
      ],
      conditions: [
        {
          field: 'plugin',
          operator: 'exists',
          value: true,
        },
      ],
    });

    // Plugin execution error strategy
    this.addRecoveryStrategy({
      id: 'plugin-execution-restart',
      name: 'Plugin Execution Restart',
      description: 'Restart plugins with execution errors',
      applicableCategories: [ErrorCategory.PLUGIN_EXECUTION],
      applicableSeverities: [ErrorSeverity.MEDIUM, ErrorSeverity.HIGH],
      maxRetries: 2,
      backoffStrategy: 'linear',
      priority: 8,
      timeout: 45000,
      actions: [
        {
          type: 'restart',
          target: 'plugin',
        },
        {
          type: 'notify',
          target: 'admin',
        },
      ],
      conditions: [
        {
          field: 'plugin',
          operator: 'exists',
          value: true,
        },
      ],
    });

    // Configuration error strategy
    this.addRecoveryStrategy({
      id: 'configuration-rollback',
      name: 'Configuration Rollback',
      description: 'Rollback configuration changes',
      applicableCategories: [ErrorCategory.CONFIGURATION],
      applicableSeverities: [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL],
      maxRetries: 1,
      backoffStrategy: 'fixed',
      priority: 15,
      timeout: 60000,
      actions: [
        {
          type: 'rollback',
          target: 'configuration',
          parameters: { version: 'previous' },
        },
        {
          type: 'notify',
          target: 'admin',
        },
      ],
      conditions: [
        {
          field: 'context.configChange',
          operator: 'exists',
          value: true,
        },
      ],
    });

    // Memory error strategy
    this.addRecoveryStrategy({
      id: 'memory-recovery',
      name: 'Memory Recovery',
      description: 'Recover from memory errors',
      applicableCategories: [ErrorCategory.MEMORY],
      applicableSeverities: [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL],
      maxRetries: 1,
      backoffStrategy: 'fixed',
      priority: 20,
      timeout: 30000,
      actions: [
        {
          type: 'restart',
          target: 'memory-manager',
        },
        {
          type: 'escalate',
          target: 'system-admin',
        },
      ],
      conditions: [
        {
          field: 'context.memoryUsage',
          operator: 'greater_than',
          value: 90,
        },
      ],
    });
  }

  /**
   * Utility Methods
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(error: SystemError): void {
    console.error(`[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`, {
      errorId: error.id,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack,
    });
  }

  /**
   * Public API Methods
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(strategy.id, strategy);
    console.log(`Recovery strategy added: ${strategy.name}`);
  }

  removeRecoveryStrategy(strategyId: string): void {
    this.recoveryStrategies.delete(strategyId);
    console.log(`Recovery strategy removed: ${strategyId}`);
  }

  addHealthCheck(healthCheck: HealthCheck): void {
    this.healthChecks.set(healthCheck.id, healthCheck);
    console.log(`Health check added: ${healthCheck.name}`);
  }

  removeHealthCheck(healthCheckId: string): void {
    this.healthChecks.delete(healthCheckId);
    console.log(`Health check removed: ${healthCheckId}`);
  }

  addCircuitBreaker(circuitBreaker: CircuitBreaker): void {
    this.circuitBreakers.set(circuitBreaker.id, circuitBreaker);
    console.log(`Circuit breaker added: ${circuitBreaker.name}`);
  }

  removeCircuitBreaker(circuitBreakerId: string): void {
    this.circuitBreakers.delete(circuitBreakerId);
    console.log(`Circuit breaker removed: ${circuitBreakerId}`);
  }

  getError(errorId: string): SystemError | undefined {
    return this.errors.get(errorId);
  }

  getAllErrors(): SystemError[] {
    return Array.from(this.errors.values());
  }

  getActiveRecoveries(): string[] {
    return Array.from(this.activeRecoveries.keys());
  }

  getStatistics(): {
    totalErrors: number;
    resolvedErrors: number;
    activeRecoveries: number;
    healthChecks: { total: number; healthy: number; unhealthy: number };
    circuitBreakers: { total: number; open: number; closed: number; halfOpen: number };
  } {
    const errors = Array.from(this.errors.values());
    const healthChecks = Array.from(this.healthChecks.values());
    const circuitBreakers = Array.from(this.circuitBreakers.values());

    return {
      totalErrors: errors.length,
      resolvedErrors: errors.filter(e => e.resolved).length,
      activeRecoveries: this.activeRecoveries.size,
      healthChecks: {
        total: healthChecks.length,
        healthy: healthChecks.filter(h => h.lastResult?.healthy).length,
        unhealthy: healthChecks.filter(h => !h.lastResult?.healthy).length,
      },
      circuitBreakers: {
        total: circuitBreakers.length,
        open: circuitBreakers.filter(cb => cb.state === CircuitBreakerState.OPEN).length,
        closed: circuitBreakers.filter(cb => cb.state === CircuitBreakerState.CLOSED).length,
        halfOpen: circuitBreakers.filter(cb => cb.state === CircuitBreakerState.HALF_OPEN).length,
      },
    };
  }

  /**
   * Event handling
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emitEvent(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Event callback error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Shutdown the error recovery manager
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Error Recovery Manager...');

    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Wait for active recoveries to complete
    const recoveryPromises = Array.from(this.activeRecoveries.values());
    await Promise.allSettled(recoveryPromises);

    // Clear all data
    this.errors.clear();
    this.recoveryStrategies.clear();
    this.healthChecks.clear();
    this.circuitBreakers.clear();
    this.activeRecoveries.clear();
    this.eventCallbacks.clear();

    console.log('Error Recovery Manager shutdown completed');
  }
}