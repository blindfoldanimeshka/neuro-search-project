import { NextRequest, NextResponse } from 'next/server';
import { webScraper } from '@/lib/web-scraper';
import { searchIndexManager, SearchFilters } from '@/lib/search-index';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      sources = ['all'], 
      useIndex = true, 
      scrapeNew = true,
      filters = {},
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      maxProductsPerSource = 10,
      includeStats = true
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const results: any = {
      query,
      timestamp: new Date().toISOString(),
      executionTime: 0,
      totalProducts: 0,
      sources: {},
      combined: []
    };

    // Поиск по существующему индексу
    let indexedResults: any = null;
    if (useIndex) {
      try {
        indexedResults = searchIndexManager.search(
          query, 
          filters, 
          sortBy, 
          sortOrder, 
          page, 
          limit
        );
        
        results.indexed = {
          total: indexedResults.total,
          products: indexedResults.products,
          stats: indexedResults.stats
        };
        
        results.totalProducts += indexedResults.total;
        console.log(`Found ${indexedResults.total} products in index`);
      } catch (error) {
        console.error('Index search error:', error);
        results.indexed = { error: 'Index search failed', total: 0, products: [] };
      }
    }

    // Скрапинг новых данных
    let scrapedResults: any = null;
    if (scrapeNew) {
      try {
        const scrapingOptions = {
          maxProducts: maxProductsPerSource,
          timeout: 30000,
          headless: true,
          delay: 1000,
          retries: 2
        };

        scrapedResults = await webScraper.scrapeProducts(query, sources, scrapingOptions);
        
        // Фильтруем результаты скрапинга
        const filteredScraped = scrapedResults
          .filter((result: any) => result.success)
          .map((result: any) => ({
            source: result.source,
            products: result.products.slice(0, maxProductsPerSource),
            total: result.products.length,
            executionTime: result.executionTime
          }));

        results.scraped = {
          sources: filteredScraped,
          total: filteredScraped.reduce((sum: number, s: any) => sum + s.total, 0)
        };

        results.totalProducts += results.scraped.total;
        console.log(`Scraped ${results.scraped.total} new products`);
      } catch (error) {
        console.error('Scraping error:', error);
        results.scraped = { error: 'Scraping failed', total: 0, sources: [] };
      }
    }

    // Объединяем результаты
    if (results.indexed && results.scraped) {
      results.combined = await combineResults(
        results.indexed.products || [],
        results.scraped.sources || [],
        query,
        sortBy,
        sortOrder
      );
    } else if (results.indexed) {
      results.combined = results.indexed.products;
    } else if (results.scraped) {
      results.combined = results.scraped.sources.flatMap((s: any) => s.products);
    }

    // Применяем пагинацию к объединенным результатам
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    results.combined = results.combined.slice(startIndex, endIndex);

    // Добавляем статистику по источникам
    if (includeStats) {
      results.sources = calculateSourceStats(results);
    }

    results.executionTime = Date.now() - startTime;

    // Сохраняем новые товары в индекс
    if (scrapedResults && scrapedResults.length > 0) {
      try {
        const newProducts = scrapedResults
          .filter((r: any) => r.success)
          .flatMap((r: any) => r.products);
        
        if (newProducts.length > 0) {
          searchIndexManager.addProducts(newProducts);
          console.log(`Added ${newProducts.length} new products to index`);
        }
      } catch (error) {
        console.error('Error adding products to index:', error);
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Hybrid search error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Функция для объединения результатов из индекса и скрапинга
async function combineResults(
  indexedProducts: any[],
  scrapedSources: any[],
  query: string,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Promise<any[]> {
  const allProducts = [...indexedProducts];
  
  // Добавляем товары из скрапинга
  scrapedSources.forEach((source: any) => {
    source.products.forEach((product: any) => {
      // Проверяем, нет ли дубликата по URL
      const isDuplicate = allProducts.some(existing => 
        existing.url === product.url || existing.title === product.title
      );
      
      if (!isDuplicate) {
        allProducts.push(product);
      }
    });
  });

  // Сортируем объединенные результаты
  return sortProducts(allProducts, sortBy, sortOrder);
}

// Функция для сортировки товаров
function sortProducts(products: any[], sortBy: string, sortOrder: 'asc' | 'desc'): any[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'price':
      sorted.sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
      break;
    case 'rating':
      sorted.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      });
      break;
    case 'date':
      sorted.sort((a, b) => sortOrder === 'asc' ? a.scrapedAt - b.scrapedAt : b.scrapedAt - a.scrapedAt);
      break;
    case 'title':
      sorted.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        return sortOrder === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      });
      break;
    case 'relevance':
    default:
      // Сортировка по релевантности (оставляем как есть)
      break;
  }

  return sorted;
}

// Функция для расчета статистики по источникам
function calculateSourceStats(results: any): Record<string, any> {
  const stats: Record<string, any> = {};

  // Статистика по индексированным товарам
  if (results.indexed && results.indexed.stats) {
    stats.indexed = results.indexed.stats;
  }

  // Статистика по скрапированным товарам
  if (results.scraped && results.scraped.sources) {
    stats.scraped = {};
    results.scraped.sources.forEach((source: any) => {
      stats.scraped[source.source] = {
        total: source.total,
        executionTime: source.executionTime
      };
    });
  }

  // Общая статистика
  stats.total = {
    products: results.totalProducts,
    sources: Object.keys(stats).length,
    executionTime: results.executionTime
  };

  return stats;
}

// GET метод для получения статистики
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const indexStats = searchIndexManager.getIndexStats();
        const scraperStats = webScraper.getStats();
        
        return NextResponse.json({
          index: indexStats,
          scraper: scraperStats,
          timestamp: new Date().toISOString()
        });

      case 'sources':
        const sources = searchIndexManager.getUniqueValues('sources');
        const categories = searchIndexManager.getUniqueValues('categories');
        
        return NextResponse.json({
          sources,
          categories,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GET request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 