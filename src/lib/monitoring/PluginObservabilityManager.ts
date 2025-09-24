// Metrics types and interfaces
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
  TIMER = 'timer',
}

export interface Metric {
  id: string;
  name: string;
  type: MetricType;
  value: number | number[];
  labels: Record<string, string>;
  timestamp: Date;
  description?: string;
}

export interface MetricsCollector {
  collect(): Promise<Metric[]>;
  registerCounter(name: string, labels?: string[], description?: string): Counter;
  registerGauge(name: string, labels?: string[], description?: string): Gauge;
  registerHistogram(name: string, labels?: string[], description?: string, buckets?: number[]): Histogram;
  registerSummary(name: string, labels?: string[], description?: string): Summary;
}

export interface Counter {
  inc(value?: number, labels?: Record<string, string>): void;
  add(value: number, labels?: Record<string, string>): void;
  get(): number;
}

export interface Gauge {
  inc(value?: number, labels?: Record<string, string>): void;
  dec(value?: number, labels?: Record<string, string>): void;
  set(value: number, labels?: Record<string, string>): void;
  get(): number;
}

export interface Histogram {
  observe(value: number, labels?: Record<string, string>): void;
  get(): { sum: number; count: number; buckets: Record<number, number> };
}

export interface Summary {
  observe(value: number, labels?: Record<string, string>): void;
  get(): { count: number; sum: number; quantiles: Record<number, number> };
}

// Distributed tracing types
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentId?: string;
  sampled: boolean;
}

export interface Span {
  context: TraceContext;
  operationName: string;
  startTime: number;
  endTime?: number;
  tags: Record<string, any>;
  logs: Array<{ timestamp: number; fields: Record<string, any> }>;
  duration: number;
  finish(): void;
  addTags(tags: Record<string, any>): void;
  addLog(log: { timestamp: number; fields: Record<string, any> }): void;
}

export interface DistributedTracer {
  startSpan(operationName: string, parentContext?: TraceContext, tags?: Record<string, any>): Span;
  inject(span: Span, format: string, carrier: any): void;
  extract(format: string, carrier: any): TraceContext | null;
}

// Alert system types
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string; // Expression to evaluate
  threshold: number;
  duration: number; // Duration in milliseconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  notificationChannels: string[];
  enabled: boolean;
  createdAt: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  name: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  labels: Record<string, string>;
}

export interface AlertManager {
  createRule(rule: AlertRule): Promise<void>;
  removeRule(ruleId: string): Promise<void>;
  evaluateRules(metrics: Metric[]): Promise<Alert[]>;
  getAlerts(status?: 'active' | 'resolved'): Alert[];
  resolveAlert(alertId: string): Promise<void>;
}

// Dashboard data types
export interface DashboardData {
  metrics: Metric[];
  alerts: Alert[];
  traces: Span[];
  performance: {
    avgResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
  };
  plugins: {
    active: number;
    total: number;
    errorRate: number;
  };
}

// Monitoring configuration
export interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableAlerting: boolean;
  metricsInterval: number;
  tracingSampleRate: number;
  maxTraceRetention: number;
  alertEvaluationInterval: number;
  dashboardRefreshInterval: number;
}

// Default configuration
const DEFAULT_CONFIG: MonitoringConfig = {
  enableMetrics: true,
  enableTracing: true,
  enableAlerting: true,
  metricsInterval: 10000, // 10 seconds
  tracingSampleRate: 0.1, // 10% sampling
  maxTraceRetention: 3600000, // 1 hour
  alertEvaluationInterval: 5000, // 5 seconds
  dashboardRefreshInterval: 30000, // 30 seconds
};

// Metrics registry implementation
class MetricsRegistry {
  private counters: Map<string, CounterImpl> = new Map();
  private gauges: Map<string, GaugeImpl> = new Map();
  private histograms: Map<string, HistogramImpl> = new Map();
  private summaries: Map<string, SummaryImpl> = new Map();

  registerCounter(name: string, labels: string[] = [], description?: string): CounterImpl {
    const counter = new CounterImpl(name, labels, description);
    this.counters.set(name, counter);
    return counter;
  }

  registerGauge(name: string, labels: string[] = [], description?: string): GaugeImpl {
    const gauge = new GaugeImpl(name, labels, description);
    this.gauges.set(name, gauge);
    return gauge;
  }

