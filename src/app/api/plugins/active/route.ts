import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface PluginConfig {
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  settings?: Record<string, any>;
}

interface ActivePlugin {
  name: string;
  config: PluginConfig;
}

// Enhanced error handling with retry logic
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Validation helper
const validatePluginConfig = (config: any): config is PluginConfig => {
  return (
    config &&
    typeof config.name === 'string' &&
    config.name.trim().length > 0 &&
    typeof config.description === 'string' &&
    typeof config.version === 'string' &&
    typeof config.isActive === 'boolean'
  );
};

// Enhanced GET with database integration and error handling
export async function GET() {
  try {
    return await withRetry(async () => {
      const plugins = await db.plugin.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      const activePlugins: ActivePlugin[] = plugins.map(plugin => ({
        name: plugin.name,
        config: {
          name: plugin.name,
          description: plugin.description,
          version: plugin.version,
          isActive: plugin.isActive,
          settings: plugin.settings ? JSON.parse(plugin.settings) : {}
        }
      }));

      return NextResponse.json(activePlugins);
    });
  } catch (error) {
    console.error('Error fetching active plugins:', error);
    
    // Fallback to default plugins if database fails
    const fallbackPlugins: ActivePlugin[] = [
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

    return NextResponse.json(fallbackPlugins, {
      status: 200,
      headers: {
        'X-Content-Fallback': 'true',
        'X-Error': encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')
      }
    });
  }
}

// Enhanced POST with validation and error handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, isActive, config } = body;

    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Plugin name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (config && !validatePluginConfig(config)) {
      return NextResponse.json(
        { error: 'Invalid plugin configuration' },
        { status: 400 }
      );
    }

    return await withRetry(async () => {
      // Check if plugin exists in database
      const existingPlugin = await db.plugin.findUnique({
        where: { name: name.trim() }
      });

      if (existingPlugin) {
        // Update existing plugin
        const updatedPlugin = await db.plugin.update({
          where: { name: name.trim() },
          data: {
            isActive: isActive !== undefined ? isActive : existingPlugin.isActive,
            settings: config ? JSON.stringify(config.settings || {}) : existingPlugin.settings,
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          plugin: {
            name: updatedPlugin.name,
            config: {
              name: updatedPlugin.name,
              description: updatedPlugin.description,
              version: updatedPlugin.version,
              isActive: updatedPlugin.isActive,
              settings: updatedPlugin.settings ? JSON.parse(updatedPlugin.settings) : {}
            }
          }
        });
      } else {
        // Create new plugin if it doesn't exist
        const newPlugin = await db.plugin.create({
          data: {
            name: name.trim(),
            description: config?.description || '',
            version: config?.version || '1.0.0',
            isActive: isActive !== undefined ? isActive : true,
            settings: JSON.stringify(config?.settings || {})
          }
        });

        return NextResponse.json({
          success: true,
          plugin: {
            name: newPlugin.name,
            config: {
              name: newPlugin.name,
              description: newPlugin.description,
              version: newPlugin.version,
              isActive: newPlugin.isActive,
              settings: newPlugin.settings ? JSON.parse(newPlugin.settings) : {}
            }
          }
        });
      }
    });
  } catch (error) {
    console.error('Error updating active plugins:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to update active plugins',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Enhanced DELETE with validation and error handling
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Plugin name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    return await withRetry(async () => {
      // Check if plugin exists
      const existingPlugin = await db.plugin.findUnique({
        where: { name: name.trim() }
      });

      if (!existingPlugin) {
        return NextResponse.json(
          { error: `Plugin '${name}' not found` },
          { status: 404 }
        );
      }

      // Deactivate plugin instead of deleting (soft delete)
      const deactivatedPlugin = await db.plugin.update({
        where: { name: name.trim() },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        plugin: {
          name: deactivatedPlugin.name,
          config: {
            name: deactivatedPlugin.name,
            description: deactivatedPlugin.description,
            version: deactivatedPlugin.version,
            isActive: deactivatedPlugin.isActive,
            settings: deactivatedPlugin.settings ? JSON.parse(deactivatedPlugin.settings) : {}
          }
        }
      });
    });
  } catch (error) {
    console.error('Error deactivating plugin:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to deactivate plugin',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}