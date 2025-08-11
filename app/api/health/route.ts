import { NextRequest, NextResponse } from 'next/server';
import { getHealthStatus } from '@/lib/startup-checks';

export async function GET(request: NextRequest) {
  try {
    const health = await getHealthStatus();
    
    // Определяем HTTP статус на основе health status
    const httpStatus = health.status === 'ok' ? 200 : 
                      health.status === 'degraded' ? 503 : 500;
    
    return NextResponse.json(health, { status: httpStatus });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to check system health'
    }, { status: 500 });
  }
}