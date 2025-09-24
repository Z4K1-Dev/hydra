'use client';

import { useState, useEffect } from 'react';

interface PluginConfig {
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  settings?: Record<string, any>;
}

export default function PluginManagement() {
  const [plugins, setPlugins] = useState<PluginConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      console.log('Fetching plugins...');
      const response = await fetch('/api/plugins');
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Plugins data:', data);
      setPlugins(data);
    } catch (error) {
      console.error('Error fetching plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlugin = async (pluginName: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pluginName, isActive })
      });

      if (response.ok) {
        setPlugins(prev => prev.map(p => 
          p.name === pluginName ? { ...p, isActive } : p
        ));
      }
    } catch (error) {
      console.error('Error toggling plugin:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plugin Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your SEO and analytics plugins. Enable or disable features as needed.
        </p>
      </div>

      <div className="grid gap-4">
        {plugins.map((plugin) => (
          <div key={plugin.name} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold capitalize">
                  {plugin.name.replace('-', ' ')}
                </h3>
                <p className="text-gray-600 text-sm">{plugin.description}</p>
                <span className="text-xs text-gray-500">v{plugin.version}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  plugin.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {plugin.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => togglePlugin(plugin.name, !plugin.isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    plugin.isActive ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      plugin.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}