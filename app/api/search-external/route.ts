import { NextRequest, NextResponse } from 'next/server';
import { productSearchAggregator, SearchFilters } from '../../lib/external-apis';

export async function POST(request: NextRequest) {
  try {
    const { query, filters = {} }: { query: string; filters?: Partial<SearchFilters> } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Формируем фильтры для поиска
    const searchFilters: SearchFilters = {
      query: query.trim(),
      ...filters
    };

    // Выполняем поиск по всем источникам
    const result = await productSearchAggregator.searchAllSources(searchFilters);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Найдено ${result.total} товаров в ${result.sources.length} источниках за ${result.searchTime}мс`
    });

  } catch (error) {
    console.error('External search API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка при поиске товаров во внешних источниках',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const engine = searchParams.get('engine');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') as 'price' | 'rating' | 'relevance' | 'date' | undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    const filters: SearchFilters = {
      query: query.trim(),
      ...(minPrice && { minPrice: parseInt(minPrice) }),
      ...(maxPrice && { maxPrice: parseInt(maxPrice) }),
      ...(category && { category }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder })
    };

    let result;
    
    if (engine) {
      // Поиск по конкретному движку
      result = await productSearchAggregator.searchByEngine(filters, engine);
    } else {
      // Поиск по всем источникам
      result = await productSearchAggregator.searchAllSources(filters);
    }

    // Формат ответа для совместимости с RAG
    if (engine) {
      return NextResponse.json({
        results: result.products,
        success: true,
        engine
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Найдено ${result.total} товаров в ${result.sources.length} источниках за ${result.searchTime}мс`
    });

  } catch (error) {
    console.error('External search API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка при поиске товаров во внешних источниках',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}