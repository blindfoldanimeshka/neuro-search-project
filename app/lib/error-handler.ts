// Типы ошибок
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  retryAfter?: number;
}

// Класс для создания ошибок приложения
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly details?: any;
  public readonly timestamp: Date;
  public readonly retryAfter?: number;

  constructor(
    type: ErrorType,
    message: string,
    code?: string,
    details?: any,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.retryAfter = retryAfter;
  }

  static fromError(error: any): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Определяем тип ошибки на основе сообщения или кода
    let type = ErrorType.UNKNOWN;
    let message = 'Произошла неизвестная ошибка';
    let code: string | undefined;
    let retryAfter: number | undefined;

    if (error.message) {
      message = error.message;
    }

    if (error.status) {
      switch (error.status) {
        case 400:
          type = ErrorType.VALIDATION;
          break;
        case 401:
          type = ErrorType.AUTHENTICATION;
          break;
        case 403:
          type = ErrorType.AUTHORIZATION;
          break;
        case 404:
          type = ErrorType.NOT_FOUND;
          break;
        case 429:
          type = ErrorType.RATE_LIMIT;
          retryAfter = error.retryAfter || 60;
          break;
        case 500:
          type = ErrorType.SERVER_ERROR;
          break;
        default:
          if (error.status >= 500) {
            type = ErrorType.SERVER_ERROR;
          } else if (error.status >= 400) {
            type = ErrorType.VALIDATION;
          }
      }
    }

    if (error.code) {
      code = error.code;
    }

    return new AppError(type, message, code, error.details, retryAfter);
  }
}

// Фабрика ошибок для API
export const createApiError = {
  validation: (message: string, details?: any) => 
    new AppError(ErrorType.VALIDATION, message, 'VALIDATION_ERROR', details),
  
  network: (message: string = 'Ошибка сети') => 
    new AppError(ErrorType.NETWORK, message, 'NETWORK_ERROR'),
  
  authentication: (message: string = 'Требуется авторизация') => 
    new AppError(ErrorType.AUTHENTICATION, message, 'AUTH_ERROR'),
  
  authorization: (message: string = 'Недостаточно прав') => 
    new AppError(ErrorType.AUTHORIZATION, message, 'FORBIDDEN'),
  
  notFound: (message: string = 'Ресурс не найден') => 
    new AppError(ErrorType.NOT_FOUND, message, 'NOT_FOUND'),
  
  rateLimit: (retryAfter: number = 60) => 
    new AppError(ErrorType.RATE_LIMIT, 'Превышен лимит запросов', 'RATE_LIMIT', undefined, retryAfter),
  
  serverError: (message: string = 'Внутренняя ошибка сервера') => 
    new AppError(ErrorType.SERVER_ERROR, message, 'SERVER_ERROR'),
  
  unknown: (message: string = 'Неизвестная ошибка') => 
    new AppError(ErrorType.UNKNOWN, message, 'UNKNOWN_ERROR')
};

// Функция для логирования ошибок
export const logError = (error: AppError, context?: string) => {
  const logData = {
    type: error.type,
    message: error.message,
    code: error.code,
    details: error.details,
    timestamp: error.timestamp.toISOString(),
    retryAfter: error.retryAfter,
    context,
    stack: error.stack
  };

  // В продакшене отправляем в сервис мониторинга
  if (process.env.NODE_ENV === 'production') {
    // Здесь можно интегрировать с Sentry, LogRocket и т.д.
    console.error('Production Error:', logData);
  } else {
    console.error('Development Error:', logData);
  }
};

// Функция для обработки ошибок в API routes
export const handleApiError = (error: any): { error: AppError; status: number } => {
  const appError = AppError.fromError(error);
  
  // Логируем ошибку
  logError(appError, 'API Route');
  
  // Определяем HTTP статус код
  let status = 500;
  switch (appError.type) {
    case ErrorType.VALIDATION:
      status = 400;
      break;
    case ErrorType.AUTHENTICATION:
      status = 401;
      break;
    case ErrorType.AUTHORIZATION:
      status = 403;
      break;
    case ErrorType.NOT_FOUND:
      status = 404;
      break;
    case ErrorType.RATE_LIMIT:
      status = 429;
      break;
    case ErrorType.SERVER_ERROR:
      status = 500;
      break;
    default:
      status = 500;
  }
  
  return { error: appError, status };
};

// Утилита для форматирования сообщений об ошибках для пользователя
export const formatErrorMessage = (error: AppError): string => {
  switch (error.type) {
    case ErrorType.VALIDATION:
      return `Ошибка валидации: ${error.message}`;
    case ErrorType.NETWORK:
      return 'Ошибка сети. Проверьте подключение к интернету.';
    case ErrorType.AUTHENTICATION:
      return 'Требуется авторизация. Войдите в систему.';
    case ErrorType.AUTHORIZATION:
      return 'Недостаточно прав для выполнения операции.';
    case ErrorType.NOT_FOUND:
      return 'Запрашиваемый ресурс не найден.';
    case ErrorType.RATE_LIMIT:
      return `Превышен лимит запросов. Попробуйте через ${error.retryAfter} секунд.`;
    case ErrorType.SERVER_ERROR:
      return 'Внутренняя ошибка сервера. Попробуйте позже.';
    default:
      return error.message || 'Произошла неизвестная ошибка.';
  }
};

// Стандартизированный формат ответа об ошибке для API
export const createErrorResponse = (error: AppError): object => {
  return {
    success: false,
    error: {
      type: error.type,
      message: error.message,
      code: error.code,
      details: error.details,
      retryAfter: error.retryAfter
    },
    timestamp: error.timestamp.toISOString()
  };
};