  registerHistogram(name: string, labels: string[] = [], description?: string, buckets?: number[]): HistogramImpl {
    const histogram = new HistogramImpl(name, labels, description, buckets);
    this.histograms.set(name, histogram);
    return histogram;
  }

  registerSummary(name: string, labels: string[] = [], description?: string): SummaryImpl {
    const summary = new SummaryImpl(name, labels, description);
    this.summaries.set(name, summary);
    return summary;
  }

  async getAllMetrics(): Promise<Metric[]> {
    const allMetrics: Metric[] = [];

    // Collect all counters
    for (const counter of this.counters.values()) {
      allMetrics.push(...counter.getMetrics());
    }

    // Collect all gauges
    for (const gauge of this.gauges.values()) {
      allMetrics.push(...gauge.getMetrics());
    }

    // Collect all histograms
    for (const histogram of this.histograms.values()) {
      allMetrics.push(...histogram.getMetrics());
    }

    // Collect all summaries
    for (const summary of this.summaries.values()) {
      allMetrics.push(...summary.getMetrics());
    }

    return allMetrics;
  }
}

// Base metric class
abstract class BaseMetric {
  protected name: string;
  protected description?: string;
  protected labelKeys: string[] = [];

  constructor(name: string, labelKeys: string[] = [], description?: string) {
    this.name = name;
    this.labelKeys = labelKeys;
    this.description = description;
  }

  protected formatKey(labels: Record<string, string> = {}): string {
    if (Object.keys(labels).length === 0) {
      return this.name;
    }

    const labelStr = Object.keys(labels)
      .sort()
      .map(key => `${key}="${labels[key]}"`)
      .join(',');

    return `${this.name}{${labelStr}}`;
  }

  protected validateLabels(labels: Record<string, string>): void {
    for (const key of Object.keys(labels)) {
      if (!this.labelKeys.includes(key)) {
        throw new Error(`Invalid label key: ${key}`);
      }
    }
  }
}

// Counter implementation
class CounterImpl extends BaseMetric implements Counter {
  private values: Map<string, number> = new Map();

  constructor(name: string, labelKeys: string[] = [], description?: string) {
    super(name, labelKeys, description);
  }

  inc(value: number = 1, labels: Record<string, string> = {}): void {
    this.add(value, labels);
  }

  add(value: number, labels: Record<string, string> = {}): void {
    if (value < 0) {
      throw new Error('Counter cannot decrease');
    }

    this.validateLabels(labels);
    const key = this.formatKey(labels);
    const currentValue = this.values.get(key) || 0;
    this.values.set(key, currentValue + value);
  }

  get(labels: Record<string, string> = {}): number {
    const key = this.formatKey(labels);
    return this.values.get(key) || 0;
  }

  getMetrics(): Metric[] {
    const metrics: Metric[] = [];
    
    for (const [key, value] of this.values.entries()) {
      const [name, labelStr] = key.split('{');
      let labels: Record<string, string> = {};
      
      if (labelStr) {
        const labelPairs = labelStr.slice(0, -1).split(','); // Remove closing '}' and split
        for (const pair of labelPairs) {
          const [k, v] = pair.split('=');
          if (k && v) {
            labels[k.trim()] = v.replace(/"/g, '').trim();
          }
        }
      }

      metrics.push({
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || this.name,
        type: MetricType.COUNTER,
        value,
        labels,
        timestamp: new Date(),
        description: this.description,
      });
    }

    return metrics;
  }
}

// Gauge implementation
class GaugeImpl extends BaseMetric implements Gauge {
  private values: Map<string, number> = new Map();

  constructor(name: string, labelKeys: string[] = [], description?: string) {
    super(name, labelKeys, description);
  }

  inc(value: number = 1, labels: Record<string, string> = {}): void {
    this.set(this.get(labels) + value, labels);
  }

  dec(value: number = 1, labels: Record<string, string> = {}): void {
    this.set(this.get(labels) - value, labels);
  }

  set(value: number, labels: Record<string, string> = {}): void {
    this.validateLabels(labels);
    const key = this.formatKey(labels);
    this.values.set(key, value);
  }

