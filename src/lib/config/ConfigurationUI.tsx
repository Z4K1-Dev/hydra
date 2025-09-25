'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Configuration, ConfigurationVersion, ConfigurationChange } from './ConfigurationSystem';

interface ConfigurationUIProps {
  initialConfig?: Configuration;
  onConfigChange?: (config: Configuration) => void;
}

export function ConfigurationUI({ initialConfig, onConfigChange }: ConfigurationUIProps) {
  const [config, setConfig] = useState<Configuration>(initialConfig || {
    version: '1.0.0',
    environment: 'development',
    plugins: {
      autoDiscovery: true,
      hotReload: false,
      healthCheckInterval: 30000,
      maxConcurrentLoads: 5,
    },
    security: {
      enableEncryption: true,
      encryptionKey: '',
      sessionTimeout: 3600000,
      maxLoginAttempts: 5,
    },
    performance: {
      enableCaching: true,
      cacheTTL: 300000,
      enableCompression: true,
      maxMemoryUsage: 512,
    },
    monitoring: {
      enableMetrics: true,
      metricsInterval: 10000,
      enableLogging: true,
      logLevel: 'info',
    },
    database: {
      connectionPoolSize: 10,
      queryTimeout: 30000,
      enableConnectionPooling: true,
    },
  });

  const [versions, setVersions] = useState<ConfigurationVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const updateConfig = (path: string, value: any) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
    setIsDirty(true);
    
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const handleSave = () => {
    // Validate configuration
    const errors = validateConfiguration(config);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      // Save configuration
      console.log('Configuration saved:', config);
      setIsDirty(false);
      
      // Add to versions
      const newVersion: ConfigurationVersion = {
        version: generateVersion(),
        timestamp: new Date(),
        checksum: generateChecksum(config),
        changes: [], // Would calculate actual changes
        author: 'user',
      };
      
      setVersions([newVersion, ...versions]);
    }
  };

  const handleReset = () => {
    setConfig(initialConfig || config);
    setIsDirty(false);
    setValidationErrors([]);
  };

  const handleExport = () => {
    const exportData = {
      config,
      versions,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const errors = validateConfiguration(data.config);
          
          if (errors.length === 0) {
            setConfig(data.config);
            setVersions(data.versions || []);
            setIsDirty(true);
            setValidationErrors([]);
          } else {
            setValidationErrors(errors);
          }
        } catch (error) {
          setValidationErrors(['Invalid configuration file']);
        }
      };
      reader.readAsText(file);
    }
  };

  const validateConfiguration = (configToValidate: any): string[] => {
    const errors: string[] = [];
    
    // Basic validation
    if (!configToValidate.version) {
      errors.push('Version is required');
    }
    
    if (!['development', 'staging', 'production'].includes(configToValidate.environment)) {
      errors.push('Environment must be development, staging, or production');
    }
    
    if (configToValidate.plugins?.healthCheckInterval && configToValidate.plugins.healthCheckInterval < 1000) {
      errors.push('Health check interval must be at least 1000ms');
    }
    
    if (configToValidate.security?.sessionTimeout && configToValidate.security.sessionTimeout < 60000) {
      errors.push('Session timeout must be at least 60000ms');
    }
    
    return errors;
  };

  const generateVersion = (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `v${timestamp}-${random}`;
  };

  const generateChecksum = (configData: Configuration): string => {
    const configString = JSON.stringify(configData);
    let hash = 0;
    for (let i = 0; i < configString.length; i++) {
      const char = configString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Configuration Management
            {isDirty && <Badge variant="secondary">Unsaved Changes</Badge>}
          </CardTitle>
          <CardDescription>
            Manage system configuration with version control and validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Button onClick={handleSave} disabled={!isDirty}>
              Save Configuration
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!isDirty}>
              Reset
            </Button>
            <Button variant="outline" onClick={handleExport}>
              Export
            </Button>
            <label htmlFor="import-config">
              <Button variant="outline" asChild>
                <span>Import</span>
              </Button>
            </label>
            <input
              id="import-config"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>

          {validationErrors.length > 0 && (
            <Alert className="mb-4">
              <AlertDescription>
                <div className="font-medium">Validation Errors:</div>
                <ul className="list-disc list-inside mt-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={config.version}
                  onChange={(e) => updateConfig('version', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="environment">Environment</Label>
                <Select value={config.environment} onValueChange={(value) => updateConfig('environment', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plugins">
          <Card>
            <CardHeader>
              <CardTitle>Plugin Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoDiscovery">Auto Discovery</Label>
                <Switch
                  id="autoDiscovery"
                  checked={config.plugins.autoDiscovery}
                  onCheckedChange={(checked) => updateConfig('plugins.autoDiscovery', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="hotReload">Hot Reload</Label>
                <Switch
                  id="hotReload"
                  checked={config.plugins.hotReload}
                  onCheckedChange={(checked) => updateConfig('plugins.hotReload', checked)}
                />
              </div>
              <div>
                <Label htmlFor="healthCheckInterval">Health Check Interval (ms)</Label>
                <Input
                  id="healthCheckInterval"
                  type="number"
                  value={config.plugins.healthCheckInterval}
                  onChange={(e) => updateConfig('plugins.healthCheckInterval', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="maxConcurrentLoads">Max Concurrent Loads</Label>
                <Input
                  id="maxConcurrentLoads"
                  type="number"
                  value={config.plugins.maxConcurrentLoads}
                  onChange={(e) => updateConfig('plugins.maxConcurrentLoads', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableEncryption">Enable Encryption</Label>
                <Switch
                  id="enableEncryption"
                  checked={config.security.enableEncryption}
                  onCheckedChange={(checked) => updateConfig('security.enableEncryption', checked)}
                />
              </div>
              <div>
                <Label htmlFor="encryptionKey">Encryption Key</Label>
                <Input
                  id="encryptionKey"
                  type="password"
                  value={config.security.encryptionKey || ''}
                  onChange={(e) => updateConfig('security.encryptionKey', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (ms)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={config.security.sessionTimeout}
                  onChange={(e) => updateConfig('security.sessionTimeout', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={config.security.maxLoginAttempts}
                  onChange={(e) => updateConfig('security.maxLoginAttempts', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableCaching">Enable Caching</Label>
                <Switch
                  id="enableCaching"
                  checked={config.performance.enableCaching}
                  onCheckedChange={(checked) => updateConfig('performance.enableCaching', checked)}
                />
              </div>
              <div>
                <Label htmlFor="cacheTTL">Cache TTL (ms)</Label>
                <Input
                  id="cacheTTL"
                  type="number"
                  value={config.performance.cacheTTL}
                  onChange={(e) => updateConfig('performance.cacheTTL', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enableCompression">Enable Compression</Label>
                <Switch
                  id="enableCompression"
                  checked={config.performance.enableCompression}
                  onCheckedChange={(checked) => updateConfig('performance.enableCompression', checked)}
                />
              </div>
              <div>
                <Label htmlFor="maxMemoryUsage">Max Memory Usage (MB)</Label>
                <Input
                  id="maxMemoryUsage"
                  type="number"
                  value={config.performance.maxMemoryUsage}
                  onChange={(e) => updateConfig('performance.maxMemoryUsage', parseInt(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableMetrics">Enable Metrics</Label>
                <Switch
                  id="enableMetrics"
                  checked={config.monitoring.enableMetrics}
                  onCheckedChange={(checked) => updateConfig('monitoring.enableMetrics', checked)}
                />
              </div>
              <div>
                <Label htmlFor="metricsInterval">Metrics Interval (ms)</Label>
                <Input
                  id="metricsInterval"
                  type="number"
                  value={config.monitoring.metricsInterval}
                  onChange={(e) => updateConfig('monitoring.metricsInterval', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enableLogging">Enable Logging</Label>
                <Switch
                  id="enableLogging"
                  checked={config.monitoring.enableLogging}
                  onCheckedChange={(checked) => updateConfig('monitoring.enableLogging', checked)}
                />
              </div>
              <div>
                <Label htmlFor="logLevel">Log Level</Label>
                <Select value={config.monitoring.logLevel} onValueChange={(value) => updateConfig('monitoring.logLevel', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="connectionPoolSize">Connection Pool Size</Label>
                <Input
                  id="connectionPoolSize"
                  type="number"
                  value={config.database.connectionPoolSize}
                  onChange={(e) => updateConfig('database.connectionPoolSize', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="queryTimeout">Query Timeout (ms)</Label>
                <Input
                  id="queryTimeout"
                  type="number"
                  value={config.database.queryTimeout}
                  onChange={(e) => updateConfig('database.queryTimeout', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="enableConnectionPooling">Enable Connection Pooling</Label>
                <Switch
                  id="enableConnectionPooling"
                  checked={config.database.enableConnectionPooling}
                  onCheckedChange={(checked) => updateConfig('database.enableConnectionPooling', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versions.map((version, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{version.version}</div>
                    <div className="text-sm text-gray-500">
                      {version.timestamp.toLocaleString()} by {version.author}
                    </div>
                  </div>
                  <Badge variant="outline">{version.changes.length} changes</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}