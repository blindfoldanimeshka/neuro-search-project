// ============================================================================
// WEB SCRAPER TYPES & INTERFACES
// ============================================================================

/**
 * Основные типы данных для вебскраппинга
 */

// ============================================================================
// PRODUCT INTERFACES
// ============================================================================

export interface ScrapedProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  image: string;
  url: string;
  source: string;
  category?: string;
  rating?: number;
  reviewsCount?: number;
  availability: boolean;
  description?: string;
  specifications?: Record<string, string>;
  scrapedAt: number;
  metadata?: Record<string, unknown>;
}

export interface ProductCard {
  element: any;
  source: string;
  index: number;
}

// ============================================================================
// SCRAPING RESULT INTERFACES
// ============================================================================

export interface ScrapingResult {
  source: string;
  products: ScrapedProduct[];
  totalFound: number;
  success: boolean;
  executionTime: number;
  error?: string;
  metadata?: {
    pageCount?: number;
    lastPage?: number;
    hasMorePages?: boolean;
    totalPages?: number;
    currentPage?: number;
  };
}

export interface BatchScrapingResult {
  results: ScrapingResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalTime: number;
    averageTime: number;
  };
  errors: ScrapingError[];
}

// ============================================================================
// SCRAPING OPTIONS INTERFACES
// ============================================================================

export interface ScrapingOptions {
  maxProducts?: number;
  timeout?: number;
  headless?: boolean;
  userAgent?: string;
  proxy?: string;
  delay?: number;
  retries?: number;
  waitForSelector?: string;
  scrollToLoad?: boolean;
  maxScrolls?: number;
  respectRobotsTxt?: boolean;
  rateLimit?: {
    requestsPerSecond: number;
    delayBetweenRequests: number;
  };
  customHeaders?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
  viewport?: {
    width: number;
    height: number;
  };
  screenshot?: boolean;
  pdf?: boolean;
}

export interface EnhancedScrapingOptions extends ScrapingOptions {
  maxConcurrent?: number;
  requestDelay?: number;
  maxRetries?: number;
  priority?: number;
  onProgress?: (progress: ScrapingProgress) => void;
  onError?: (error: ScrapingError) => void;
  onComplete?: (result: ScrapingResult) => void;
}

// ============================================================================
// SITE CONFIGURATION INTERFACES
// ============================================================================

export interface SiteConfig {
  name: string;
  baseUrl: string;
  searchUrl: string;
  selectors: {
    productCard: string;
    title: string;
    price: string;
    image: string;
    url: string;
    rating?: string;
    reviewsCount?: string;
    availability?: string;
    description?: string;
    category?: string;
    originalPrice?: string;
    discount?: string;
  };
  waitForSelector?: string;
  scrollToLoad?: boolean;
  maxScrolls?: number;
  pagination?: {
    selector?: string;
    nextPageSelector?: string;
    maxPages?: number;
    pageParam?: string;
  };
  priceExtractor?: (text: string) => number;
  imageExtractor?: (element: any) => string;
  urlExtractor?: (element: any) => string;
  customExtractors?: Record<string, (element: any) => unknown>;
  headers?: Record<string, string>;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
  antiBot?: {
    enabled: boolean;
    methods: ('userAgent' | 'headers' | 'cookies' | 'delays' | 'proxy')[];
  };
}

// ============================================================================
// QUEUE MANAGEMENT INTERFACES
// ============================================================================

export interface QueueItem {
  id: string;
  url: string;
  options: ScrapingOptions;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface QueueStatus {
  total: number;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  retrying: number;
}

export interface ScrapingProgress {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  successRate: number;
  estimatedTimeRemaining?: number;
}

// ============================================================================
// ERROR & STATISTICS INTERFACES
// ============================================================================

export interface ScrapingError {
  url: string;
  error: string;
  retryCount: number;
  timestamp: number;
  source?: string;
  statusCode?: number;
  responseTime?: number;
}

export interface ScrapingStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalProducts: number;
  averageResponseTime: number;
  successRate: number;
  totalTime: number;
  errors: Array<{ source: string; error: string; timestamp: number }>;
  sources: Record<string, {
    requests: number;
    success: number;
    failed: number;
    products: number;
    avgTime: number;
  }>;
}

// ============================================================================
// EVENT INTERFACES
// ============================================================================

