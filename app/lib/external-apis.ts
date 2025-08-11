export interface ExternalProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  seller: string;
  source: 'wildberries' | 'ozon' | 'avito' | 'yandex' | 'sbermegamarket' | 'youla' | 'government' | 'custom';
  url: string;
  image?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  availability: boolean;
  deliveryTime?: string;
  location?: string;
}

export interface SearchFilters {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  rating?: number;
  location?: string;
  sortBy?: 'price' | 'rating' | 'relevance' | 'date';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  products: ExternalProduct[];
  total: number;
  sources: string[];
  searchTime: number;
}

// Wildberries API интеграция
export class WildberriesAPI {
  private baseUrl = 'https://search.wb.ru/exactmatch/ru/common/v4/search';
  
  async searchProducts(filters: SearchFilters): Promise<ExternalProduct[]> {
    try {
      const params = new URLSearchParams({
        query: filters.query,
        dest: '-1257786', // Москва
        limit: '20',
        sort: filters.sortBy === 'price' ? 'priceup' : 'popular',
        ...(filters.minPrice && { priceMin: filters.minPrice.toString() }),
        ...(filters.maxPrice && { priceMax: filters.maxPrice.toString() })
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Wildberries API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.data?.products?.map((product: any) => ({
        id: product.id.toString(),
        name: product.name,
        price: product.salePriceU / 100,
        originalPrice: product.priceU / 100,
        rating: product.rating,
        reviews: product.reviewRating,
        seller: product.seller,
        source: 'wildberries' as const,
        url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`,
        image: `https://images.wbstatic.net/c246x328/new/${product.id}-1.jpg`,
        availability: product.sizes?.some((size: any) => size.stocks?.length > 0) || false,
        deliveryTime: '1-3 дня'
      })) || [];

    } catch (error) {
      console.error('Wildberries API error:', error);
      return [];
    }
  }
}

// Ozon API интеграция
export class OzonAPI {
  private baseUrl = 'https://api.ozon.ru/composer-api.bx/page/json/v2';
  
  async searchProducts(filters: SearchFilters): Promise<ExternalProduct[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({
          url: `/search?text=${encodeURIComponent(filters.query)}`,
          layout_container: 'searchResults',
          layout_page_index: 0
        })
      });

      if (!response.ok) {
        throw new Error(`Ozon API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Парсинг HTML ответа от Ozon
      const products = this.parseOzonProducts(data);
      
      return products.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        rating: product.rating,
        reviews: product.reviews,
        seller: product.seller,
        source: 'ozon' as const,
        url: product.url,
        image: product.image,
        availability: product.availability,
        deliveryTime: '1-2 дня'
      }));

    } catch (error) {
      console.error('Ozon API error:', error);
      return [];
    }
  }

  private parseOzonProducts(data: any): any[] {
    // Логика парсинга Ozon
    return [];
  }
}

// Агрегатор поиска по всем источникам
export class ProductSearchAggregator {
  private apis = {
    wildberries: new WildberriesAPI(),
    ozon: new OzonAPI()
  };

  async searchByEngine(filters: SearchFilters, engine: string): Promise<SearchResult> {
    const startTime = Date.now();
    const results: ExternalProduct[] = [];
    const sources: string[] = [];

    // Поиск по конкретному движку
    if (engine === 'duckduckgo' || engine === 'google' || engine === 'bing') {
      // Для внешних поисковиков используем демо-данные
      results.push(...this.getDemoProducts(filters.query));
      sources.push(engine);
    } else if (this.apis[engine as keyof typeof this.apis]) {
      // Поиск через конкретный API маркетплейса
      try {
        const api = this.apis[engine as keyof typeof this.apis];
        const products = await api.searchProducts(filters);
        results.push(...products);
        sources.push(engine);
      } catch (error) {
        console.error(`Error searching ${engine}:`, error);
      }
    }

    return {
      products: results,
      total: results.length,
      sources,
      searchTime: Date.now() - startTime
    };
  }

  private getDemoProducts(query: string): ExternalProduct[] {
    // Возвращаем демо-данные для тестирования
    if (query.toLowerCase().includes('смартфон') || query.toLowerCase().includes('телефон')) {
      return [
        {
          id: 'demo-1',
          name: 'Смартфон Samsung Galaxy S24',
          price: 85000,
          originalPrice: 95000,
          rating: 4.8,
          reviews: 1250,
          seller: 'Samsung Store',
          source: 'wildberries',
          url: 'https://www.wildberries.ru/catalog/123456/detail.aspx',
          image: 'https://images.wbstatic.net/c246x328/new/123456-1.jpg',
          description: 'Флагманский смартфон с AI-камерой',
          category: 'электроника',
          availability: true,
          deliveryTime: '1-3 дня'
        }
      ];
    }
    return [];
  }

  async searchAllSources(filters: SearchFilters): Promise<SearchResult> {
    const startTime = Date.now();
    const results: ExternalProduct[] = [];
    const sources: string[] = [];

    // Параллельный поиск по всем источникам
    const searchPromises = Object.entries(this.apis).map(async ([source, api]) => {
      try {
        const products = await api.searchProducts(filters);
        results.push(...products);
        sources.push(source);
        return products;
      } catch (error) {
        console.error(`Error searching ${source}:`, error);
        return [];
      }
    });

    await Promise.all(searchPromises);

    // Добавляем демонстрационные данные для тестирования
    if (results.length === 0 && filters.query.toLowerCase().includes('смартфон')) {
      const demoProducts: ExternalProduct[] = [
        {
          id: 'wb-1',
          name: 'Смартфон Samsung Galaxy S24 128GB',
          price: 85000,
          originalPrice: 95000,
          rating: 4.8,
          reviews: 1250,
          seller: 'Samsung Store',
          source: 'wildberries',
          url: 'https://www.wildberries.ru/catalog/123456/detail.aspx',
          image: 'https://images.wbstatic.net/c246x328/new/123456-1.jpg',
          description: 'Флагманский смартфон с AI-камерой и мощным процессором',
          category: 'электроника',
          subcategory: 'смартфоны',
          availability: true,
          deliveryTime: '1-3 дня',
          location: 'Москва'
        },
        {
          id: 'ozon-1',
          name: 'iPhone 15 Pro 256GB',
          price: 120000,
          originalPrice: 135000,
          rating: 4.9,
          reviews: 890,
          seller: 'Apple Store',
          source: 'ozon',
          url: 'https://www.ozon.ru/product/iphone-15-pro',
          image: 'https://images.ozon.ru/iphone-15-pro.jpg',
          description: 'Премиальный смартфон от Apple с титановым корпусом',
          category: 'электроника',
          subcategory: 'смартфоны',
          availability: true,
          deliveryTime: '1-2 дня',
          location: 'Санкт-Петербург'
        },
        {
          id: 'wb-2',
          name: 'Xiaomi Redmi Note 13 Pro',
          price: 35000,
          originalPrice: 40000,
          rating: 4.6,
          reviews: 567,
          seller: 'Xiaomi Store',
          source: 'wildberries',
          url: 'https://www.wildberries.ru/catalog/789012/detail.aspx',
          image: 'https://images.wbstatic.net/c246x328/new/789012-1.jpg',
          description: 'Смартфон с отличным соотношением цена-качество',
          category: 'электроника',
          subcategory: 'смартфоны',
          availability: true,
          deliveryTime: '1-3 дня',
          location: 'Москва'
        },
        {
          id: 'ozon-2',
          name: 'Google Pixel 8 Pro',
          price: 95000,
          originalPrice: 105000,
          rating: 4.7,
          reviews: 234,
          seller: 'Google Store',
          source: 'ozon',
          url: 'https://www.ozon.ru/product/google-pixel-8-pro',
          image: 'https://images.ozon.ru/google-pixel-8-pro.jpg',
          description: 'Смартфон с лучшей камерой и чистой Android',
          category: 'электроника',
          subcategory: 'смартфоны',
          availability: false,
          deliveryTime: '3-5 дней',
          location: 'Екатеринбург'
        }
      ];

      results.push(...demoProducts);
      sources.push('wildberries', 'ozon');
    }

    // Сортировка результатов
    if (filters.sortBy === 'price') {
      results.sort((a, b) => 
        filters.sortOrder === 'desc' ? b.price - a.price : a.price - b.price
      );
    } else if (filters.sortBy === 'rating') {
      results.sort((a, b) => 
        filters.sortOrder === 'desc' ? (b.rating || 0) - (a.rating || 0) : (a.rating || 0) - (b.rating || 0)
      );
    }

    return {
      products: results,
      total: results.length,
      sources,
      searchTime: Date.now() - startTime
    };
  }

  // Поиск товаров для госзакупок
  async searchGovernmentTenders(query: string): Promise<ExternalProduct[]> {
    // Здесь будет интеграция с API госзакупок
    // Пока возвращаем пустой массив
    return [];
  }
}

// Синглтон для использования в приложении
export const productSearchAggregator = new ProductSearchAggregator(); 