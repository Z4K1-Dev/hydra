import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Plugin configuration interface
interface PluginConfig {
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  settings?: Record<string, any>;
}

// Default plugin configurations
const defaultPlugins: PluginConfig[] = [
  {
    name: 'google-analytics',
    description: 'Google Analytics integration for website tracking',
    version: '1.0.0',
    isActive: false,
    settings: {
      trackingId: '',
      anonymizeIp: true,
      enableDemographics: false
    }
  },
  {
    name: 'seo-tools',
    description: 'SEO tools for meta tags and structured data',
    version: '1.0.0',
    isActive: true,
    settings: {
      title: '',
      description: '',
      keywords: '',
      author: '',
      ogImage: '',
      twitterCard: 'summary'
    }
  },
  {
    name: 'sitemap-generator',
    description: 'Automatic sitemap generation for SEO',
    version: '1.0.0',
    isActive: true,
    settings: {
      baseUrl: '',
      autoGenerate: true,
      includeImages: true,
      defaultChangefreq: 'weekly',
      defaultPriority: 0.8
    }
  },
  {
    name: 'rich-snippet',
    description: 'Rich snippet and structured data generation',
    version: '1.0.0',
    isActive: true,
    settings: {
      enableArticle: true,
      enableProduct: true,
      enableLocalBusiness: true,
      enableOrganization: true,
      defaultOrganization: {}
    }
  },
  {
    name: 'google-local',
    description: 'Google Local Business integration',
    version: '1.0.0',
    isActive: false,
    settings: {
      placeId: '',
      apiKey: '',
      enableReviews: true,
      enableDirections: true,
      enablePhotos: true,
      mapContainerId: 'google-map'
    }
  },
  {
    name: 'keyword-tagging',
    description: 'Keyword analysis and tagging system',
    version: '1.0.0',
    isActive: true,
    settings: {
      primaryKeywords: [],
      secondaryKeywords: [],
      autoTag: true,
      densityThreshold: 0.5,
      maxKeywords: 10,
      enableMetaKeywords: true,
      enableContentAnalysis: true
    }
  }
];

// GET /api/plugins - Get all plugins
export async function GET(request: NextRequest) {
  try {
    // Fetch plugins from database
    const plugins = await db.plugin.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If no plugins in database, initialize with default plugins
    if (plugins.length === 0) {
      const initializedPlugins = await initializeDefaultPlugins();
      return NextResponse.json(initializedPlugins);
    }

    // Transform database plugins to frontend format
    const formattedPlugins = plugins.map(plugin => ({
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      isActive: plugin.isActive,
      settings: plugin.settings ? JSON.parse(plugin.settings) : {}
    }));

    return NextResponse.json(formattedPlugins);
  } catch (error) {
    console.error('Error fetching plugins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plugins' },
      { status: 500 }
    );
  }
}

// POST /api/plugins - Update plugin configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, isActive, settings } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Plugin name is required' },
        { status: 400 }
      );
    }

    // Check if plugin exists in database
    const existingPlugin = await db.plugin.findUnique({
      where: { name }
    });

    if (!existingPlugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    // Update plugin in database
    const updatedPlugin = await db.plugin.update({
      where: { name },
      data: {
        isActive: isActive !== undefined ? isActive : existingPlugin.isActive,
        settings: settings ? JSON.stringify(settings) : existingPlugin.settings,
        updatedAt: new Date()
      }
    });

    // Transform to frontend format
    const formattedPlugin = {
      name: updatedPlugin.name,
      description: updatedPlugin.description,
      version: updatedPlugin.version,
      isActive: updatedPlugin.isActive,
      settings: updatedPlugin.settings ? JSON.parse(updatedPlugin.settings) : {}
    };

    return NextResponse.json(formattedPlugin);
  } catch (error) {
    console.error('Error updating plugin:', error);
    return NextResponse.json(
      { error: 'Failed to update plugin' },
      { status: 500 }
    );
  }
}