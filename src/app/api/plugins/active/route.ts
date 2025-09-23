import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo purposes
// In production, you would use a database
let activePlugins = [
  {
    name: 'seo-tools',
    config: {
      name: 'seo-tools',
      description: 'SEO Tools Plugin',
      version: '1.0.0',
      isActive: true,
      settings: {
        title: 'My Awesome Website',
        description: 'A modern website with amazing features',
        keywords: 'awesome, website, modern, features',
        enableStructuredData: true
      }
    }
  }
];

export async function GET() {
  try {
    return NextResponse.json(activePlugins);
  } catch (error) {
    console.error('Error fetching active plugins:', error);
    return NextResponse.json({ error: 'Failed to fetch active plugins' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, isActive, config } = body;

    // Find existing plugin
    const existingIndex = activePlugins.findIndex(p => p.name === name);
    
    if (existingIndex !== -1) {
      // Update existing plugin
      activePlugins[existingIndex] = {
        ...activePlugins[existingIndex],
        isActive: isActive !== undefined ? isActive : activePlugins[existingIndex].isActive,
        config: config || activePlugins[existingIndex].config
      };
    } else {
      // Add new plugin
      activePlugins.push({
        name,
        config: config || {
          name,
          description: '',
          version: '1.0.0',
          isActive: true,
          settings: {}
        }
      });
    }

    return NextResponse.json({ success: true, plugins: activePlugins });
  } catch (error) {
    console.error('Error updating active plugins:', error);
    return NextResponse.json({ error: 'Failed to update active plugins' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Plugin name is required' }, { status: 400 });
    }

    activePlugins = activePlugins.filter(p => p.name !== name);
    
    return NextResponse.json({ success: true, plugins: activePlugins });
  } catch (error) {
    console.error('Error deleting plugin:', error);
    return NextResponse.json({ error: 'Failed to delete plugin' }, { status: 500 });
  }
}