  get(labels: Record<string, string> = {}): number {
    const key = this.formatKey(labels);
    return this.values.get(key) || 0;
  }

  getMetrics(): Metric[] {
    const metrics: Metric[] = [];
    
    for (const [key, value] of this.values.entries()) {
      const [name, labelStr] = key.split('{');
      let labels: Record<string, string> = {};
      
      if (labelStr) {
        const labelPairs = labelStr.slice(0, -1).split(',');
        for (const pair of labelPairs) {
          const [k, v] = pair.split('=');
          if (k && v) {
            labels[k.trim()] = v.replace(/"/g, '').trim();
          }
        }
      }

      metrics.push({
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || this.name,
        type: MetricType.GAUGE,
        value,
        labels,
        timestamp: new Date(),
        description: this.description,
      });
    }

    return metrics;
  }
}

// Histogram implementation
class HistogramImpl extends BaseMetric implements Histogram {
  private buckets: number[];
  private values: Map<string, { count: number; sum: number; buckets: Map<number, number> }> = new Map();

  constructor(name: string, labelKeys: string[] = [], description?: string, buckets?: number[]) {
    super(name, labelKeys, description);
    this.buckets = buckets || [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10];
  }

  observe(value: number, labels: Record<string, string> = {}): void {
    this.validateLabels(labels);
    const key = this.formatKey(labels);
    
    if (!this.values.has(key)) {
      this.values.set(key, {
        count: 0,
        sum: 0,
        buckets: new Map<number, number>(),
      });
    }

    // Initialize bucket counts if not exists
    const data = this.values.get(key)!;
    data.count++;
    data.sum += value;

    for (const bucket of this.buckets) {
      if (value <= bucket) {
        const bucketCount = data.buckets.get(bucket) || 0;
        data.buckets.set(bucket, bucketCount + 1);
      }
    }
  }

  get(labels: Record<string, string> = {}): { sum: number; count: number; buckets: Record<number, number> } {
    const key = this.formatKey(labels);
    const data = this.values.get(key);
    
    if (!data) {
      return { 
        sum: 0, 
        count: 0, 
        buckets: Object.fromEntries(this.buckets.map(b => [b, 0])) 
      };
    }

    const buckets: Record<number, number> = {};
    for (const [bucket, count] of data.buckets.entries()) {
      buckets[bucket] = count;
    }

    return {
      sum: data.sum,
      count: data.count,
      buckets,
    };
  }

