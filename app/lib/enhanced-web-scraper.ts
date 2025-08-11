import { WebScraper, ScrapingResult, ScrapingOptions, ScrapedProduct } from './web-scraper';
import { EventEmitter } from 'events';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface QueueItem {
  id: string;
  url: string;
  options: ScrapingOptions;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
}

export interface EnhancedScrapingOptions extends Partial<ScrapingOptions> {
  maxConcurrent?: number;
  requestDelay?: number;
  maxRetries?: number;
  timeout?: number;
  priority?: number;
  onProgress?: (progress: ScrapingProgress) => void;
  onError?: (error: ScrapingError) => void;
}

export interface ScrapingProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  currentUrl?: string;
  estimatedTimeRemaining?: number;
}

export interface ScrapingError {
  url: string;
  error: string;
  retryCount: number;
  timestamp: number;
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
// ENHANCED WEB SCRAPER CLASS
// ============================================================================

export class EnhancedWebScraper extends EventEmitter {
  private scraper: WebScraper;
  private queue: QueueItem[] = [];
  private activeRequests = new Set<string>();
  private isProcessing = false;
  private maxConcurrent: number;
  private requestDelay: number;
  private maxRetries: number;
  private timeout: number;
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTime: 0,
  };
  private resultMap = new Map<string, ScrapingResult | ScrapingError>();

