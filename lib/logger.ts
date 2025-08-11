// Простая система логирования
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  userId?: string
  action?: string
  data?: Record<string, unknown>
  ip?: string
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Максимальное количество логов в памяти

  private addLog(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    }

    this.logs.push(logEntry)

    // Ограничиваем количество логов в памяти
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // В продакшене здесь можно добавить отправку в внешний сервис логирования
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.log(`[${level.toUpperCase()}] ${message}`, data || '')
    }
  }

  info(message: string, data?: Record<string, unknown>) {
    this.addLog(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.addLog(LogLevel.WARN, message, data)
  }

  error(message: string, data?: Record<string, unknown>) {
    this.addLog(LogLevel.ERROR, message, data)
  }

  debug(message: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      this.addLog(LogLevel.DEBUG, message, data)
    }
  }

  // Логирование действий пользователей
  logUserAction(userId: string, action: string, data?: Record<string, unknown>) {
    this.info(`User action: ${action}`, {
      userId,
      action,
      ...data
    })
  }

  // Логирование поисковых запросов
  logSearch(query: string, filters: Record<string, unknown>, resultsCount: number) {
    this.info('Search performed', {
      query: query.substring(0, 100), // Ограничиваем длину для безопасности
      filters,
      resultsCount
    })
  }

  // Логирование ошибок валидации
  logValidationError(field: string, value: unknown, error: string) {
    this.warn('Validation error', {
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value,
      error
    })
  }

  // Получение логов (для админки)
  getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    let filteredLogs = this.logs

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    return filteredLogs.slice(-limit)
  }

  // Очистка логов
  clearLogs() {
    this.logs = []
  }
}

export const logger = new Logger() 