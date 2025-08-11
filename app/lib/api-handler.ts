import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, createErrorResponse, logError, AppError } from './error-handler';
import { withRateLimit, rateLimiters } from './rate-limiter';

export type ApiHandler<T = any> = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse<T>>;

export interface ApiHandlerOptions {
  // Валидация
  bodySchema?: z.ZodSchema;
  querySchema?: z.ZodSchema;
  
  // Rate limiting
  rateLimit?: 'standard' | 'strict' | 'search' | 'ai' | false;
  
  // Аутентификация
  requireAuth?: boolean;
  
  // Логирование
  logRequests?: boolean;
  
  // Кэширование
  cache?: {
    ttl: number; // время жизни кэша в секундах
    revalidate?: number;
  };
}

// Главная функция-обертка для API handlers
export function createApiHandler<TBody = any, TQuery = any, TResponse = any>(
  handler: (
    request: NextRequest,
    body: TBody,
    query: TQuery,
    context?: { params?: Record<string, string> }
  ) => Promise<TResponse>,
  options: ApiHandlerOptions = {}
): ApiHandler {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const startTime = Date.now();
    
    try {
      // 1. Логирование запроса
      if (options.logRequests) {
        console.log({
          timestamp: new Date().toISOString(),
          method: request.method,
          url: request.url,
          headers: Object.fromEntries(request.headers.entries())
        });
      }
      
      // 2. Проверка аутентификации (если требуется)
      if (options.requireAuth) {
        // TODO: Реализовать проверку аутентификации
        // const user = await checkAuth(request);
        // if (!user) {
        //   throw createApiError.authentication();
        // }
      }
      
      // 3. Валидация query параметров
      let query: TQuery = {} as TQuery;
      if (options.querySchema) {
        const { searchParams } = new URL(request.url);
        const queryData = Object.fromEntries(searchParams.entries());
        
        try {
          query = options.querySchema.parse(queryData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw createApiError.validation(
              'Invalid query parameters',
              error.errors
            );
          }
          throw error;
        }
      }
      
      // 4. Валидация body (для POST, PUT, PATCH)
      let body: TBody = {} as TBody;
      if (['POST', 'PUT', 'PATCH'].includes(request.method) && options.bodySchema) {
        try {
          const rawBody = await request.json();
          body = options.bodySchema.parse(rawBody);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw createApiError.validation(
              'Invalid request body',
              error.errors
            );
          }
          if (error instanceof SyntaxError) {
            throw createApiError.validation('Invalid JSON in request body');
          }
          throw error;
        }
      }
      
      // 5. Выполнение основного обработчика
      const result = await handler(request, body, query, context);
      
      // 6. Формирование успешного ответа
      const response = NextResponse.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime
      });
      
      // 7. Добавление заголовков кэширования
      if (options.cache) {
        response.headers.set(
          'Cache-Control',
          `public, s-maxage=${options.cache.ttl}, stale-while-revalidate=${options.cache.revalidate || options.cache.ttl}`
        );
      }
      
      return response;
      
    } catch (error) {
      // Обработка ошибок
      const { error: appError, status } = handleApiError(error);
      
      return NextResponse.json(
        createErrorResponse(appError),
        { status }
      );
    }
  };
}

// Хелперы для создания API routes с типизацией
export function createGetHandler<TQuery = any, TResponse = any>(
  handler: (request: NextRequest, query: TQuery) => Promise<TResponse>,
  options?: ApiHandlerOptions
) {
  return createApiHandler<never, TQuery, TResponse>(
    async (request, _, query) => handler(request, query),
    options
  );
}

export function createPostHandler<TBody = any, TResponse = any>(
  handler: (request: NextRequest, body: TBody) => Promise<TResponse>,
  options?: ApiHandlerOptions
) {
  return createApiHandler<TBody, never, TResponse>(
    async (request, body) => handler(request, body),
    options
  );
}

// Функция для применения rate limiting к уже созданному handler
export function withApiRateLimit(
  handler: ApiHandler,
  rateLimitType: 'standard' | 'strict' | 'search' | 'ai' = 'standard'
): ApiHandler {
  const limiter = rateLimiters[rateLimitType];
  
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    // Преобразуем NextRequest в обычный Request для rate limiter
    const standardRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    // Применяем rate limiting
    const response = await limiter(
      standardRequest,
      async () => handler(request, context)
    );
    
    // Преобразуем Response обратно в NextResponse
    const body = await response.json();
    return NextResponse.json(body, {
      status: response.status,
      headers: response.headers
    });
  };
}

// Экспортируем также отдельные функции для обработки ошибок
export { createApiError, handleApiError, createErrorResponse } from './error-handler';