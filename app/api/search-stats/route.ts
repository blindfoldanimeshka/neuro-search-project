import { NextRequest, NextResponse } from 'next/server';
import { searchIndexManager } from '../../lib/search-index';

export async function GET(request: NextRequest) {
  try {
    const stats = searchIndexManager.getIndexStats();
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Search Stats API Error:', error);
    
    return NextResponse.json(
      { error: 'Ошибка при получении статистики поиска' },
      { status: 500 }
    );
  }
} 