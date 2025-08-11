import { NextRequest, NextResponse } from 'next/server';
import { productSearchAggregator, SearchFilters } from '../../../lib/external-apis';
import { webScraper } from '../../../lib/web-scraper';

// Поддерживаемые категории
const SUPPORTED_CATEGORIES = {
  goszakupki: 'Госзакупки',
  marketplaces: 'Маркетплейсы',
  private: 'Частные объявления',
  all: 'Все источники'
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') as 'price' | 'rating' | 'relevance' | 'date' | undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
    const limit = searchParams.get('limit') || '20';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const { category } = await params;
    
    if (!SUPPORTED_CATEGORIES[category as keyof typeof SUPPORTED_CATEGORIES]) {
      return NextResponse.json(
        { error: `Unsupported category: ${category}. Supported categories: ${Object.keys(SUPPORTED_CATEGORIES).join(', ')}` },
        { status: 400 }
      );
    }

    const filters: SearchFilters = {
      query: query.trim(),
      ...(minPrice && { minPrice: parseInt(minPrice) }),
      ...(maxPrice && { maxPrice: parseInt(maxPrice) }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder })
    };

    const startTime = Date.now();
    let products = [];

    // Выполняем поиск в зависимости от категории
    switch (category) {
      case 'goszakupki':
        const govResult = await webScraper.scrapeGovernmentTenders(query);
        products = govResult.products || [];
        break;

      case 'marketplaces':
        // Поиск по маркетплейсам (Wildberries, Ozon, Яндекс.Маркет)
        const marketResults = await Promise.all([
          webScraper.scrapeWildberries(filters),
          webScraper.scrapeOzon(filters),
          webScraper.scrapeYandexMarket(filters)
        ]);
        products = marketResults
          .filter(result => result.success)
          .flatMap(result => result.products);
        break;

      case 'private':
        // Поиск по частным объявлениям (Авито, Юла)
        const privateResults = await Promise.all([
          webScraper.scrapeAvito(filters),
          webScraper.scrapeYoula(filters)
        ]);
        products = privateResults
          .filter(result => result.success)
          .flatMap(result => result.products);
        break;

      case 'all':
      default:
        // Поиск по всем источникам
        const allResults = await webScraper.scrapeAllSources(filters);
        products = allResults
          .filter(result => result.success)
          .flatMap(result => result.products);
        break;
    }

    // Ограничиваем количество результатов
    const limitedProducts = products.slice(0, parseInt(limit));

    const searchTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        category,
        categoryName: SUPPORTED_CATEGORIES[category as keyof typeof SUPPORTED_CATEGORIES],
        query,
        products: limitedProducts,
        total: limitedProducts.length,
        totalFound: products.length,
        searchTime,
        filters
      },
      message: `Найдено ${limitedProducts.length} товаров в категории "${SUPPORTED_CATEGORIES[category as keyof typeof SUPPORTED_CATEGORIES]}" за ${searchTime}мс`
    });

  } catch (error) {
    console.error('Category search API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка при поиске товаров в категории',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { query, filters = {} }: { query: string; filters?: Partial<SearchFilters> } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    const { category } = await params;
    
    if (!SUPPORTED_CATEGORIES[category as keyof typeof SUPPORTED_CATEGORIES]) {
      return NextResponse.json(
        { error: `Unsupported category: ${category}. Supported categories: ${Object.keys(SUPPORTED_CATEGORIES).join(', ')}` },
        { status: 400 }
      );
    }

    const searchFilters: SearchFilters = {
      query: query.trim(),
      ...filters
    };

    const startTime = Date.now();
    let products = [];

    // Выполняем поиск в зависимости от категории
    switch (category) {
      case 'goszakupki':
        const govResult = await webScraper.scrapeGovernmentTenders(query);
        products = govResult.products || [];
        break;

      case 'marketplaces':
        const marketResults = await Promise.all([
          webScraper.scrapeWildberries(searchFilters),
          webScraper.scrapeOzon(searchFilters),
          webScraper.scrapeYandexMarket(searchFilters)
        ]);
        products = marketResults
          .filter(result => result.success)
          .flatMap(result => result.products);
        break;

      case 'private':
        const privateResults = await Promise.all([
          webScraper.scrapeAvito(searchFilters),
          webScraper.scrapeYoula(searchFilters)
        ]);
        products = privateResults
          .filter(result => result.success)
          .flatMap(result => result.products);
        break;

      case 'all':
      default:
        const allResults = await webScraper.scrapeAllSources(searchFilters);
        products = allResults
          .filter(result => result.success)
          .flatMap(result => result.products);
        break;
    }

    const searchTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        category,
        categoryName: SUPPORTED_CATEGORIES[category as keyof typeof SUPPORTED_CATEGORIES],
        query,
        products,
        total: products.length,
        searchTime,
        filters: searchFilters
      },
      message: `Найдено ${products.length} товаров в категории "${SUPPORTED_CATEGORIES[category as keyof typeof SUPPORTED_CATEGORIES]}" за ${searchTime}мс`
    });

  } catch (error) {
    console.error('Category search API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка при поиске товаров в категории',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
} 