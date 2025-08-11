import { ScrapedProduct } from './web-scraper';

export interface AdvancedSearchFilters {
  query?: string;
  sources?: string[];
  categories?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  ratingRange?: {
    min?: number;
    max?: number;
  };
  availability?: boolean;
  dateRange?: {
    from?: number;
    to?: number;
  };
  features?: Record<string, string | number | boolean>;
  location?: string;
  seller?: string;
}

export interface SearchQuery {
  text?: string;
  filters?: AdvancedSearchFilters;
  sortBy?: 'relevance' | 'price' | 'rating' | 'date' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  facets?: boolean;
  suggestions?: boolean;
}

export interface SearchResponse {
  products: ScrapedProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: FacetResults;
  suggestions?: string[];
  searchTime: number;
  query: SearchQuery;
}

export interface FacetResults {
  sources: FacetBucket[];
  categories: FacetBucket[];
  priceRanges: FacetBucket[];
  ratingRanges: FacetBucket[];
  availability: FacetBucket[];
  dateRanges: FacetBucket[];
}

export interface FacetBucket {
  key: string;
  count: number;
  selected?: boolean;
}

export interface ProductDocument {
  id: string;
  title: string;
  titleTokens: string[];
  description?: string;
  descriptionTokens?: string[];
  category?: string;
  categoryTokens?: string[];
  source: string;
  price: number;
  priceRange: string;
  rating?: number;
  ratingRange: string;
  availability: boolean;
  location?: string;
  seller?: string;
  features: Record<string, any>;
  scrapedAt: number;
  dateRange: string;
  popularity: number;
  searchScore: number;
}

export interface IndexMetadata {
  version: string;
  createdAt: number;
  lastUpdated: number;
  totalDocuments: number;
  indexSize: number;
  settings: IndexSettings;
}

export interface IndexSettings {
  minWordLength: number;
  maxWordLength: number;
  stopWords: string[];
  synonyms: Record<string, string[]>;
  boostFactors: Record<string, number>;
}

class AdvancedSearchIndex {
  private documents: Map<string, ProductDocument> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();
  private metadata: IndexMetadata;
  private settings: IndexSettings;

  constructor() {
    this.settings = {
      minWordLength: 3,
      maxWordLength: 20,
      stopWords: ['и', 'в', 'с', 'по', 'для', 'от', 'до', 'на', 'за', 'из', 'к', 'у', 'о', 'об', 'со', 'во'],
      synonyms: {
        'смартфон': ['телефон', 'мобильный', 'мобильник'],
        'ноутбук': ['лэптоп', 'компьютер'],
        'телевизор': ['тв', 'телек']
      },
      boostFactors: {
        title: 3.0,
        category: 2.0,
        description: 1.0,
        brand: 2.5
      }
    };

    this.metadata = {
      version: '2.0.0',
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      totalDocuments: 0,
      indexSize: 0,
      settings: this.settings
    };

    this.loadFromStorage();
  }

  // Добавление товара в индекс
  async addProduct(product: ScrapedProduct): Promise<void> {
    const document = this.createDocument(product);
    this.documents.set(product.id, document);
    
    // Обновляем инвертированный индекс
    this.updateInvertedIndex(document);
    
    this.metadata.totalDocuments = this.documents.size;
    this.metadata.lastUpdated = Date.now();
    this.metadata.indexSize = this.calculateIndexSize();
    
    this.saveToStorage();
  }

  // Создание документа для индексации
  private createDocument(product: ScrapedProduct): ProductDocument {
    const titleTokens = this.tokenize(product.title);
    const descriptionTokens = product.description ? this.tokenize(product.description) : [];
    const categoryTokens = product.category ? this.tokenize(product.category) : [];

    return {
      id: product.id,
      title: product.title,
      titleTokens,
      description: product.description,
      descriptionTokens,
      category: product.category,
      categoryTokens,
      source: product.source,
      price: product.price,
      priceRange: this.getPriceRange(product.price),
      rating: product.rating,
      ratingRange: this.getRatingRange(product.rating),
      availability: product.availability,
      location: product.source === 'avito' ? 'Москва' : undefined,
      seller: product.source,
      features: this.extractFeatures(product),
      scrapedAt: product.scrapedAt,
      dateRange: this.getDateRange(product.scrapedAt),
      popularity: this.calculatePopularity(product),
      searchScore: 0
    };
  }

