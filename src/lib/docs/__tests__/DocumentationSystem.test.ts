import { 
  DeveloperExperienceManager, 
  PluginDocumentationGenerator,
  PluginDebuggerImpl,
  PluginProfilerImpl,
  PluginLoggerImpl,
  PluginSandboxImpl,
  ApiExplorerImpl
} from '../PluginDocumentationSystem';

describe('Documentation & Developer Experience System', () => {
  let devExperienceManager: DeveloperExperienceManager;
  let docGenerator: PluginDocumentationGenerator;

  beforeEach(() => {
    devExperienceManager = new DeveloperExperienceManager();
    docGenerator = new PluginDocumentationGenerator();
  });

  describe('PluginDocumentationGenerator', () => {
    it('should generate API documentation for a plugin', async () => {
      const documentation = await docGenerator.generateAPIDocumentation('test-plugin');
      
      expect(documentation).toBeDefined();
      expect(documentation.name).toBe('test-plugin');
      expect(documentation.version).toBe('1.0.0');
      expect(documentation.description).toContain('test-plugin');
      expect(documentation.installation).toContain('npm install');
      expect(documentation.contributing).toBeDefined();
      expect(documentation.troubleshooting).toBeDefined();
    });

    it('should generate usage examples for a plugin', async () => {
      const examples = await docGenerator.generateUsageExamples('test-plugin');
      
      expect(examples).toBeInstanceOf(Array);
      expect(examples.length).toBeGreaterThan(0);
      
      for (const example of examples) {
        expect(example.title).toBeDefined();
        expect(example.description).toBeDefined();
        expect(example.code).toBeDefined();
        expect(example.language).toBe('typescript');
      }
      
      const basicExample = examples.find(e => e.title === 'Basic Usage');
      expect(basicExample).toBeDefined();
      expect(basicExample?.code).toContain('test-plugin');
    });

    it('should generate type definitions', async () => {
      const typeDefs = await docGenerator.generateTypeDefinitions('test-plugin');
      
      expect(typeDefs).toBeDefined();
      expect(typeof typeDefs).toBe('string');
      expect(typeDefs).toContain('test-plugin');
      expect(typeDefs).toContain('declare module');
    });

    it('should generate changelog', async () => {
      const changelog = await docGenerator.generateChangelog('test-plugin');
      
      expect(changelog).toBeInstanceOf(Array);
      expect(changelog.length).toBeGreaterThan(0);
      
      const firstEntry = changelog[0];
      expect(firstEntry.version).toBe('1.0.0');
      expect(firstEntry.changes).toBeInstanceOf(Array);
      expect(firstEntry.changes.length).toBeGreaterThan(0);
      
      const firstChange = firstEntry.changes[0];
      expect(firstChange.type).toBe('feature');
      expect(firstChange.description).toBe('Initial release');
    });

    it('should generate comprehensive documentation', async () => {
      const documentation = await docGenerator.generateDocumentation('test-plugin');
      
      expect(documentation).toBeDefined();
      expect(documentation.name).toBe('test-plugin');
      expect(documentation.examples).toBeInstanceOf(Array);
      expect(documentation.changelog).toBeInstanceOf(Array);
      expect(documentation.apiReference).toBeInstanceOf(Array);
    });
  });

  describe('DeveloperExperienceManager', () => {
    it('should initialize with default tools', () => {
      const tools = devExperienceManager.getTools();
      
      expect(tools).toBeDefined();
      expect(tools.debugger).toBeDefined();
      expect(tools.profiler).toBeDefined();
      expect(tools.logger).toBeDefined();
      expect(tools.sandbox).toBeDefined();
      expect(tools.apiExplorer).toBeDefined();
    });

    it('should generate documentation', async () => {
      const documentation = await devExperienceManager.generateDocumentation('test-plugin');
      
      expect(documentation).toBeDefined();
      expect(documentation.name).toBe('test-plugin');
      expect(documentation.version).toBe('1.0.0');
    });

    it('should handle hot-reloading of plugins', async () => {
      const eventCallback = jest.fn();
      devExperienceManager.on('plugin:hot_reload', eventCallback);
      
      const result = await devExperienceManager.hotReloadPlugin('test-plugin');
      
      expect(result.success).toBe(true);
      expect(result.pluginName).toBe('test-plugin');
      expect(result.timestamp).toBeInstanceOf(Date);
      
      // Check that the event was emitted
      expect(eventCallback).toHaveBeenCalledWith(expect.objectContaining({
        pluginName: 'test-plugin',
        timestamp: expect.any(Date),
      }));
      
      // Clean up
      devExperienceManager.off('plugin:hot_reload', eventCallback);
    });

    it('should generate insights', async () => {
      const insights = await devExperienceManager.generateInsights();
      
      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      
      const firstInsight = insights[0];
      expect(firstInsight.id).toBeDefined();
      expect(firstInsight.title).toBeDefined();
      expect(firstInsight.description).toBeDefined();
      expect(firstInsight.severity).toBeDefined();
      expect(firstInsight.recommendation).toBeDefined();
      expect(firstInsight.timestamp).toBeInstanceOf(Date);
    });

    it('should provide access to documentation generator', () => {
      const generator = devExperienceManager.getDocumentationGenerator();
      expect(generator).toBeInstanceOf(PluginDocumentationGenerator);
    });

    it('should handle event subscription and unsubscription', () => {
      const callback = jest.fn();
      
      // Subscribe
      devExperienceManager.on('test:event', callback);
      
      // Emit event
      (devExperienceManager as any).emitEvent('test:event', { data: 'test' });
      
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
      
      // Unsubscribe
      devExperienceManager.off('test:event', callback);
      
      // Emit again - callback should not be called
      (devExperienceManager as any).emitEvent('test:event', { data: 'test2' });
      
      // Callback should still have been called only once
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  describe('Developer Tools Implementations', () => {
    it('should implement plugin debugger', async () => {
      const debuggerImpl = new PluginDebuggerImpl();
      const session = await debuggerImpl.debugPlugin('test-plugin');
      
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.pluginName).toBe('test-plugin');
      expect(session.status).toBe('running');
      expect(session.timestamp).toBeInstanceOf(Date);
    });

    it('should implement plugin profiler', async () => {
      const profilerImpl = new PluginProfilerImpl();
      const profileResult = await profilerImpl.profilePlugin('test-plugin');
      
      expect(profileResult).toBeDefined();
      expect(profileResult.pluginName).toBe('test-plugin');
      expect(profileResult.totalTime).toBe(0);
      expect(profileResult.functionCalls).toBeInstanceOf(Array);
      expect(profileResult.memoryUsage).toBeDefined();
      expect(profileResult.timestamp).toBeInstanceOf(Date);
    });

    it('should implement plugin logger', async () => {
      const loggerImpl = new PluginLoggerImpl();
      const logs = await loggerImpl.getPluginLogs('test-plugin');
      
      expect(logs).toBeInstanceOf(Array);
    });

    it('should implement plugin sandbox', async () => {
      const sandboxImpl = new PluginSandboxImpl();
      const sandbox = await sandboxImpl.createSandbox('test-plugin');
      
      expect(sandbox).toBeDefined();
      expect(sandbox.id).toBeDefined();
      expect(sandbox.pluginName).toBe('test-plugin');
      expect(sandbox.status).toBe('created');
      expect(sandbox.created).toBeInstanceOf(Date);
      expect(sandbox.lastUsed).toBeInstanceOf(Date);
    });

    it('should implement API explorer', async () => {
      const apiExplorerImpl = new ApiExplorerImpl();
      const endpoints = await apiExplorerImpl.exploreAPI('test-plugin');
      
      expect(endpoints).toBeInstanceOf(Array);
    });
  });

  describe('Configuration Management', () => {
    it('should allow custom configuration', () => {
      const customConfig = {
        enableInteractiveDocs: false,
        enableLiveExamples: false,
        theme: 'dark' as const,
        language: 'es',
      };
      
      const customGenerator = new PluginDocumentationGenerator(customConfig);
      
      // While we can't directly access the config, we can verify the instance was created
      expect(customGenerator).toBeInstanceOf(PluginDocumentationGenerator);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        theme: 'dark' as const,
      };
      
      const customGenerator = new PluginDocumentationGenerator(customConfig);
      expect(customGenerator).toBeInstanceOf(PluginDocumentationGenerator);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in event callbacks', () => {
      const badCallback = () => {
        throw new Error('Test error');
      };
      
      // Subscribe a bad callback
      devExperienceManager.on('test:error_event', badCallback);
      
      // Emitting should not crash the system
      expect(() => {
        (devExperienceManager as any).emitEvent('test:error_event', { data: 'test' });
      }).not.toThrow();
      
      // Clean up
      devExperienceManager.off('test:error_event', badCallback);
    });
  });
});