  getMetrics(): Metric[] {
    const metrics: Metric[] = [];
    
    for (const [key, data] of this.values.entries()) {
      const [name, labelStr] = key.split('{');
      let labels: Record<string, string> = {};
      
      if (labelStr) {
        const labelPairs = labelStr.slice(0, -1).split(',');
        for (const pair of labelPairs) {
          const [k, v] = pair.split('=');
          if (k && v) {
            labels[k.trim()] = v.replace(/"/g, '').trim();
          }
        }
      }

      // Add histogram metric
      metrics.push({
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || this.name,
        type: MetricType.HISTOGRAM,
        value: [data.sum, data.count],
        labels: { ...labels, type: 'summary' },
        timestamp: new Date(),
        description: this.description,
      });

      // Add bucket metrics
      for (const [bucket, count] of data.buckets.entries()) {
        metrics.push({
          id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${name}_bucket`,
          type: MetricType.GAUGE,
          value: count,
          labels: { ...labels, le: bucket.toString() },
          timestamp: new Date(),
          description: `Histogram bucket for ${bucket}s`,
        });
      }
    }

    return metrics;
  }
}

// Summary implementation
class SummaryImpl extends BaseMetric implements Summary {
  private values: Map<string, number[]> = new Map();

  constructor(name: string, labelKeys: string[] = [], description?: string) {
    super(name, labelKeys, description);
  }

  observe(value: number, labels: Record<string, string> = {}): void {
    this.validateLabels(labels);
    const key = this.formatKey(labels);
    
    if (!this.values.has(key)) {
      this.values.set(key, []);
    }

    this.values.get(key)!.push(value);
  }

  get(labels: Record<string, string> = {}): { count: number; sum: number; quantiles: Record<number, number> } {
    const key = this.formatKey(labels);
    const data = this.values.get(key) || [];
    
    const count = data.length;
    const sum = data.reduce((a, b) => a + b, 0);
    
    // Calculate quantiles (simplified)
    const sortedData = [...data].sort((a, b) => a - b);
    const quantiles: Record<number, number> = {};
    
    if (sortedData.length > 0) {
      quantiles[0.5] = sortedData[Math.floor(sortedData.length * 0.5)]; // 50th percentile (median)
      quantiles[0.9] = sortedData[Math.floor(sortedData.length * 0.9)]; // 90th percentile
      quantiles[0.95] = sortedData[Math.floor(sortedData.length * 0.95)]; // 95th percentile
      quantiles[0.99] = sortedData[Math.floor(sortedData.length * 0.99)]; // 99th percentile
    }

    return { count, sum, quantiles };
  }

  getMetrics(): Metric[] {
    const metrics: Metric[] = [];
    
    for (const [key, data] of this.values.entries()) {
      const [name, labelStr] = key.split('{');
      let labels: Record<string, string> = {};
      
      if (labelStr) {
        const labelPairs = labelStr.slice(0, -1).split(',');
        for (const pair of labelPairs) {
          const [k, v] = pair.split('=');
          if (k && v) {
            labels[k.trim()] = v.replace(/"/g, '').trim();
          }
        }
      }

      const summaryData = this.get(labels);
      
      // Add summary metric
      metrics.push({
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || this.name,
        type: MetricType.SUMMARY,
        value: [summaryData.sum, summaryData.count],
        labels: { ...labels, type: 'summary' },
        timestamp: new Date(),
        description: this.description,
      });

      // Add quantile metrics
      for (const [quantile, value] of Object.entries(summaryData.quantiles)) {
        metrics.push({
          id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: name || this.name,
          type: MetricType.SUMMARY,
          value,
          labels: { ...labels, quantile },
          timestamp: new Date(),
          description: `Quantile ${quantile} for ${name}`,
        });
      }
    }

    return metrics;
  }
}

// Distributed tracing implementation
class SpanImpl implements Span {
  public context: TraceContext;
  public operationName: string;
  public startTime: number;
  public endTime?: number;
  public tags: Record<string, any> = {};
  public logs: Array<{ timestamp: number; fields: Record<string, any> }> = [];
  public duration: number = 0;

  constructor(operationName: string, parentContext?: TraceContext, tags?: Record<string, any>) {
    this.operationName = operationName;
    this.startTime = Date.now();

    // Generate trace ID and span ID if not provided
    const traceId = parentContext?.traceId || this.generateId();
    const parentId = parentContext?.spanId;
    const spanId = this.generateId();
    const sampled = parentContext?.sampled ?? Math.random() < 0.1; // Default 10% sampling

    this.context = { traceId, spanId, parentId, sampled };

    if (tags) {
      this.tags = { ...tags };
    }
  }

  finish(): void {
    if (!this.endTime) {
      this.endTime = Date.now();
      this.duration = this.endTime - this.startTime;
    }
  }

  addTags(tags: Record<string, any>): void {
    this.tags = { ...this.tags, ...tags };
  }

  addLog(log: { timestamp: number; fields: Record<string, any> }): void {
    this.logs.push(log);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}

class DistributedTracerImpl implements DistributedTracer {
  private spans: SpanImpl[] = [];
  private maxRetention: number;

  constructor(maxRetention: number = 3600000) { // 1 hour
    this.maxRetention = maxRetention;
  }

  startSpan(operationName: string, parentContext?: TraceContext, tags?: Record<string, any>): Span {
    const span = new SpanImpl(operationName, parentContext, tags);
    this.spans.push(span);
    this.cleanupOldSpans();
    return span;
  }

  inject(span: Span, format: string, carrier: any): void {
    // Inject trace context into carrier based on format
    if (format === 'http_headers') {
      carrier['x-trace-id'] = span.context.traceId;
      carrier['x-span-id'] = span.context.spanId;
      if (span.context.parentId) {
        carrier['x-parent-id'] = span.context.parentId;
      }
    }
  }

  extract(format: string, carrier: any): TraceContext | null {
    // Extract trace context from carrier based on format
    if (format === 'http_headers') {
      const traceId = carrier['x-trace-id'];
      const spanId = carrier['x-span-id'];
      const parentId = carrier['x-parent-id'];
      
      if (traceId && spanId) {
        return {
          traceId,
          spanId,
          parentId,
          sampled: true, // Simplified
        };
      }
    }
    
    return null;
  }

  private cleanupOldSpans(): void {
    const now = Date.now();
    const threshold = now - this.maxRetention;
    
    this.spans = this.spans.filter(span => 
      span.startTime > threshold
    );
  }

  getTraces(): SpanImpl[] {
    return [...this.spans];
  }
}

// Alert manager implementation
class AlertManagerImpl implements AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private evaluationInterval?: NodeJS.Timeout;

  createRule(rule: AlertRule): Promise<void> {
    this.rules.set(rule.id, rule);
    return Promise.resolve();
  }

  removeRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId);
    return Promise.resolve();
  }

  async evaluateRules(metrics: Metric[]): Promise<Alert[]> {
    const newAlerts: Alert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // This is a simplified condition evaluation
      // In a real implementation, you'd want a more sophisticated expression evaluator
      const shouldTrigger = this.evaluateRuleCondition(rule, metrics);

      if (shouldTrigger) {
        const alert: Alert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ruleId: rule.id,
          name: rule.name,
          message: `Alert: ${rule.description}`,
          severity: rule.severity,
          timestamp: new Date(),
          resolved: false,
          labels: {}, // Could be based on metric labels
        };

        this.alerts.set(alert.id, alert);
        newAlerts.push(alert);
      }
    }

    return newAlerts;
  }

  private evaluateRuleCondition(rule: AlertRule, metrics: Metric[]): boolean {
    // Simplified condition evaluation
    // In a real system, this would be more sophisticated
    if (rule.condition.includes('value >')) {
      const threshold = parseFloat(rule.condition.split('value >')[1]);
      for (const metric of metrics) {
        if (typeof metric.value === 'number' && metric.value > threshold) {
          return true;
        } else if (Array.isArray(metric.value)) {
          for (const value of metric.value) {
            if (typeof value === 'number' && value > threshold) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  getAlerts(status?: 'active' | 'resolved'): Alert[] {
    if (!status) {
      return Array.from(this.alerts.values());
    }

    return Array.from(this.alerts.values()).filter(
      alert => status === 'active' ? !alert.resolved : alert.resolved
    );
  }

  resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
    }
    return Promise.resolve();
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }
}

// Main monitoring service
export class PluginObservabilityManager {
  private config: MonitoringConfig;
  private metricsRegistry: MetricsRegistry;
  private metricsCollector: MetricsCollector;
  private tracer: DistributedTracerImpl;
  private alertManager: AlertManagerImpl;
  private metricsInterval?: NodeJS.Timeout;
  private alertEvaluationInterval?: NodeJS.Timeout;
  private eventCallbacks: Map<string, Set<Function>> = new Map();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metricsRegistry = new MetricsRegistry();
    this.metricsCollector = this.metricsRegistry;
    this.tracer = new DistributedTracerImpl(this.config.maxTraceRetention);
    this.alertManager = new AlertManagerImpl();
  }

  async initialize(): Promise<void> {
    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    if (this.config.enableAlerting) {
      this.startAlertEvaluation();
    }

    console.log('Monitoring & Observability system initialized');
  }

  private startMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        
        // Evaluate alerts based on metrics
        if (this.config.enableAlerting) {
          const newAlerts = await this.alertManager.evaluateRules(metrics);
          if (newAlerts.length > 0) {
            for (const alert of newAlerts) {
              this.emitEvent('alert:triggered', alert);
            }
          }
        }
      } catch (error) {
        console.error('Metrics collection error:', error);
      }
    }, this.config.metricsInterval);
  }

  private startAlertEvaluation(): void {
    if (this.alertEvaluationInterval) {
      clearInterval(this.alertEvaluationInterval);
    }

    this.alertEvaluationInterval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        const newAlerts = await this.alertManager.evaluateRules(metrics);
        
        if (newAlerts.length > 0) {
          for (const alert of newAlerts) {
            this.emitEvent('alert:triggered', alert);
          }
        }
      } catch (error) {
        console.error('Alert evaluation error:', error);
      }
    }, this.config.alertEvaluationInterval);
  }

  async collectMetrics(): Promise<Metric[]> {
    return await this.metricsRegistry.getAllMetrics();
  }

  registerCounter(name: string, labels?: string[], description?: string): Counter {
    return this.metricsRegistry.registerCounter(name, labels, description);
  }

  registerGauge(name: string, labels?: string[], description?: string): Gauge {
    return this.metricsRegistry.registerGauge(name, labels, description);
  }

  registerHistogram(name: string, labels?: string[], description?: string, buckets?: number[]): Histogram {
    return this.metricsRegistry.registerHistogram(name, labels, description, buckets);
  }

  registerSummary(name: string, labels?: string[], description?: string): Summary {
    return this.metricsRegistry.registerSummary(name, labels, description);
  }

  startTrace(operation: string, parentContext?: TraceContext, tags?: Record<string, any>): Span {
    return this.tracer.startSpan(operation, parentContext, tags);
  }

  injectTraceContext(span: Span, format: string, carrier: any): void {
    this.tracer.inject(span, format, carrier);
  }

  extractTraceContext(format: string, carrier: any): TraceContext | null {
    return this.tracer.extract(format, carrier);
  }

  async createAlertRule(rule: AlertRule): Promise<void> {
    await this.alertManager.createRule(rule);
  }

  async removeAlertRule(ruleId: string): Promise<void> {
    await this.alertManager.removeRule(ruleId);
  }

  getAlerts(status?: 'active' | 'resolved'): Alert[] {
    return this.alertManager.getAlerts(status);
  }

  async resolveAlert(alertId: string): Promise<void> {
    await this.alertManager.resolveAlert(alertId);
  }

  async getDashboardData(): Promise<DashboardData> {
    const metrics = await this.collectMetrics();
    const alerts = this.alertManager.getAlerts();
    const traces = this.tracer.getTraces();

    // Calculate performance metrics
    let totalResponseTime = 0;
    let requestCount = 0;
    let errorCount = 0;

    for (const metric of metrics) {
      if (metric.name.includes('response_time') && typeof metric.value === 'number') {
        totalResponseTime += metric.value;
        requestCount++;
      }
      if (metric.name.includes('error_count') && typeof metric.value === 'number') {
        errorCount += metric.value;
      }
    }

    const avgResponseTime = requestCount > 0 ? totalResponseTime / requestCount : 0;
    const requestsPerSecond = requestCount / (this.config.metricsInterval / 1000);
    const errorRate = requestCount > 0 ? errorCount / requestCount : 0;

    // Calculate system metrics (simplified)
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage ? process.cpuUsage() : { user: 0, system: 0 };

    return {
      metrics,
      alerts,
      traces: traces.map(trace => trace as Span), // Cast to avoid type issues
      performance: {
        avgResponseTime,
        requestsPerSecond,
        errorRate,
      },
      system: {
        cpuUsage: cpuUsage.user / 1000000, // Simplified
        memoryUsage: memoryUsage.heapUsed / (1024 * 1024), // MB
        diskUsage: 0, // Would require additional logic
        networkUsage: 0, // Would require additional logic
      },
      plugins: {
        active: 0, // Would get from plugin system
        total: 0, // Would get from plugin system
        errorRate: 0, // Would calculate from plugin errors
      },
    };
  }

  getTraces(): Span[] {
    return this.tracer.getTraces().map(trace => trace as Span);
  }

  getMetricsRegistry(): MetricsRegistry {
    return this.metricsRegistry;
  }

  getTracer(): DistributedTracerImpl {
    return this.tracer;
  }

  getAlertManager(): AlertManagerImpl {
    return this.alertManager;
  }

  on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
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
          console.error(`Observability event callback error for ${event}:`, error);
        }
      });
    }
  }

  async shutdown(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    if (this.alertEvaluationInterval) {
      clearInterval(this.alertEvaluationInterval);
    }

    console.log('Monitoring & Observability system shutdown complete');
  }
}

// Singleton instance
let observabilityManager: PluginObservabilityManager | null = null;

export function getGlobalObservabilityManager(config?: Partial<MonitoringConfig>): PluginObservabilityManager {
  if (!observabilityManager) {
    observabilityManager = new PluginObservabilityManager(config);
  }
  return observabilityManager;
}