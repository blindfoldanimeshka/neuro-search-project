import { NextRequest, NextResponse } from 'next/server';
import { createEnhancedScraper } from '@/lib/enhanced-web-scraper';
import { advancedSearchIndex } from '@/lib/advanced-search-index';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sources, maxPages, autoIndex = true } = body;

    // Валидация запроса
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    if (sources && (!Array.isArray(sources) || sources.some(s => typeof s !== 'string'))) {
      return NextResponse.json(
        { error: 'Sources must be an array of strings' },
        { status: 400 }
      );
    }

    if (maxPages && (typeof maxPages !== 'number' || maxPages < 1 || maxPages > 10)) {
      return NextResponse.json(
        { error: 'MaxPages must be a number between 1 and 10' },
        { status: 400 }
      );
    }

    // Создаем экземпляр скрапера
    const scraper = createEnhancedScraper();
    
    // Получаем доступные источники, если не указаны
    const availableSources = sources || ['wildberries', 'ozon', 'yandex'];
    const pages = maxPages || 3;

    console.log(`Starting enhanced scraping for query: "${query}" from sources: ${availableSources.join(', ')}`);

        // Выполняем скрапинг
    const scrapingResult = await scraper.scrapeBatch(
      availableSources.map((source: string) => `https://${source}.com/search?q=${encodeURIComponent(query)}`), 
      { maxConcurrent: 2, requestDelay: 1000 }
    );

    // Автоматически индексируем результаты, если требуется
    if (autoIndex && scrapingResult.results.length > 0) {
      try {
        const firstResult = scrapingResult.results[0];
        if (firstResult.products.length > 0) {
          await advancedSearchIndex.addProduct(firstResult.products[0]); // Добавляем первый продукт для демонстрации
          console.log('Product auto-indexed successfully');
        }
      } catch (indexError) {
        console.error('Auto-indexing error:', indexError);
        // Не прерываем выполнение, если индексация не удалась
      }
    }

    // Формируем ответ
    const response = {
      ...scrapingResult,
      query,
      sources: availableSources,
      maxPages: pages,
      autoIndexed: autoIndex,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Enhanced scraping error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during enhanced scraping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const sources = searchParams.get('sources')?.split(',');
    const maxPages = searchParams.get('maxPages');
    const autoIndex = searchParams.get('autoIndex') !== 'false';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter (q) is required' },
        { status: 400 }
      );
    }

    const pages = maxPages ? parseInt(maxPages) : 3;
    const availableSources = sources || ['wildberries', 'ozon', 'yandex'];

    console.log(`Starting enhanced scraping via GET for query: "${query}"`);

    const scraper = createEnhancedScraper();
    const scrapingResult = await scraper.scrapeBatch(
      availableSources.map((source: string) => `https://${source}.com/search?q=${encodeURIComponent(query)}`),
      { maxConcurrent: 2, requestDelay: 1000 }
    );

    // Автоматически индексируем результаты
    if (autoIndex && scrapingResult.results.length > 0) {
      try {
        const firstResult = scrapingResult.results[0];
        if (firstResult.products.length > 0) {
          await advancedSearchIndex.addProduct(firstResult.products[0]);
          console.log('Product auto-indexed successfully via GET');
        }
      } catch (indexError) {
        console.error('Auto-indexing error via GET:', indexError);
      }
    }

    const response = {
      ...scrapingResult,
      query,
      sources: availableSources,
      maxPages: pages,
      autoIndexed: autoIndex,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Enhanced scraping GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error during enhanced scraping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
