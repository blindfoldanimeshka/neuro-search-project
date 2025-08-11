import { ScrapedProduct } from './web-scraper';

export interface SearchFilters {
  sources?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  rating?: {
    min?: number;
    max?: number;
  };
  availability?: boolean;
  categories?: string[];
  dateRange?: {
    from?: number;
    to?: number;
  };
}

export interface SearchResult {
  products: ScrapedProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: SearchFilters;
  stats: {
    sources: Record<string, number>;
    priceRange: { min: number; max: number };
    averageRating: number;
    totalAvailable: number;
  };
}

export interface IndexStats {
  totalProducts: number;
  sources: Record<string, number>;
  categories: Record<string, number>;
  priceRange: { min: number; max: number };
  averageRating: number;
  lastUpdated: number;
  indexSize: number;
}

export interface ProductIndex {
  id: string;
  title: string;
  price: number;
  source: string;
  category?: string;
  rating?: number;
  availability: boolean;
  scrapedAt: number;
  // Индексированные поля для поиска
  searchableText: string;
  priceRange: string;
  ratingRange: string;
  dateRange: string;
}

class SearchIndexManager {
  private products: Map<string, ScrapedProduct> = new Map();
  private productIndexes: Map<string, ProductIndex> = new Map();
  private categories: Set<string> = new Set();
  private sources: Set<string> = new Set();
  private lastUpdate: number = Date.now();

  constructor() {
    this.loadFromStorage();
  }

  // Добавление товаров в индекс
  addProducts(products: ScrapedProduct[]): void {
    const startTime = Date.now();
    let addedCount = 0;
    let updatedCount = 0;

    for (const product of products) {
      try {
        if (this.products.has(product.id)) {
          // Обновляем существующий товар
          this.products.set(product.id, product);
          this.updateProductIndex(product);
          updatedCount++;
        } else {
          // Добавляем новый товар
          this.products.set(product.id, product);
          this.createProductIndex(product);
          addedCount++;
        }

        // Обновляем категории и источники
        if (product.category) {
          this.categories.add(product.category);
        }
        this.sources.add(product.source);

      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
      }
    }

    this.lastUpdate = Date.now();
    this.saveToStorage();

    console.log(`Index updated: ${addedCount} added, ${updatedCount} updated in ${Date.now() - startTime}ms`);
  }

  // Создание индекса для товара
  private createProductIndex(product: ScrapedProduct): void {
    const index: ProductIndex = {
      id: product.id,
      title: product.title,
      price: product.price,
      source: product.source,
      category: product.category,
      rating: product.rating,
      availability: product.availability,
      scrapedAt: product.scrapedAt,
      searchableText: this.createSearchableText(product),
      priceRange: this.getPriceRange(product.price),
      ratingRange: this.getRatingRange(product.rating),
      dateRange: this.getDateRange(product.scrapedAt)
    };

    this.productIndexes.set(product.id, index);
  }

  // Обновление индекса товара
  private updateProductIndex(product: ScrapedProduct): void {
    const existingIndex = this.productIndexes.get(product.id);
    if (existingIndex) {
      existingIndex.title = product.title;
      existingIndex.price = product.price;
      existingIndex.category = product.category;
      existingIndex.rating = product.rating;
      existingIndex.availability = product.availability;
      existingIndex.scrapedAt = product.scrapedAt;
      existingIndex.searchableText = this.createSearchableText(product);
      existingIndex.priceRange = this.getPriceRange(product.price);
      existingIndex.ratingRange = this.getRatingRange(product.rating);
      existingIndex.dateRange = this.getDateRange(product.scrapedAt);
    }
  }

  // Создание поискового текста
  private createSearchableText(product: ScrapedProduct): string {
    const parts = [
      product.title.toLowerCase(),
      product.source.toLowerCase(),
      product.category?.toLowerCase() || '',
      product.description?.toLowerCase() || ''
    ];

    return parts.filter(Boolean).join(' ');
  }

  // Получение диапазона цен для индексации
  private getPriceRange(price: number): string {
    if (price <= 1000) return 'low';
    if (price <= 5000) return 'medium';
    if (price <= 20000) return 'high';
    return 'premium';
  }

  // Получение диапазона рейтинга для индексации
  private getRatingRange(rating?: number): string {
    if (!rating) return 'no-rating';
    if (rating < 3) return 'low';
    if (rating < 4) return 'medium';
    return 'high';
  }

  // Получение диапазона дат для индексации
  private getDateRange(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const days = diff / (1000 * 60 * 60 * 24);

    if (days <= 1) return 'today';
    if (days <= 7) return 'week';
    if (days <= 30) return 'month';
    return 'old';
  }

