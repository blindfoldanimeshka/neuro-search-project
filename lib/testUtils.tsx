import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { ReactElement } from 'react'
import { testLogger } from './testLogger'
import { ThemeProvider } from '../app/context/ThemeProvider'

// Функция для рендеринга с провайдерами
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions
): RenderResult {
  // Мокаем localStorage для тестов
  const localStorageMock = {
    getItem: jest.fn((key: string) => {
      if (key === 'isDarkTheme') {
        return 'false' // Возвращаем валидное JSON значение
      }
      if (key === 'theme') {
        return 'light' // Добавляем поддержку ключа theme
      }
      if (key === 'panelSizes') {
        return JSON.stringify({ main: 70, chat: 30 })
      }
      if (key === 'searchHistory') {
        return JSON.stringify(['смартфон', 'ноутбук'])
      }
      if (key === 'favorites') {
        return JSON.stringify([])
      }
      return null
    }),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  })

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <ThemeProvider>
        {children}
      </ThemeProvider>
    )
  }

  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Расширенная функция render с логированием
export function renderWithLogging(
  ui: ReactElement,
  options?: RenderOptions
): RenderResult {
  testLogger.logTestAction('render', {
    component: typeof ui.type === 'function' ? ui.type.name : 'Unknown',
    options: options ? Object.keys(options) : []
  })
  
  return renderWithProviders(ui, options)
}

// Утилита для логирования действий пользователя
export function logUserAction(action: string, data?: Record<string, unknown>) {
  testLogger.logTestAction(`user_action: ${action}`, data)
}

// Утилита для логирования проверок
export function logAssertion(assertion: string, data?: Record<string, unknown>) {
  testLogger.logTestAction(`assertion: ${assertion}`, data)
}

// Утилита для логирования моков
export function logMock(mockName: string, mockData?: Record<string, unknown>) {
  testLogger.logTestAction(`mock: ${mockName}`, mockData)
}

// Утилита для логирования асинхронных операций
export function logAsyncOperation(operation: string, data?: Record<string, unknown>) {
  testLogger.logTestAction(`async: ${operation}`, data)
}

// Утилита для логирования ошибок
export function logError(error: string, data?: Record<string, unknown>) {
  testLogger.logTestAction(`error: ${error}`, data)
}

// Утилита для логирования производительности
export function logPerformance(operation: string, duration: number, data?: Record<string, unknown>) {
  testLogger.logTestAction(`performance: ${operation}`, {
    duration,
    ...data
  })
}

// Утилита для создания моков с логированием
export function createMockWithLogging<T extends Record<string, any>>(
  mockName: string,
  mockImplementation: T
): T {
  const loggedMock = {} as T
  
  for (const [key, value] of Object.entries(mockImplementation)) {
    if (typeof value === 'function') {
      loggedMock[key as keyof T] = jest.fn((...args: any[]) => {
        logMock(`${mockName}.${key}`, { args })
        return value(...args)
      }) as T[keyof T]
    } else {
      loggedMock[key as keyof T] = value
    }
  }
  
  return loggedMock
}

// Утилита для ожидания с логированием
export async function waitForWithLogging(
  callback: () => void | Promise<void>,
  options?: { timeout?: number; interval?: number }
): Promise<void> {
  const startTime = Date.now()
  
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = options?.timeout || 1000
      const interval = options?.interval || 50
      let attempts = 0
      
      const check = async () => {
        attempts++
        try {
          await callback()
          resolve()
        } catch (error) {
          if (Date.now() - startTime > timeout) {
            reject(error)
          } else {
            setTimeout(check, interval)
          }
        }
      }
      
      check()
    })
    
    const duration = Date.now() - startTime
    logPerformance('waitFor', duration, { timeout: options?.timeout })
  } catch (error) {
    logError('waitFor failed', { 
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime 
    })
    throw error
  }
}

// Утилита для логирования состояния компонента
export function logComponentState(componentName: string, state: Record<string, unknown>) {
  testLogger.logTestAction(`component_state: ${componentName}`, state)
}

// Утилита для логирования пропсов компонента
export function logComponentProps(componentName: string, props: Record<string, unknown>) {
  testLogger.logTestAction(`component_props: ${componentName}`, props)
}

// Утилита для логирования событий
export function logEvent(eventName: string, eventData?: Record<string, unknown>) {
  testLogger.logTestAction(`event: ${eventName}`, eventData)
}

// Утилита для логирования сетевых запросов
export function logNetworkRequest(method: string, url: string, data?: Record<string, unknown>) {
  testLogger.logTestAction(`network: ${method} ${url}`, data)
}

// Утилита для логирования API вызовов
export function logAPICall(endpoint: string, data?: Record<string, unknown>) {
  testLogger.logTestAction(`api_call: ${endpoint}`, data)
}

// Утилита для логирования валидации
export function logValidation(field: string, value: unknown, isValid: boolean, error?: string) {
  testLogger.logTestAction(`validation: ${field}`, {
    value: typeof value === 'string' ? value.substring(0, 100) : value,
    isValid,
    error
  })
}

// Утилита для логирования тестовых данных
export function logTestData(dataName: string, data: Record<string, unknown>) {
  testLogger.logTestAction(`test_data: ${dataName}`, data)
}

// Утилита для логирования контекста теста
export function logTestContext(context: Record<string, unknown>) {
  testLogger.logTestAction('test_context', context)
} 