import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { webScraper } from '@/lib/web-scraper';
import { productDatabase } from '@/lib/product-database';
import { aiAnalyzer } from '@/lib/ai-analyzer';

// Функция для вызова нейропарсера
async function callNeuroParser(query: string, userPrompt?: string, context?: any, options?: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ai-neuro-parser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        userPrompt,
        sources: options?.sources || ['wildberries', 'ozon'],
        maxProducts: options?.maxProducts || 20,
        includeAnalysis: options?.includeAnalysis !== false,
        saveToDatabase: options?.saveToDatabase !== false,
        context
      })
    });

    if (!response.ok) {
      throw new Error(`Neuro parser error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling neuro parser:', error);
    return null;
  }
}

// Инициализация OpenAI клиента для OpenRouter
const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
}) : null;

const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-chat-v3-0324:free';

interface AIAssistantRequest {
  message: string;
  action?: 'chat' | 'search' | 'analyze' | 'recommend' | 'compare';
  context?: {
    previousProducts?: any[];
    searchHistory?: string[];
    userPreferences?: Record<string, any>;
  };
  options?: {
    maxProducts?: number;
    sources?: string[];
    includeAnalysis?: boolean;
    saveToHistory?: boolean;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: AIAssistantRequest = await request.json();
    const { message, action, context, options } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Сообщение обязательно для заполнения' },
        { status: 400 }
      );
    }

    // Определяем действие на основе сообщения
    const detectedAction = action || detectAction(message);
    
    let response: string;
    let data: any = {};
    let sourcesUsed: string[] = [];
    let productsFound = 0;

    switch (detectedAction) {
      case 'search':
        const searchResult = await handleSearch(message, options);
        response = searchResult.response;
        data.products = searchResult.products;
        sourcesUsed = searchResult.sourcesUsed;
        productsFound = searchResult.productsFound;
        break;

      case 'analyze':
        const analysisResult = await handleAnalysis(message, context, options);
        response = analysisResult.response;
        data.analysis = analysisResult.analysis;
        sourcesUsed = analysisResult.sourcesUsed;
        productsFound = analysisResult.productsFound;
        break;

      case 'recommend':
        const recommendResult = await handleRecommendations(message, context, options);
        response = recommendResult.response;
        data.recommendations = recommendResult.recommendations;
        sourcesUsed = recommendResult.sourcesUsed;
        productsFound = recommendResult.productsFound;
        break;

      case 'compare':
        const compareResult = await handleComparison(message, context, options);
        response = compareResult.response;
        data.comparison = compareResult.comparison;
        sourcesUsed = compareResult.sourcesUsed;
        productsFound = compareResult.productsFound;
        break;

      default:
        const chatResult = await handleChat(message, context);
        response = chatResult.response;
        break;
    }

    // Сохраняем в историю поиска
    if (options?.saveToHistory && sourcesUsed.length > 0) {
      productDatabase.addSearchHistory(message, productsFound, sourcesUsed);
    }

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      response,
      data,
      metadata: {
        action: detectedAction,
        executionTime,
        sourcesUsed,
        productsFound
      }
    });

  } catch (error) {
    console.error('Error in AI Assistant:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Определение действия на основе сообщения
function detectAction(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('найди') || lowerMessage.includes('поиск') || lowerMessage.includes('ищи') || 
      lowerMessage.includes('найти') || lowerMessage.includes('покажи') || lowerMessage.includes('ищу')) {
    return 'search';
  }
  
  if (lowerMessage.includes('анализ') || lowerMessage.includes('проанализируй') || lowerMessage.includes('статистика')) {
    return 'analyze';
  }
  
  if (lowerMessage.includes('рекомендации') || lowerMessage.includes('посоветуй') || lowerMessage.includes('выбор') ||
      lowerMessage.includes('что выбрать') || lowerMessage.includes('какой лучше')) {
    return 'recommend';
  }
  
  if (lowerMessage.includes('сравни') || lowerMessage.includes('сравнение') || lowerMessage.includes('что лучше')) {
    return 'compare';
  }
  
  return 'chat';
}

// Обработка поиска
async function handleSearch(message: string, options?: any) {
  const searchQuery = extractSearchQuery(message);
  const sources = options?.sources || ['wildberries', 'ozon'];
  const maxProducts = options?.maxProducts || 20;

  // Сначала пытаемся использовать нейропарсер
  const neuroParserResult = await callNeuroParser(searchQuery, message, undefined, {
    sources,
    maxProducts,
    includeAnalysis: true,
    saveToDatabase: true
  });

  if (neuroParserResult?.success && neuroParserResult.data.products.length > 0) {
    const { products, summary, sourcesUsed, totalFound } = neuroParserResult.data;
    
    let response = `🧠 **Нейропарсер нашел ${products.length} товаров:**\n\n`;
    response += `${summary}\n\n`;
    
    if (products.length > 0) {
      response += `📦 **Лучшие варианты:**\n`;
      products.slice(0, 5).forEach((product: any, index: number) => {
        response += `${index + 1}. **${product.title}**\n`;
        response += `   💰 Цена: ${product.price} ${product.currency}\n`;
        if (product.rating) {
          response += `   ⭐ Рейтинг: ${product.rating}/5\n`;
        }
        response += `   🏪 Источник: ${product.source}\n`;
        
        // Добавляем ИИ анализ если есть
        if (product.aiAnalysis) {
          response += `   🤖 **ИИ анализ:** ${product.aiAnalysis.summary}\n`;
          if (product.aiAnalysis.pros.length > 0) {
            response += `   ✅ Плюсы: ${product.aiAnalysis.pros.slice(0, 2).join(', ')}\n`;
          }
          if (product.aiAnalysis.cons.length > 0) {
            response += `   ⚠️ Минусы: ${product.aiAnalysis.cons.slice(0, 2).join(', ')}\n`;
          }
        }
        response += `\n`;
      });

      if (products.length > 5) {
        response += `... и еще ${products.length - 5} товаров\n`;
      }
    }

    return { 
      response, 
      products, 
      sourcesUsed, 
      productsFound: products.length,
      neuroParserUsed: true 
    };
  }

  // Если нейропарсер не сработал, используем обычный поиск
  let allProducts: any[] = [];
  let sourcesUsed: string[] = [];

  // Поиск по существующим данным
  const existingProducts = productDatabase.searchProducts(searchQuery, {
    maxResults: maxProducts,
    sources: sources.includes('all') ? undefined : sources
  });

  if (existingProducts.length > 0) {
    allProducts = existingProducts;
    sourcesUsed = [...new Set(existingProducts.map(p => p.source))];
  }

  // Если данных недостаточно, используем скрапер
  if (allProducts.length < maxProducts / 2) {
    try {
      const scrapedResults = await webScraper.scrapeProducts(searchQuery, sources);
      const scrapedProducts = scrapedResults.flatMap(result => result.products || []);

      // Сохраняем новые товары в базу
      productDatabase.addProducts(scrapedProducts);
      
      allProducts = [...existingProducts, ...scrapedProducts];
      sourcesUsed = [...new Set(allProducts.map(p => p.source))];
    } catch (error) {
      console.error('Error scraping products:', error);
    }
  }

  // Сортируем по релевантности
  allProducts.sort((a, b) => {
    const aRating = a.rating || 0;
    const bRating = b.rating || 0;
    return bRating - aRating;
  });

  const products = allProducts.slice(0, maxProducts);
  const productsFound = products.length;

  let response = `🔍 Найдено ${productsFound} товаров по запросу "${searchQuery}":\n\n`;
  
  if (products.length > 0) {
    response += `📦 Топ товары:\n`;
    products.slice(0, 5).forEach((product, index) => {
      response += `${index + 1}. ${product.title}\n`;
      response += `   💰 Цена: ${product.price} ${product.currency}\n`;
      if (product.rating) {
        response += `   ⭐ Рейтинг: ${product.rating}/5\n`;
      }
      response += `   🏪 Источник: ${product.source}\n\n`;
    });

    if (products.length > 5) {
      response += `... и еще ${products.length - 5} товаров\n`;
    }
  } else {
    response += `😔 К сожалению, товары не найдены. Попробуйте изменить запрос.`;
  }

  return { response, products, sourcesUsed, productsFound };
}

// Обработка анализа
async function handleAnalysis(message: string, context?: any, options?: any) {
  const searchQuery = extractSearchQuery(message);
  const maxProducts = options?.maxProducts || 50;

  // Получаем товары для анализа
  let products = productDatabase.searchProducts(searchQuery, { maxResults: maxProducts });
  
  if (products.length === 0) {
    // Если товаров нет, пытаемся найти через скрапер
    try {
      const scrapedResults = await webScraper.scrapeProducts(searchQuery, ['wildberries', 'ozon']);
      products = scrapedResults.flatMap(result => result.products || []);
      productDatabase.addProducts(products);
    } catch (error) {
      console.error('Error scraping products for analysis:', error);
    }
  }

  if (products.length === 0) {
    return {
      response: `😔 Не удалось найти товары для анализа по запросу "${searchQuery}". Попробуйте другой запрос.`,
      analysis: null,
      sourcesUsed: [],
      productsFound: 0
    };
  }

  // Анализируем с помощью ИИ
  const analysis = await aiAnalyzer.analyzeProducts(products, searchQuery);
  
  let response = `📊 Анализ товаров по запросу "${searchQuery}":\n\n`;
  response += `📋 ${analysis.summary}\n\n`;
  
  if (analysis.insights.length > 0) {
    response += `💡 Ключевые инсайты:\n`;
    analysis.insights.forEach(insight => {
      response += `• ${insight}\n`;
    });
    response += `\n`;
  }

  if (analysis.recommendations.length > 0) {
    response += `🎯 Рекомендации:\n`;
    analysis.recommendations.forEach(rec => {
      response += `• ${rec}\n`;
    });
    response += `\n`;
  }

  response += `💰 Анализ цен:\n`;
  response += `• Средняя цена: ${analysis.priceAnalysis.averagePrice} ₽\n`;
  response += `• Диапазон: ${analysis.priceAnalysis.priceRange}\n`;
  response += `• Лучшее соотношение: ${analysis.priceAnalysis.bestValue}\n\n`;

  response += `⭐ Анализ качества:\n`;
  response += `• Средний рейтинг: ${analysis.qualityAnalysis.averageRating}/5\n`;
  response += `• Распределение: ${analysis.qualityAnalysis.ratingDistribution}\n`;

  const sourcesUsed = [...new Set(products.map(p => p.source))];
  const productsFound = products.length;

  return { response, analysis, sourcesUsed, productsFound };
}

// Обработка рекомендаций
async function handleRecommendations(message: string, context?: any, options?: any) {
  const searchQuery = extractSearchQuery(message);
  const maxProducts = options?.maxProducts || 30;
  const userPreferences = context?.userPreferences;

  // Получаем товары для рекомендаций
  let products = productDatabase.searchProducts(searchQuery, { maxResults: maxProducts });
  
  if (products.length === 0) {
    try {
      const scrapedResults = await webScraper.scrapeProducts(searchQuery, ['wildberries', 'ozon']);
      products = scrapedResults.flatMap(result => result.products || []);
      productDatabase.addProducts(products);
    } catch (error) {
      console.error('Error scraping products for recommendations:', error);
    }
  }

  if (products.length === 0) {
    return {
      response: `😔 Не удалось найти товары для рекомендаций по запросу "${searchQuery}". Попробуйте другой запрос.`,
      recommendations: null,
      sourcesUsed: [],
      productsFound: 0
    };
  }

  // Генерируем рекомендации с помощью ИИ
  const recommendations = await aiAnalyzer.generateRecommendations(products, searchQuery, userPreferences);
  
  let response = `🎯 Рекомендации по выбору товара "${searchQuery}":\n\n`;
  response += `📝 ${recommendations.reasoning}\n\n`;
  
  response += `🏆 Лучшие варианты:\n`;
  recommendations.products.forEach((product, index) => {
    response += `${index + 1}. ${product.title}\n`;
    response += `   💰 Цена: ${product.price} ${product.currency}\n`;
    if (product.rating) {
      response += `   ⭐ Рейтинг: ${product.rating}/5\n`;
    }
    response += `   🏪 Источник: ${product.source}\n\n`;
  });

  if (recommendations.alternatives.length > 0) {
    response += `🔄 Альтернативы:\n`;
    recommendations.alternatives.forEach(alt => {
      response += `• ${alt}\n`;
    });
    response += `\n`;
  }

  response += `💰 ${recommendations.priceComparison}`;

  const sourcesUsed = [...new Set(products.map(p => p.source))];
  const productsFound = products.length;

  return { response, recommendations, sourcesUsed, productsFound };
}

// Обработка сравнения
async function handleComparison(message: string, context?: any, options?: any) {
  const searchQuery = extractSearchQuery(message);
  const maxProducts = options?.maxProducts || 20;

  // Определяем источники для сравнения
  const sources = ['wildberries', 'ozon'];
  let allProducts: any[] = [];

  try {
    // Получаем товары из разных источников
    const scrapedResults = await webScraper.scrapeProducts(searchQuery, sources);
    for (const result of scrapedResults) {
      if (result.products) {
        productDatabase.addProducts(result.products);
        allProducts.push(...result.products);
      }
    }
  } catch (error) {
    console.error('Error scraping products for comparison:', error);
  }

  if (allProducts.length === 0) {
    return {
      response: `😔 Не удалось найти товары для сравнения по запросу "${searchQuery}". Попробуйте другой запрос.`,
      comparison: null,
      sourcesUsed: [],
      productsFound: 0
    };
  }

  // Разделяем товары по источникам
  const wildberriesProducts = allProducts.filter(p => p.source === 'wildberries');
  const ozonProducts = allProducts.filter(p => p.source === 'ozon');

  // Сравниваем с помощью ИИ
  const comparison = await aiAnalyzer.compareSources(
    wildberriesProducts, 
    ozonProducts, 
    'Wildberries', 
    'Ozon'
  );

  let response = `⚖️ Сравнение источников по запросу "${searchQuery}":\n\n`;
  
  response += `🏪 Wildberries:\n`;
  response += `• Товаров: ${comparison.source1.products.length}\n`;
  response += `• Средняя цена: ${Math.round(comparison.source1.averagePrice)} ₽\n`;
  response += `• Средний рейтинг: ${comparison.source1.averageRating.toFixed(1)}/5\n\n`;

  response += `🏪 Ozon:\n`;
  response += `• Товаров: ${comparison.source2.products.length}\n`;
  response += `• Средняя цена: ${Math.round(comparison.source2.averagePrice)} ₽\n`;
  response += `• Средний рейтинг: ${comparison.source2.averageRating.toFixed(1)}/5\n\n`;

  response += `🏆 Победитель по цене: ${comparison.winner}\n`;
  response += `💰 Разница в ценах: ${Math.round(comparison.priceDifference)} ₽\n`;
  response += `⭐ Разница в качестве: ${comparison.qualityDifference.toFixed(1)} баллов\n\n`;

  response += `💡 Рекомендации:\n`;
  comparison.recommendations.forEach(rec => {
    response += `• ${rec}\n`;
  });

  const sourcesUsed = ['wildberries', 'ozon'];
  const productsFound = allProducts.length;

  return { response, comparison, sourcesUsed, productsFound };
}

// Обработка обычного чата
async function handleChat(message: string, context?: any) {
  if (!openai) {
    return {
      response: `Привет! Я ваш ИИ помощник для поиска и анализа товаров. К сожалению, сейчас ИИ недоступен, но я могу помочь с поиском товаров. Попробуйте написать "найди смартфоны" или "анализ цен на ноутбуки".`
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: `Ты ИИ помощник для поиска и анализа товаров на маркетплейсах. Ты можешь:
- Искать товары на Wildberries, Ozon и других площадках
- Анализировать цены и рейтинги
- Давать рекомендации по выбору
- Сравнивать источники

Отвечай на русском языке, будь дружелюбным и полезным. Если пользователь просит найти товары, предложи использовать поиск.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return {
      response: response.choices[0]?.message?.content || 'Извините, не удалось обработать ваш запрос.'
    };
  } catch (error) {
    console.error('Error in chat:', error);
    return {
      response: `Привет! Я ваш ИИ помощник для поиска и анализа товаров. К сожалению, сейчас ИИ недоступен, но я могу помочь с поиском товаров. Попробуйте написать "найди смартфоны" или "анализ цен на ноутбуки".`
    };
  }
}

// Извлечение поискового запроса из сообщения
function extractSearchQuery(message: string): string {
  // Убираем ключевые слова и оставляем сам запрос
  const searchKeywords = ['найди', 'найти', 'поиск', 'ищи', 'проанализируй', 'анализ', 'рекомендации', 'посоветуй', 'сравни', 'сравнение'];
  
  let query = message.toLowerCase();
  for (const keyword of searchKeywords) {
    query = query.replace(new RegExp(keyword, 'gi'), '').trim();
  }
  
  // Убираем лишние символы
  query = query.replace(/[^\w\sа-яё]/gi, ' ').trim();
  
  return query || 'товары';
}
