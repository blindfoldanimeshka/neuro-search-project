# Web Scrapers Documentation

Этот модуль содержит современные вебскрапперы для извлечения данных с различных сайтов, написанные с нуля с использованием лучших практик.

## 🚀 Основные возможности

### Поддерживаемые источники
- **Wildberries** - российский маркетплейс
- **Ozon** - российская торговая площадка  
- **Avito** - российские объявления
- **Яндекс.Маркет** - сравнение цен
- **Сбермегамаркет** - розничная торговля

### Технологии
- **Puppeteer** - рендеринг JavaScript
- **Cheerio** - парсинг HTML
- **TypeScript** - типизация и безопасность
- **Event-driven архитектура** - асинхронная обработка

## 📁 Структура файлов

```
lib/
├── web-scraper.ts           # Основной вебскраппер
├── enhanced-web-scraper.ts  # Улучшенная версия с очередью
├── web-scraper-examples.ts  # Примеры использования
└── README.md                # Документация
```

## 🔧 Основной вебскраппер (WebScraper)

### Основные методы

#### `scrapeProducts(query, sources, options)`
Скрапинг продуктов по поисковому запросу с нескольких источников.

```typescript
const scraper = new WebScraper();
const results = await scraper.scrapeProducts('iPhone 15', ['wildberries', 'ozon'], {
  maxProducts: 10,
  delay: 2000,
  headless: true
});
```

#### `scrapeByUrl(url, options)`
Скрапинг конкретной страницы по URL.

```typescript
const result = await scraper.scrapeByUrl('https://example.com/product', {
  maxProducts: 5
});
```

### Опции скрапинга

```typescript
interface ScrapingOptions {
  maxProducts?: number;        // Максимальное количество продуктов
  timeout?: number;            // Таймаут в миллисекундах
  headless?: boolean;          // Скрытый режим браузера
  userAgent?: string;          // Пользовательский агент
  proxy?: string;              // Прокси-сервер
  delay?: number;              // Задержка между запросами
  retries?: number;            // Количество повторных попыток
  waitForSelector?: string;    // Селектор для ожидания загрузки
  scrollToLoad?: boolean;      // Прокрутка для загрузки контента
  maxScrolls?: number;         // Максимальное количество прокруток
  respectRobotsTxt?: boolean;  // Соблюдение robots.txt
  rateLimit?: {                // Ограничение скорости
    requestsPerSecond: number;
    delayBetweenRequests: number;
  };
}
```

## 🚀 Улучшенный вебскраппер (EnhancedWebScraper)

### Особенности
- **Управление очередью** - приоритизация и планирование запросов
- **Параллельная обработка** - настраиваемое количество одновременных запросов
- **Автоматические повторы** - экспоненциальная задержка при ошибках
- **Отслеживание прогресса** - мониторинг выполнения в реальном времени
- **Событийная архитектура** - реакция на изменения состояния

### Создание скраппера

```typescript
// Базовый скраппер
const scraper = createEnhancedScraper({
  maxConcurrent: 3,
  requestDelay: 1000,
  maxRetries: 3,
  timeout: 30000
});

// Оптимизированный для e-commerce
const ecommerceScraper = createEcommerceScraper();

// Оптимизированный для контент-сайтов
const contentScraper = createContentScraper();
```

### Управление очередью

```typescript
// Добавление URL в очередь
const id = await scraper.addToQueue('https://example.com', options, priority);

// Удаление из очереди
scraper.removeFromQueue(id);

// Статус очереди
const status = scraper.getQueueStatus();
console.log(`Total: ${status.total}, Active: ${status.active}, Waiting: ${status.waiting}`);

// Очистка очереди
scraper.clearQueue();
```

### Пакетная обработка

```typescript
const urls = [
  'https://site1.com/products',
  'https://site2.com/catalog',
  'https://site3.com/items'
];

const batchResult = await scraper.scrapeBatch(urls, {
  maxProducts: 5,
  headless: true
});

console.log(`Success: ${batchResult.summary.successful}/${batchResult.summary.total}`);
```

### События

```typescript
scraper.on('queued', (data) => {
  console.log(`Queued: ${data.url} (priority: ${data.priority})`);
});

scraper.on('started', (data) => {
  console.log(`Started: ${data.url}`);
});

scraper.on('completed', (data) => {
  console.log(`Completed: ${data.url} - ${data.result.totalFound} products`);
});

scraper.on('error', (error) => {
  console.error(`Error: ${error.url} - ${error.error}`);
});

scraper.on('retrying', (data) => {
  console.log(`Retrying: ${data.url} (attempt ${data.retryCount})`);
});
```

### Мониторинг и статистика

```typescript
// Получение статистики
const stats = scraper.getStats();
console.log(`Success rate: ${stats.successRate.toFixed(2)}%`);
console.log(`Average response time: ${stats.averageResponseTime.toFixed(0)}ms`);

// Прогресс выполнения
const progress = scraper.getProgress();
console.log(`Progress: ${progress.completed}/${progress.total}`);
console.log(`Estimated time: ${progress.estimatedTimeRemaining}ms`);

// Сброс статистики
scraper.resetStats();
```

## 📊 Структуры данных

### ScrapedProduct

