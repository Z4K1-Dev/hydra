'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  ErrorRecoveryManager, 
  SystemError, 
  RecoveryStrategy, 
  HealthCheck, 
  CircuitBreaker,
  ErrorSeverity,
  ErrorCategory,
  CircuitBreakerState
} from './ErrorRecoveryManager';

interface ErrorRecoveryUIProps {
  recoveryManager: ErrorRecoveryManager;
}

export function ErrorRecoveryUI({ recoveryManager }: ErrorRecoveryUIProps) {
  const [errors, setErrors] = useState<SystemError[]>([]);
  const [strategies, setStrategies] = useState<RecoveryStrategy[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreaker[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [activeRecoveries, setActiveRecoveries] = useState<string[]>([]);

  useEffect(() => {
    // Simulate getting data from recovery manager
    // In a real implementation, this would use actual data
    const mockErrors: SystemError[] = [
      {
        id: 'error_1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.PLUGIN_LOAD,
        message: 'Failed to load plugin: google-analytics',
        context: { plugin: 'google-analytics', attempt: 2 },
        source: 'plugin-loader',
        plugin: 'google-analytics',
        resolved: false,
        retryCount: 2,
      },
      {
        id: 'error_2',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.MEMORY,
        message: 'Memory usage exceeded threshold',
        context: { memoryUsage: 95, threshold: 90 },
        source: 'system-monitor',
        component: 'memory-manager',
        resolved: true,
        resolvedAt: new Date(Date.now() - 8 * 60 * 1000),
        resolutionMethod: 'memory-recovery',
        retryCount: 1,
      },
    ];

    const mockStrategies: RecoveryStrategy[] = [
      {
        id: 'plugin-load-retry',
        name: 'Plugin Load Retry',
        description: 'Retry loading failed plugins',
        applicableCategories: [ErrorCategory.PLUGIN_LOAD],
        applicableSeverities: [ErrorSeverity.LOW, ErrorSeverity.MEDIUM],
        maxRetries: 3,
        backoffStrategy: 'exponential',
        actions: [{ type: 'reload', target: 'plugin' }],
        conditions: [{ field: 'plugin', operator: 'exists', value: true }],
        priority: 10,
        timeout: 30000,
      },
    ];

    const mockHealthChecks: HealthCheck[] = [
      {
        id: 'plugin-health',
        name: 'Plugin Health Check',
        description: 'Check health of all plugins',
        component: 'plugin-system',
        checkInterval: 60000,
        timeout: 5000,
        enabled: true,
        lastCheck: new Date(),
        lastResult: {
          healthy: true,
          responseTime: 45,
          message: 'All plugins healthy',
          timestamp: new Date(),
        },
        consecutiveFailures: 0,
        maxConsecutiveFailures: 3,
      },
    ];

    const mockCircuitBreakers: CircuitBreaker[] = [
      {
        id: 'plugin-cb',
        name: 'Plugin Circuit Breaker',
        component: 'plugin-system',
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        failureThreshold: 5,
        recoveryTimeout: 300000,
        requestCount: 150,
        successCount: 148,
      },
    ];

    const mockStatistics = {
      totalErrors: 2,
      resolvedErrors: 1,
      activeRecoveries: 1,
      healthChecks: { total: 1, healthy: 1, unhealthy: 0 },
      circuitBreakers: { total: 1, open: 0, closed: 1, halfOpen: 0 },
    };

    setErrors(mockErrors);
    setStrategies(mockStrategies);
    setHealthChecks(mockHealthChecks);
    setCircuitBreakers(mockCircuitBreakers);
    setStatistics(mockStatistics);
    setActiveRecoveries(['error_1']);

    // Setup event listeners
    const handleErrorReported = (data: any) => {
      setErrors(prev => [data.error, ...prev]);
    };

    const handleErrorRecovered = (data: any) => {
      setErrors(prev => prev.map(e => 
        e.id === data.error.id ? { ...e, resolved: true, resolvedAt: new Date() } : e
      ));
    };

    recoveryManager.on('error:reported', handleErrorReported);
    recoveryManager.on('error:recovered', handleErrorRecovered);

    return () => {
      recoveryManager.off('error:reported', handleErrorReported);
      recoveryManager.off('error:recovered', handleErrorRecovered);
    };
  }, [recoveryManager]);

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'bg-green-100 text-green-800';
      case ErrorSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case ErrorSeverity.HIGH:
        return 'bg-orange-100 text-orange-800';
      case ErrorSeverity.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCircuitBreakerStateColor = (state: CircuitBreakerState) => {
    switch (state) {
      case CircuitBreakerState.CLOSED:
        return 'bg-green-100 text-green-800';
      case CircuitBreakerState.OPEN:
        return 'bg-red-100 text-red-800';
      case CircuitBreakerState.HALF_OPEN:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Error Recovery & Self-Healing Dashboard
            <div className="flex items-center space-x-2">
              {activeRecoveries.length > 0 && (
                <Badge variant="secondary">
                  {activeRecoveries.length} Active Recoveries
                </Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Monitor system errors, recovery strategies, and self-healing operations
          </CardDescription>
        </CardHeader>
      </Card>

      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Errors</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {statistics.totalErrors}
                  </p>
                  <p className="text-xs text-gray-500">
                    {statistics.resolvedErrors} resolved
                  </p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Recoveries</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {statistics.activeRecoveries}
                  </p>
                  <p className="text-xs text-gray-500">
                    In progress
                  </p>
                </div>
                <div className="text-3xl">🔄</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Health Checks</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statistics.healthChecks.healthy}/{statistics.healthChecks.total}
                  </p>
                  <p className="text-xs text-gray-500">
                    {statistics.healthChecks.unhealthy} unhealthy
                  </p>
                </div>
                <div className="text-3xl">💚</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Circuit Breakers</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {statistics.circuitBreakers.closed}/{statistics.circuitBreakers.total}
                  </p>
                  <p className="text-xs text-gray-500">
                    {statistics.circuitBreakers.open} open
                  </p>
                </div>
                <div className="text-3xl">⚡</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="circuit-breakers">Circuit Breakers</TabsTrigger>
        </TabsList>

        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>System Errors</CardTitle>
              <CardDescription>
                Recent system errors and their recovery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {errors.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4">✅</div>
                      <p>No errors detected</p>
                    </div>
                  ) : (
                    errors.map((error) => (
                      <div key={error.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getSeverityColor(error.severity)}>
                                {error.severity}
                              </Badge>
                              <Badge variant="outline">
                                {error.category}
                              </Badge>
                              {error.resolved && (
                                <Badge className="bg-green-100 text-green-800">
                                  Resolved
                                </Badge>
                              )}
                              {activeRecoveries.includes(error.id) && (
                                <Badge className="bg-orange-100 text-orange-800">
                                  Recovering
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-medium">{error.message}</h4>
                            <div className="text-sm text-gray-600 mt-1">
                              <p>Source: {error.source}</p>
                              {error.plugin && <p>Plugin: {error.plugin}</p>}
                              {error.component && <p>Component: {error.component}</p>}
                              <p>Retries: {error.retryCount}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {formatTimeAgo(error.timestamp)}
                            </div>
                            {error.resolved && error.resolvedAt && (
                              <div className="text-xs text-green-600">
                                Resolved {formatTimeAgo(error.resolvedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                        {error.context && Object.keys(error.context).length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <h5 className="text-sm font-medium mb-2">Context:</h5>
                            <div className="text-xs bg-gray-50 p-2 rounded">
                              {Object.entries(error.context).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Strategies</CardTitle>
              <CardDescription>
                Available recovery strategies and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {strategies.map((strategy) => (
                  <Card key={strategy.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{strategy.name}</CardTitle>
                        <Badge variant="outline">Priority {strategy.priority}</Badge>
                      </div>
                      <CardDescription>{strategy.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium mb-2">Applicable To:</h5>
                          <div className="space-y-1">
                            <div>
                              <span className="text-sm font-medium">Categories:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {strategy.applicableCategories.map((cat) => (
                                  <Badge key={cat} variant="secondary" className="text-xs">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm font-medium">Severities:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {strategy.applicableSeverities.map((sev) => (
                                  <Badge key={sev} variant="secondary" className="text-xs">
                                    {sev}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Configuration:</h5>
                          <div className="space-y-1 text-sm">
                            <div>Max Retries: {strategy.maxRetries}</div>
                            <div>Backoff: {strategy.backoffStrategy}</div>
                            <div>Timeout: {strategy.timeout}ms</div>
                            <div>Actions: {strategy.actions.length}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Health Checks</CardTitle>
              <CardDescription>
                System health monitoring and check results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthChecks.map((check) => (
                  <Card key={check.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{check.name}</h4>
                            <Badge variant={check.enabled ? "default" : "secondary"}>
                              {check.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                            {check.lastResult && (
                              <Badge className={check.lastResult.healthy ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {check.lastResult.healthy ? "Healthy" : "Unhealthy"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{check.description}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            Component: {check.component} | Interval: {check.checkInterval / 1000}s
                          </div>
                        </div>
                        <div className="text-right">
                          {check.lastResult && (
                            <div className="text-sm">
                              <div>Response: {check.lastResult.responseTime}ms</div>
                              <div className="text-xs text-gray-500">
                                {formatTimeAgo(check.lastResult.timestamp)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {check.lastResult && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <span>Consecutive Failures:</span>
                            <div className="flex items-center space-x-2">
                              <span>{check.consecutiveFailures} / {check.maxConsecutiveFailures}</span>
                              <Progress 
                                value={(check.consecutiveFailures / check.maxConsecutiveFailures) * 100} 
                                className="w-20"
                              />
                            </div>
                          </div>
                          {check.lastResult.message && (
                            <div className="mt-1 text-xs text-gray-600">
                              Message: {check.lastResult.message}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circuit-breakers">
          <Card>
            <CardHeader>
              <CardTitle>Circuit Breakers</CardTitle>
              <CardDescription>
                Circuit breaker status and protection mechanisms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {circuitBreakers.map((cb) => (
                  <Card key={cb.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{cb.name}</h4>
                            <Badge className={getCircuitBreakerStateColor(cb.state)}>
                              {cb.state.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">Component: {cb.component}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            Threshold: {cb.failureThreshold} failures | 
                            Recovery: {cb.recoveryTimeout / 1000}s
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <div>Requests: {cb.requestCount}</div>
                            <div>Success: {cb.successCount}</div>
                            <div>Failures: {cb.failureCount}</div>
                            <div className="text-xs text-gray-500">
                              Success Rate: {cb.requestCount > 0 ? Math.round((cb.successCount / cb.requestCount) * 100) : 0}%
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {cb.state === CircuitBreakerState.OPEN && cb.nextAttemptTime && (
                        <Alert className="mt-3">
                          <AlertDescription>
                            Circuit breaker will attempt recovery at {cb.nextAttemptTime.toLocaleString()}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}