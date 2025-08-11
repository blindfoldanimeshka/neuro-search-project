import { ScrapedProduct } from './web-scraper';
import { IndexedDBStorage, productIndexDBConfig } from './indexed-db-storage';
import { envConfig } from './env-validator';

interface OptimizedProduct extends ScrapedProduct {
  searchTokens: string[];
  popularityScore: number;
}

interface CacheEntry {
  key: string;
  data: any;
  expiry: number;
}

interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: number;
  resultsCount: number;
  filters: any;
}

export class OptimizedSearchManager {
  private storage: IndexedDBStorage;
  private memoryCache: Map<string, { data: any; expiry: number }> = new Map();
  private tokenCache: Map<string, string[]> = new Map();
  private maxIndexSize: number;
  private cacheCleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.storage = new IndexedDBStorage(productIndexDBConfig);
    this.maxIndexSize = envConfig.get().MAX_INDEX_SIZE;
    
    // Запускаем периодическую очистку кэша
    this.startCacheCleanup();
  }

  // Инициализация
  async init(): Promise<void> {
    await this.storage.init();
    await this.cleanupOldData();
  }

  // Добавление продуктов с оптимизацией
  async addProducts(products: ScrapedProduct[]): Promise<void> {
    const optimizedProducts: OptimizedProduct[] = products.map(product => ({
      ...product,
      searchTokens: this.tokenizeProduct(product),
      popularityScore: this.calculatePopularity(product)
    }));

    // Проверяем размер индекса перед добавлением
    const currentSize = await this.getIndexSize();
    if (currentSize > this.maxIndexSize * 0.9) {
      // Если индекс почти полный, удаляем старые данные
      await this.removeOldProducts(products.length);
    }

    // Добавляем продукты пакетами для оптимизации
    const batchSize = 100;
    for (let i = 0; i < optimizedProducts.length; i += batchSize) {
      const batch = optimizedProducts.slice(i, i + batchSize);
      await this.storage.putBulk('products', batch);
    }

    // Очищаем кэш поиска, так как данные изменились
    this.clearSearchCache();
  }

  // Поиск с кэшированием
  async search(
    query: string,
    filters: any = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<{ products: ScrapedProduct[]; total: number; cached: boolean }> {
    // Генерируем ключ кэша
    const cacheKey = this.generateCacheKey('search', { query, filters, limit, offset });
    
    // Проверяем память кэш
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Выполняем поиск
    const searchTokens = this.tokenizeQuery(query);
    let products: OptimizedProduct[] = [];

    if (searchTokens.length > 0) {
      // Используем индекс для поиска по токенам
      const productIds = new Set<string>();
      
      for (const token of searchTokens) {
        const results = await this.storage.getByIndex<OptimizedProduct>(
          'products',
          'searchTokens',
          token
        );
        results.forEach(product => productIds.add(product.id));
      }

      // Загружаем найденные продукты
      const foundProducts: OptimizedProduct[] = [];
      for (const id of productIds) {
        const product = await this.storage.get<OptimizedProduct>('products', id);
        if (product) {
          foundProducts.push(product);
        }
      }

      // Применяем фильтры
      products = this.applyFilters(foundProducts, filters);
      
      // Сортируем по релевантности
      products = this.sortByRelevance(products, searchTokens);
    } else {
      // Если нет поискового запроса, просто применяем фильтры
      const allProducts = await this.storage.getAll<OptimizedProduct>('products');
      products = this.applyFilters(allProducts, filters);
    }

    // Применяем пагинацию
    const total = products.length;
    const paginatedProducts = products.slice(offset, offset + limit);

    // Сохраняем в кэш
    const result = { products: paginatedProducts, total };
    this.saveToCache(cacheKey, result, 300); // 5 минут

    // Сохраняем историю поиска
    await this.saveSearchHistory(query, filters, total);

    return { ...result, cached: false };
  }

  // Токенизация продукта для индексации
  private tokenizeProduct(product: ScrapedProduct): string[] {
    const text = `${product.title} ${product.category || ''} ${product.description || ''}`.toLowerCase();
    return this.tokenize(text);
  }

  // Токенизация поискового запроса
  private tokenizeQuery(query: string): string[] {
    return this.tokenize(query.toLowerCase());
  }

  // Базовая токенизация с кэшированием
  private tokenize(text: string): string[] {
    // Проверяем кэш токенов
    const cached = this.tokenCache.get(text);
    if (cached) return cached;

    // Токенизация
    const tokens = text
      .replace(/[^\w\sа-яё]/gi, ' ')
      .split(/\s+/)
      .filter(token => token.length >= 3)
      .map(token => token.trim());

    // Удаляем дубликаты
    const uniqueTokens = [...new Set(tokens)];

    // Кэшируем результат
    if (this.tokenCache.size > 10000) {
      // Очищаем кэш если он слишком большой
      this.tokenCache.clear();
    }
    this.tokenCache.set(text, uniqueTokens);

    return uniqueTokens;
  }

  // Расчет популярности
  private calculatePopularity(product: ScrapedProduct): number {
    let score = 0;
    
    if (product.rating) {
      score += product.rating * 20;
    }
    
    if (product.reviewsCount) {
      score += Math.min(product.reviewsCount / 10, 50);
    }
    
    // Учитываем свежесть
    const daysOld = (Date.now() - product.scrapedAt) / (1000 * 60 * 60 * 24);
    if (daysOld <= 1) score += 30;
    else if (daysOld <= 7) score += 20;
    else if (daysOld <= 30) score += 10;
    
    return Math.round(score);
  }

  // Применение фильтров
  private applyFilters(products: OptimizedProduct[], filters: any): OptimizedProduct[] {
    let filtered = products;

    if (filters.sources?.length > 0) {
      filtered = filtered.filter(p => filters.sources.includes(p.source));
    }

    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) {
        filtered = filtered.filter(p => p.price >= filters.priceRange.min);
      }
      if (filters.priceRange.max !== undefined) {
        filtered = filtered.filter(p => p.price <= filters.priceRange.max);
      }
    }

    if (filters.rating?.min !== undefined) {
      filtered = filtered.filter(p => p.rating && p.rating >= filters.rating.min);
    }

    if (filters.availability !== undefined) {
      filtered = filtered.filter(p => p.availability === filters.availability);
    }

    if (filters.categories?.length > 0) {
      filtered = filtered.filter(p => p.category && filters.categories.includes(p.category));
    }

    return filtered;
  }

  // Сортировка по релевантности
  private sortByRelevance(products: OptimizedProduct[], searchTokens: string[]): OptimizedProduct[] {
    return products.sort((a, b) => {
      // Считаем количество совпадений токенов
      const aMatches = a.searchTokens.filter(token => searchTokens.includes(token)).length;
      const bMatches = b.searchTokens.filter(token => searchTokens.includes(token)).length;
      
      // Сначала по количеству совпадений
      if (aMatches !== bMatches) {
        return bMatches - aMatches;
      }
      
      // Затем по популярности
      return b.popularityScore - a.popularityScore;
    });
  }

  // Работа с кэшем
  private generateCacheKey(prefix: string, params: any): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.memoryCache.delete(key);
    return null;
  }

  private saveToCache(key: string, data: any, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.memoryCache.set(key, { data, expiry });
    
    // Также сохраняем в IndexedDB для долговременного кэша
    this.storage.put('cache', { key, data, expiry }).catch(console.error);
  }

  private clearSearchCache(): void {
    // Очищаем только кэш поиска
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith('search:')) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Очистка старых данных
  private async cleanupOldData(): Promise<void> {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дней

    // Удаляем старые продукты
    await this.storage.iterate<OptimizedProduct>('products', (product, cursor) => {
      if (now - product.scrapedAt > maxAge) {
        cursor.delete();
      }
    });

    // Удаляем истекший кэш
    await this.storage.iterate<CacheEntry>('cache', (entry, cursor) => {
      if (entry.expiry < now) {
        cursor.delete();
      }
    });
  }

  // Удаление старых продуктов при нехватке места
  private async removeOldProducts(count: number): Promise<void> {
    const products = await this.storage.getAll<OptimizedProduct>('products');
    
    // Сортируем по дате и популярности
    products.sort((a, b) => {
      const aScore = a.popularityScore + (Date.now() - a.scrapedAt) / (1000 * 60 * 60 * 24);
      const bScore = b.popularityScore + (Date.now() - b.scrapedAt) / (1000 * 60 * 60 * 24);
      return bScore - aScore;
    });

    // Удаляем наименее важные продукты
    const toRemove = products.slice(0, count);
    for (const product of toRemove) {
      await this.storage.delete('products', product.id);
    }
  }

  // Получение размера индекса
  private async getIndexSize(): Promise<number> {
    const count = await this.storage.count('products');
    // Примерная оценка: 1KB на продукт
    return count * 1024;
  }

  // Сохранение истории поиска
  private async saveSearchHistory(query: string, filters: any, resultsCount: number): Promise<void> {
    const entry: SearchHistoryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      query,
      timestamp: Date.now(),
      resultsCount,
      filters
    };
    
    await this.storage.put('searchHistory', entry);
  }

  // Получение популярных поисков
  async getPopularSearches(limit: number = 10): Promise<string[]> {
    const history = await this.storage.getAll<SearchHistoryEntry>('searchHistory');
    
    // Группируем по запросам и считаем частоту
    const frequency = new Map<string, number>();
    history.forEach(entry => {
      frequency.set(entry.query, (frequency.get(entry.query) || 0) + 1);
    });

    // Сортируем по частоте
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query]) => query);
  }

  // Периодическая очистка кэша
  private startCacheCleanup(): void {
    this.cacheCleanupInterval = setInterval(() => {
      // Очищаем истекший кэш в памяти
      const now = Date.now();
      for (const [key, value] of this.memoryCache.entries()) {
        if (value.expiry < now) {
          this.memoryCache.delete(key);
        }
      }
      
      // Очищаем старые данные в IndexedDB
      this.cleanupOldData().catch(console.error);
    }, 60 * 60 * 1000); // Каждый час
  }

  // Остановка менеджера
  async destroy(): Promise<void> {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.memoryCache.clear();
    this.tokenCache.clear();
    this.storage.close();
  }

  // Экспорт данных
  async exportData(): Promise<{ products: ScrapedProduct[]; searchHistory: SearchHistoryEntry[] }> {
    const products = await this.storage.getAll<ScrapedProduct>('products');
    const searchHistory = await this.storage.getAll<SearchHistoryEntry>('searchHistory');
    
    return { products, searchHistory };
  }

  // Получение статистики
  async getStats(): Promise<any> {
    const productsCount = await this.storage.count('products');
    const searchHistoryCount = await this.storage.count('searchHistory');
    const cacheCount = await this.storage.count('cache');
    
    return {
      products: productsCount,
      searchHistory: searchHistoryCount,
      cache: cacheCount,
      memoryCache: this.memoryCache.size,
      tokenCache: this.tokenCache.size,
      estimatedSize: productsCount * 1024 // байт
    };
  }
}

// Создаем экземпляр для использования
export const optimizedSearchManager = new OptimizedSearchManager();