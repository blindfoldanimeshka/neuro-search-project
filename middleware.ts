import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log environment variable loading for debugging
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log('Environment check:', {
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      hasLMStudioUrl: !!process.env.LMSTUDIO_BASE_URL,
      nodeEnv: process.env.NODE_ENV
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};