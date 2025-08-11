// ============================================================================
// WEB SCRAPER EXAMPLES & USAGE PATTERNS
// ============================================================================

import { webScraper, WebScraper } from './web-scraper';
import { ScrapingOptions, ScrapingSource } from './web-scraper-types';

/**
 * Примеры использования веб-скраппера для различных сценариев
 */

// ============================================================================
// BASIC USAGE EXAMPLES
// ============================================================================

/**
 * Пример 1: Базовый поиск продуктов
 */
export async function basicProductSearch() {
  try {
    console.log('🔍 Starting basic product search...');
    
    const results = await webScraper.scrapeProducts(
      'смартфон', 
      ['wildberries', 'ozon'], 
      { maxProducts: 10, headless: true }
    );
    
    console.log('✅ Search completed!');
    results.forEach(result => {
      console.log(`${result.source}: ${result.products.length} products found`);
    });
    
    return results;
  } catch (error) {
    console.error('❌ Basic search failed:', error);
    throw error;
  }
}

/**
 * Пример 2: Поиск по всем доступным источникам
 */
export async function searchAllSources() {
  try {
    console.log('🌐 Searching all available sources...');
    
    const results = await webScraper.scrapeProducts(
      'ноутбук',
      ['all'],
      { 
        maxProducts: 5, 
        headless: true, 
        delay: 2000,
        timeout: 30000 
      }
    );
    
    console.log('✅ All sources search completed!');
    return results;
  } catch (error) {
    console.error('❌ All sources search failed:', error);
    throw error;
  }
}

// ============================================================================
// ADVANCED USAGE EXAMPLES
// ============================================================================

/**
 * Пример 3: Поиск с кастомными настройками
 */
export async function advancedSearchWithCustomOptions() {
  try {
    console.log('⚙️ Starting advanced search with custom options...');
    
    const customOptions: ScrapingOptions = {
      maxProducts: 20,
      headless: false, // Показать браузер для отладки
      timeout: 45000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      delay: 3000,
      retries: 2,
      scrollToLoad: true,
      maxScrolls: 5,
      waitForSelector: '.product-card',
      rateLimit: {
        requestsPerSecond: 1,
        delayBetweenRequests: 2000
      }
    };
    
    const results = await webScraper.scrapeProducts(
      'наушники беспроводные',
      ['wildberries', 'ozon', 'yandex'],
      customOptions
    );
    
    console.log('✅ Advanced search completed!');
    return results;
  } catch (error) {
    console.error('❌ Advanced search failed:', error);
    throw error;
  }
}

/**
 * Пример 4: Мониторинг статистики скраппинга
 */
export async function monitorScrapingStats() {
  try {
    console.log('📊 Monitoring scraping statistics...');
    
    // Сбросить статистику
    webScraper.resetStats();
    
    // Выполнить несколько поисков
    await webScraper.scrapeProducts('телефон', ['wildberries'], { maxProducts: 5 });
    await webScraper.scrapeProducts('планшет', ['ozon'], { maxProducts: 5 });
    await webScraper.scrapeProducts('часы', ['yandex'], { maxProducts: 5 });
    
    // Получить статистику
    const stats = webScraper.getStats();
    
    console.log('📈 Scraping Statistics:');
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Successful: ${stats.successfulRequests}`);
    console.log(`Failed: ${stats.failedRequests}`);
    console.log(`Success Rate: ${stats.successRate.toFixed(2)}%`);
    console.log(`Total Products: ${stats.totalProducts}`);
    console.log(`Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms`);
    console.log(`Total Time: ${stats.totalTime}ms`);
    
    // Показать статистику по источникам
    console.log('\n📊 Source-specific stats:');
    Object.entries(stats.sources).forEach(([source, sourceStats]) => {
      console.log(`${source}:`);
      console.log(`  Requests: ${sourceStats.requests}`);
      console.log(`  Success: ${sourceStats.success}`);
      console.log(`  Failed: ${sourceStats.failed}`);
      console.log(`  Products: ${sourceStats.products}`);
      console.log(`  Avg Time: ${sourceStats.avgTime.toFixed(2)}ms`);
    });
    
    return stats;
  } catch (error) {
    console.error('❌ Stats monitoring failed:', error);
    throw error;
  }
}

// ============================================================================
// BATCH PROCESSING EXAMPLES
// ============================================================================

/**
 * Пример 5: Пакетная обработка множественных запросов
 */
export async function batchProcessingExample() {
  try {
    console.log('📦 Starting batch processing...');
    
    const queries = [
      'смартфон Samsung',
      'ноутбук Dell',
      'наушники Sony',
      'часы Apple',
      'планшет iPad'
    ];
    
    const sources: ScrapingSource[] = ['wildberries', 'ozon'];
    const options: ScrapingOptions = {
      maxProducts: 3,
      headless: true,
      delay: 1000
    };
    
    const allResults = [];
    
    for (const query of queries) {
      console.log(`🔍 Processing query: "${query}"`);
      
      try {
        const results = await webScraper.scrapeProducts(query, sources, options);
        allResults.push(...results);
        
        console.log(`✅ Query "${query}" completed`);
        
        // Пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Query "${query}" failed:`, error);
      }
    }
    
    console.log(`🏁 Batch processing completed! Total results: ${allResults.length}`);
    return allResults;
    
  } catch (error) {
    console.error('❌ Batch processing failed:', error);
    throw error;
  }
}