  // Токенизация текста
  private tokenize(text: string): string[] {
    if (!text) return [];
    
    return text
      .toLowerCase()
      .replace(/[^\w\sа-яё]/gi, ' ')
      .split(/\s+/)
      .filter(token => 
        token.length >= this.settings.minWordLength && 
        token.length <= this.settings.maxWordLength &&
        !this.settings.stopWords.includes(token)
      )
      .map(token => this.normalizeToken(token));
  }

  // Нормализация токена
  private normalizeToken(token: string): string {
    // Приведение к базовой форме (лемматизация)
    // В реальной реализации здесь будет использоваться библиотека лемматизации
    return token;
  }

  // Получение диапазона цен
  private getPriceRange(price: number): string {
    if (price <= 1000) return '0-1000';
    if (price <= 5000) return '1000-5000';
    if (price <= 20000) return '5000-20000';
    if (price <= 100000) return '20000-100000';
    return '100000+';
  }

  // Получение диапазона рейтинга
  private getRatingRange(rating?: number): string {
    if (!rating) return 'no-rating';
    if (rating < 3) return '0-3';
    if (rating < 4) return '3-4';
    return '4-5';
  }

  // Получение диапазона дат
  private getDateRange(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const days = diff / (1000 * 60 * 60 * 24);

    if (days <= 1) return 'today';
    if (days <= 7) return 'week';
    if (days <= 30) return 'month';
    if (days <= 90) return 'quarter';
    return 'old';
  }

  // Извлечение характеристик товара
  private extractFeatures(product: ScrapedProduct): Record<string, any> {
    const features: Record<string, any> = {};
    
    if (product.specifications) {
      Object.assign(features, product.specifications);
    }
    
    // Извлекаем бренд из названия
    const brandMatch = product.title.match(/^(Samsung|Apple|Xiaomi|Huawei|Sony|LG|Philips|Bosch|Electrolux)/i);
    if (brandMatch) {
      features.brand = brandMatch[1];
    }
    
    return features;
  }

  // Расчет популярности товара
  private calculatePopularity(product: ScrapedProduct): number {
    let score = 0;
    
    // Базовый балл за рейтинг
    if (product.rating) {
      score += product.rating * 10;
    }
    
    // Балл за количество отзывов
    if (product.reviewsCount) {
      score += Math.min(product.reviewsCount / 10, 50);
    }
    
    // Балл за свежесть
    const daysOld = (Date.now() - product.scrapedAt) / (1000 * 60 * 60 * 24);
    if (daysOld <= 1) score += 20;
    else if (daysOld <= 7) score += 10;
    else if (daysOld <= 30) score += 5;
    
    return Math.round(score);
  }

