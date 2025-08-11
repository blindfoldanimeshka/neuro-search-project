import { ProductData } from './web-scraper-types';

// Простая in-memory база данных для демонстрации
// В реальном проекте используйте PostgreSQL, MongoDB или другую БД
class ProductDatabase {
  private products: Map<string, ProductData> = new Map();
  private searchHistory: Array<{
    query: string;
    timestamp: Date;
    resultsCount: number;
    sources: string[];
  }> = [];
  private userPreferences: Map<string, any> = new Map();

  // Добавить товар в базу
  addProduct(product: ProductData): void {
    const key = `${product.source}-${product.id}`;
    this.products.set(key, {
      ...product,
      addedAt: new Date(),
      lastUpdated: new Date()
    });
  }

  // Добавить несколько товаров
  addProducts(products: ProductData[]): void {
    products.forEach(product => this.addProduct(product));
  }

  // Поиск товаров по запросу
  searchProducts(query: string, options: {
    maxResults?: number;
    sources?: string[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  } = {}): ProductData[] {
    const {
      maxResults = 50,
      sources = ['all'],
      minPrice,
      maxPrice,
      minRating
    } = options;

    let results = Array.from(this.products.values());

    // Фильтрация по источникам
    if (sources.length > 0 && !sources.includes('all')) {
      results = results.filter(product => sources.includes(product.source));
    }

    // Фильтрация по цене
    if (minPrice !== undefined) {
      results = results.filter(product => product.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      results = results.filter(product => product.price <= maxPrice);
    }

    // Фильтрация по рейтингу
    if (minRating !== undefined) {
      results = results.filter(product => product.rating && product.rating >= minRating);
    }

    // Поиск по тексту (название, описание)
    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      results = results.filter(product => {
        const productText = `${product.title} ${product.description || ''}`.toLowerCase();
        return searchTerms.some(term => productText.includes(term));
      });
    }

    // Сортировка по релевантности и рейтингу
    results.sort((a, b) => {
      // Приоритет товарам с рейтингом
      const aRating = a.rating || 0;
      const bRating = b.rating || 0;
      if (aRating !== bRating) {
        return bRating - aRating;
      }
      
      // Затем по дате добавления (новые первыми)
      return new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime();
    });

    return results.slice(0, maxResults);
  }

  // Получить товар по ID
  getProduct(id: string, source: string): ProductData | undefined {
    const key = `${source}-${id}`;
    return this.products.get(key);
  }

  // Обновить товар
  updateProduct(id: string, source: string, updates: Partial<ProductData>): boolean {
    const key = `${source}-${id}`;
    const product = this.products.get(key);
    
    if (product) {
      this.products.set(key, {
        ...product,
        ...updates,
        lastUpdated: new Date()
      });
      return true;
    }
    
    return false;
  }

  // Удалить товар
  deleteProduct(id: string, source: string): boolean {
    const key = `${source}-${id}`;
    return this.products.delete(key);
  }

  // Получить статистику
  getStats() {
    const totalProducts = this.products.size;
    const sources = new Set(Array.from(this.products.values()).map(p => p.source));
    const totalValue = Array.from(this.products.values()).reduce((sum, p) => sum + p.price, 0);
    
    const priceRanges = {
      '0-1000': 0,
      '1000-5000': 0,
      '5000-10000': 0,
      '10000+': 0
    };

    Array.from(this.products.values()).forEach(product => {
      if (product.price <= 1000) priceRanges['0-1000']++;
      else if (product.price <= 5000) priceRanges['1000-5000']++;
      else if (product.price <= 10000) priceRanges['5000-10000']++;
      else priceRanges['10000+']++;
    });

    return {
      totalProducts,
      sources: Array.from(sources),
      totalValue: Math.round(totalValue),
      averagePrice: totalProducts > 0 ? Math.round(totalValue / totalProducts) : 0,
      priceRanges,
      searchHistoryCount: this.searchHistory.length
    };
  }

  // Добавить запрос в историю поиска
  addSearchHistory(query: string, resultsCount: number, sources: string[]): void {
    this.searchHistory.push({
      query,
      timestamp: new Date(),
      resultsCount,
      sources
    });

    // Ограничиваем историю последними 100 запросами
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-100);
    }
  }

  // Получить историю поиска
  getSearchHistory(limit: number = 20): Array<{
    query: string;
    timestamp: Date;
    resultsCount: number;
    sources: string[];
  }> {
    return this.searchHistory
      .slice(-limit)
      .reverse();
  }

  // Получить популярные запросы
  getPopularQueries(limit: number = 10): Array<{
    query: string;
    count: number;
    lastUsed: Date;
  }> {
    const queryCounts = new Map<string, { count: number; lastUsed: Date }>();
    
    this.searchHistory.forEach(item => {
      const existing = queryCounts.get(item.query);
      if (existing) {
        existing.count++;
        if (item.timestamp > existing.lastUsed) {
          existing.lastUsed = item.timestamp;
        }
      } else {
        queryCounts.set(item.query, {
          count: 1,
          lastUsed: item.timestamp
        });
      }
    });

    return Array.from(queryCounts.entries())
      .map(([query, data]) => ({ query, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Сохранить пользовательские предпочтения
  saveUserPreferences(userId: string, preferences: any): void {
    this.userPreferences.set(userId, {
      ...this.userPreferences.get(userId),
      ...preferences,
      updatedAt: new Date()
    });
  }

  // Получить пользовательские предпочтения
  getUserPreferences(userId: string): any {
    return this.userPreferences.get(userId) || {};
  }

  // Очистить старые товары (старше 30 дней)
  cleanupOldProducts(): number {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let deletedCount = 0;
    
    for (const [key, product] of this.products.entries()) {
      if (product.lastUpdated && product.lastUpdated < thirtyDaysAgo) {
        this.products.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  // Экспорт данных
  exportData(): any {
    return {
      products: Array.from(this.products.values()),
      searchHistory: this.searchHistory,
      userPreferences: Object.fromEntries(this.userPreferences),
      stats: this.getStats(),
      exportedAt: new Date()
    };
  }

  // Импорт данных
  importData(data: any): void {
    if (data.products) {
      data.products.forEach((product: ProductData) => {
        this.addProduct(product);
      });
    }
    
    if (data.searchHistory) {
      this.searchHistory = data.searchHistory.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    }
    
    if (data.userPreferences) {
      this.userPreferences = new Map(Object.entries(data.userPreferences));
    }
  }
}

// Создаем единственный экземпляр базы данных
export const productDatabase = new ProductDatabase();

// Экспортируем типы для использования в других модулях
export type { ProductDatabase };
