import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test database connection and plugin data
    const testResponse = {
      message: 'Debug endpoint working',
      timestamp: new Date().toISOString(),
      pluginsEndpoint: '/api/plugins',
      test: 'This is a test response'
    };
    
    return NextResponse.json(testResponse);
  } catch (error) {
    return NextResponse.json(
      { error: 'Debug endpoint failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}