import { z } from 'zod'

// Схема для валидации environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // OpenRouter API
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  
  // Безопасность
  ALLOWED_ORIGIN: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(60000),
  
  // Логирование
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  // Дополнительные настройки
  MAX_SEARCH_RESULTS: z.string().transform(Number).default(100),
  MAX_PRODUCT_NAME_LENGTH: z.string().transform(Number).default(200),
  MAX_DESCRIPTION_LENGTH: z.string().transform(Number).default(1000),
})

// Функция для получения конфигурации
export function getConfig() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Ошибка конфигурации:', error.issues)
    }
    
    // Возвращаем дефолтные значения в случае ошибки
    return {
      NODE_ENV: 'development',
      OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
      RATE_LIMIT_MAX_REQUESTS: 100,
      RATE_LIMIT_WINDOW_MS: 60000,
      LOG_LEVEL: 'info',
      MAX_SEARCH_RESULTS: 100,
      MAX_PRODUCT_NAME_LENGTH: 200,
      MAX_DESCRIPTION_LENGTH: 1000,
    }
  }
}

// Экспортируем конфигурацию
export const config = getConfig()

// Типы для TypeScript
export type Config = ReturnType<typeof getConfig> 