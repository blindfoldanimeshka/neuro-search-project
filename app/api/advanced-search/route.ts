import { NextRequest } from 'next/server';
import { z } from 'zod';
import { advancedSearchIndex, SearchQuery, SearchResponse } from '@/lib/advanced-search-index';
import { createPostHandler, createGetHandler, createApiError } from '@/lib/api-handler';

// Схема валидации для POST запроса
const searchQuerySchema = z.object({
  text: z.string().optional(),
  filters: z.object({
    sources: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    priceRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional()
    }).optional(),
    ratingRange: z.object({
      min: z.number().min(0).max(5).optional(),
      max: z.number().min(0).max(5).optional()
    }).optional(),
    availability: z.boolean().optional(),
    dateRange: z.object({
      from: z.number().optional(),
      to: z.number().optional()
    }).optional(),
    features: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
    location: z.string().optional(),
    seller: z.string().optional()
  }).optional(),
  sortBy: z.enum(['relevance', 'price', 'rating', 'date', 'popularity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  facets: z.boolean().optional(),
  suggestions: z.boolean().optional()
});

// Схема валидации для GET запроса
const getQuerySchema = z.object({
  q: z.string().optional(),
  source: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  maxPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  sortBy: z.enum(['relevance', 'price', 'rating', 'date', 'popularity']).optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => parseInt(val) || 20).optional()
});

// POST обработчик для расширенного поиска
export const POST = createPostHandler<z.infer<typeof searchQuerySchema>, SearchResponse>(
  async (request, body) => {
    const searchQuery: SearchQuery = body;

    // Валидация запроса
    if (!searchQuery || (!searchQuery.text && !searchQuery.filters)) {
      throw createApiError.validation('Search query or filters are required');
    }

    // Выполняем поиск
    const results = await advancedSearchIndex.search(searchQuery);

    return results;
  },
  {
    bodySchema: searchQuerySchema,
    rateLimit: 'search',
    cache: {
      ttl: 300, // кэш на 5 минут
      revalidate: 60
    }
  }
);

// GET обработчик для простых поисков
export const GET = createGetHandler<z.infer<typeof getQuerySchema>, SearchResponse>(
  async (request, query) => {
    // Преобразуем GET параметры в SearchQuery
    const searchQuery: SearchQuery = {
      text: query.q,
      filters: {
        sources: query.source ? [query.source] : undefined,
        categories: query.category ? [query.category] : undefined,
        priceRange: {
          min: query.minPrice,
          max: query.maxPrice
        }
      },
      sortBy: query.sortBy || 'relevance',
      page: query.page || 1,
      limit: query.limit || 20,
      facets: true,
      suggestions: true
    };

    const results = await advancedSearchIndex.search(searchQuery);
    return results;
  },
  {
    querySchema: getQuerySchema,
    rateLimit: 'search',
    cache: {
      ttl: 300,
      revalidate: 60
    }
  }
);