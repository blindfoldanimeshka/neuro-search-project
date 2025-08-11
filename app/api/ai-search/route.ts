import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { ExternalProduct } from '../../lib/external-apis';
import { webScraper } from '../../lib/web-scraper';
import { searchIndexManager } from '../../lib/search-index';
import { createPostHandler, createApiError } from '../../lib/api-handler';
import { envConfig } from '../../lib/env-validator';

// Схема валидации для запроса
const aiSearchSchema = z.object({
  query: z.string().min(1, 'Query is required').max(200, 'Query is too long'),
  filters: z.record(z.unknown()).optional().default({})
});

interface AISearchResult {
  query: string;
  searchUrls: string[];
  products: ExternalProduct[];
  searchTime: number;
  indexedCount: number;
  aiAnalysis?: string;
  recommendations?: string[];
  indexId?: string;
}

// Инициализация OpenAI клиента
let openai: OpenAI | null = null;
const aiConfig = envConfig.getAIConfig();

if (aiConfig.provider === 'openrouter' && aiConfig.apiKey) {
  openai = new OpenAI({
    apiKey: aiConfig.apiKey,
    baseURL: aiConfig.baseURL,
  });
}

// Обработчик POST запроса с использованием createPostHandler
export const POST = createPostHandler<z.infer<typeof aiSearchSchema>, AISearchResult>(
  async (request, body) => {
    const { query, filters } = body;
    
    // Проверяем, что AI сервис настроен
    if (!openai) {
      throw createApiError.serverError(
        'AI service not configured. Please check your environment configuration.'
      );
    }

    const startTime = Date.now();

    // Сначала проверяем индекс на наличие похожих результатов
    const searchResult = searchIndexManager.search(query, filters);
    const indexedResults = searchResult.products;
    
    let products: ExternalProduct[] = [];
    let searchUrls: string[] = [];
    let indexId: string | undefined;

    if (indexedResults.length > 0) {
      // Используем результаты из индекса
      products = indexedResults;
      console.log(`Found ${products.length} products from index for query: ${query}`);
    } else {
      // Выполняем новый поиск
      searchUrls = await performAISearch(query, filters);
      products = await indexAndExtractProducts(searchUrls, query, filters);
      
      // Добавляем результаты в индекс
      if (products.length > 0) {
        // Преобразуем ExternalProduct в ScrapedProduct
        const scrapedProducts = products.map(product => ({
          id: product.id,
          title: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          currency: 'RUB',
          image: product.image || '',
          url: product.url,
          source: (product.source as any) || 'custom',
          category: product.category,
          rating: product.rating,
          reviewsCount: product.reviews,
          availability: product.availability,
          description: product.description,
          scrapedAt: Date.now()
        }));
        
        searchIndexManager.addProducts(scrapedProducts);
        indexId = Date.now().toString();
      }
    }

    const searchTime = Date.now() - startTime;

    // Получаем AI анализ результатов
    let aiAnalysis: string | undefined;
    let recommendations: string[] | undefined;

    if (products.length > 0) {
      try {
        const analysisResponse = await openai.chat.completions.create({
          model: aiConfig.model,
          messages: [
            {
              role: 'system',
              content: 'Ты эксперт по анализу товаров. Проанализируй результаты поиска и дай краткие рекомендации.'
            },
            {
              role: 'user',
              content: `Проанализируй результаты поиска "${query}": ${JSON.stringify(products.slice(0, 5))}. 
              Дай краткий анализ (2-3 предложения) и 3 рекомендации для покупки.`
            }
          ],
          temperature: 0.3,
          max_tokens: 300,
        });

        const analysis = analysisResponse.choices[0]?.message?.content || '';
        const lines = analysis.split('\n').filter(line => line.trim());
        
        aiAnalysis = lines[0] || '';
        recommendations = lines.slice(1).filter(line => line.includes('•') || line.includes('-'));
      } catch (error) {
        console.error('Error getting AI analysis:', error);
        // Не прерываем выполнение, если анализ не удался
      }
    }

    return {
      query,
      searchUrls,
      products,
      searchTime,
      indexedCount: searchUrls.length,
      aiAnalysis,
      recommendations,
      indexId
    };
  },
  {
    bodySchema: aiSearchSchema,
    rateLimit: 'ai',
    logRequests: true
  }
);

// Функция для ИИ-поиска через Google
async function performAISearch(query: string, filters: Record<string, unknown>): Promise<string[]> {
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }

  const aiConfig = envConfig.getAIConfig();
  const systemPrompt = `Ты - эксперт по поиску товаров в интернете. 
  
Задача: Найди релевантные сайты для поиска товара "${query}" в российском интернете.

Инструкции:
1. Предложи 5-10 конкретных URL-адресов российских сайтов, где можно найти этот товар
2. Включи популярные маркетплейсы: Wildberries, Ozon, Яндекс.Маркет, СберМегаМаркет, Авито
3. Добавь специализированные магазины для данной категории товаров
4. Учитывай фильтры: ${JSON.stringify(filters)}
5. Возвращай только URL-адреса, разделенные переносами строк
6. Не добавляй описания или комментарии

Пример ответа:
https://www.wildberries.ru/catalog/0/search.aspx?search=смартфон
https://www.ozon.ru/search/?text=смартфон
https://market.yandex.ru/search?text=смартфон
https://www.avito.ru/all?q=смартфон
https://sbermegamarket.ru/catalog/?q=смартфон`;

  const completion = await openai.chat.completions.create({
    model: aiConfig.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Найди сайты для поиска товара: ${query}` }
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const response = completion.choices[0]?.message?.content || '';
  
  // Парсим URL из ответа ИИ
  const urls = response
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('http'))
    .slice(0, 10); // Ограничиваем до 10 URL

  // Добавляем стандартные маркетплейсы если ИИ не нашел достаточно URL
  const defaultUrls = [
    `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(query)}`,
    `https://www.ozon.ru/search/?text=${encodeURIComponent(query)}`,
    `https://market.yandex.ru/search?text=${encodeURIComponent(query)}`,
    `https://www.avito.ru/all?q=${encodeURIComponent(query)}`,
    `https://sbermegamarket.ru/catalog/?q=${encodeURIComponent(query)}`
  ];

  const allUrls = [...new Set([...urls, ...defaultUrls])];
  
  return allUrls.slice(0, 10);
}

// Функция для индексации и извлечения товаров
async function indexAndExtractProducts(urls: string[], query: string, filters: Record<string, unknown>): Promise<ExternalProduct[]> {
  const allProducts: ExternalProduct[] = [];
  
  // Параллельно обрабатываем все URL
  const scrapingPromises = urls.map(async (url) => {
    try {
      // Используем новый метод scrapeByUrl для автоматического определения типа сайта
      const result = await webScraper.scrapeByUrl(url, filters);
      return result.products;
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return [];
    }
  });

  const results = await Promise.all(scrapingPromises);
  
  // Объединяем все результаты и преобразуем в ExternalProduct
  results.forEach(products => {
    const externalProducts = products.map(product => ({
      id: product.id,
      name: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      rating: product.rating,
      reviews: product.reviewsCount,
      seller: 'Не указан',
      source: (product.source as any) || 'custom',
      url: product.url,
      image: product.image,
      description: product.description,
      category: product.category,
      subcategory: '',
      availability: product.availability,
      deliveryTime: 'Не указано',
      location: 'Не указано'
    }));
    allProducts.push(...externalProducts);
  });

  // Удаляем дубликаты по ID
  const uniqueProducts = allProducts.filter((product, index, self) => 
    index === self.findIndex(p => p.id === product.id)
  );

  return uniqueProducts;
}