// ============================================================================
// ERROR HANDLING EXAMPLES
// ============================================================================

/**
 * Пример 6: Обработка ошибок и повторные попытки
 */
export async function errorHandlingExample() {
  try {
    console.log('🔄 Testing error handling and retries...');
    
    const options: ScrapingOptions = {
      maxProducts: 5,
      retries: 3,
      timeout: 10000, // Короткий таймаут для демонстрации
      delay: 1000
    };
    
    const results = await webScraper.scrapeProducts(
      'тест продукт',
      ['wildberries'],
      options
    );
    
    console.log('✅ Error handling test completed');
    return results;
    
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
    
    // Показать статистику ошибок
    const stats = webScraper.getStats();
    console.log('📊 Error Statistics:');
    stats.errors.forEach((error, index) => {
      console.log(`Error ${index + 1}:`);
      console.log(`  Source: ${error.source}`);
      console.log(`  Error: ${error.error}`);
      console.log(`  Timestamp: ${new Date(error.timestamp).toISOString()}`);
    });
    
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTION EXAMPLES
// ============================================================================

/**
 * Пример 7: Использование утилитарных функций
 */
export async function utilityFunctionsExample() {
  try {
    console.log('🔧 Testing utility functions...');
    
    // Тест Cheerio скраппинга
    const cheerioResults = await webScraper.scrapeWithCheerio(
      'https://example.com',
      'h1'
    );
    console.log('Cheerio results:', cheerioResults);
    
    // Получить доступные источники
    const availableSources = webScraper.getAvailableSources();
    console.log('Available sources:', availableSources);
    
    // Получить конфигурацию источника
    const wildberriesConfig = webScraper.getSourceConfig('wildberries');
    console.log('Wildberries config:', wildberriesConfig?.name);
    
    console.log('✅ Utility functions test completed');
    
  } catch (error) {
    console.error('❌ Utility functions test failed:', error);
    throw error;
  }
}

// ============================================================================
// PERFORMANCE TESTING EXAMPLES
// ============================================================================

/**
 * Пример 8: Тестирование производительности
 */
export async function performanceTest() {
  try {
    console.log('⚡ Starting performance test...');
    
    const startTime = Date.now();
    
    // Тест с разными настройками
    const testCases = [
      { maxProducts: 5, headless: true, delay: 0 },
      { maxProducts: 10, headless: true, delay: 500 },
      { maxProducts: 15, headless: true, delay: 1000 }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      const caseStartTime = Date.now();
      
      try {
        const result = await webScraper.scrapeProducts(
          'тест',
          ['wildberries'],
          testCase
        );
        
        const caseTime = Date.now() - caseStartTime;
        results.push({
          config: testCase,
          time: caseTime,
          products: result.reduce((sum, r) => sum + r.totalFound, 0)
        });
        
        console.log(`✅ Test case completed in ${caseTime}ms`);
        
      } catch (error) {
        console.error(`❌ Test case failed:`, error);
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    console.log('📊 Performance Test Results:');
    console.log(`Total Time: ${totalTime}ms`);
    results.forEach((result, index) => {
      console.log(`Case ${index + 1}:`);
      console.log(`  Config: ${JSON.stringify(result.config)}`);
      console.log(`  Time: ${result.time}ms`);
      console.log(`  Products: ${result.products}`);
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    throw error;
  }
}

// ============================================================================
// MAIN DEMO FUNCTION
// ============================================================================

/**
 * Главная демонстрационная функция
 */
export async function runAllExamples() {
  try {
    console.log('🚀 Starting Web Scraper Examples...\n');
    
    // Инициализация
    await webScraper.initialize({ headless: true });
    
    // Запуск примеров
    console.log('1️⃣ Basic Product Search');
    await basicProductSearch();
    
    console.log('\n2️⃣ Search All Sources');
    await searchAllSources();
    
    console.log('\n3️⃣ Advanced Search');
    await advancedSearchWithCustomOptions();
    
    console.log('\n4️⃣ Monitor Statistics');
    await monitorScrapingStats();
    
    console.log('\n5️⃣ Batch Processing');
    await batchProcessingExample();
    
    console.log('\n6️⃣ Error Handling');
    await errorHandlingExample();
    
    console.log('\n7️⃣ Utility Functions');
    await utilityFunctionsExample();
    
    console.log('\n8️⃣ Performance Test');
    await performanceTest();
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Examples execution failed:', error);
  } finally {
    // Закрытие браузера
    await webScraper.close();
    console.log('🔒 Web scraper closed');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  basicProductSearch,
  searchAllSources,
  advancedSearchWithCustomOptions,
  monitorScrapingStats,
  batchProcessingExample,
  errorHandlingExample,
  utilityFunctionsExample,
  performanceTest,
  runAllExamples
};
