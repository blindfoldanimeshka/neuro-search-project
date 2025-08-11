import { logger } from './logger'
import fs from 'fs'
import path from 'path'

export interface TestLogEntry {
  timestamp: string
  testSuite: string
  testName: string
  status: 'PASS' | 'FAIL' | 'SKIP' | 'START' | 'END'
  duration?: number
  error?: string
  data?: Record<string, unknown>
}

class TestLogger {
  private testLogs: TestLogEntry[] = []
  private currentTest: { suite: string; name: string; startTime: number } | null = null
  private logDir = 'test-logs'

  constructor() {
    this.ensureLogDirectory()
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  private addTestLog(entry: TestLogEntry) {
    this.testLogs.push(entry)
    
    // Логируем в основную систему логирования
    const logLevel = entry.status === 'FAIL' ? 'error' : 'info'
    const message = `[TEST] ${entry.testSuite} - ${entry.testName}: ${entry.status}`
    
    logger[logLevel](message, {
      testSuite: entry.testSuite,
      testName: entry.testName,
      status: entry.status,
      duration: entry.duration,
      error: entry.error,
      ...entry.data
    })

    // Сохраняем в файл
    this.saveToFile(entry)
  }

  private saveToFile(entry: TestLogEntry) {
    const date = new Date().toISOString().split('T')[0]
    const logFile = path.join(this.logDir, `test-logs-${date}.json`)
    
    try {
      let logs: TestLogEntry[] = []
      if (fs.existsSync(logFile)) {
        try {
          const content = fs.readFileSync(logFile, 'utf-8')
          if (content.trim()) {
            logs = JSON.parse(content)
          }
        } catch (parseError) {
          console.warn('Failed to parse existing log file, starting fresh:', parseError)
          // Если файл поврежден, начинаем заново
          logs = []
        }
      }
      
      logs.push(entry)
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2))
    } catch (error) {
      console.error('Failed to save test log:', error)
    }
  }

  // Начало тестового набора
  startTestSuite(suiteName: string) {
    this.addTestLog({
      timestamp: new Date().toISOString(),
      testSuite: suiteName,
      testName: 'SUITE_START',
      status: 'START'
    })
  }

  // Конец тестового набора
  endTestSuite(suiteName: string, stats: { passed: number; failed: number; skipped: number }) {
    this.addTestLog({
      timestamp: new Date().toISOString(),
      testSuite: suiteName,
      testName: 'SUITE_END',
      status: 'END',
      data: stats
    })
  }

  // Начало теста
  startTest(testName: string, testSuite: string) {
    this.currentTest = {
      suite: testSuite,
      name: testName,
      startTime: Date.now()
    }
    
    this.addTestLog({
      timestamp: new Date().toISOString(),
      testSuite,
      testName,
      status: 'START'
    })
  }

  // Успешное завершение теста
  passTest(testName: string, testSuite: string, data?: Record<string, unknown>) {
    const duration = this.currentTest ? Date.now() - this.currentTest.startTime : undefined
    
    this.addTestLog({
      timestamp: new Date().toISOString(),
      testSuite,
      testName,
      status: 'PASS',
      duration,
      data
    })
    
    this.currentTest = null
  }

  // Неудачное завершение теста
  failTest(testName: string, testSuite: string, error: string, data?: Record<string, unknown>) {
    const duration = this.currentTest ? Date.now() - this.currentTest.startTime : undefined
    
    this.addTestLog({
      timestamp: new Date().toISOString(),
      testSuite,
      testName,
      status: 'FAIL',
      duration,
      error,
      data
    })
    
    this.currentTest = null
  }

  // Пропущенный тест
  skipTest(testName: string, testSuite: string, reason?: string) {
    this.addTestLog({
      timestamp: new Date().toISOString(),
      testSuite,
      testName,
      status: 'SKIP',
      data: reason ? { reason } : undefined
    })
  }

  // Логирование действий в тесте
  logTestAction(action: string, data?: Record<string, unknown>) {
    if (!this.currentTest) return
    
    this.addTestLog({
      timestamp: new Date().toISOString(),
      testSuite: this.currentTest.suite,
      testName: this.currentTest.name,
      status: 'PASS', // Используем PASS для действий
      data: { action, ...data }
    })
  }

  // Получение статистики тестов
  getTestStats() {
    const stats = {
      total: this.testLogs.length,
      passed: this.testLogs.filter(log => log.status === 'PASS').length,
      failed: this.testLogs.filter(log => log.status === 'FAIL').length,
      skipped: this.testLogs.filter(log => log.status === 'SKIP').length,
      suites: new Set(this.testLogs.map(log => log.testSuite)).size
    }
    
    return stats
  }

  // Получение логов по фильтрам
  getTestLogs(filters?: {
    status?: 'PASS' | 'FAIL' | 'SKIP' | 'START' | 'END'
    testSuite?: string
    testName?: string
    limit?: number
  }): TestLogEntry[] {
    let filteredLogs = this.testLogs

    if (filters?.status) {
      filteredLogs = filteredLogs.filter(log => log.status === filters.status)
    }

    if (filters?.testSuite) {
      filteredLogs = filteredLogs.filter(log => log.testSuite === filters.testSuite)
    }

    if (filters?.testName) {
      filteredLogs = filteredLogs.filter(log => log.testName.includes(filters.testName!))
    }

    const limit = filters?.limit || 100
    return filteredLogs.slice(-limit)
  }

  // Очистка логов
  clearLogs() {
    this.testLogs = []
    this.currentTest = null
  }

  // Экспорт логов в JSON
  exportLogs(filename?: string) {
    const date = new Date().toISOString().split('T')[0]
    const exportFile = filename || `test-export-${date}.json`
    const exportPath = path.join(this.logDir, exportFile)
    
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        stats: this.getTestStats(),
        logs: this.testLogs
      }
      
      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2))
      return exportPath
    } catch (error) {
      console.error('Failed to export test logs:', error)
      return null
    }
  }
}

export const testLogger = new TestLogger() 