'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface GoogleAnalyticsDemoProps {
  isActive: boolean;
}

// Mock analytics data
const mockAnalyticsData = {
  visitors: 1234,
  pageViews: 5678,
  sessions: 890,
  bounceRate: 45.2,
  avgSessionDuration: '2:45',
  topPages: [
    { path: '/', views: 1234, percentage: 35 },
    { path: '/blog', views: 890, percentage: 25 },
    { path: '/products', views: 678, percentage: 19 },
    { path: '/about', views: 456, percentage: 13 },
    { path: '/contact', views: 234, percentage: 8 }
  ],
  realTimeData: {
    currentVisitors: 42,
    pageViewsLast30min: 156,
    topCountries: [
      { country: 'Indonesia', visitors: 15 },
      { country: 'United States', visitors: 12 },
      { country: 'Singapore', visitors: 8 },
      { country: 'Malaysia', visitors: 7 }
    ]
  }
};

export function GoogleAnalyticsDemo({ isActive }: GoogleAnalyticsDemoProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [lastEvent, setLastEvent] = useState<string>('');

  useEffect(() => {
    if (isActive) {
      setIsTracking(true);
      setLastEvent('Plugin loaded successfully');
    } else {
      setIsTracking(false);
      setLastEvent('Plugin deactivated');
    }
  }, [isActive]);

  const trackEvent = (eventName: string) => {
    if (!isActive) return;
    setLastEvent(`Event tracked: ${eventName}`);
  };

  if (!isActive) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Google Analytics Plugin
            <Badge variant="secondary">Inactive</Badge>
          </CardTitle>
          <CardDescription>
            Track website analytics and user behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📴</div>
            <p>Plugin is inactive. Enable it to see analytics data.</p>
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
            📊 Google Analytics Plugin
            <Badge variant="default">Active</Badge>
          </CardTitle>
          <CardDescription>
            Real-time analytics dashboard (Demo Mode)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Last event: {lastEvent}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visitors</p>
                <p className="text-2xl font-bold text-blue-600">
                  {mockAnalyticsData.visitors.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">+12% from last week</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockAnalyticsData.pageViews.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">+8% from last week</p>
              </div>
              <div className="text-3xl">📄</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sessions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {mockAnalyticsData.sessions.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">+15% from last week</p>
              </div>
              <div className="text-3xl">⏱️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {mockAnalyticsData.bounceRate}%
                </p>
                <p className="text-xs text-red-600">-3% from last week</p>
              </div>
              <div className="text-3xl">📉</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top Pages</CardTitle>
          <CardDescription>Most visited pages on your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAnalyticsData.topPages.map((page, index) => (
              <div key={page.path} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-300">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{page.path}</div>
                    <div className="text-sm text-gray-600">{page.views} views</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{page.percentage}%</div>
                  <div className="text-sm text-gray-600">of total</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>⚡ Real-time Activity</CardTitle>
            <CardDescription>Current user activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Current Visitors</span>
                <span className="font-bold text-green-600">
                  {mockAnalyticsData.realTimeData.currentVisitors}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Page Views (30 min)</span>
                <span className="font-bold text-blue-600">
                  {mockAnalyticsData.realTimeData.pageViewsLast30min}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Avg. Session Duration</span>
                <span className="font-bold text-purple-600">
                  {mockAnalyticsData.avgSessionDuration}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🌍 Top Countries</CardTitle>
            <CardDescription>Visitor geographic distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAnalyticsData.realTimeData.topCountries.map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                    <span>{country.country}</span>
                  </div>
                  <span className="font-medium">{country.visitors}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Tracking Demo */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Event Tracking Demo</CardTitle>
          <CardDescription>Test event tracking functionality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              onClick={() => trackEvent('button_click')}
              className="h-20 flex flex-col gap-2"
            >
              <span>🖱️</span>
              <span className="text-xs">Button Click</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => trackEvent('form_submission')}
              className="h-20 flex flex-col gap-2"
            >
              <span>📝</span>
              <span className="text-xs">Form Submit</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => trackEvent('page_view')}
              className="h-20 flex flex-col gap-2"
            >
              <span>👁️</span>
              <span className="text-xs">Page View</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => trackEvent('purchase')}
              className="h-20 flex flex-col gap-2"
            >
              <span>💰</span>
              <span className="text-xs">Purchase</span>
            </Button>
          </div>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-medium mb-1">Event Tracking Status:</div>
            <div className="text-sm text-gray-600">
              {lastEvent || 'No events tracked yet'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}