  // Обновление инвертированного индекса
  private updateInvertedIndex(document: ProductDocument): void {
    const allTokens = [
      ...document.titleTokens,
      ...(document.descriptionTokens || []),
      ...(document.categoryTokens || [])
    ];

    for (const token of allTokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token)!.add(document.id);
    }
  }

  // Поиск по индексу
  async search(query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    
    let results = Array.from(this.documents.values());
    
    // Применяем фильтры
    if (query.filters) {
      results = this.applyFilters(results, query.filters);
    }
    
    // Выполняем текстовый поиск
    if (query.text && query.text.trim()) {
      results = this.textSearch(results, query.text.trim());
    }
    
    // Сортируем результаты
    results = this.sortResults(results, query.sortBy || 'relevance', query.sortOrder || 'desc');
    
    // Применяем пагинацию
    const page = query.page || 1;
    const limit = query.limit || 20;
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);
    
    // Формируем ответ
    const response: SearchResponse = {
      products: paginatedResults.map(doc => this.documentToProduct(doc)),
      total,
      page,
      limit,
      totalPages,
      searchTime: Date.now() - startTime,
      query
    };
    
    // Добавляем фасеты, если требуется
    if (query.facets) {
      response.facets = this.calculateFacets(results);
    }
    
    // Добавляем предложения, если требуется
    if (query.suggestions && query.text) {
      response.suggestions = this.generateSuggestions(query.text);
    }
    
    return response;
  }

  // Применение фильтров
  private applyFilters(documents: ProductDocument[], filters: AdvancedSearchFilters): ProductDocument[] {
    let filtered = documents;

    if (filters.sources && filters.sources.length > 0) {
      filtered = filtered.filter(doc => filters.sources!.includes(doc.source));
    }

    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(doc => doc.category && filters.categories!.includes(doc.category));
    }

    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) {
        filtered = filtered.filter(doc => doc.price >= filters.priceRange!.min!);
      }
      if (filters.priceRange.max !== undefined) {
        filtered = filtered.filter(doc => doc.price <= filters.priceRange!.max!);
      }
    }

    if (filters.ratingRange) {
      if (filters.ratingRange.min !== undefined) {
        filtered = filtered.filter(doc => doc.rating && doc.rating >= filters.ratingRange!.min!);
      }
      if (filters.ratingRange.max !== undefined) {
        filtered = filtered.filter(doc => doc.rating && doc.rating <= filters.ratingRange!.max!);
      }
    }

    if (filters.availability !== undefined) {
      filtered = filtered.filter(doc => doc.availability === filters.availability);
    }

    if (filters.dateRange) {
      if (filters.dateRange.from !== undefined) {
        filtered = filtered.filter(doc => doc.scrapedAt >= filters.dateRange!.from!);
      }
      if (filters.dateRange.to !== undefined) {
        filtered = filtered.filter(doc => doc.scrapedAt <= filters.dateRange!.to!);
      }
    }

    if (filters.location) {
      filtered = filtered.filter(doc => doc.location && doc.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }

    if (filters.seller) {
      filtered = filtered.filter(doc => doc.seller && doc.seller.toLowerCase().includes(filters.seller!.toLowerCase()));
    }

    if (filters.features) {
      for (const [key, value] of Object.entries(filters.features)) {
        filtered = filtered.filter(doc => 
          doc.features[key] !== undefined && doc.features[key] === value
        );
      }
    }

    return filtered;
  }

  // Текстовый поиск
  private textSearch(documents: ProductDocument[], query: string): ProductDocument[] {
    const queryTokens = this.tokenize(query);
    const scoredDocs: Array<{ doc: ProductDocument; score: number }> = [];

    for (const doc of documents) {
      let score = 0;
      
      for (const token of queryTokens) {
        // Поиск в названии
        if (doc.titleTokens.includes(token)) {
          score += this.settings.boostFactors.title;
        }
        
        // Поиск в категории
        if (doc.categoryTokens && doc.categoryTokens.includes(token)) {
          score += this.settings.boostFactors.category;
        }
        
        // Поиск в описании
        if (doc.descriptionTokens && doc.descriptionTokens.includes(token)) {
          score += this.settings.boostFactors.description;
        }
        
        // Поиск в характеристиках
        if (doc.features.brand && doc.features.brand.toLowerCase().includes(token)) {
          score += this.settings.boostFactors.brand;
        }
        
        // Проверяем синонимы
        for (const [synonym, words] of Object.entries(this.settings.synonyms)) {
          if (words.includes(token) && (doc.titleTokens.includes(synonym) || 
              (doc.categoryTokens && doc.categoryTokens.includes(synonym)))) {
            score += 1.5;
          }
        }
      }
      
      if (score > 0) {
        scoredDocs.push({ doc, score });
      }
    }

    // Сортируем по релевантности
    scoredDocs.sort((a, b) => b.score - a.score);
    
    // Обновляем searchScore в документах
    scoredDocs.forEach(({ doc, score }) => {
      doc.searchScore = score;
    });

    return scoredDocs.map(item => item.doc);
  }

  // Сортировка результатов
  private sortResults(documents: ProductDocument[], sortBy: string, sortOrder: 'asc' | 'desc'): ProductDocument[] {
    const sorted = [...documents];

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
      case 'popularity':
        sorted.sort((a, b) => sortOrder === 'asc' ? a.popularity - b.popularity : b.popularity - a.popularity);
        break;
      case 'relevance':
      default:
        // Сортируем по searchScore (уже установлен в textSearch)
        sorted.sort((a, b) => b.searchScore - a.searchScore);
        break;
    }

    return sorted;
  }

  // Расчет фасетов
  private calculateFacets(documents: ProductDocument[]): FacetResults {
    const facets: FacetResults = {
      sources: this.calculateFacet(documents, 'source'),
      categories: this.calculateFacet(documents, 'category'),
      priceRanges: this.calculateFacet(documents, 'priceRange'),
      ratingRanges: this.calculateFacet(documents, 'ratingRange'),
      availability: this.calculateFacet(documents, 'availability'),
      dateRanges: this.calculateFacet(documents, 'dateRange')
    };

    return facets;
  }

  // Расчет фасета для конкретного поля
  private calculateFacet(documents: ProductDocument[], field: keyof ProductDocument): FacetBucket[] {
    const counts = new Map<string, number>();
    
    for (const doc of documents) {
      const value = doc[field];
      if (value !== undefined && value !== null) {
        const key = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    
    return Array.from(counts.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Генерация предложений
  private generateSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const queryTokens = this.tokenize(query);
    
    if (queryTokens.length === 0) return suggestions;
    
    const lastToken = queryTokens[queryTokens.length - 1];
    
    // Ищем похожие токены в индексе
    for (const [token, docIds] of this.invertedIndex.entries()) {
      if (token.startsWith(lastToken) && token !== lastToken) {
        const suggestion = queryTokens.slice(0, -1).join(' ') + ' ' + token;
        suggestions.push(suggestion);
        
        if (suggestions.length >= 5) break;
      }
    }
    
    return suggestions;
  }

  // Преобразование документа в товар
  private documentToProduct(doc: ProductDocument): ScrapedProduct {
    return {
      id: doc.id,
      title: doc.title,
      price: doc.price,
      currency: 'RUB',
      image: '',
      url: '',
      source: doc.source,
      category: doc.category,
      rating: doc.rating,
      availability: doc.availability,
      description: doc.description,
      scrapedAt: doc.scrapedAt
    };
  }

  // Получение статистики индекса
  getIndexStats(): IndexMetadata {
    return { ...this.metadata };
  }

  // Очистка индекса
  clearIndex(): void {
    this.documents.clear();
    this.invertedIndex.clear();
    this.metadata.totalDocuments = 0;
    this.metadata.lastUpdated = Date.now();
    this.metadata.indexSize = 0;
    this.saveToStorage();
  }

  // Сохранение в localStorage
  private saveToStorage(): void {
    try {
      const data = {
        documents: Array.from(this.documents.entries()),
        invertedIndex: Array.from(this.invertedIndex.entries()).map(([token, docIds]) => [token, Array.from(docIds)]),
        metadata: this.metadata
      };
      localStorage.setItem('advancedSearchIndex', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving advanced search index to storage:', error);
    }
  }

  // Загрузка из localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('advancedSearchIndex');
      if (stored) {
        const data = JSON.parse(stored);
        
        if (data.documents) {
          this.documents = new Map(data.documents);
        }
        
        if (data.invertedIndex) {
          this.invertedIndex = new Map(
            data.invertedIndex.map(([token, docIds]: [string, string[]]) => [token, new Set(docIds)])
          );
        }
        
        if (data.metadata) {
          this.metadata = { ...this.metadata, ...data.metadata };
        }
        
        console.log(`Loaded ${this.documents.size} documents from advanced search index`);
      }
    } catch (error) {
      console.error('Error loading advanced search index from storage:', error);
    }
  }

  // Расчет размера индекса
  private calculateIndexSize(): number {
    let size = 0;
    
    // Размер документов
    for (const doc of this.documents.values()) {
      size += JSON.stringify(doc).length;
    }
    
    // Размер инвертированного индекса
    for (const [token, docIds] of this.invertedIndex.entries()) {
      size += token.length + docIds.size * 8; // Примерная оценка
    }
    
    return size;
  }
}

// Экспортируем экземпляр класса
export const advancedSearchIndex = new AdvancedSearchIndex();

// Экспортируем типы для использования в других модулях
export type { 
  AdvancedSearchFilters, 
  SearchQuery, 
  SearchResponse, 
  FacetResults, 
  FacetBucket, 
  ProductDocument, 
  IndexMetadata, 
  IndexSettings 
};
