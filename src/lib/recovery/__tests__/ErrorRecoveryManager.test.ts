import { ErrorRecoveryManager, ErrorSeverity, ErrorCategory, CircuitBreakerState } from '../ErrorRecoveryManager';

// Mock timers
jest.useFakeTimers();

describe('ErrorRecoveryManager', () => {
  let recoveryManager: ErrorRecoveryManager;

  beforeEach(() => {
    jest.clearAllMocks();
    recoveryManager = new ErrorRecoveryManager({
      enableAutoRecovery: true,
      enableCircuitBreakers: true,
      enableHealthChecks: true,
      enableErrorLogging: true,
      enableNotification: false,
      maxConcurrentRecoveries: 3,
      recoveryTimeout: 30000,
      healthCheckInterval: 60000,
      errorRetentionPeriod: 7 * 24 * 60 * 60 * 1000,
      notificationChannels: ['console'],
    });
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      expect(recoveryManager).toBeDefined();
      
      const stats = recoveryManager.getStatistics();
      expect(stats.totalErrors).toBe(0);
      expect(stats.activeRecoveries).toBe(0);
    });

    it('should initialize default recovery strategies', async () => {
      await recoveryManager.initialize();
      
      // Check that default strategies were added
      const strategies = recoveryManager['recoveryStrategies'];
      expect(strategies.has('plugin-load-retry')).toBe(true);
      expect(strategies.has('plugin-execution-restart')).toBe(true);
      expect(strategies.has('configuration-rollback')).toBe(true);
      expect(strategies.has('memory-recovery')).toBe(true);
    });

    it('should start health checks when enabled', async () => {
      const options = {
        enableHealthChecks: true,
        healthCheckInterval: 1000,
      };
      
      const manager = new ErrorRecoveryManager(options);
      
      await manager.initialize();
      
      expect(manager['healthCheckInterval']).toBeDefined();
    });
  });

  describe('Error Reporting', () => {
    it('should report error and generate error ID', async () => {
      const errorData = {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.PLUGIN_LOAD,
        message: 'Test error message',
        context: { plugin: 'test-plugin' },
        source: 'test-source',
      };

      const errorId = await recoveryManager.reportError(errorData);

      expect(errorId).toBeDefined();
      expect(typeof errorId).toBe('string');
      expect(errorId.startsWith('error_')).toBe(true);
    });

    it('should store error with correct data', async () => {
      const errorData = {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.MEMORY,
        message: 'Memory error',
        context: { memoryUsage: 95 },
        source: 'system-monitor',
        component: 'memory-manager',
      };

      const errorId = await recoveryManager.reportError(errorData);
      const storedError = recoveryManager.getError(errorId);

      expect(storedError).toBeDefined();
      expect(storedError!.severity).toBe(ErrorSeverity.HIGH);
      expect(storedError!.category).toBe(ErrorCategory.MEMORY);
      expect(storedError!.message).toBe('Memory error');
      expect(storedError!.context.memoryUsage).toBe(95);
      expect(storedError!.component).toBe('memory-manager');
      expect(storedError!.resolved).toBe(false);
      expect(storedError!.retryCount).toBe(0);
    });

    it('should emit error reported event', async () => {
      const mockCallback = jest.fn();
      recoveryManager.on('error:reported', mockCallback);

      const errorData = {
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.NETWORK,
        message: 'Network error',
        context: {},
        source: 'network-client',
      };

      await recoveryManager.reportError(errorData);

      expect(mockCallback).toHaveBeenCalled();
      const calledWithError = mockCallback.mock.calls[0][0];
      expect(calledWithError.severity).toBe(ErrorSeverity.LOW);
      expect(calledWithError.message).toBe('Network error');
    });
  });

  describe('Recovery Strategies', () => {
    it('should add recovery strategy', () => {
      const strategy = {
        id: 'test-strategy',
        name: 'Test Strategy',
        description: 'Test recovery strategy',
        applicableCategories: [ErrorCategory.PLUGIN_LOAD],
        applicableSeverities: [ErrorSeverity.LOW],
        maxRetries: 3,
        backoffStrategy: 'linear' as const,
        actions: [{ type: 'reload' as const, target: 'test' }],
        conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
        priority: 5,
        timeout: 10000,
      };

      recoveryManager.addRecoveryStrategy(strategy);

      expect(recoveryManager['recoveryStrategies'].has('test-strategy')).toBe(true);
    });

    it('should remove recovery strategy', () => {
      const strategy = {
        id: 'test-strategy',
        name: 'Test Strategy',
        description: 'Test recovery strategy',
        applicableCategories: [ErrorCategory.PLUGIN_LOAD],
        applicableSeverities: [ErrorSeverity.LOW],
        maxRetries: 3,
        backoffStrategy: 'linear' as const,
        actions: [{ type: 'reload' as const, target: 'test' }],
        conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
        priority: 5,
        timeout: 10000,
      };

      recoveryManager.addRecoveryStrategy(strategy);
      expect(recoveryManager['recoveryStrategies'].has('test-strategy')).toBe(true);

      recoveryManager.removeRecoveryStrategy('test-strategy');
      expect(recoveryManager['recoveryStrategies'].has('test-strategy')).toBe(false);
    });

    it('should find applicable strategies for error', async () => {
      const errorData = {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.PLUGIN_LOAD,
        message: 'Plugin load error',
        context: { plugin: 'test-plugin' },
        source: 'plugin-loader',
      };

      await recoveryManager.reportError(errorData);

      const strategies = (recoveryManager as any).findApplicableStrategies(
        recoveryManager.getError('error_1')!
      );

      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies[0].applicableCategories).toContain(ErrorCategory.PLUGIN_LOAD);
      expect(strategies[0].applicableSeverities).toContain(ErrorSeverity.MEDIUM);
    });

    it('should check recovery conditions', () => {
      const strategy = {
        id: 'test-strategy',
        name: 'Test Strategy',
        description: 'Test recovery strategy',
        applicableCategories: [ErrorCategory.PLUGIN_LOAD],
        applicableSeverities: [ErrorSeverity.LOW],
        maxRetries: 3,
        backoffStrategy: 'linear' as const,
        actions: [{ type: 'reload' as const, target: 'test' }],
        conditions: [
          { field: 'plugin', operator: 'exists' as const, value: true },
          { field: 'context.memoryUsage', operator: 'greater_than' as const, value: 90 },
        ],
        priority: 5,
        timeout: 10000,
      };

      recoveryManager.addRecoveryStrategy(strategy);

      const error = {
        id: 'test-error',
        timestamp: new Date(),
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.PLUGIN_LOAD,
        message: 'Test error',
        context: { plugin: 'test-plugin', memoryUsage: 95 },
        source: 'test',
        resolved: false,
        retryCount: 0,
      };

      const meetsConditions = (recoveryManager as any).checkRecoveryConditions(strategy, error);
      expect(meetsConditions).toBe(true);
    });

    it('should calculate backoff delay correctly', () => {
      const linearStrategy = {
        id: 'linear',
        name: 'Linear Strategy',
        description: 'Linear backoff',
        applicableCategories: [ErrorCategory.PLUGIN_LOAD],
        applicableSeverities: [ErrorSeverity.LOW],
        maxRetries: 3,
        backoffStrategy: 'linear' as const,
        actions: [{ type: 'reload' as const, target: 'test' }],
        conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
        priority: 5,
        timeout: 10000,
      };

      const exponentialStrategy = {
        id: 'exponential',
        name: 'Exponential Strategy',
        description: 'Exponential backoff',
        applicableCategories: [ErrorCategory.PLUGIN_LOAD],
        applicableSeverities: [ErrorSeverity.LOW],
        maxRetries: 3,
        backoffStrategy: 'exponential' as const,
        actions: [{ type: 'reload' as const, target: 'test' }],
        conditions: [{ field: 'test', operator: 'exists' as const, value: true }],
        priority: 5,
        timeout: 10000,
      };

      const linearDelay = (recoveryManager as any).calculateBackoffDelay(linearStrategy, 2);
      const exponentialDelay = (recoveryManager as any).calculateBackoffDelay(exponentialStrategy, 2);

      expect(linearDelay).toBe(2000); // 1000 * 2
      expect(exponentialDelay).toBe(2000); // 1000 * 2^(2-1)
    });
  });

  describe('Circuit Breakers', () => {
    it('should add circuit breaker', () => {
      const circuitBreaker = {
        id: 'test-cb',
        name: 'Test Circuit Breaker',
        component: 'test-component',
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        failureThreshold: 5,
        recoveryTimeout: 30000,
        requestCount: 0,
        successCount: 0,
      };

      recoveryManager.addCircuitBreaker(circuitBreaker);

      expect(recoveryManager['circuitBreakers'].has('test-cb')).toBe(true);
    });

    it('should update circuit breaker on success', () => {
      const circuitBreaker = {
        id: 'test-cb',
        name: 'Test Circuit Breaker',
        component: 'test-component',
        state: CircuitBreakerState.CLOSED,
        failureCount: 2,
        failureThreshold: 5,
        recoveryTimeout: 30000,
        requestCount: 10,
        successCount: 8,
      };

      recoveryManager.addCircuitBreaker(circuitBreaker);

      (recoveryManager as any).updateCircuitBreakerSuccess(circuitBreaker);

      expect(circuitBreaker.successCount).toBe(9);
      expect(circuitBreaker.requestCount).toBe(11);
      expect(circuitBreaker.failureCount).toBe(1); // Should decrement
    });

    it('should update circuit breaker on failure', () => {
      const circuitBreaker = {
        id: 'test-cb',
        name: 'Test Circuit Breaker',
        component: 'test-component',
        state: CircuitBreakerState.CLOSED,
        failureCount: 4,
        failureThreshold: 5,
        recoveryTimeout: 30000,
        requestCount: 10,
        successCount: 6,
      };

      recoveryManager.addCircuitBreaker(circuitBreaker);

      (recoveryManager as any).updateCircuitBreakerFailure(circuitBreaker);

      expect(circuitBreaker.failureCount).toBe(5);
      expect(circuitBreaker.requestCount).toBe(11);
      expect(circuitBreaker.state).toBe(CircuitBreakerState.OPEN);
      expect(circuitBreaker.nextAttemptTime).toBeDefined();
    });

    it('should get circuit breaker for error', async () => {
      const circuitBreaker = {
        id: 'plugin-cb',
        name: 'Plugin Circuit Breaker',
        component: 'plugin-system',
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        failureThreshold: 5,
        recoveryTimeout: 30000,
        requestCount: 0,
        successCount: 0,
      };

      recoveryManager.addCircuitBreaker(circuitBreaker);

      const errorData = {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.PLUGIN_LOAD,
        message: 'Plugin error',
        context: { plugin: 'test-plugin' },
        source: 'plugin-loader',
        plugin: 'test-plugin',
      };

      await recoveryManager.reportError(errorData);

      const foundCb = (recoveryManager as any).getCircuitBreakerForError(
        recoveryManager.getError('error_1')!
      );

      expect(foundCb).toBeDefined();
      expect(foundCb!.id).toBe('plugin-cb');
    });
  });

  describe('Health Checks', () => {
    it('should add health check', () => {
      const healthCheck = {
        id: 'test-hc',
        name: 'Test Health Check',
        description: 'Test health check',
        component: 'test-component',
        checkInterval: 60000,
        timeout: 5000,
        enabled: true,
        consecutiveFailures: 0,
        maxConsecutiveFailures: 3,
      };

      recoveryManager.addHealthCheck(healthCheck);

      expect(recoveryManager['healthChecks'].has('test-hc')).toBe(true);
    });

    it('should perform health check', async () => {
      const healthCheck = {
        id: 'test-hc',
        name: 'Test Health Check',
        description: 'Test health check',
        component: 'test-component',
        checkInterval: 60000,
        timeout: 5000,
        enabled: true,
        consecutiveFailures: 0,
        maxConsecutiveFailures: 3,
      };

      recoveryManager.addHealthCheck(healthCheck);

      // Mock successful health check
      jest.spyOn(recoveryManager as any, 'executeHealthCheck').mockResolvedValue({
        healthy: true,
        responseTime: 50,
        message: 'Component is healthy',
        timestamp: new Date(),
      });

      await (recoveryManager as any).performHealthCheck(healthCheck);

      expect(healthCheck.lastResult).toBeDefined();
      expect(healthCheck.lastResult!.healthy).toBe(true);
      expect(healthCheck.consecutiveFailures).toBe(0);
    });

    it('should handle health check failure', async () => {
      const healthCheck = {
        id: 'test-hc',
        name: 'Test Health Check',
        description: 'Test health check',
        component: 'test-component',
        checkInterval: 60000,
        timeout: 5000,
        enabled: true,
        consecutiveFailures: 2,
        maxConsecutiveFailures: 3,
      };

      recoveryManager.addHealthCheck(healthCheck);

      // Mock failed health check
      jest.spyOn(recoveryManager as any, 'executeHealthCheck').mockRejectedValue(
        new Error('Health check failed')
      );

      await (recoveryManager as any).performHealthCheck(healthCheck);

      expect(healthCheck.lastResult).toBeDefined();
      expect(healthCheck.lastResult!.healthy).toBe(false);
      expect(healthCheck.consecutiveFailures).toBe(3);
    });

    it('should handle health check timeout', async () => {
      const healthCheck = {
        id: 'test-hc',
        name: 'Test Health Check',
        description: 'Test health check',
        component: 'test-component',
        checkInterval: 60000,
        timeout: 1000,
        enabled: true,
        consecutiveFailures: 0,
        maxConsecutiveFailures: 3,
      };

      recoveryManager.addHealthCheck(healthCheck);

      // Mock slow health check
      jest.spyOn(recoveryManager as any, 'executeHealthCheck').mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 2000))
      );

      await (recoveryManager as any).performHealthCheck(healthCheck);

      expect(healthCheck.lastResult).toBeDefined();
      expect(healthCheck.lastResult!.healthy).toBe(false);
      expect(healthCheck.lastResult!.message).toBe('Health check timeout');
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', async () => {
      // Add some test data
      await recoveryManager.reportError({
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.PLUGIN_LOAD,
        message: 'Test error 1',
        context: {},
        source: 'test',
      });

      await recoveryManager.reportError({
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.MEMORY,
        message: 'Test error 2',
        context: {},
        source: 'test',
      });

      // Manually resolve one error
      const error = recoveryManager.getError('error_1');
      if (error) {
        error.resolved = true;
        error.resolvedAt = new Date();
      }

      const stats = recoveryManager.getStatistics();

      expect(stats.totalErrors).toBe(2);
      expect(stats.resolvedErrors).toBe(1);
      expect(stats.activeRecoveries).toBe(0);
    });
  });

  describe('Event Handling', () => {
    it('should handle event callbacks', async () => {
      const reportedCallback = jest.fn();
      const recoveredCallback = jest.fn();

      recoveryManager.on('error:reported', reportedCallback);
      recoveryManager.on('error:recovered', recoveredCallback);

      await recoveryManager.reportError({
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.NETWORK,
        message: 'Test event',
        context: {},
        source: 'test',
      });

      expect(reportedCallback).toHaveBeenCalled();

      // Manually trigger recovery
      const error = recoveryManager.getError('error_1');
      if (error) {
        error.resolved = true;
        error.resolvedAt = new Date();
        error.resolutionMethod = 'test-strategy';
        recoveryManager['errors'].set('error_1', error);
        
        (recoveryManager as any).emitEvent('error:recovered', { error, strategy: { name: 'test' } });
      }

      expect(recoveredCallback).toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', async () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      recoveryManager.on('error:reported', errorCallback);

      // Should not throw when callback fails
      await expect(
        recoveryManager.reportError({
          severity: ErrorSeverity.LOW,
          category: ErrorCategory.NETWORK,
          message: 'Test event',
          context: {},
          source: 'test',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await recoveryManager.initialize();

      // Add some test data
      await recoveryManager.reportError({
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.PLUGIN_LOAD,
        message: 'Test error',
        context: {},
        source: 'test',
      });

      await recoveryManager.shutdown();

      const stats = recoveryManager.getStatistics();
      expect(stats.totalErrors).toBe(0); // Should be cleared
      expect(recoveryManager['healthCheckInterval']).toBeUndefined();
    });
  });
});