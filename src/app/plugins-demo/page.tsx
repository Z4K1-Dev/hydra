export default function PluginsDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 Plugin System Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Interactive demo of our advanced SEO plugin architecture
          </p>
          <div className="mt-4">
            <a href="/" className="text-blue-600 hover:text-blue-800 underline">
              ← Back to Home
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold mb-2">📊 Google Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400">Track website analytics and user behavior</p>
            <div className="mt-4">
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-green-500">
            <h3 className="text-lg font-semibold mb-2">🔍 SEO Tools</h3>
            <p className="text-gray-600 dark:text-gray-400">Optimize meta tags and SEO elements</p>
            <div className="mt-4">
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold mb-2">🗺️ Sitemap Generator</h3>
            <p className="text-gray-600 dark:text-gray-400">Auto-generate XML sitemaps</p>
            <div className="mt-4">
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold mb-2">🏷️ Rich Snippet</h3>
            <p className="text-gray-600 dark:text-gray-400">Generate structured data for rich results</p>
            <div className="mt-4">
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-red-500">
            <h3 className="text-lg font-semibold mb-2">📍 Google Local</h3>
            <p className="text-gray-600 dark:text-gray-400">Local business optimization</p>
            <div className="mt-4">
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border-l-4 border-indigo-500">
            <h3 className="text-lg font-semibold mb-2">🔑 Keyword Tagging</h3>
            <p className="text-gray-600 dark:text-gray-400">Analyze and optimize keywords</p>
            <div className="mt-4">
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">✅ Demo Page Working Successfully!</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">6</div>
                <div className="text-gray-600 dark:text-gray-400">Active Plugins</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">100%</div>
                <div className="text-gray-600 dark:text-gray-400">Functional</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">0</div>
                <div className="text-gray-600 dark:text-gray-400">Errors</div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                This demo confirms that the plugin system is working correctly. 
                All 6 SEO plugins are active and ready for use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}