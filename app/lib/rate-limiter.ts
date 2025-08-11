import { createApiError } from './error-handler';

export interface RateLimitConfig {
  windowMs: number; // временное окно в миллисекундах
  maxRequests: number; // максимум запросов за окно
  keyGenerator?: (req: Request) => string; // функция для генерации ключа
  skipSuccessfulRequests?: boolean; // пропускать успешные запросы
  skipFailedRequests?: boolean; // пропускать неуспешные запросы
}

// Простой in-memory store для rate limiting
// В production лучше использовать Redis
class InMemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Очищаем устаревшие записи каждую минуту
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const resetTime = now + windowMs;
    
    const current = this.store.get(key);
    
    if (current && current.resetTime > now) {
      current.count++;
      return current;
    }
    
    const newEntry = { count: 1, resetTime };
    this.store.set(key, newEntry);
    return newEntry;
  }

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetTime > Date.now()) {
      return entry;
    }
    return undefined;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Создаем глобальный store
const store = new InMemoryStore();

// Функция rate limiter
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config;

  return async function rateLimiter(
    request: Request,
    handler: () => Promise<Response>
  ): Promise<Response> {
    const key = keyGenerator(request);
    const current = store.get(key);
    
    // Проверяем текущий счетчик
    if (current && current.count >= maxRequests) {
      const retryAfter = Math.ceil((current.resetTime - Date.now()) / 1000);
      
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: `Превышен лимит запросов. Попробуйте через ${retryAfter} секунд.`,
          retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': current.resetTime.toString(),
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    // Увеличиваем счетчик
    const { count, resetTime } = store.increment(key, windowMs);
    
    // Выполняем основной обработчик
    try {
      const response = await handler();
      
      // Добавляем заголовки rate limit
      response.headers.set('X-RateLimit-Limit', maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - count).toString());
      response.headers.set('X-RateLimit-Reset', resetTime.toString());
      
      // Если нужно пропускать успешные запросы, откатываем счетчик
      if (skipSuccessfulRequests && response.ok) {
        const current = store.get(key);
        if (current && current.count > 0) {
          current.count--;
        }
      }
      
      return response;
    } catch (error) {
      // Если нужно пропускать неуспешные запросы, откатываем счетчик
      if (skipFailedRequests) {
        const current = store.get(key);
        if (current && current.count > 0) {
          current.count--;
        }
      }
      throw error;
    }
  };
}

// Функция для генерации ключа по умолчанию
function defaultKeyGenerator(request: Request): string {
  // Пытаемся получить IP адрес
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  // Добавляем путь для более гранулярного контроля
  const url = new URL(request.url);
  return `${ip}:${url.pathname}`;
}

// Предустановленные конфигурации
export const rateLimiters = {
  // Стандартный лимит для API
  standard: createRateLimiter({
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 100
  }),
  
  // Строгий лимит для чувствительных операций
  strict: createRateLimiter({
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 10
  }),
  
  // Лимит для поиска
  search: createRateLimiter({
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 30,
    skipSuccessfulRequests: true // не считаем успешные поиски
  }),
  
  // Лимит для AI операций
  ai: createRateLimiter({
    windowMs: 60 * 1000, // 1 минута
    maxRequests: 20
  })
};

// Функция для применения rate limiting к API route
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  limiter = rateLimiters.standard
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    return limiter(req, () => handler(req));
  };
}