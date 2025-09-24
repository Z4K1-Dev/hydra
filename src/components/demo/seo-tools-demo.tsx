'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SEOToolsDemoProps {
  isActive: boolean;
}

export function SEOToolsDemo({ isActive }: SEOToolsDemoProps) {
  const [seoConfig, setSeoConfig] = useState({
    title: 'Hybrid Plugin System Demo - Advanced SEO Tools',
    description: 'Experience the power of our hybrid plugin system with comprehensive SEO optimization tools, meta tag management, and structured data generation.',
    keywords: 'plugin system, seo tools, hybrid architecture, nextjs, typescript, meta tags, structured data',
    author: 'Plugin System Demo',
    ogImage: 'https://via.placeholder.com/1200x630',
    twitterCard: 'summary_large_image',
    enableRobots: true,
    enableCanonical: true,
    enableOpenGraph: true,
    enableTwitter: true
  });

  const [metaTags, setMetaTags] = useState<string[]>([]);
  const [score, setScore] = useState(85);

  const updateConfig = (key: string, value: any) => {
    setSeoConfig(prev => ({ ...prev, [key]: value }));
    calculateScore();
  };

  const calculateScore = () => {
    let newScore = 0;
    
    // Title score
    if (seoConfig.title.length >= 30 && seoConfig.title.length <= 60) newScore += 20;
    else if (seoConfig.title.length > 0) newScore += 10;
    
    // Description score
    if (seoConfig.description.length >= 120 && seoConfig.description.length <= 160) newScore += 20;
    else if (seoConfig.description.length > 0) newScore += 10;
    
    // Keywords score
    if (seoConfig.keywords.split(',').length >= 3) newScore += 15;
    else if (seoConfig.keywords.length > 0) newScore += 5;
    
    // Open Graph score
    if (seoConfig.enableOpenGraph && seoConfig.ogImage) newScore += 15;
    
    // Twitter score
    if (seoConfig.enableTwitter) newScore += 10;
    
    // Author score
    if (seoConfig.author) newScore += 5;
    
    // Robots score
    if (seoConfig.enableRobots) newScore += 5;
    
    setScore(newScore);
  };

  const generateMetaTags = () => {
    const tags = [];
    
    if (seoConfig.title) tags.push(`<title>${seoConfig.title}</title>`);
    if (seoConfig.description) tags.push(`<meta name="description" content="${seoConfig.description}">`);
    if (seoConfig.keywords) tags.push(`<meta name="keywords" content="${seoConfig.keywords}">`);
    if (seoConfig.author) tags.push(`<meta name="author" content="${seoConfig.author}">`);
    
    if (seoConfig.enableRobots) {
      tags.push(`<meta name="robots" content="index, follow">`);
      tags.push(`<meta name="googlebot" content="index, follow">`);
    }
    
    if (seoConfig.enableOpenGraph) {
      tags.push(`<meta property="og:title" content="${seoConfig.title}">`);
      tags.push(`<meta property="og:description" content="${seoConfig.description}">`);
      tags.push(`<meta property="og:type" content="website">`);
      tags.push(`<meta property="og:url" content="${window.location.href}">`);
      if (seoConfig.ogImage) tags.push(`<meta property="og:image" content="${seoConfig.ogImage}">`);
    }
    
    if (seoConfig.enableTwitter) {
      tags.push(`<meta name="twitter:card" content="${seoConfig.twitterCard}">`);
      tags.push(`<meta name="twitter:title" content="${seoConfig.title}">`);
      tags.push(`<meta name="twitter:description" content="${seoConfig.description}">`);
      if (seoConfig.ogImage) tags.push(`<meta name="twitter:image" content="${seoConfig.ogImage}">`);
    }
    
    if (seoConfig.enableCanonical) {
      tags.push(`<link rel="canonical" href="${window.location.href}">`);
    }
    
    setMetaTags(tags);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
    return 'text-red-600 bg-red-100 dark:bg-red-900';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  if (!isActive) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 SEO Tools Plugin
            <Badge variant="secondary">Inactive</Badge>
          </CardTitle>
          <CardDescription>
            Optimize meta tags and SEO elements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🔍</div>
            <p>Plugin is inactive. Enable it to access SEO tools.</p>
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
            🔍 SEO Tools Plugin
            <Badge variant="default">Active</Badge>
          </CardTitle>
          <CardDescription>
            Optimize meta tags and SEO elements for better search engine rankings
          </CardDescription>
        </CardHeader>
      </Card>

      {/* SEO Score */}
      <Card>
        <CardHeader>
          <CardTitle>📊 SEO Score</CardTitle>
          <CardDescription>Current optimization score based on your settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center ${getScoreColor(score)}`}>
              <div className="text-center">
                <div className="text-3xl font-bold">{score}</div>
                <div className="text-sm font-medium">{getScoreLabel(score)}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {seoConfig.title.length}/60
              </div>
              <div className="text-sm text-gray-600">Title Length</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {seoConfig.description.length}/160
              </div>
              <div className="text-sm text-gray-600">Description</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {seoConfig.keywords.split(',').filter(k => k.trim()).length}
              </div>
              <div className="text-sm text-gray-600">Keywords</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                {metaTags.length}
              </div>
              <div className="text-sm text-gray-600">Meta Tags</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ SEO Configuration</CardTitle>
          <CardDescription>Configure your meta tags and SEO settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={seoConfig.title}
              onChange={(e) => updateConfig('title', e.target.value)}
              placeholder="Enter page title (30-60 characters recommended)"
            />
            <div className="text-sm text-gray-600 mt-1">
              {seoConfig.title.length} characters (recommended: 30-60)
            </div>
          </div>

          <div>
            <Label htmlFor="description">Meta Description</Label>
            <Textarea
              id="description"
              value={seoConfig.description}
              onChange={(e) => updateConfig('description', e.target.value)}
              placeholder="Enter meta description (120-160 characters recommended)"
              rows={3}
            />
            <div className="text-sm text-gray-600 mt-1">
              {seoConfig.description.length} characters (recommended: 120-160)
            </div>
          </div>

          <div>
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              value={seoConfig.keywords}
              onChange={(e) => updateConfig('keywords', e.target.value)}
              placeholder="Enter keywords separated by commas"
            />
          </div>

          <div>
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={seoConfig.author}
              onChange={(e) => updateConfig('author', e.target.value)}
              placeholder="Enter author name"
            />
          </div>

          <div>
            <Label htmlFor="ogImage">OG Image URL</Label>
            <Input
              id="ogImage"
              value={seoConfig.ogImage}
              onChange={(e) => updateConfig('ogImage', e.target.value)}
              placeholder="Enter Open Graph image URL"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enableRobots"
                checked={seoConfig.enableRobots}
                onCheckedChange={(checked) => updateConfig('enableRobots', checked)}
              />
              <Label htmlFor="enableRobots">Enable Robots Meta</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableCanonical"
                checked={seoConfig.enableCanonical}
                onCheckedChange={(checked) => updateConfig('enableCanonical', checked)}
              />
              <Label htmlFor="enableCanonical">Enable Canonical URL</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableOpenGraph"
                checked={seoConfig.enableOpenGraph}
                onCheckedChange={(checked) => updateConfig('enableOpenGraph', checked)}
              />
              <Label htmlFor="enableOpenGraph">Enable Open Graph</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableTwitter"
                checked={seoConfig.enableTwitter}
                onCheckedChange={(checked) => updateConfig('enableTwitter', checked)}
              />
              <Label htmlFor="enableTwitter">Enable Twitter Cards</Label>
            </div>
          </div>

          <Button onClick={generateMetaTags} className="w-full">
            Generate Meta Tags
          </Button>
        </CardContent>
      </Card>

      {/* Google Search Preview */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Google Search Preview</CardTitle>
          <CardDescription>How your page appears in Google search results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-blue-600 text-sm hover:underline cursor-pointer">
              {seoConfig.title || 'Your Page Title'}
            </div>
            <div className="text-green-600 text-sm">
              {window.location.hostname}
            </div>
            <div className="text-gray-600 text-sm mt-1">
              {seoConfig.description || 'Your meta description will appear here...'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Meta Tags */}
      {metaTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🏷️ Generated Meta Tags</CardTitle>
            <CardDescription>Copy these meta tags to your HTML head section</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              {metaTags.map((tag, index) => (
                <div key={index} className="mb-1">
                  {tag}
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigator.clipboard.writeText(metaTags.join('\n'))}
              className="mt-4"
            >
              Copy to Clipboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}