export interface ScrapingEvents {
  queued: (data: { id: string; url: string; priority: number }) => void;
  started: (data: { id: string; url: string }) => void;
  completed: (data: { id: string; result: ScrapingResult }) => void;
  failed: (data: { id: string; error: ScrapingError }) => void;
  retrying: (data: { id: string; error: ScrapingError; retryCount: number }) => void;
  error: (error: ScrapingError) => void;
  progress: (progress: ScrapingProgress) => void;
  log: (message: string) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ScrapingSource = 'wildberries' | 'ozon' | 'avito' | 'yandex' | 'sbermegamarket' | 'all';

export type ScrapingPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export type ImageFormat = 'png' | 'jpeg' | 'webp';

// ============================================================================
// VALIDATION & SANITIZATION
// ============================================================================

/**
 * Валидация URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Очистка и нормализация текста
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .trim();
}

/**
 * Извлечение числового значения из текста
 */
export function extractNumber(text: string): number | undefined {
  const match = text.match(/[\d\s.,]+/);
  if (match) {
    const cleaned = match[0].replace(/[^\d.,]/g, '').replace(',', '.');
    const number = parseFloat(cleaned);
    return isNaN(number) ? undefined : number;
  }
  return undefined;
}

/**
 * Извлечение цены из текста
 */
export function extractPrice(text: string): { price: number; currency: string } | null {
  const priceRegex = /([\d\s.,]+)\s*([₽$€£₴₸₾₿]|[A-Z]{3})/i;
  const match = text.match(priceRegex);
  
  if (match) {
    const price = parseFloat(match[1].replace(/[^\d.,]/g, '').replace(',', '.'));
    const currency = match[2].toUpperCase();
    
    if (!isNaN(price)) {
      return { price, currency };
    }
  }
  
  return null;
}

/**
 * Нормализация URL изображения
 */
export function normalizeImageUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  
  try {
    if (url.startsWith('http')) {
      return url;
    } else if (url.startsWith('//')) {
      return `https:${url}`;
    } else if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${url}`;
    } else {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}/${url}`;
    }
  } catch {
    return url;
  }
}

/**
 * Нормализация URL продукта
 */
export function normalizeProductUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  
  try {
    if (url.startsWith('http')) {
      return url;
    } else if (url.startsWith('//')) {
      return `https:${url}`;
    } else if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}${url}`;
    } else {
      const base = new URL(baseUrl);
      return `${base.protocol}//${base.host}/${url}`;
    }
  } catch {
    return url;
  }
}

// ============================================================================
// DELAY & RATE LIMITING UTILITIES
// ============================================================================

/**
 * Создание задержки
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Создание экспоненциальной задержки для повторных попыток
 */
export function exponentialBackoff(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000);
}

/**
 * Ограничение скорости запросов
 */
export class RateLimiter {
  private lastRequestTime = 0;
  private minDelay: number;

  constructor(requestsPerSecond: number) {
    this.minDelay = 1000 / requestsPerSecond;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minDelay) {
      await delay(this.minDelay - timeSinceLastRequest);
    }
    
    this.lastRequestTime = Date.now();
  }
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Генерация уникального ID
 */
export function generateId(): string {
  return `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Генерация ID для продукта
 */
export function generateProductId(source: string, title: string, price: number): string {
  const hash = title.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substr(0, 10);
  return `${source}_${hash}_${price}`;
}

// ============================================================================
// CONFIGURATION HELPERS
// ============================================================================

/**
 * Создание конфигурации по умолчанию
 */
export function createDefaultConfig(): ScrapingOptions {
  return {
    maxProducts: 20,
    timeout: 30000,
    headless: true,
    delay: 1000,
    retries: 2,
    scrollToLoad: true,
    maxScrolls: 3,
    respectRobotsTxt: true,
    rateLimit: {
      requestsPerSecond: 1,
      delayBetweenRequests: 1000
    },
    viewport: {
      width: 1920,
      height: 1080
    }
  };
}

/**
 * Создание конфигурации для e-commerce
 */
export function createEcommerceConfig(): ScrapingOptions {
  return {
    ...createDefaultConfig(),
    maxProducts: 50,
    scrollToLoad: true,
    maxScrolls: 5,
    waitForSelector: '[data-testid="product-card"], .product-card, .item-card',
    customHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  };
}

/**
 * Создание конфигурации для контент-сайтов
 */
export function createContentConfig(): ScrapingOptions {
  return {
    ...createDefaultConfig(),
    maxProducts: 100,
    scrollToLoad: false,
    maxScrolls: 1,
    waitForSelector: 'article, .post, .entry, .content',
    customHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3'
    }
  };
}


