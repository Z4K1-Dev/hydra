'use client';

import { useState, useEffect } from 'react';

interface PluginConfig {
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  settings?: Record<string, any>;
}

export default function SimplePluginPage() {
  const [plugins, setPlugins] = useState<PluginConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Simple plugin page - useEffect running');
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      console.log('Simple plugin page - fetching plugins...');
      const response = await fetch('/api/plugins');
      console.log('Simple plugin page - response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Simple plugin page - plugins data:', data);
      setPlugins(data);
      setError(null);
    } catch (err) {
      console.error('Simple plugin page - error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Simple Plugin Page</h1>
        <div>Loading plugins...</div>
        <div className="mt-4 text-sm text-gray-600">
          Check browser console for detailed logs
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Simple Plugin Page</h1>
        <div className="text-red-600">Error: {error}</div>
        <button 
          onClick={loadPlugins}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Plugin Page</h1>
      <div className="mb-4">
        Found {plugins.length} plugins
      </div>
      <div className="space-y-2">
        {plugins.map((plugin) => (
          <div key={plugin.name} className="border p-3 rounded">
            <div className="font-semibold">{plugin.name}</div>
            <div className="text-sm text-gray-600">{plugin.description}</div>
            <div className="text-xs">
              Status: {plugin.isActive ? 'Active' : 'Inactive'} | v{plugin.version}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}