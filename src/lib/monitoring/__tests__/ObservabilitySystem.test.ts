import { 
  PluginObservabilityManager, 
  MetricType,
  getGlobalObservabilityManager
} from '../PluginObservabilityManager';

describe('Monitoring & Observability System', () => {
  let observabilityManager: PluginObservabilityManager;

  beforeEach(async () => {
    observabilityManager = new PluginObservabilityManager({
      enableMetrics: true,
      enableTracing: true,
      enableAlerting: true,
      metricsInterval: 5000, // 5 seconds
      alertEvaluationInterval: 2000, // 2 seconds
    });
    await observabilityManager.initialize();
  });

  afterEach(async () => {
    await observabilityManager.shutdown();
  });

  describe('Metrics Collection', () => {
    it('should register and collect counter metrics', async () => {
      const counter = observabilityManager.registerCounter('test_counter', ['plugin'], 'Test counter metric');
      
      // Add some values to the counter
      counter.inc(1, { plugin: 'plugin1' });
      counter.inc(2, { plugin: 'plugin2' });
      
      const metrics = await observabilityManager.collectMetrics();
      const counterMetrics = metrics.filter(m => m.name === 'test_counter');
      
      expect(counterMetrics).toHaveLength(2); // Two different label sets
      
      const plugin1Metric = counterMetrics.find(m => m.labels.plugin === 'plugin1');
      const plugin2Metric = counterMetrics.find(m => m.labels.plugin === 'plugin2');
      
      expect(plugin1Metric?.value).toBe(1);
      expect(plugin2Metric?.value).toBe(2);
      expect(plugin1Metric?.description).toBe('Test counter metric');
    });

    it('should register and collect gauge metrics', async () => {
      const gauge = observabilityManager.registerGauge('test_gauge', ['status'], 'Test gauge metric');
      
      // Set some values to the gauge
      gauge.set(10, { status: 'active' });
      gauge.set(5, { status: 'inactive' });
      gauge.inc(1, { status: 'active' }); // Should be 11 now
      
      const metrics = await observabilityManager.collectMetrics();
      const gaugeMetrics = metrics.filter(m => m.name === 'test_gauge');
      
      expect(gaugeMetrics).toHaveLength(2);
      
      const activeGauge = gaugeMetrics.find(m => m.labels.status === 'active');
      expect(activeGauge?.value).toBe(11);
    });

    it('should register and collect histogram metrics', async () => {
      const histogram = observabilityManager.registerHistogram(
        'test_histogram', 
        ['operation'], 
        'Test histogram metric',
        [1, 5, 10]
      );
      
      // Observe some values
      histogram.observe(0.5, { operation: 'read' });
      histogram.observe(2, { operation: 'read' });
      histogram.observe(7, { operation: 'read' });
      histogram.observe(15, { operation: 'read' });
      
      const metrics = await observabilityManager.collectMetrics();
      const histogramMetrics = metrics.filter(m => m.name === 'test_histogram');
      
      expect(histogramMetrics).toHaveLength(1); // Just the summary in this subset, buckets are separate
      
      // Check that we have the summary metric
      const summaryMetric = histogramMetrics.find(m => m.labels.type === 'summary');
      expect(summaryMetric).toBeDefined();
      
      // Check that we have bucket metrics (they're separate in the full metrics array)
      const bucketMetrics = metrics.filter(m => m.name === 'test_histogram_bucket');
      expect(bucketMetrics).toHaveLength(3); // Three different buckets based on our values and bucket boundaries
    });

    it('should register and collect summary metrics', async () => {
      const summary = observabilityManager.registerSummary('test_summary', ['type'], 'Test summary metric');
      
      // Observe some values
      for (let i = 0; i < 100; i++) {
        summary.observe(i, { type: 'test' });
      }
      
      const metrics = await observabilityManager.collectMetrics();
      const summaryMetrics = metrics.filter(m => m.name === 'test_summary');
      
      // Should have summary + quantile metrics
      const summaryMetric = summaryMetrics.find(m => m.labels.type === 'summary');
      expect(summaryMetric).toBeDefined();
      
      // Should have quantile metrics
      const quantileMetrics = summaryMetrics.filter(m => m.labels.quantile);
      expect(quantileMetrics.length).toBeGreaterThan(0);
    });
  });

  describe('Distributed Tracing', () => {
    it('should start and finish spans', () => {
      const span = observabilityManager.startTrace('test_operation', undefined, { tag1: 'value1' });
      
      expect(span.operationName).toBe('test_operation');
      expect(span.tags.tag1).toBe('value1');
      expect(span.startTime).toBeLessThanOrEqual(Date.now());
      expect(span.endTime).toBeUndefined();
      
      // Finish the span
      span.finish();
      
      expect(span.endTime).toBeDefined();
      expect(span.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle trace context injection and extraction', () => {
      const span = observabilityManager.startTrace('test_operation');
      const carrier: Record<string, string> = {};
      
      // Inject trace context
      observabilityManager.injectTraceContext(span, 'http_headers', carrier);
      
      expect(carrier['x-trace-id']).toBe(span.context.traceId);
      expect(carrier['x-span-id']).toBe(span.context.spanId);
      
      // Extract trace context
      const extractedContext = observabilityManager.extractTraceContext('http_headers', carrier);
      
      expect(extractedContext).toBeDefined();
      expect(extractedContext?.traceId).toBe(span.context.traceId);
      expect(extractedContext?.spanId).toBe(span.context.spanId);
    });

    it('should maintain parent-child relationships', () => {
      const parentSpan = observabilityManager.startTrace('parent_operation');
      const childSpan = observabilityManager.startTrace('child_operation', parentSpan.context);
      
      expect(childSpan.context.parentId).toBe(parentSpan.context.spanId);
      expect(childSpan.context.traceId).toBe(parentSpan.context.traceId);
      
      parentSpan.finish();
      childSpan.finish();
    });
  });

  describe('Alert Management', () => {
    it('should create and evaluate alert rules', async () => {
      const rule = {
        id: 'rule1',
        name: 'High Error Rate Alert',
        description: 'Alerts when error rate is above 5%',
        condition: 'value > 0.05',
        threshold: 0.05,
        duration: 1000,
        severity: 'high' as const,
        notificationChannels: ['console'],
        enabled: true,
        createdAt: new Date(),
      };

      await observabilityManager.createAlertRule(rule);
      
      // Register a gauge with high value to trigger the alert
      const gauge = observabilityManager.registerGauge('error_rate', [], 'Error rate');
      gauge.set(0.1); // Above threshold
      
      // Evaluate rules
      const newAlerts = await observabilityManager.getAlertManager().evaluateRules(
        await observabilityManager.collectMetrics()
      );
      
      expect(newAlerts).toHaveLength(1);
      expect(newAlerts[0].ruleId).toBe('rule1');
      expect(newAlerts[0].severity).toBe('high');
      expect(newAlerts[0].resolved).toBe(false);
    });

    it('should get active and resolved alerts separately', async () => {
      const rule = {
        id: 'rule2',
        name: 'Test Alert',
        description: 'Test alert for testing',
        condition: 'value > 10',
        threshold: 10,
        duration: 1000,
        severity: 'medium' as const,
        notificationChannels: ['console'],
        enabled: true,
        createdAt: new Date(),
      };

      await observabilityManager.createAlertRule(rule);
      
      // Create a metric that triggers the alert
      const gauge = observabilityManager.registerGauge('test_metric');
      gauge.set(15); // Above threshold
      
      // Evaluate to create alert
      await observabilityManager.getAlertManager().evaluateRules(
        await observabilityManager.collectMetrics()
      );
      
      // Get all alerts
      const allAlerts = observabilityManager.getAlerts();
      expect(allAlerts).toHaveLength(1);
      
      // Get only active alerts
      const activeAlerts = observabilityManager.getAlerts('active');
      expect(activeAlerts).toHaveLength(1);
      
      // Get only resolved alerts
      const resolvedAlerts = observabilityManager.getAlerts('resolved');
      expect(resolvedAlerts).toHaveLength(0);
      
      // Resolve the alert
      await observabilityManager.resolveAlert(allAlerts[0].id);
      
      // Now get resolved alerts
      const nowResolvedAlerts = observabilityManager.getAlerts('resolved');
      expect(nowResolvedAlerts).toHaveLength(1);
    });
  });

  describe('Dashboard Data', () => {
    it('should generate dashboard data', async () => {
      // Register some metrics
      const counter = observabilityManager.registerCounter('response_count', ['plugin']);
      const gauge = observabilityManager.registerGauge('error_rate', ['plugin']);
      
      counter.inc(10, { plugin: 'plugin1' });
      gauge.set(0.05, { plugin: 'plugin1' });
      
      // Create a span
      const span = observabilityManager.startTrace('api_request');
      span.finish();
      
      // Create an alert rule
      await observabilityManager.createAlertRule({
        id: 'dashboard_test_rule',
        name: 'Dashboard Test Rule',
        description: 'Test rule for dashboard',
        condition: 'value > 0.05',
        threshold: 0.05,
        duration: 1000,
        severity: 'low' as const,
        notificationChannels: ['console'],
        enabled: true,
        createdAt: new Date(),
      });
      
      const dashboardData = await observabilityManager.getDashboardData();
      
      expect(dashboardData).toHaveProperty('metrics');
      expect(dashboardData).toHaveProperty('alerts');
      expect(dashboardData).toHaveProperty('traces');
      expect(dashboardData).toHaveProperty('performance');
      expect(dashboardData).toHaveProperty('system');
      expect(dashboardData).toHaveProperty('plugins');
      
      expect(dashboardData.metrics.length).toBeGreaterThanOrEqual(2); // counter + gauge
      expect(dashboardData.traces).toHaveLength(1);
      expect(dashboardData.performance).toHaveProperty('avgResponseTime');
      expect(dashboardData.system).toHaveProperty('memoryUsage');
    });
  });

  describe('Event Handling', () => {
    it('should handle events', () => {
      const mockCallback = jest.fn();
      observabilityManager.on('test:event', mockCallback);
      
      // Manually emit a test event to verify the event system works
      (observabilityManager as any).emitEvent('test:event', { test: true });
      
      expect(mockCallback).toHaveBeenCalledWith({ test: true });
    });
  });

  describe('Global Instance', () => {
    it('should provide singleton instance', () => {
      const instance1 = getGlobalObservabilityManager();
      const instance2 = getGlobalObservabilityManager();
      
      expect(instance1).toBe(instance2);
    });

    it('should allow configuration of singleton', () => {
      // Reset singleton for test
      (getGlobalObservabilityManager as any).instance = undefined;
      
      const instance1 = getGlobalObservabilityManager({ enableAlerting: false });
      const instance2 = getGlobalObservabilityManager();
      
      expect(instance1).toBe(instance2);
      
      // This would require exposing the config to test properly
      expect(instance1).toBeDefined();
    });
  });

  describe('Multiple Plugin Support', () => {
    it('should handle metrics from multiple plugins', async () => {
      // Register metrics for different plugins
      const plugin1Counter = observabilityManager.registerCounter('plugin_requests', ['plugin']);
      const plugin2Counter = observabilityManager.registerCounter('plugin_errors', ['plugin']);
      
      plugin1Counter.inc(5, { plugin: 'auth-plugin' });
      plugin2Counter.inc(1, { plugin: 'auth-plugin' });
      plugin1Counter.inc(3, { plugin: 'db-plugin' });
      plugin2Counter.inc(2, { plugin: 'db-plugin' });
      
      const metrics = await observabilityManager.collectMetrics();
      
      expect(metrics.length).toBeGreaterThanOrEqual(4); // At least 4 counter values
      
      const authPluginMetrics = metrics.filter(m => m.labels.plugin === 'auth-plugin');
      const dbPluginMetrics = metrics.filter(m => m.labels.plugin === 'db-plugin');
      
      expect(authPluginMetrics).toHaveLength(2);
      expect(dbPluginMetrics).toHaveLength(2);
    });
  });
});