import { NextRequest, NextResponse } from 'next/server';
import { webScraper, ScrapingOptions } from '@/lib/web-scraper';
import { searchIndexManager } from '@/lib/search-index';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sources, options, saveToIndex = true } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Валидация источников
    const validSources = ['wildberries', 'ozon', 'avito', 'yandex', 'sbermegamarket', 'all'];
    const sourcesToScrape = sources && Array.isArray(sources) 
      ? sources.filter(s => validSources.includes(s))
      : ['all'];

    // Валидация опций
    const scrapingOptions: ScrapingOptions = {
      maxProducts: Math.min(options?.maxProducts || 20, 100), // Максимум 100 товаров
      timeout: Math.min(options?.timeout || 30000, 120000), // Максимум 2 минуты
      headless: options?.headless ?? true,
      userAgent: options?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    console.log(`Starting scraping for query: "${query}" from sources:`, sourcesToScrape);

    // Выполняем скрапинг
    const results = await webScraper.scrapeProducts(query, sourcesToScrape, scrapingOptions);

    // Подсчитываем общую статистику
    const totalProducts = results.reduce((sum, result) => sum + result.totalFound, 0);
    const successfulSources = results.filter(r => r.success).length;
    const failedSources = results.filter(r => !r.success).length;

    // Собираем все товары
    const allProducts = results.flatMap(result => result.products);

    // Сохраняем в индекс, если требуется
    let indexResult = null;
    if (saveToIndex && allProducts.length > 0) {
      indexResult = await searchIndexManager.addProductsToIndex(allProducts);
    }

    // Формируем ответ
    const response = {
      success: true,
      query,
      results: {
        totalProducts,
        successfulSources,
        failedSources,
        sources: results.map(result => ({
          source: result.source,
          productsCount: result.totalFound,
          success: result.success,
          executionTime: result.executionTime,
          error: result.error
        }))
      },
      products: allProducts,
      index: indexResult ? {
        added: indexResult.added,
        totalInIndex: indexResult.total
      } : null,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Scraping API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during scraping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Поиск в существующем индексе
    const products = await searchIndexManager.searchInIndex(query, {
      source: source || undefined
    });

    const limitedProducts = products.slice(0, limit);

    return NextResponse.json({
      success: true,
      query,
      source: source || 'all',
      products: limitedProducts,
      total: products.length,
      returned: limitedProducts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scraping GET API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Метод для получения статуса скрапера
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          status: 'active',
          timestamp: new Date().toISOString()
        });

      case 'health':
        const health = searchIndexManager.checkIndexHealth();
        return NextResponse.json({
          success: true,
          health,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "status" or "health"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Scraping PUT API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 