  // Поиск по индексу
  search(query: string, filters: SearchFilters = {}, sortBy: string = 'relevance', sortOrder: 'asc' | 'desc' = 'desc', page: number = 1, limit: number = 20): SearchResult {
    const startTime = Date.now();
    
    // Фильтрация товаров
    let filteredProducts = this.applyFilters(filters);
    
    // Поиск по тексту
    if (query && query.trim()) {
      filteredProducts = this.searchByText(filteredProducts, query.trim());
    }

    // Сортировка
    filteredProducts = this.sortProducts(filteredProducts, sortBy, sortOrder);

    // Пагинация
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Статистика
    const stats = this.calculateSearchStats(filteredProducts);

    const result: SearchResult = {
      products: paginatedProducts,
      total,
      page,
      limit,
      totalPages,
      filters,
      stats
    };

    console.log(`Search completed in ${Date.now() - startTime}ms. Found ${total} products, showing ${paginatedProducts.length}`);
    return result;
  }

  // Применение фильтров
  private applyFilters(filters: SearchFilters): ScrapedProduct[] {
    let filtered = Array.from(this.products.values());

    // Фильтр по источникам
    if (filters.sources && filters.sources.length > 0) {
      filtered = filtered.filter(p => filters.sources!.includes(p.source));
    }

    // Фильтр по диапазону цен
    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) {
        filtered = filtered.filter(p => p.price >= filters.priceRange!.min!);
      }
      if (filters.priceRange.max !== undefined) {
        filtered = filtered.filter(p => p.price <= filters.priceRange!.max!);
      }
    }

    // Фильтр по рейтингу
    if (filters.rating) {
      if (filters.rating.min !== undefined) {
        filtered = filtered.filter(p => p.rating && p.rating >= filters.rating!.min!);
      }
      if (filters.rating.max !== undefined) {
        filtered = filtered.filter(p => p.rating && p.rating <= filters.rating!.max!);
      }
    }

    // Фильтр по наличию
    if (filters.availability !== undefined) {
      filtered = filtered.filter(p => p.availability === filters.availability);
    }

    // Фильтр по категориям
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(p => p.category && filters.categories!.includes(p.category));
    }

    // Фильтр по датам
    if (filters.dateRange) {
      if (filters.dateRange.from !== undefined) {
        filtered = filtered.filter(p => p.scrapedAt >= filters.dateRange!.from!);
      }
      if (filters.dateRange.to !== undefined) {
        filtered = filtered.filter(p => p.scrapedAt <= filters.dateRange!.to!);
      }
    }

    return filtered;
  }

  // Поиск по тексту
  private searchByText(products: ScrapedProduct[], query: string): ScrapedProduct[] {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);

    return products.filter(product => {
      const searchableText = this.productIndexes.get(product.id)?.searchableText || '';
      
      // Проверяем каждое слово запроса
      return queryWords.every(word => {
        return searchableText.includes(word) ||
               product.title.toLowerCase().includes(word) ||
               (product.category && product.category.toLowerCase().includes(word)) ||
               (product.description && product.description.toLowerCase().includes(word));
      });
    });
  }

  // Сортировка товаров
  private sortProducts(products: ScrapedProduct[], sortBy: string, sortOrder: 'asc' | 'desc'): ScrapedProduct[] {
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
        // Сортировка по релевантности (оставляем как есть, так как уже отсортировано по поиску)
        break;
    }

    return sorted;
  }

  // Расчет статистики поиска
  private calculateSearchStats(products: ScrapedProduct[]) {
    const sources: Record<string, number> = {};
    const prices = products.map(p => p.price).filter(p => p > 0);
    const ratings = products.map(p => p.rating).filter(r => r !== undefined) as number[];

    // Подсчет по источникам
    products.forEach(p => {
      sources[p.source] = (sources[p.source] || 0) + 1;
    });

    // Статистика по ценам
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0
    };

    // Средний рейтинг
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
      : 0;

    // Количество доступных товаров
    const totalAvailable = products.filter(p => p.availability).length;

    return {
      sources,
      priceRange,
      averageRating: Math.round(averageRating * 100) / 100,
      totalAvailable
    };
  }

  // Получение статистики индекса
  getIndexStats(): IndexStats {
    const prices = Array.from(this.products.values()).map(p => p.price).filter(p => p > 0);
    const ratings = Array.from(this.products.values()).map(p => p.rating).filter(r => r !== undefined) as number[];

    const stats: IndexStats = {
      totalProducts: this.products.size,
      sources: {},
      categories: {},
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0
      },
      averageRating: ratings.length > 0 
        ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 100) / 100
        : 0,
      lastUpdated: this.lastUpdate,
      indexSize: this.productIndexes.size
    };

    // Подсчет по источникам
    this.sources.forEach(source => {
      stats.sources[source] = Array.from(this.products.values()).filter(p => p.source === source).length;
    });

    // Подсчет по категориям
    this.categories.forEach(category => {
      stats.categories[category] = Array.from(this.products.values()).filter(p => p.category === category).length;
    });

    return stats;
  }

  // Получение товара по ID
  getProductById(id: string): ScrapedProduct | undefined {
    return this.products.get(id);
  }

  // Получение товаров по источнику
  getProductsBySource(source: string): ScrapedProduct[] {
    return Array.from(this.products.values()).filter(p => p.source === source);
  }

  // Получение товаров по категории
  getProductsByCategory(category: string): ScrapedProduct[] {
    return Array.from(this.products.values()).filter(p => p.category === category);
  }

  // Удаление товара
  removeProduct(id: string): boolean {
    const removed = this.products.delete(id);
    if (removed) {
      this.productIndexes.delete(id);
      this.saveToStorage();
    }
    return removed;
  }

  // Очистка индекса
  clearIndex(): void {
    this.products.clear();
    this.productIndexes.clear();
    this.categories.clear();
    this.sources.clear();
    this.lastUpdate = Date.now();
    this.saveToStorage();
    console.log('Index cleared');
  }

  // Экспорт данных
  exportData(): { products: ScrapedProduct[]; stats: IndexStats } {
    return {
      products: Array.from(this.products.values()),
      stats: this.getIndexStats()
    };
  }

  // Импорт данных
  importData(data: { products: ScrapedProduct[]; stats?: IndexStats }): void {
    this.clearIndex();
    this.addProducts(data.products);
    console.log(`Imported ${data.products.length} products`);
  }

  // Сохранение в localStorage
  private saveToStorage(): void {
    try {
      const data = {
        products: Array.from(this.products.entries()),
        categories: Array.from(this.categories),
        sources: Array.from(this.sources),
        lastUpdate: this.lastUpdate
      };
      localStorage.setItem('searchIndex', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  // Загрузка из localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('searchIndex');
      if (stored) {
        const data = JSON.parse(stored);
        
        // Восстанавливаем товары
        if (data.products) {
          this.products = new Map(data.products);
          // Восстанавливаем индексы
          Array.from(this.products.values()).forEach(product => {
            this.createProductIndex(product);
          });
        }

        // Восстанавливаем категории и источники
        if (data.categories) {
          this.categories = new Set(data.categories);
        }
        if (data.sources) {
          this.sources = new Set(data.sources);
        }
        if (data.lastUpdate) {
          this.lastUpdate = data.lastUpdate;
        }

        console.log(`Loaded ${this.products.size} products from storage`);
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  // Получение уникальных значений для фильтров
  getUniqueValues(field: 'sources' | 'categories'): string[] {
    switch (field) {
      case 'sources':
        return Array.from(this.sources);
      case 'categories':
        return Array.from(this.categories);
      default:
        return [];
    }
  }

  // Поиск похожих товаров
  findSimilarProducts(productId: string, limit: number = 5): ScrapedProduct[] {
    const product = this.products.get(productId);
    if (!product) return [];

    const similar: Array<{ product: ScrapedProduct; score: number }> = [];

    for (const otherProduct of this.products.values()) {
      if (otherProduct.id === productId) continue;

      let score = 0;

      // Оценка по категории
      if (product.category && otherProduct.category === product.category) {
        score += 3;
      }

      // Оценка по источнику
      if (product.source === otherProduct.source) {
        score += 1;
      }

      // Оценка по диапазону цен
      const priceDiff = Math.abs(product.price - otherProduct.price) / Math.max(product.price, otherProduct.price);
      if (priceDiff < 0.2) score += 2;
      else if (priceDiff < 0.5) score += 1;

      // Оценка по рейтингу
      if (product.rating && otherProduct.rating) {
        const ratingDiff = Math.abs(product.rating - otherProduct.rating);
        if (ratingDiff < 1) score += 2;
        else if (ratingDiff < 2) score += 1;
      }

      if (score > 0) {
        similar.push({ product: otherProduct, score });
      }
    }

    return similar
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);
  }

  // Оптимизация индекса
  optimizeIndex(): void {
    const startTime = Date.now();
    
    // Удаляем дубликаты по URL
    const urlMap = new Map<string, string>();
    const toRemove: string[] = [];

    for (const [id, product] of this.products.entries()) {
      if (urlMap.has(product.url)) {
        // Оставляем более новый товар
        const existingId = urlMap.get(product.url)!;
        const existingProduct = this.products.get(existingId)!;
        
        if (product.scrapedAt > existingProduct.scrapedAt) {
          toRemove.push(existingId);
          urlMap.set(product.url, id);
        } else {
          toRemove.push(id);
        }
      } else {
        urlMap.set(product.url, id);
      }
    }

    // Удаляем дубликаты
    toRemove.forEach(id => this.removeProduct(id));

    // Пересоздаем индексы
    this.productIndexes.clear();
    Array.from(this.products.values()).forEach(product => {
      this.createProductIndex(product);
    });

    this.saveToStorage();
    console.log(`Index optimized in ${Date.now() - startTime}ms. Removed ${toRemove.length} duplicates`);
  }
}

// Экспортируем экземпляр класса
export const searchIndexManager = new SearchIndexManager();

// Экспортируем типы для использования в других модулях
export type { SearchFilters, SearchResult, IndexStats, ProductIndex }; 