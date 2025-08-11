import { NextRequest, NextResponse } from 'next/server';
import { searchIndexManager, SearchFilters } from '@/lib/search-index';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      filters = {}, 
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      includeStats = false
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Валидация параметров
    const validSortBy = ['relevance', 'price', 'rating', 'date', 'title'];
    const validSortOrder = ['asc', 'desc'];
    
    if (!validSortBy.includes(sortBy)) {
      return NextResponse.json(
        { error: `Invalid sortBy. Must be one of: ${validSortBy.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validSortOrder.includes(sortOrder)) {
      return NextResponse.json(
        { error: `Invalid sortOrder. Must be one of: ${validSortOrder.join(', ')}` },
        { status: 400 }
      );
    }

    const pageNumber = Math.max(1, parseInt(page.toString()));
    const limitNumber = Math.min(Math.max(1, parseInt(limit.toString())), 100);

    // Валидация фильтров
    const validatedFilters: SearchFilters = {};
    
    if (filters.minPrice !== undefined) {
      const minPrice = parseFloat(filters.minPrice.toString());
      if (!isNaN(minPrice) && minPrice >= 0) {
        validatedFilters.minPrice = minPrice;
      }
    }

    if (filters.maxPrice !== undefined) {
      const maxPrice = parseFloat(filters.maxPrice.toString());
      if (!isNaN(maxPrice) && maxPrice > 0) {
        validatedFilters.maxPrice = maxPrice;
      }
    }

    if (filters.category && typeof filters.category === 'string') {
      validatedFilters.category = filters.category;
    }

    if (filters.source && typeof filters.source === 'string') {
      validatedFilters.source = filters.source;
    }

    if (filters.minRating !== undefined) {
      const minRating = parseFloat(filters.minRating.toString());
      if (!isNaN(minRating) && minRating >= 0 && minRating <= 5) {
        validatedFilters.minRating = minRating;
      }
    }

    if (filters.availability !== undefined) {
      validatedFilters.availability = Boolean(filters.availability);
    }

    console.log(`Searching index for query: "${query}" with filters:`, validatedFilters);

    // Выполняем поиск
    const startTime = Date.now();
    const products = await searchIndexManager.searchInIndex(query, validatedFilters);
    const searchTime = Date.now() - startTime;

    // Применяем сортировку
    let sortedProducts = [...products];
    
    switch (sortBy) {
      case 'price':
        sortedProducts.sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
        break;
      case 'rating':
        sortedProducts.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
        });
        break;
      case 'date':
        sortedProducts.sort((a, b) => sortOrder === 'asc' ? a.scrapedAt - b.scrapedAt : b.scrapedAt - a.scrapedAt);
        break;
      case 'title':
        sortedProducts.sort((a, b) => {
          const titleA = a.title.toLowerCase();
          const titleB = b.title.toLowerCase();
          return sortOrder === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
        });
        break;
      case 'relevance':
      default:
        // Сортировка по релевантности уже применена в searchInIndex
        break;
    }

    // Применяем пагинацию
    const total = sortedProducts.length;
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = startIndex + limitNumber;
    const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

    // Формируем ответ
    const response: any = {
      success: true,
      query,
      filters: validatedFilters,
      sort: { by: sortBy, order: sortOrder },
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
        hasNext: endIndex < total,
        hasPrev: pageNumber > 1
      },
      results: {
        products: paginatedProducts,
        count: paginatedProducts.length,
        searchTime
      },
      timestamp: new Date().toISOString()
    };

    // Добавляем статистику, если требуется
    if (includeStats) {
      const stats = searchIndexManager.getIndexStats();
      response.stats = stats;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search index API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = searchIndexManager.getIndexStats();
        return NextResponse.json({
          success: true,
          stats,
          timestamp: new Date().toISOString()
        });

      case 'health':
        const health = searchIndexManager.checkIndexHealth();
        return NextResponse.json({
          success: true,
          health,
          timestamp: new Date().toISOString()
        });

      case 'sources':
        const statsForSources = searchIndexManager.getIndexStats();
        const sources = Object.keys(statsForSources.sources).map(source => ({
          name: source,
          count: statsForSources.sources[source]
        }));
        return NextResponse.json({
          success: true,
          sources,
          timestamp: new Date().toISOString()
        });

      case 'categories':
        const statsForCategories = searchIndexManager.getIndexStats();
        const categories = Object.keys(statsForCategories.categories).map(category => ({
          name: category,
          count: statsForCategories.categories[category]
        }));
        return NextResponse.json({
          success: true,
          categories,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "stats", "health", "sources", or "categories"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Search index GET API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Метод для получения товаров по конкретным критериям
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'bySource':
        if (!params.source) {
          return NextResponse.json(
            { error: 'Source parameter is required for bySource action' },
            { status: 400 }
          );
        }
        const productsBySource = searchIndexManager.getProductsBySource(params.source);
        return NextResponse.json({
          success: true,
          action: 'bySource',
          source: params.source,
          products: productsBySource,
          count: productsBySource.length,
          timestamp: new Date().toISOString()
        });

      case 'byCategory':
        if (!params.category) {
          return NextResponse.json(
            { error: 'Category parameter is required for byCategory action' },
            { status: 400 }
          );
        }
        const productsByCategory = searchIndexManager.getProductsByCategory(params.category);
        return NextResponse.json({
          success: true,
          action: 'byCategory',
          category: params.category,
          products: productsByCategory,
          count: productsByCategory.length,
          timestamp: new Date().toISOString()
        });

      case 'byPriceRange':
        if (!params.minPrice || !params.maxPrice) {
          return NextResponse.json(
            { error: 'minPrice and maxPrice parameters are required for byPriceRange action' },
            { status: 400 }
          );
        }
        const minPrice = parseFloat(params.minPrice);
        const maxPrice = parseFloat(params.maxPrice);
        
        if (isNaN(minPrice) || isNaN(maxPrice) || minPrice < 0 || maxPrice < minPrice) {
          return NextResponse.json(
            { error: 'Invalid price range parameters' },
            { status: 400 }
          );
        }
        
        const productsByPriceRange = searchIndexManager.getProductsByPriceRange(minPrice, maxPrice);
        return NextResponse.json({
          success: true,
          action: 'byPriceRange',
          priceRange: { min: minPrice, max: maxPrice },
          products: productsByPriceRange,
          count: productsByPriceRange.length,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "bySource", "byCategory", or "byPriceRange"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Search index PUT API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
