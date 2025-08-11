# Веб-скраппер - Документация

## 📖 Обзор

Веб-скраппер - это мощный инструмент для автоматического сбора данных с e-commerce сайтов. Он поддерживает множество источников, имеет встроенную защиту от блокировки и предоставляет детальную статистику.

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install puppeteer
```

### Простой пример

```typescript
import { webScraper } from './web-scraper';

// Инициализация
await webScraper.initialize({ headless: true });

// Поиск товаров
const results = await webScraper.scrapeProducts(
  'смартфон',
  ['wildberries'],
  { maxProducts: 10 }
);

console.log(`Найдено ${results.totalFound} товаров`);
```

## 🔧 Конфигурация

### Основные настройки

```typescript
const options: ScrapingOptions = {
  maxProducts: 20,        // Максимум товаров для поиска
  timeout: 30000,         // Таймаут в миллисекундах
  headless: true,         // Фоновый режим браузера
  delay: 1000,            // Задержка между запросами
  retries: 2,             // Количество повторных попыток
  scrollToLoad: true,     // Прокрутка для загрузки контента
  maxScrolls: 3,          // Максимум прокруток
  respectRobotsTxt: true, // Уважение robots.txt
  viewport: {
    width: 1920,
    height: 1080
  }
};
```

### Настройки источников

```typescript
const sourceConfig = webScraper.getSourceConfig('wildberries');
console.log(sourceConfig.selectors.productCard); // '.product-card, .j-card'
console.log(sourceConfig.pagination.maxPages);   // 5
```

## 📊 Поддерживаемые источники

| Источник | Описание | Статус |
|----------|----------|---------|
| **Wildberries** | Российский маркетплейс | ✅ Активен |
| **Ozon** | Российский маркетплейс | ✅ Активен |
| **Avito** | Российские объявления | ✅ Активен |
| **Yandex.Market** | Яндекс.Маркет | ✅ Активен |
| **Sbermegamarket** | СберМегаМаркет | ✅ Активен |

## 🎯 Основные методы

### `scrapeProducts(query, sources, options)`

Основной метод для поиска товаров.

```typescript
const results = await webScraper.scrapeProducts(
  'ноутбук',                    // Поисковый запрос
  ['wildberries', 'ozon'],      // Источники
  { 
    maxProducts: 15,
    delay: 2000,
    headless: true
  }
);
```

### `scrapeBatch(queries, sources, options)`

Пакетная обработка множественных запросов.

```typescript
const batchResults = await webScraper.scrapeBatch(
  ['смартфон', 'ноутбук', 'планшет'],
  ['all'],
  { maxProducts: 5 }
);
```

### `getStats()`

Получение статистики скраппинга.

```typescript
const stats = webScraper.getStats();
console.log(`Успешность: ${stats.successRate.toFixed(2)}%`);
console.log(`Всего запросов: ${stats.totalRequests}`);
```

## 🛡️ Анти-бот защита

Веб-скраппер включает несколько уровней защиты:

- **User-Agent ротация** - Случайные браузерные заголовки
- **Задержки** - Настраиваемые паузы между запросами
- **Заголовки** - Реалистичные HTTP заголовки
- **Куки** - Поддержка сессий и аутентификации
- **Прокси** - Возможность использования прокси-серверов

## 📈 Мониторинг и статистика

### Детальная статистика

```typescript
interface ScrapingStats {
  totalRequests: number;           // Общее количество запросов
  successfulRequests: number;      // Успешные запросы
  failedRequests: number;          // Неудачные запросы
  totalProducts: number;           // Общее количество товаров
  averageResponseTime: number;     // Среднее время ответа
  successRate: number;             // Процент успешности
  totalTime: number;               // Общее время работы
  sources: Record<string, {        // Статистика по источникам
    requests: number;
    success: number;
    failed: number;
    products: number;
    avgTime: number;
  }>;
  errors: Array<{                  // Детали ошибок
    source: string;
    error: string;
    timestamp: number;
  }>;
}
```

### События и прогресс

```typescript
// Подписка на события
webScraper.on('progress', (progress) => {
  console.log(`Прогресс: ${progress.completed}/${progress.total}`);
});

webScraper.on('error', (error) => {
  console.error(`Ошибка: ${error.error}`);
});
```

## 🔄 Обработка ошибок

### Автоматические повторные попытки

```typescript
const options: ScrapingOptions = {
  retries: 3,                    // Количество попыток
  delay: 2000,                   // Задержка между попытками
  exponentialBackoff: true       // Экспоненциальное увеличение задержки
};
```

### Обработка ошибок

```typescript
try {
  const results = await webScraper.scrapeProducts('товар', ['wildberries']);
  console.log('Успешно:', results);
} catch (error) {
  if (error instanceof ScrapingError) {
    console.error(`Ошибка скраппинга: ${error.message}`);
    console.error(`Источник: ${error.source}`);
    console.error(`Попытка: ${error.retryCount}`);
  } else {
    console.error('Неожиданная ошибка:', error);
  }
}
```

## 🧪 Тестирование

### Запуск тестов

```bash
# Компиляция и запуск теста
npm run test:scraper

# Режим наблюдения
npm run test:scraper:watch
```

### Создание собственных тестов

```typescript
// test-custom.ts
import { webScraper } from './web-scraper';

async function testCustomScraping() {
  try {
    await webScraper.initialize();
    
    const results = await webScraper.scrapeProducts(
      'тестовый товар',
      ['wildberries'],
      { maxProducts: 2, timeout: 10000 }
    );
    
    console.log('Тест пройден:', results);
  } catch (error) {
    console.error('Тест провален:', error);
  } finally {
    await webScraper.close();
  }
}

testCustomScraping();
```

## 📝 Примеры использования

Смотрите файл `web-scraper-examples.ts` для подробных примеров:

- Базовый поиск товаров
- Поиск по всем источникам
- Кастомные настройки скраппинга
- Мониторинг статистики
- Пакетная обработка
- Обработка ошибок
- Тестирование производительности

## ⚠️ Важные замечания

1. **Соблюдайте robots.txt** - Уважайте правила сайтов
2. **Умеренные задержки** - Не перегружайте серверы
3. **Правовые аспекты** - Убедитесь в законности использования
4. **Мониторинг** - Следите за статистикой и ошибками
5. **Обновления** - Регулярно обновляйте селекторы CSS

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи и статистику
2. Убедитесь в актуальности селекторов CSS
3. Проверьте настройки сети и прокси
4. Обратитесь к документации Puppeteer
5. Создайте issue в репозитории

## 📚 Дополнительные ресурсы

- [Puppeteer Documentation](https://pptr.dev/)
- [CSS Selectors Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [Web Scraping Best Practices](https://www.scraperapi.com/blog/web-scraping-best-practices/)
- [Anti-Bot Detection](https://www.scraperapi.com/blog/5-techniques-to-avoid-bot-detection/)
