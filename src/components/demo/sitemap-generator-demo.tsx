'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SitemapGeneratorDemoProps {
  isActive: boolean;
}

interface SitemapURL {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}

export function SitemapGeneratorDemo({ isActive }: SitemapGeneratorDemoProps) {
  const [sitemapConfig, setSitemapConfig] = useState({
    baseUrl: 'https://example.com',
    autoGenerate: true,
    includeImages: true,
    defaultChangefreq: 'weekly',
    defaultPriority: 0.8
  });

  const [sitemapUrls, setSitemapUrls] = useState<SitemapURL[]>([
    { loc: 'https://example.com/', lastmod: '2024-01-15', changefreq: 'weekly', priority: 1.0 },
    { loc: 'https://example.com/blog', lastmod: '2024-01-14', changefreq: 'daily', priority: 0.9 },
    { loc: 'https://example.com/products', lastmod: '2024-01-13', changefreq: 'weekly', priority: 0.8 },
    { loc: 'https://example.com/about', lastmod: '2024-01-10', changefreq: 'monthly', priority: 0.6 },
    { loc: 'https://example.com/contact', lastmod: '2024-01-08', changefreq: 'monthly', priority: 0.5 }
  ]);

  const [newUrl, setNewUrl] = useState({
    path: '',
    changefreq: 'weekly',
    priority: 0.8
  });

  const [generatedSitemap, setGeneratedSitemap] = useState('');
  const [generatedRobots, setGeneratedRobots] = useState('');

  const updateConfig = (key: string, value: any) => {
    setSitemapConfig(prev => ({ ...prev, [key]: value }));
  };

  const addUrl = () => {
    if (!newUrl.path) return;
    
    const url: SitemapURL = {
      loc: `${sitemapConfig.baseUrl}${newUrl.path.startsWith('/') ? newUrl.path : '/' + newUrl.path}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: newUrl.changefreq,
      priority: newUrl.priority
    };

    setSitemapUrls(prev => [...prev, url]);
    setNewUrl({ path: '', changefreq: 'weekly', priority: 0.8 });
  };

  const removeUrl = (index: number) => {
    setSitemapUrls(prev => prev.filter((_, i) => i !== index));
  };

  const generateSitemap = () => {
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    sitemapUrls.forEach(url => {
      sitemap += `
  <url>
    <loc>${escapeXML(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    setGeneratedSitemap(sitemap);
  };

  const generateRobots = () => {
    const robots = `User-agent: *
Allow: /

Sitemap: ${sitemapConfig.baseUrl}/sitemap.xml`;
    setGeneratedRobots(robots);
  };

  const escapeXML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  if (!isActive) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗺️ Sitemap Generator Plugin
            <Badge variant="secondary">Inactive</Badge>
          </CardTitle>
          <CardDescription>
            Auto-generate XML sitemaps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🗺️</div>
            <p>Plugin is inactive. Enable it to generate sitemaps.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🗺️ Sitemap Generator Plugin
            <Badge variant="default">Active</Badge>
          </CardTitle>
          <CardDescription>
            Auto-generate XML sitemaps for better search engine crawling
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Sitemap Configuration</CardTitle>
          <CardDescription>Configure your sitemap settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={sitemapConfig.baseUrl}
              onChange={(e) => updateConfig('baseUrl', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="autoGenerate"
                checked={sitemapConfig.autoGenerate}
                onCheckedChange={(checked) => updateConfig('autoGenerate', checked)}
              />
              <Label htmlFor="autoGenerate">Auto Generate</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="includeImages"
                checked={sitemapConfig.includeImages}
                onCheckedChange={(checked) => updateConfig('includeImages', checked)}
              />
              <Label htmlFor="includeImages">Include Images</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultChangefreq">Default Change Frequency</Label>
              <select
                id="defaultChangefreq"
                value={sitemapConfig.defaultChangefreq}
                onChange={(e) => updateConfig('defaultChangefreq', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="always">Always</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div>
              <Label htmlFor="defaultPriority">Default Priority</Label>
              <Input
                id="defaultPriority"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={sitemapConfig.defaultPriority}
                onChange={(e) => updateConfig('defaultPriority', parseFloat(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URL Management */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 URL Management</CardTitle>
          <CardDescription>Manage URLs in your sitemap</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="newPath">Path</Label>
              <Input
                id="newPath"
                value={newUrl.path}
                onChange={(e) => setNewUrl(prev => ({ ...prev, path: e.target.value }))}
                placeholder="/page-path"
              />
            </div>
            <div>
              <Label htmlFor="newChangefreq">Change Frequency</Label>
              <select
                id="newChangefreq"
                value={newUrl.changefreq}
                onChange={(e) => setNewUrl(prev => ({ ...prev, changefreq: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="always">Always</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div>
              <Label htmlFor="newPriority">Priority</Label>
              <Input
                id="newPriority"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={newUrl.priority}
                onChange={(e) => setNewUrl(prev => ({ ...prev, priority: parseFloat(e.target.value) }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addUrl} className="w-full">
                Add URL
              </Button>
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 font-medium text-sm">
              Current URLs ({sitemapUrls.length})
            </div>
            <div className="max-h-64 overflow-y-auto">
              {sitemapUrls.map((url, index) => (
                <div key={index} className="p-4 border-b flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{url.loc}</div>
                    <div className="text-sm text-gray-600">
                      {url.changefreq} • Priority: {url.priority} • Lastmod: {url.lastmod}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeUrl(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Tools */}
      <Card>
        <CardHeader>
          <CardTitle>🛠️ Generate Tools</CardTitle>
          <CardDescription>Generate sitemap and robots.txt files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={generateSitemap} className="h-20 flex flex-col gap-2">
              <span>🗺️</span>
              <span>Generate Sitemap</span>
            </Button>
            <Button onClick={generateRobots} className="h-20 flex flex-col gap-2">
              <span>🤖</span>
              <span>Generate Robots.txt</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Files */}
      <Tabs defaultValue="sitemap" className="w-full">
        <TabsList>
          <TabsTrigger value="sitemap">Sitemap.xml</TabsTrigger>
          <TabsTrigger value="robots">Robots.txt</TabsTrigger>
        </TabsList>

        <TabsContent value="sitemap">
          {generatedSitemap && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Sitemap.xml</CardTitle>
                <CardDescription>Copy this content to your sitemap.xml file</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedSitemap}
                  readOnly
                  rows={15}
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={() => navigator.clipboard.writeText(generatedSitemap)}
                  className="mt-4"
                >
                  Copy to Clipboard
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="robots">
          {generatedRobots && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Robots.txt</CardTitle>
                <CardDescription>Copy this content to your robots.txt file</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedRobots}
                  readOnly
                  rows={8}
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={() => navigator.clipboard.writeText(generatedRobots)}
                  className="mt-4"
                >
                  Copy to Clipboard
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Sitemap Statistics</CardTitle>
          <CardDescription>Overview of your sitemap</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{sitemapUrls.length}</div>
              <div className="text-sm text-gray-600">Total URLs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {sitemapUrls.filter(u => u.priority >= 0.8).length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {sitemapUrls.filter(u => u.changefreq === 'daily' || u.changefreq === 'weekly').length}
              </div>
              <div className="text-sm text-gray-600">Frequently Updated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {sitemapConfig.autoGenerate ? 'Yes' : 'No'}
              </div>
              <div className="text-sm text-gray-600">Auto Generate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}