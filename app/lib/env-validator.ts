import { z } from 'zod';

// Схема для валидации переменных окружения
const envSchema = z.object({
  // Обязательные переменные
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // AI конфигурация (хотя бы один должен быть настроен)
  OPENROUTER_API_KEY: z.string().optional(),
  DEFAULT_AI_MODEL: z.string().default('deepseek/deepseek-chat-v3-0324:free'),
  LM_STUDIO_BASE_URL: z.string().url().optional(),
  LOCAL_AI_MODEL: z.string().optional(),
  LM_STUDIO_TIMEOUT: z.string().transform(Number).default('30000'),
  LM_STUDIO_MAX_TOKENS: z.string().transform(Number).default('1000'),
  LM_STUDIO_TEMPERATURE: z.string().transform(Number).default('0.7'),
  
  // Безопасность
  ALLOWED_ORIGINS: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // База данных (опционально)
  DATABASE_URL: z.string().optional(),
  
  // Внешние сервисы (опционально)
  SENTRY_DSN: z.string().optional(),
  ANALYTICS_ID: z.string().optional(),
  
  // Функциональные флаги
  ENABLE_AI_SEARCH: z.string().transform(val => val === 'true').default('true'),
  ENABLE_WEB_SCRAPING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_ADVANCED_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  
  // Настройки приложения
  MAX_INDEX_SIZE: z.string().transform(Number).default('10485760'),
  CACHE_TTL: z.string().transform(Number).default('3600000'),
  MAX_SCRAPE_PRODUCTS: z.string().transform(Number).default('100')
}).refine(
  (data) => data.OPENROUTER_API_KEY || data.LM_STUDIO_BASE_URL,
  {
    message: "Необходимо настроить хотя бы один AI провайдер: OPENROUTER_API_KEY или LM_STUDIO_BASE_URL"
  }
);

// Тип для валидированных переменных окружения
export type EnvConfig = z.infer<typeof envSchema>;

// Класс для работы с конфигурацией
class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: EnvConfig | null = null;
  private validationErrors: string[] = [];

  private constructor() {}

  static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  // Валидация и загрузка конфигурации
  load(): EnvConfig {
    if (this.config) {
      return this.config;
    }

    try {
      // Валидируем переменные окружения
      this.config = envSchema.parse(process.env);
      
      // Логируем успешную загрузку (без sensitive данных)
      console.log('✅ Environment configuration loaded successfully', {
        nodeEnv: this.config.NODE_ENV,
        aiProvider: this.config.OPENROUTER_API_KEY ? 'OpenRouter' : 'LM Studio',
        features: {
          aiSearch: this.config.ENABLE_AI_SEARCH,
          webScraping: this.config.ENABLE_WEB_SCRAPING,
          advancedAnalytics: this.config.ENABLE_ADVANCED_ANALYTICS
        }
      });
      
      return this.config;
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.validationErrors = error.errors.map(e => 
          `${e.path.join('.')}: ${e.message}`
        );
        
        console.error('❌ Environment validation failed:', this.validationErrors);
        
        // В development режиме показываем детальные ошибки
        if (process.env.NODE_ENV === 'development') {
          throw new Error(
            `Environment validation failed:\n${this.validationErrors.join('\n')}\n\n` +
            `Please check your .env.local file and ensure all required variables are set correctly.`
          );
        }
        
        // В production используем дефолтные значения где возможно
        console.warn('⚠️ Using default values for missing environment variables');
        this.config = envSchema.parse({});
      }
      
      throw error;
    }
  }

  // Получить конфигурацию
  get(): EnvConfig {
    if (!this.config) {
      return this.load();
    }
    return this.config;
  }

  // Проверить, включена ли функция
  isFeatureEnabled(feature: keyof Pick<EnvConfig, 'ENABLE_AI_SEARCH' | 'ENABLE_WEB_SCRAPING' | 'ENABLE_ADVANCED_ANALYTICS'>): boolean {
    const config = this.get();
    return config[feature];
  }

  // Получить AI конфигурацию
  getAIConfig() {
    const config = this.get();
    
    if (config.OPENROUTER_API_KEY) {
      return {
        provider: 'openrouter' as const,
        apiKey: config.OPENROUTER_API_KEY,
        model: config.DEFAULT_AI_MODEL,
        baseURL: 'https://openrouter.ai/api/v1'
      };
    }
    
    return {
      provider: 'lmstudio' as const,
      baseURL: config.LM_STUDIO_BASE_URL!,
      model: config.LOCAL_AI_MODEL,
      timeout: config.LM_STUDIO_TIMEOUT,
      maxTokens: config.LM_STUDIO_MAX_TOKENS,
      temperature: config.LM_STUDIO_TEMPERATURE
    };
  }

  // Получить конфигурацию rate limiting
  getRateLimitConfig() {
    const config = this.get();
    return {
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      maxRequests: config.RATE_LIMIT_MAX_REQUESTS
    };
  }

  // Получить разрешенные origins для CORS
  getAllowedOrigins(): string[] {
    const config = this.get();
    if (!config.ALLOWED_ORIGINS) {
      return config.NODE_ENV === 'production' 
        ? [] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    }
    return config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }

  // Проверить валидность конфигурации
  isValid(): boolean {
    return this.validationErrors.length === 0;
  }

  // Получить ошибки валидации
  getValidationErrors(): string[] {
    return this.validationErrors;
  }
}

// Экспортируем singleton instance
export const envConfig = EnvironmentConfig.getInstance();

// Функция для инициализации конфигурации при запуске приложения
export function validateEnv(): EnvConfig {
  return envConfig.load();
}

// Хелпер для безопасного получения переменной окружения
export function getEnvVar(key: keyof EnvConfig): any {
  const config = envConfig.get();
  return config[key];
}

// Проверка обязательных переменных для production
export function checkProductionEnv() {
  if (process.env.NODE_ENV === 'production') {
    const config = envConfig.get();
    const warnings: string[] = [];
    
    if (!config.ALLOWED_ORIGINS) {
      warnings.push('ALLOWED_ORIGINS not set - CORS will be disabled');
    }
    
    if (!config.SENTRY_DSN) {
      warnings.push('SENTRY_DSN not set - error monitoring disabled');
    }
    
    if (config.RATE_LIMIT_MAX_REQUESTS > 1000) {
      warnings.push('RATE_LIMIT_MAX_REQUESTS is very high - consider lowering for production');
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ Production environment warnings:', warnings);
    }
  }
}