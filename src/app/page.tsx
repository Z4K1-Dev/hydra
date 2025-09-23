'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, BarChart3, Search, MapPin, Tag, FileText } from 'lucide-react';

export default function Home() {
  const [loadedPlugins, setLoadedPlugins] = useState<string[]>([
    'google-analytics',
    'seo-tools', 
    'sitemap-generator',
    'rich-snippet',
    'google-local',
    'keyword-tagging'
  ]);
  
  const [pluginStatus, setPluginStatus] = useState<Record<string, boolean>>({
    'google-analytics': true,
    'seo-tools': true,
    'sitemap-generator': true,
    'rich-snippet': true,
    'google-local': true,
    'keyword-tagging': true
  });

  const getPluginIcon = (pluginName: string) => {
    switch (pluginName) {
      case 'google-analytics':
        return <BarChart3 className="h-5 w-5" />;
      case 'seo-tools':
        return <Search className="h-5 w-5" />;
      case 'sitemap-generator':
        return <FileText className="h-5 w-5" />;
      case 'rich-snippet':
        return <Tag className="h-5 w-5" />;
      case 'google-local':
        return <MapPin className="h-5 w-5" />;
      case 'keyword-tagging':
        return <Tag className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getPluginDescription = (pluginName: string) => {
    switch (pluginName) {
      case 'google-analytics':
        return 'Website analytics and tracking';
      case 'seo-tools':
        return 'Meta tags and SEO optimization';
      case 'sitemap-generator':
        return 'Automatic sitemap generation';
      case 'rich-snippet':
        return 'Structured data for rich snippets';
      case 'google-local':
        return 'Google Business integration';
      case 'keyword-tagging':
        return 'Keyword analysis and tagging';
      default:
        return 'Plugin functionality';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        <img
          src="/logo.svg"
          alt="Z.ai Logo"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">SEO Plugin System</h1>
          <p className="text-lg text-muted-foreground">
            Modular SEO and analytics plugins for your Next.js application
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="plugins">Active Plugins</TabsTrigger>
            <TabsTrigger value="admin">Admin Panel</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Plugin System Features</CardTitle>
                <CardDescription>
                  Our modular plugin system allows you to enable/disable SEO features as needed
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Available Plugins</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Google Analytics</li>
                    <li>• SEO Tools</li>
                    <li>• Sitemap Generator</li>
                    <li>• Rich Snippet</li>
                    <li>• Google Local</li>
                    <li>• Keyword Tagging</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Key Benefits</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Load only what you need</li>
                    <li>• Easy configuration</li>
                    <li>• Performance optimized</li>
                    <li>• Modular architecture</li>
                    <li>• Real-time management</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plugins" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadedPlugins.map((pluginName) => (
                <Card key={pluginName}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getPluginIcon(pluginName)}
                        <CardTitle className="text-lg capitalize">
                          {pluginName.replace('-', ' ')}
                        </CardTitle>
                      </div>
                      <Badge variant={pluginStatus[pluginName] ? 'default' : 'secondary'}>
                        {pluginStatus[pluginName] ? 'Loaded' : 'Loading...'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {getPluginDescription(pluginName)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Plugin Demo</CardTitle>
                <CardDescription>
                  Try our interactive demo with all 6 SEO plugins
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="flex-1">
                    <a href="/plugins-demo">
                      <Settings className="mr-2 h-4 w-4" />
                      View Demo
                    </a>
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>
                    Interactive demo with: {loadedPlugins.length} plugins
                  </p>
                  <p>
                    Try enabling/disabling plugins in real-time!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}