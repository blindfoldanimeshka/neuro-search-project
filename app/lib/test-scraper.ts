// ============================================================================
// SIMPLE TEST FILE FOR WEB SCRAPER
// ============================================================================

import { webScraper } from './web-scraper';

/**
 * Простой тест веб-скраппера
 */
async function testWebScraper() {
  try {
    console.log('🧪 Starting Web Scraper Test...\n');
    
    // Инициализация
    console.log('1️⃣ Initializing web scraper...');
    await webScraper.initialize({ headless: true });
    console.log('✅ Web scraper initialized\n');
    
    // Получение доступных источников
    console.log('2️⃣ Getting available sources...');
    const sources = webScraper.getAvailableSources();
    console.log('Available sources:', sources);
    console.log('✅ Sources retrieved\n');
    
    // Простой поиск
    console.log('3️⃣ Testing basic search...');
    const results = await webScraper.scrapeProducts(
      'тест',
      ['wildberries'],
      { 
        maxProducts: 2, 
        headless: true, 
        timeout: 15000 
      }
    );
    
    console.log('✅ Search completed!');
    console.log('Results:', results);
    
    // Статистика
    console.log('\n4️⃣ Getting statistics...');
    const stats = webScraper.getStats();
    console.log('Statistics:', {
      totalRequests: stats.totalRequests,
      successfulRequests: stats.successfulRequests,
      failedRequests: stats.failedRequests,
      totalProducts: stats.totalProducts,
      successRate: stats.successRate.toFixed(2) + '%'
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Закрытие
    console.log('\n🔒 Closing web scraper...');
    await webScraper.close();
    console.log('✅ Web scraper closed');
  }
}

// Запуск теста
if (require.main === module) {
  testWebScraper().catch(console.error);
}

export { testWebScraper };
