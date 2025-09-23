import { NextRequest, NextResponse } from 'next/server';

// GET /api/plugins/[name] - Get specific plugin
// PUT /api/plugins/[name] - Update specific plugin
// DELETE /api/plugins/[name] - Delete specific plugin

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;

    // Mock plugin data - in real app, fetch from database
    const plugin = getMockPlugin(name);
    
    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(plugin);
  } catch (error) {
    console.error('Error fetching plugin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plugin' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;
    const body = await request.json();
    const { isActive, settings } = body;

    // In a real app, update in database
    // For now, return success response
    
    return NextResponse.json({
      success: true,
      message: `Plugin ${name} updated successfully`,
      plugin: {
        name,
        isActive,
        settings
      }
    });
  } catch (error) {
    console.error('Error updating plugin:', error);
    return NextResponse.json(
      { error: 'Failed to update plugin' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { name } = params;

    // In a real app, delete from database
    // For now, return success response
    
    return NextResponse.json({
      success: true,
      message: `Plugin ${name} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting plugin:', error);
    return NextResponse.json(
      { error: 'Failed to delete plugin' },
      { status: 500 }
    );
  }
}

// Helper function to get mock plugin data
function getMockPlugin(name: string) {
  const plugins: Record<string, any> = {
    'google-analytics': {
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
    'seo-tools': {
      name: 'seo-tools',
      description: 'SEO tools for meta tags and structured data',
      version: '1.0.0',
      isActive: true,
      settings: {
        title: 'My Website',
        description: 'A modern website with SEO optimization',
        keywords: 'website, seo, optimization',
        author: 'Website Author',
        ogImage: '',
        twitterCard: 'summary'
      }
    },
    'sitemap-generator': {
      name: 'sitemap-generator',
      description: 'Automatic sitemap generation for SEO',
      version: '1.0.0',
      isActive: true,
      settings: {
        baseUrl: 'https://example.com',
        autoGenerate: true,
        includeImages: true,
        defaultChangefreq: 'weekly',
        defaultPriority: 0.8
      }
    },
    'rich-snippet': {
      name: 'rich-snippet',
      description: 'Rich snippet and structured data generation',
      version: '1.0.0',
      isActive: true,
      settings: {
        enableArticle: true,
        enableProduct: true,
        enableLocalBusiness: true,
        enableOrganization: true,
        defaultOrganization: {
          name: 'My Organization',
          url: 'https://example.com',
          logo: 'https://example.com/logo.png'
        }
      }
    },
    'google-local': {
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
    'keyword-tagging': {
      name: 'keyword-tagging',
      description: 'Keyword analysis and tagging system',
      version: '1.0.0',
      isActive: true,
      settings: {
        primaryKeywords: ['website', 'seo'],
        secondaryKeywords: ['optimization', 'content'],
        autoTag: true,
        densityThreshold: 0.5,
        maxKeywords: 10,
        enableMetaKeywords: true,
        enableContentAnalysis: true
      }
    }
  };

  return plugins[name];
}