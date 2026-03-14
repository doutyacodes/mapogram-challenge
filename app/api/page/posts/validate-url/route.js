// 5. Additional utility API - /api/posts/validate-url/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { message: 'URL is required' },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(url);
      
      // Optional: Check if URL is accessible
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 5000 
      });
      
      return NextResponse.json({ 
        valid: response.ok,
        status: response.status 
      });
    } catch (error) {
      return NextResponse.json({ 
        valid: false,
        error: 'Invalid URL format' 
      });
    }
  } catch (error) {
    console.error('Error validating URL:', error);
    return NextResponse.json(
      { message: 'Failed to validate URL' },
      { status: 500 }
    );
  }
}