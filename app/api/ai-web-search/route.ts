import { NextRequest, NextResponse } from 'next/server';
import { webScraper } from '@/lib/web-scraper';
import OpenAI from 'openai';

// Инициализация OpenAI клиента для OpenRouter
const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
}) : null;

// Модель по умолчанию
const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-chat-v3-0324:free';

interface WebSearchRequest {
  message: string;
  model?: string;
  sources?: string[];
  maxProducts?: number;
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    location?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      model = DEFAULT_MODEL, 
      sources = ['all'],
      maxProducts = 20,
      filters = {}
    }: WebSearchRequest = await request.json();

    if (!process.env.OPENROUTER_API_KEY || !openai) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // 1. Анализируем сообщение пользователя с помощью AI
    const analysisPrompt = `Проанализируй сообщение пользователя и извлеки:
1. Поисковый запрос (что ищет пользователь)
2. Категорию товара (если указана)
3. Ценовой диапазон (если указан)
4. Локацию (если указана)
5. Дополнительные требования

Сообщение: "${message}"

Ответь в формате JSON:
{
  "searchQuery": "основной поисковый запрос",
  "category": "категория или null",
  "minPrice": число или null,
  "maxPrice": число или null,
  "location": "локация или null",
  "additionalRequirements": "дополнительные требования или null"
}`;

    const analysisResponse = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'Ты - помощник для анализа поисковых запросов. Отвечай только в формате JSON.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const analysisText = analysisResponse.choices[0]?.message?.content || '{}';
    let searchAnalysis;
    
    try {
      searchAnalysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI analysis:', parseError);
      // Fallback: используем исходное сообщение как поисковый запрос
      searchAnalysis = {
        searchQuery: message,
        category: null,
        minPrice: null,
        maxPrice: null,
        location: null,
        additionalRequirements: null
      };
    }

    // 2. Выполняем веб-скрапинг
    const searchQuery = searchAnalysis.searchQuery || message;
    console.log(`Starting web scraping for query: "${searchQuery}"`);

    const scrapingOptions = {
      maxProducts: Math.min(maxProducts, 50), // Ограничиваем максимум
      timeout: 60000, // 1 минута
      headless: true,
      delay: 1000 // Задержка между запросами
    };

    const scrapingResults = await webScraper.scrapeProducts(
      searchQuery, 
      sources, 
      scrapingOptions
    );

    // 3. Анализируем результаты с помощью AI
    const resultsAnalysisPrompt = `Проанализируй результаты поиска товаров и предоставь:
1. Краткое резюме найденных товаров
2. Рекомендации по выбору
3. Анализ цен (если есть данные)
4. Дополнительные советы

Результаты поиска: ${JSON.stringify(scrapingResults, null, 2)}

Поисковый запрос: "${searchQuery}"
Дополнительные требования: ${searchAnalysis.additionalRequirements || 'не указаны'}

Отвечай на русском языке, будь полезным и дружелюбным. Используй эмодзи для лучшего восприятия.`;

    const resultsAnalysis = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'Ты - AI помощник для анализа результатов поиска товаров. Отвечай на русском языке.' },
        { role: 'user', content: resultsAnalysisPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const analysisContent = resultsAnalysis.choices[0]?.message?.content || 'Анализ результатов недоступен';

    // 4. Формируем итоговый ответ
    const totalProducts = scrapingResults.reduce((sum, result) => sum + result.totalFound, 0);
    const successfulSources = scrapingResults.filter(r => r.success).length;
    const failedSources = scrapingResults.filter(r => !r.success).length;

    // Собираем все товары
    const allProducts = scrapingResults.flatMap(result => result.products);

    return NextResponse.json({
      success: true,
      data: {
        searchQuery,
        analysis: searchAnalysis,
        products: allProducts,
        totalProducts,
        sources: {
          total: sources.length,
          successful: successfulSources,
          failed: failedSources
        },
        scrapingResults,
        aiAnalysis: analysisContent
      },
      message: `Найдено ${totalProducts} товаров в ${successfulSources} источниках. ${failedSources > 0 ? `${failedSources} источников недоступны.` : ''}`
    });

  } catch (error) {
    console.error('AI Web Search API Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Неверный API ключ OpenRouter' },
          { status: 401 }
        );
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Превышен лимит запросов. Попробуйте позже.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Ошибка при выполнении AI-поиска. Попробуйте еще раз.' },
      { status: 500 }
    );
  }
}