```typescript
interface ScrapedProduct {
  id: string;                    // Уникальный идентификатор
  title: string;                 // Название продукта
  price: number;                 // Цена
  originalPrice?: number;        // Исходная цена (если есть скидка)
  currency: string;              // Валюта
  image: string;                 // URL изображения
  url: string;                   // URL страницы продукта
  source: string;                // Источник данных
  category?: string;             // Категория
  rating?: number;               // Рейтинг
  reviewsCount?: number;         // Количество отзывов
  availability: boolean;         // Доступность
  description?: string;          // Описание
  specifications?: Record<string, string>; // Характеристики
  scrapedAt: number;            // Время скрапинга
  metadata?: Record<string, unknown>; // Дополнительные данные
}
```

### ScrapingResult

```typescript
interface ScrapingResult {
  source: string;                // Источник
  products: ScrapedProduct[];    // Массив продуктов
  totalFound: number;            // Общее количество найденных
  success: boolean;              // Успешность операции
  executionTime: number;         // Время выполнения
  error?: string;                // Ошибка (если есть)
  metadata?: {                   // Метаданные
    pageCount?: number;          // Количество страниц
    lastPage?: number;           // Последняя страница
    hasMorePages?: boolean;      // Есть ли еще страницы
  };
}
```

## 🛠️ Примеры использования

### Базовый скрапинг

```typescript
import { WebScraper } from './web-scraper';

async function basicScraping() {
  const scraper = new WebScraper();
  
  try {
    const results = await scraper.scrapeProducts('laptop', ['wildberries'], {
      maxProducts: 5,
      headless: true
    });
    
    results.forEach(result => {
      console.log(`${result.source}: ${result.totalFound} products`);
      result.products.forEach(product => {
        console.log(`- ${product.title}: ${product.price} ${product.currency}`);
      });
    });
  } finally {
    await scraper.close();
  }
}
```

### Улучшенный скрапинг с очередью

```typescript
import { createEnhancedScraper } from './enhanced-web-scraper';

async function enhancedScraping() {
  const scraper = createEnhancedScraper({
    maxConcurrent: 2,
    requestDelay: 1500
  });
  
  // Настройка событий
  scraper.on('completed', (data) => {
    console.log(`✅ ${data.url}: ${data.result.totalFound} products`);
  });
  
  try {
    // Добавление URL в очередь
    const urls = [
      'https://site1.com/search?q=phone',
      'https://site2.com/search?q=laptop'
    ];
    
    for (const url of urls) {
      await scraper.addToQueue(url, { maxProducts: 10 });
    }
    
    // Ожидание завершения
    await new Promise(resolve => {
      const checkComplete = () => {
        const status = scraper.getQueueStatus();
        if (status.total === 0) resolve(true);
        else setTimeout(checkComplete, 1000);
      };
      checkComplete();
    });
    
  } finally {
    await scraper.close();
  }
}
```

### Пакетная обработка

```typescript
import { createEcommerceScraper } from './enhanced-web-scraper';

async function batchScraping() {
  const scraper = createEcommerceScraper();
  
  try {
    const urls = [
      'https://wildberries.ru/catalog/0/search.aspx?search=smartphone',
      'https://ozon.ru/search/?text=laptop'
    ];
    
    const result = await scraper.scrapeBatch(urls, {
      maxProducts: 5
    });
    
    console.log(`Batch completed: ${result.summary.successful}/${result.summary.total}`);
    console.log(`Total time: ${result.summary.totalTime}ms`);
    
  } finally {
    await scraper.close();
  }
}
```

## ⚠️ Важные замечания

### Соблюдение правил
- **Respect robots.txt** - соблюдайте правила сайтов
- **Rate limiting** - не перегружайте серверы
- **User-Agent** - используйте реалистичные заголовки
- **Delays** - добавляйте задержки между запросами

### Обработка ошибок
- Всегда используйте try-catch блоки
- Закрывайте скрапперы в finally блоке
- Обрабатывайте сетевые ошибки и таймауты
- Логируйте ошибки для отладки

### Производительность
- Используйте headless режим для продакшена
- Настраивайте количество одновременных запросов
- Мониторьте использование памяти
- Закрывайте неиспользуемые браузеры

## 🔍 Отладка

### Включение логирования

```typescript
// Включение детального логирования
const scraper = new WebScraper();
scraper.on('log', (message) => {
  console.log(`[SCRAPER] ${message}`);
});
```

### Мониторинг производительности

```typescript
const stats = scraper.getStats();
console.log('Performance metrics:', {
  successRate: `${stats.successRate.toFixed(2)}%`,
  avgResponseTime: `${stats.averageResponseTime.toFixed(0)}ms`,
  totalProducts: stats.totalProducts
});
```

### Проверка состояния

```typescript
// Статус очереди
const queueStatus = enhancedScraper.getQueueStatus();

// Прогресс выполнения
const progress = enhancedScraper.getProgress();

// Доступные источники
const sources = scraper.getAvailableSources();
```

## 📚 Дополнительные ресурсы

- [Puppeteer Documentation](https://pptr.dev/)
- [Cheerio Documentation](https://cheerio.js.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Web Scraping Best Practices](https://www.scraperapi.com/blog/web-scraping-best-practices/)

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте логи и сообщения об ошибках
2. Убедитесь в корректности селекторов
3. Проверьте сетевое соединение
4. Обновите User-Agent и заголовки
5. Добавьте дополнительные задержки

---

**Версия:** 2.0.0  
**Дата обновления:** Декабрь 2024  
**Автор:** AI Assistant
