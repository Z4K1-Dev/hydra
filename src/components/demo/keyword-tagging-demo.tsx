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
import { Progress } from '@/components/ui/progress';

interface KeywordTaggingDemoProps {
  isActive: boolean;
}

interface KeywordAnalysis {
  keyword: string;
  density: number;
  count: number;
  recommended: boolean;
  competition: 'low' | 'medium' | 'high';
  volume: number;
}

interface KeywordSuggestion {
  keyword: string;
  volume: number;
  difficulty: number;
  relevance: number;
  suggested: boolean;
}

export function KeywordTaggingDemo({ isActive }: KeywordTaggingDemoProps) {
  const [keywordConfig, setKeywordConfig] = useState({
    enableAnalysis: true,
    enableSuggestions: true,
    enableDensityCheck: true,
    enableCompetitorAnalysis: true,
    autoGenerateTags: true,
    targetDensity: 2.5
  });

  const [content, setContent] = useState(`Hybrid plugin systems represent the cutting edge of web application architecture. By combining the best of both client-side and server-side rendering, developers can create highly scalable and performant applications. Our advanced plugin system leverages Next.js and TypeScript to deliver exceptional user experiences while maintaining code maintainability and extensibility.

The hybrid architecture allows plugins to operate seamlessly across different rendering contexts, providing maximum flexibility for developers. This approach enables real-time functionality while preserving SEO benefits and fast initial page loads. With proper implementation, hybrid plugin systems can handle complex business logic while maintaining optimal performance characteristics.

When developing hybrid plugin systems, it's essential to consider factors such as state management, event handling, and lifecycle management. The system should be designed to accommodate various plugin types while maintaining consistency and reliability across the entire application ecosystem.`);

  const [targetKeywords, setTargetKeywords] = useState([
    'hybrid plugin system',
    'next.js',
    'typescript',
    'web development',
    'client-side rendering',
    'server-side rendering'
  ]);

  const [newKeyword, setNewKeyword] = useState('');

  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis[]>([
    { keyword: 'hybrid plugin system', density: 3.2, count: 3, recommended: true, competition: 'low', volume: 1200 },
    { keyword: 'next.js', density: 1.8, count: 2, recommended: true, competition: 'medium', volume: 8500 },
    { keyword: 'typescript', density: 1.2, count: 1, recommended: true, competition: 'medium', volume: 6200 },
    { keyword: 'web development', density: 0.8, count: 1, recommended: false, competition: 'high', volume: 15000 },
    { keyword: 'client-side rendering', density: 0.4, count: 1, recommended: false, competition: 'low', volume: 2800 },
    { keyword: 'server-side rendering', density: 0.4, count: 1, recommended: false, competition: 'low', volume: 3200 }
  ]);

  const [keywordSuggestions, setKeywordSuggestions] = useState<KeywordSuggestion[]>([
    { keyword: 'plugin architecture', volume: 1800, difficulty: 45, relevance: 95, suggested: true },
    { keyword: 'react plugins', volume: 3200, difficulty: 65, relevance: 88, suggested: true },
    { keyword: 'web application architecture', volume: 2400, difficulty: 55, relevance: 92, suggested: true },
    { keyword: 'scalable web apps', volume: 1900, difficulty: 40, relevance: 85, suggested: false },
    { keyword: 'frontend development', volume: 8900, difficulty: 75, relevance: 78, suggested: false },
    { keyword: 'javascript frameworks', volume: 12500, difficulty: 80, relevance: 72, suggested: false }
  ]);

  const updateConfig = (key: string, value: any) => {
    setKeywordConfig(prev => ({ ...prev, [key]: value }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !targetKeywords.includes(newKeyword.trim())) {
      setTargetKeywords(prev => [...prev, newKeyword.trim()]);
      setNewKeyword('');
      analyzeKeywords();
    }
  };

  const removeKeyword = (keyword: string) => {
    setTargetKeywords(prev => prev.filter(k => k !== keyword));
    analyzeKeywords();
  };

  const analyzeKeywords = () => {
    // Simulate keyword analysis
    const words = content.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    const analysis = targetKeywords.map(keyword => {
      const keywordLower = keyword.toLowerCase();
      const count = words.filter(word => word.includes(keywordLower)).length;
      const density = (count / totalWords) * 100;
      
      return {
        keyword,
        density: parseFloat(density.toFixed(2)),
        count,
        recommended: density >= 0.5 && density <= 3,
        competition: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
        volume: Math.floor(Math.random() * 10000) + 500
      };
    });
    
    setKeywordAnalysis(analysis);
  };

  const getDensityColor = (density: number) => {
    if (density >= 2 && density <= 3) return 'text-green-600';
    if (density >= 1 && density <= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 80) return 'text-green-600';
    if (relevance >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isActive) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏷️ Keyword Tagging Plugin
            <Badge variant="secondary">Inactive</Badge>
          </CardTitle>
          <CardDescription>
            Analyze and optimize keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🏷️</div>
            <p>Plugin is inactive. Enable it to access keyword tools.</p>
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
            🏷️ Keyword Tagging Plugin
            <Badge variant="default">Active</Badge>
          </CardTitle>
          <CardDescription>
            Analyze content density and optimize keywords for better SEO
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Keyword Configuration</CardTitle>
          <CardDescription>Configure keyword analysis settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enableAnalysis"
                checked={keywordConfig.enableAnalysis}
                onCheckedChange={(checked) => updateConfig('enableAnalysis', checked)}
              />
              <Label htmlFor="enableAnalysis">Enable Analysis</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableSuggestions"
                checked={keywordConfig.enableSuggestions}
                onCheckedChange={(checked) => updateConfig('enableSuggestions', checked)}
              />
              <Label htmlFor="enableSuggestions">Enable Suggestions</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableDensityCheck"
                checked={keywordConfig.enableDensityCheck}
                onCheckedChange={(checked) => updateConfig('enableDensityCheck', checked)}
              />
              <Label htmlFor="enableDensityCheck">Density Check</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enableCompetitorAnalysis"
                checked={keywordConfig.enableCompetitorAnalysis}
                onCheckedChange={(checked) => updateConfig('enableCompetitorAnalysis', checked)}
              />
              <Label htmlFor="enableCompetitorAnalysis">Competitor Analysis</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoGenerateTags"
                checked={keywordConfig.autoGenerateTags}
                onCheckedChange={(checked) => updateConfig('autoGenerateTags', checked)}
              />
              <Label htmlFor="autoGenerateTags">Auto Generate Tags</Label>
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="targetDensity">Target Density (%)</Label>
            <Input
              id="targetDensity"
              type="number"
              min="0.5"
              max="5"
              step="0.1"
              value={keywordConfig.targetDensity}
              onChange={(e) => updateConfig('targetDensity', parseFloat(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Content Analysis</CardTitle>
          <CardDescription>Analyze your content for keyword optimization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="content">Content to Analyze</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your content here for keyword analysis..."
              rows={8}
            />
          </div>

          <Button onClick={analyzeKeywords} className="w-full">
            Analyze Keywords
          </Button>
        </CardContent>
      </Card>

      {/* Target Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Target Keywords</CardTitle>
          <CardDescription>Manage your target keywords</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add new keyword"
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            />
            <Button onClick={addKeyword}>Add</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {targetKeywords.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2">
                {keyword}
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="text-xs hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>

          <div className="text-sm text-gray-600">
            Total keywords: {targetKeywords.length}
          </div>
        </CardContent>
      </Card>

      {/* Keyword Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Keyword Analysis Results</CardTitle>
          <CardDescription>Detailed analysis of your keywords</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Keyword</th>
                  <th className="text-left p-2">Density</th>
                  <th className="text-left p-2">Count</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Competition</th>
                  <th className="text-left p-2">Volume</th>
                </tr>
              </thead>
              <tbody>
                {keywordAnalysis.map((analysis, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{analysis.keyword}</td>
                    <td className={`p-2 ${getDensityColor(analysis.density)}`}>
                      {analysis.density}%
                    </td>
                    <td className="p-2">{analysis.count}</td>
                    <td className="p-2">
                      <Badge variant={analysis.recommended ? "default" : "secondary"}>
                        {analysis.recommended ? "Good" : "Adjust"}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge className={getCompetitionColor(analysis.competition)}>
                        {analysis.competition}
                      </Badge>
                    </td>
                    <td className="p-2">{analysis.volume.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Keyword Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Keyword Suggestions</CardTitle>
          <CardDescription>AI-powered keyword suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keywordSuggestions.map((suggestion, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{suggestion.keyword}</h4>
                  <Badge variant={suggestion.suggested ? "default" : "secondary"}>
                    {suggestion.suggested ? "Suggested" : "Optional"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Volume:</span>
                    <span className="font-medium">{suggestion.volume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Difficulty:</span>
                    <span className={`font-medium ${getRelevanceColor(100 - suggestion.difficulty)}`}>
                      {suggestion.difficulty}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Relevance:</span>
                    <span className={`font-medium ${getRelevanceColor(suggestion.relevance)}`}>
                      {suggestion.relevance}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <Progress value={suggestion.relevance} className="h-2" />
                  <div className="text-xs text-gray-600">Relevance Score</div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => {
                    if (!targetKeywords.includes(suggestion.keyword)) {
                      setTargetKeywords(prev => [...prev, suggestion.keyword]);
                      analyzeKeywords();
                    }
                  }}
                >
                  Add to Keywords
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SEO Score */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 SEO Score</CardTitle>
          <CardDescription>Overall SEO optimization score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">87</div>
              <div className="text-lg font-medium">Excellent SEO Score</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">6</div>
                <div className="text-sm text-gray-600">Target Keywords</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">4</div>
                <div className="text-sm text-gray-600">Optimal Keywords</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">2.3%</div>
                <div className="text-sm text-gray-600">Avg Density</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">Low</div>
                <div className="text-sm text-gray-600">Competition</div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                ✅ Optimization Tips
              </h4>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Keyword density is optimal for most target keywords</li>
                <li>• Consider adding more long-tail keywords</li>
                <li>• Content length is good for SEO optimization</li>
                <li>• Keyword competition is manageable</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}