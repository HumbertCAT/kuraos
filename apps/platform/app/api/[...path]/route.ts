import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://kura-backend-1045114177864.europe-west1.run.app';

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'GET');
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'POST');
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'PUT');
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'PATCH');
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path, 'DELETE');
}

async function proxyRequest(request: NextRequest, pathSegments: string[], method: string) {
  const path = pathSegments.join('/');
  const url = `${BACKEND_URL}/api/v1/${path}`;
  
  // Forward headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Forward cookies from the request
  const cookies = request.headers.get('cookie');
  if (cookies) {
    headers['Cookie'] = cookies;
  }

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // Add body for non-GET requests
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const body = await request.text();
      if (body) {
        fetchOptions.body = body;
      }
    } catch {
      // No body
    }
  }

  try {
    const response = await fetch(url, fetchOptions);
    
    // Get response body
    const data = await response.text();
    
    // Create response with same status
    const proxyResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
    });

    // Forward important headers
    proxyResponse.headers.set('Content-Type', response.headers.get('Content-Type') || 'application/json');
    
    // Forward Set-Cookie headers (transform for same-origin)
    const setCookie = response.headers.get('Set-Cookie');
    if (setCookie) {
      // Transform the cookie for same-origin use:
      // - Change SameSite=none to SameSite=lax (same-origin doesn't need none)
      // - Keep Secure if on HTTPS
      const transformedCookie = setCookie
        .replace(/SameSite=none/gi, 'SameSite=lax')
        .replace(/; Secure/gi, ''); // Remove Secure for same-origin
      proxyResponse.headers.set('Set-Cookie', transformedCookie);
    }

    return proxyResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