  constructor(options: EnhancedScrapingOptions = {}) {
    super();

    this.scraper = new WebScraper();
    this.maxConcurrent = options.maxConcurrent ?? 3;
    this.requestDelay = options.requestDelay ?? 1000;
    this.maxRetries = options.maxRetries ?? 3;
    this.timeout = options.timeout ?? 30000;
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Add URL to scraping queue
   */
  async addToQueue(url: string, options: ScrapingOptions = {}, priority = 0): Promise<string> {
    const id = this.generateId();
    const queueItem: QueueItem = {
      id,
      url,
      options,
      priority,
      retryCount: 0,
      maxRetries: this.maxRetries,
      createdAt: Date.now(),
    };

    // Insert based on priority (higher priority first)
    const insertIndex = this.queue.findIndex(item => item.priority < priority);
    if (insertIndex === -1) {
      this.queue.push(queueItem);
    } else {
      this.queue.splice(insertIndex, 0, queueItem);
    }

    this.emit('queued', { id, url, priority });

    // Start processing if not already running
    if (!this.isProcessing) {
      void this.processQueue();
    }

    return id;
  }

  /**
   * Remove item from queue
   */
  removeFromQueue(id: string): boolean {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.emit('removed', { id });
      return true;
    }
    return false;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { total: number; active: number; waiting: number } {
    return {
      total: this.queue.length + this.activeRequests.size,
      active: this.activeRequests.size,
      waiting: this.queue.length,
    };
  }

  /**
   * Clear entire queue
   */
  clearQueue(): void {
    this.queue = [];
    this.emit('queueCleared');
  }

  // ============================================================================
  // BATCH SCRAPING
  // ============================================================================

  /**
   * Scrape multiple URLs with queue management
   */
  async scrapeBatch(urls: string[], options: EnhancedScrapingOptions = {}): Promise<BatchScrapingResult> {
    const startTime = Date.now();
    const results: ScrapingResult[] = [];
    const errors: ScrapingError[] = [];

    // Add all URLs to queue and track URL by ID
    const urlMap = new Map<string, string>();
    const promises = urls.map(async url => {
      const id = await this.addToQueue(url, options, options.priority ?? 0);
      urlMap.set(id, url);
      return id;
    });
    const ids = await Promise.all(promises);

    // Wait for all to complete
    const completedResults = await this.waitForCompletion(ids);

    // Process results
    for (let i = 0; i < completedResults.length; i++) {
      const result = completedResults[i];
      const id = ids[i];
      const url = urlMap.get(id) ?? 'unknown';
      if ((result as ScrapingResult).success) {
        results.push(result as ScrapingResult);
      } else {
        const err = result as ScrapingError;
        errors.push({
          url,
          error: err.error || 'Unknown error',
          retryCount: err.retryCount ?? 0,
          timestamp: err.timestamp ?? Date.now(),
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const summary = {
      total: urls.length,
      successful: results.length,
      failed: errors.length,
      totalTime,
      averageTime: urls.length > 0 ? totalTime / urls.length : 0,
    };

    return { results, summary, errors };
  }

  /**
   * Wait for specific queue items to complete
   */
  private async waitForCompletion(ids: string[]): Promise<(ScrapingResult | ScrapingError)[]> {
    return new Promise((resolve) => {
      const results: (ScrapingResult | ScrapingError)[] = [];
      const completedIds = new Set<string>();

      const onCompleted = (data: { id: string; result: ScrapingResult }) => {
        if (ids.includes(data.id) && !completedIds.has(data.id)) {
          completedIds.add(data.id);
          this.resultMap.set(data.id, data.result);
          results[ids.indexOf(data.id)] = data.result;
          checkComplete();
        }
      };

      const onFailed = (data: { id: string; error: ScrapingError }) => {
        if (ids.includes(data.id) && !completedIds.has(data.id)) {
          completedIds.add(data.id);
          this.resultMap.set(data.id, data.error);
          results[ids.indexOf(data.id)] = data.error;
          checkComplete();
        }
      };

      const checkComplete = () => {
        if (completedIds.size === ids.length) {
          this.off('completed', onCompleted);
          this.off('failed', onFailed);
          resolve(results);
        }
      };

      this.on('completed', onCompleted);
      this.on('failed', onFailed);

      // In case some are already completed (should not happen, but for safety)
      checkComplete();
    });
  }

  // ============================================================================
  // QUEUE PROCESSING
  // ============================================================================

  /**
   * Process queue items
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeRequests.size < this.maxConcurrent) {
      const item = this.queue.shift();
      if (!item) break;

      void this.processQueueItem(item);

      // Add delay between requests
      if (this.requestDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay));
      }
    }

    this.isProcessing = false;

    // If there are still items in queue, continue processing
    if (this.queue.length > 0) {
      setTimeout(() => void this.processQueue(), 100);
    }
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: QueueItem): Promise<void> {
    this.activeRequests.add(item.id);
    this.emit('started', { id: item.id, url: item.url });

    try {
      // Set timeout for the request
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.timeout);
      });

      // Execute scraping with timeout
      const result = await Promise.race([
        this.scraper.scrapeByUrl(item.url, item.options),
        timeoutPromise,
      ]);

      // Convert result to ScrapingResult format
      const scrapingResult: ScrapingResult = {
        source: this.extractSourceFromUrl(item.url),
        products: result.products,
        totalFound: result.products.length,
        success: true,
        executionTime: Date.now() - item.createdAt,
        metadata: {
          pageCount: 1,
          lastPage: 1,
          hasMorePages: false
        }
      };

      this.stats.successfulRequests++;
      this.stats.totalTime += Date.now() - item.createdAt;

      this.emit('completed', { id: item.id, result: scrapingResult });

    } catch (error: any) {
      this.stats.failedRequests++;

      const errorData: ScrapingError = {
        url: item.url,
        error: error instanceof Error ? error.message : String(error),
        retryCount: item.retryCount,
        timestamp: Date.now(),
      };

      // Retry logic
      if (item.retryCount < item.maxRetries) {
        item.retryCount++;
        item.priority -= 1; // Повышаем приоритет для повторных попыток

        // Add back to queue with delay
        setTimeout(() => {
          this.queue.unshift(item);
          void this.processQueue();
        }, Math.pow(2, item.retryCount) * 1000); // Exponential backoff

        this.emit('retrying', { id: item.id, error: errorData, retryCount: item.retryCount });
      } else {
        this.emit('failed', { id: item.id, error: errorData });
        this.emit('error', errorData);
      }
    } finally {
      this.activeRequests.delete(item.id);
      this.stats.totalRequests++;

      // Continue processing queue
      if (this.queue.length > 0) {
        void this.processQueue();
      }
    }
  }

  // ============================================================================
  // STATISTICS & MONITORING
  // ============================================================================

  /**
   * Get scraping statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0
        ? (this.stats.successfulRequests / this.stats.totalRequests) * 100
        : 0,
      averageResponseTime: this.stats.successfulRequests > 0
        ? this.stats.totalTime / this.stats.successfulRequests
        : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTime: 0,
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate unique ID for queue items
   */
  private generateId(): string {
    return `scrape_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Close scraper and cleanup
   */
  async close(): Promise<void> {
    this.clearQueue();
    this.activeRequests.clear();
    this.isProcessing = false;
    await this.scraper.close();
    this.emit('closed');
  }

  /**
   * Get current progress
   */
  getProgress(): ScrapingProgress {
    const total = this.queue.length + this.activeRequests.size + this.stats.successfulRequests + this.stats.failedRequests;
    const completed = this.stats.successfulRequests + this.stats.failedRequests;
    const inProgress = this.activeRequests.size;

    return {
      total,
      completed,
      failed: this.stats.failedRequests,
      inProgress,
      estimatedTimeRemaining: this.calculateEstimatedTime(),
    };
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTime(): number | undefined {
    if (this.stats.successfulRequests === 0) return undefined;

    const avgTime = this.stats.totalTime / this.stats.successfulRequests;
    const remaining = this.queue.length + this.activeRequests.size;

    return Math.ceil(avgTime * remaining / this.maxConcurrent);
  }

  /**
   * Extract source from URL for error handling
   */
  private extractSourceFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return 'unknown';
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create enhanced scraper with default settings
 */
export function createEnhancedScraper(options: EnhancedScrapingOptions = {}): EnhancedWebScraper {
  return new EnhancedWebScraper(options);
}

/**
 * Create scraper optimized for e-commerce sites
 */
export function createEcommerceScraper(): EnhancedWebScraper {
  return new EnhancedWebScraper({
    maxConcurrent: 2,
    requestDelay: 2000,
    maxRetries: 2,
    timeout: 45000,
  });
}

/**
 * Create scraper optimized for news/content sites
 */
export function createContentScraper(): EnhancedWebScraper {
  return new EnhancedWebScraper({
    maxConcurrent: 5,
    requestDelay: 500,
    maxRetries: 1,
    timeout: 20000,
  });
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type {
  ScrapingResult,
  ScrapingOptions,
  ScrapedProduct,
};
