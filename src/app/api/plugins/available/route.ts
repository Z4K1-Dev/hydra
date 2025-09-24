import { NextResponse } from 'next/server';

// Available plugins configuration
const availablePlugins = [
  {
    name: 'google-analytics',
    displayName: 'Google Analytics',
    description: 'Track website analytics and user behavior with Google Analytics',
    version: '1.0.0',
    category: 'Analytics',
    icon: '📊',
    settings: {
      trackingId: {
        type: 'string',
        label: 'Tracking ID',
        required: true,
        description: 'Your Google Analytics tracking ID (e.g., UA-XXXXXXXXX-X)'
      },
      anonymizeIp: {
        type: 'boolean',
        label: 'Anonymize IP',
        required: false,
        default: true,
        description: 'Enable IP anonymization'
      },
      enableDemographics: {
        type: 'boolean',
        label: 'Enable Demographics',
        required: false,
        default: false,
        description: 'Enable demographics and interests reports'
      }
    }
  },
  {
    name: 'seo-tools',
    displayName: 'SEO Tools',
    description: 'Optimize your website for search engines with meta tags and structured data',
    version: '1.0.0',
    category: 'SEO',
    icon: '🔍',
    settings: {
      title: {
        type: 'string',
        label: 'Default Title',
        required: false,
        default: '',
        description: 'Default meta title for pages'
      },
      description: {
        type: 'string',
        label: 'Default Description',
        required: false,
        default: '',
        description: 'Default meta description for pages'
      },
      keywords: {
        type: 'string',
        label: 'Default Keywords',
        required: false,
        default: '',
        description: 'Default meta keywords (comma-separated)'
      },
      author: {
        type: 'string',
        label: 'Author',
        required: false,
        default: '',
        description: 'Default author meta tag'
      },
      enableStructuredData: {
        type: 'boolean',
        label: 'Enable Structured Data',
        required: false,
        default: true,
        description: 'Enable structured data generation'
      }
    }
  },
  {
    name: 'sitemap-generator',
    displayName: 'Sitemap Generator',
    description: 'Automatically generate XML sitemaps for better search engine indexing',
    version: '1.0.0',
    category: 'SEO',
    icon: '🗺️',
    settings: {
      baseUrl: {
        type: 'string',
        label: 'Base URL',
        required: true,
        description: 'Your website base URL (e.g., https://example.com)'
      },
      autoGenerate: {
        type: 'boolean',
        label: 'Auto Generate',
        required: false,
        default: true,
        description: 'Automatically generate sitemap on page changes'
      },
      includeImages: {
        type: 'boolean',
        label: 'Include Images',
        required: false,
        default: true,
        description: 'Include image URLs in sitemap'
      },
      defaultChangefreq: {
        type: 'string',
        label: 'Default Change Frequency',
        required: false,
        default: 'weekly',
        description: 'Default change frequency for pages'
      },
      defaultPriority: {
        type: 'number',
        label: 'Default Priority',
        required: false,
        default: 0.8,
        description: 'Default priority for pages (0.0 to 1.0)'
      }
    }
  },
  {
    name: 'rich-snippet',
    displayName: 'Rich Snippet',
    description: 'Generate structured data for rich snippets in search results',
    version: '1.0.0',
    category: 'SEO',
    icon: '💎',
    settings: {
      enableArticle: {
        type: 'boolean',
        label: 'Enable Article Snippets',
        required: false,
        default: true,
        description: 'Enable structured data for articles'
      },
      enableProduct: {
        type: 'boolean',
        label: 'Enable Product Snippets',
        required: false,
        default: true,
        description: 'Enable structured data for products'
      },
      enableLocalBusiness: {
        type: 'boolean',
        label: 'Enable Local Business Snippets',
        required: false,
        default: true,
        description: 'Enable structured data for local businesses'
      },
      enableOrganization: {
        type: 'boolean',
        label: 'Enable Organization Snippets',
        required: false,
        default: true,
        description: 'Enable structured data for organizations'
      },
      autoDetectContent: {
        type: 'boolean',
        label: 'Auto-detect Content',
        required: false,
        default: true,
        description: 'Automatically detect content type and generate structured data'
      }
    }
  },
  {
    name: 'google-local',
    displayName: 'Google Local',
    description: 'Integrate Google Maps, Places, and local business features',
    version: '1.0.0',
    category: 'Local',
    icon: '📍',
    settings: {
      placeId: {
        type: 'string',
        label: 'Google Place ID',
        required: false,
        description: 'Your Google Place ID (e.g., ChIJrTLr-GyuEmsRBfyf1GD_B6wQ)'
      },
      apiKey: {
        type: 'string',
        label: 'Google Maps API Key',
        required: false,
        description: 'Google Maps JavaScript API key'
      },
      businessData: {
        type: 'object',
        label: 'Business Data',
        required: false,
        default: {},
        description: 'Your business information'
      },
      enableMaps: {
        type: 'boolean',
        label: 'Enable Maps',
        required: false,
        default: true,
        description: 'Enable Google Maps integration'
      },
      enableReviews: {
        type: 'boolean',
        label: 'Enable Reviews',
        required: false,
        default: true,
        description: 'Enable Google Reviews integration'
      }
    }
  },
  {
    name: 'keyword-tagging',
    displayName: 'Keyword Tagging',
    description: 'Automatically analyze and tag content with relevant keywords',
    version: '1.0.0',
    category: 'SEO',
    icon: '🏷️',
    settings: {
      autoTag: {
        type: 'boolean',
        label: 'Auto Tag Content',
        required: false,
        default: true,
        description: 'Automatically tag content with keywords'
      },
      densityAnalysis: {
        type: 'boolean',
        label: 'Density Analysis',
        required: false,
        default: true,
        description: 'Analyze keyword density in content'
      },
      readabilityAnalysis: {
        type: 'boolean',
        label: 'Readability Analysis',
        required: false,
        default: true,
        description: 'Analyze content readability'
      },
      sentimentAnalysis: {
        type: 'boolean',
        label: 'Sentiment Analysis',
        required: false,
        default: false,
        description: 'Analyze sentiment of keywords'
      },
      minKeywordLength: {
        type: 'number',
        label: 'Min Keyword Length',
        required: false,
        default: 3,
        description: 'Minimum length for keywords'
      },
      maxKeywordLength: {
        type: 'number',
        label: 'Max Keyword Length',
        required: false,
        default: 50,
        description: 'Maximum length for keywords'
      }
    }
  }
];

export async function GET() {
  try {
    return NextResponse.json(availablePlugins);
  } catch (error) {
    console.error('Error fetching available plugins:', error);
    return NextResponse.json({ error: 'Failed to fetch available plugins' }, { status: 500 });
  }
}