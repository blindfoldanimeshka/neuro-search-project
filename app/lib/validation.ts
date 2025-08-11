import { z } from 'zod';

// Базовые схемы
export const StringSchema = z.string().min(1, 'Поле обязательно для заполнения');
export const EmailSchema = z.string().email('Неверный формат email');
export const NumberSchema = z.number().min(0, 'Значение должно быть положительным');
export const BooleanSchema = z.boolean();

// Схемы для поиска
export const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Поисковый запрос не может быть пустым').max(200, 'Запрос слишком длинный'),
  filters: z.object({
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    yearFrom: z.number().min(1900).max(new Date().getFullYear()).optional(),
    yearTo: z.number().min(1900).max(new Date().getFullYear()).optional(),
  }).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

// Схемы для AI запросов
export const AIRequestSchema = z.object({
  message: z.string().min(1, 'Сообщение не может быть пустым').max(2000, 'Сообщение слишком длинное'),
  model: z.string().optional(),
  context: z.string().optional(),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().min(1).max(4000).optional().default(1000),
});

// Схемы для продуктов
export const ProductSchema = z.object({
  id: z.string().min(1, 'ID продукта обязателен'),
  name: z.string().min(1, 'Название продукта обязательно').max(200, 'Название слишком длинное'),
  price: z.number().min(0, 'Цена должна быть положительной'),
  originalPrice: z.number().min(0).optional(),
  image: z.string().url('Неверный URL изображения').optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().min(0).optional(),
  isNew: z.boolean().optional(),
  discount: z.number().min(0).max(100).optional(),
  url: z.string().url('Неверный URL').optional(),
  seller: z.string().optional(),
  availability: z.boolean().optional().default(true),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  deliveryTime: z.string().optional(),
  location: z.string().optional(),
});

// Схемы для фильтров
export const FiltersSchema = z.object({
  yearFrom: z.number().min(1900).max(new Date().getFullYear()),
  yearTo: z.number().min(1900).max(new Date().getFullYear()),
  priceFrom: z.number().min(0),
  priceTo: z.number().min(0),
  category: z.string(),
  subcategory: z.string(),
}).refine((data) => data.yearFrom <= data.yearTo, {
  message: 'Год начала должен быть меньше или равен году окончания',
  path: ['yearFrom'],
}).refine((data) => data.priceFrom <= data.priceTo, {
  message: 'Минимальная цена должна быть меньше или равна максимальной',
  path: ['priceFrom'],
});

// Схемы для экспорта
export const ExportSchema = z.object({
  format: z.enum(['excel', 'csv', 'json']),
  products: z.array(ProductSchema),
  includeHeaders: z.boolean().optional().default(true),
  filename: z.string().optional(),
});

// Схемы для пользовательских настроек
export const UserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional().default('auto'),
  language: z.enum(['ru', 'en']).optional().default('ru'),
  notifications: z.boolean().optional().default(true),
  autoSave: z.boolean().optional().default(true),
  searchHistory: z.boolean().optional().default(true),
});

// Схемы для API ответов
export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string(),
  requestId: z.string().optional(),
});

// Схемы для пагинации
export const PaginationSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
  total: z.number().min(0).optional(),
  totalPages: z.number().min(0).optional(),
});

// Схемы для сортировки
export const SortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

// Функции валидации
export const validateSearchQuery = (data: unknown) => {
  return SearchQuerySchema.parse(data);
};

export const validateAIRequest = (data: unknown) => {
  return AIRequestSchema.parse(data);
};

export const validateProduct = (data: unknown) => {
  return ProductSchema.parse(data);
};

export const validateFilters = (data: unknown) => {
  return FiltersSchema.parse(data);
};

export const validateExport = (data: unknown) => {
  return ExportSchema.parse(data);
};

export const validateUserSettings = (data: unknown) => {
  return UserSettingsSchema.parse(data);
};

// Функции для безопасной валидации (не выбрасывают исключения)
export const safeValidate = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => e.message).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Ошибка валидации' };
  }
};

// Утилиты для работы с валидацией
export const createValidationError = (message: string, field?: string) => {
  return {
    success: false as const,
    error: message,
    field,
  };
};

export const createValidationSuccess = <T>(data: T) => {
  return {
    success: true as const,
    data,
  };
};

// Типы для TypeScript
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type AIRequest = z.infer<typeof AIRequestSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Filters = z.infer<typeof FiltersSchema>;
export type ExportData = z.infer<typeof ExportSchema>;
export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type APIResponse = z.infer<typeof APIResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type Sort = z.infer<typeof SortSchema>;

// Middleware для валидации в API routes
export const withValidation = <T>(schema: z.ZodSchema<T>) => {
  return (handler: (data: T) => Promise<Response>) => {
    return async (request: Request) => {
      try {
        const body = await request.json();
        const validatedData = schema.parse(body);
        return handler(validatedData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessage = error.errors.map(e => e.message).join(', ');
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: errorMessage,
              details: error.errors 
            }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Ошибка валидации' 
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    };
  };
};
