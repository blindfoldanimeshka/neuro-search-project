import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { webScraper } from '@/lib/web-scraper';
import { productDatabase } from '@/lib/product-database';
import { aiAnalyzer } from '@/lib/ai-analyzer';

// Инициализация OpenAI клиента
const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
    'X-Title': 'Neuro Parser'
  }
}) : null;

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

interface NeuroParserRequest {
  query: string;
  userPrompt?: string;
  sources?: string[];
  maxProducts?: number;
  includeAnalysis?: boolean;
  saveToDatabase?: boolean;
  context?: {
    previousProducts?: any[];
    searchHistory?: string[];
    userPreferences?: Record<string, any>;
  };
}

interface ParsedProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  rating?: number;
  reviewsCount?: number;
  imageUrl?: string;
  productUrl?: string;
  source: string;
  availability: boolean;
  category?: string;
  brand?: string;
  features?: string[];
  aiAnalysis?: {
    summary: string;
    pros: string[];
    cons: string[];
    recommendation: string;
    priceAnalysis: string;
  };
}

export async function POST(request: NextRequest) {
  
  try {
    const body: NeuroParserRequest = await request.json();
    const { 
      query, 
      userPrompt, 
      sources = ['wildberries', 'ozon'], 
      maxProducts = 20,
      includeAnalysis = true,
      saveToDatabase = true,
      context 
    } = body;

    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Запрос обязателен для заполнения' },
        { status: 400 }
      );
    }

    if (!openai || !process.env.OPENROUTER_API_KEY) {
      console.error('OpenRouter API key not configured');
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your .env.local file' },
        { status: 503 }
      );
    }

    // Шаг 1: Анализ запроса с помощью ИИ
    const enhancedQuery = await enhanceSearchQuery(query, userPrompt, context);
    
    // Шаг 2: Поиск товаров через веб-скрапер
    const scrapedResults = await webScraper.scrapeProducts(enhancedQuery, sources, {
      maxProducts: maxProducts * 2, // Получаем больше для лучшего выбора
      headless: true
    });

    // Шаг 3: Обработка и структурирование данных
    const rawProducts = scrapedResults.flatMap(result => result.products || []);
    
    // Шаг 4: ИИ анализ и обогащение данных
    const enrichedProducts = await enrichProductsWithAI(rawProducts, enhancedQuery, includeAnalysis);
    
    // Шаг 5: Фильтрация и ранжирование
    const filteredProducts = await filterAndRankProducts(enrichedProducts, enhancedQuery, maxProducts);
    
    // Шаг 6: Сохранение в базу данных
    if (saveToDatabase && filteredProducts.length > 0) {
      await productDatabase.saveProducts(filteredProducts);
    }
    
    // Шаг 7: Формирование ответа
    const response = {
      query: query,
      enhancedQuery: enhancedQuery,
      products: filteredProducts,
      totalFound: rawProducts.length,
      filteredCount: filteredProducts.length,
      sources: sources,
      timestamp: new Date().toISOString(),
      analysisIncluded: includeAnalysis
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in Neuro Parser:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при обработке запроса',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Улучшение поискового запроса с помощью ИИ
async function enhanceSearchQuery(
  query: string, 
  userPrompt?: string,
  context?: any
): Promise<string> {
  if (!openai) return query;

  try {
    const systemPrompt = `Ты - эксперт по оптимизации поисковых запросов для маркетплейсов.
Твоя задача - улучшить поисковый запрос для получения лучших результатов.

Правила:
1. Добавь синонимы и похожие слова
2. Учти контекст и пользовательские предпочтения
3. Сделай запрос более конкретным
4. Не изменяй основную суть запроса
5. Возвращай только улучшенный запрос, без объяснений

Примеры:
- "телефон" → "смартфон мобильный телефон"
- "ноутбук для работы" → "ноутбук рабочий компьютер офис"
- "кроссовки" → "кроссовки обувь спортивная"`;

    const userMessage = `Запрос: "${query}"
${userPrompt ? `Дополнительные требования: "${userPrompt}"` : ''}
${context?.userPreferences ? `Предпочтения: ${JSON.stringify(context.userPreferences)}` : ''}

Улучши этот запрос для поиска товаров:`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 100
    });

    const enhancedQuery = response.choices[0]?.message?.content?.trim() || query;
    return enhancedQuery;
  } catch (error) {
    console.error('Error enhancing query:', error);
    return query;
  }
}

// Обогащение товаров с помощью ИИ
async function enrichProductsWithAI(
  products: any[], 
  query: string, 
  includeAnalysis: boolean
): Promise<ParsedProduct[]> {
  const enrichedProducts: ParsedProduct[] = [];
  
  for (const product of products) {
    const parsedProduct: ParsedProduct = {
      id: product.id || `${product.source}_${Date.now()}_${Math.random()}`,
      title: product.title || 'Без названия',
      description: product.description || '',
      price: parseFloat(product.price) || 0,
      currency: product.currency || 'RUB',
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      source: product.source,
      availability: product.availability !== false,
      category: product.category,
      brand: product.brand,
      features: product.features || []
    };

    // Добавляем ИИ анализ если требуется
    if (includeAnalysis && openai) {
      try {
        const analysis = await aiAnalyzer.analyzeProduct(parsedProduct, query);
        parsedProduct.aiAnalysis = analysis;
      } catch (error) {
        console.error('Error analyzing product:', error);
      }
    }

    enrichedProducts.push(parsedProduct);
  }

  return enrichedProducts;
}

// Фильтрация и ранжирование товаров
async function filterAndRankProducts(
  products: ParsedProduct[], 
  query: string, 
  maxProducts: number
): Promise<ParsedProduct[]> {
  if (!openai) {
    // Простая фильтрация без ИИ
    return products
      .filter(p => p.price > 0 && p.title)
      .slice(0, maxProducts);
  }

  try {
    // ИИ ранжирование
    const systemPrompt = `Ты - эксперт по ранжированию товаров.
Оцени релевантность каждого товара запросу по шкале от 0 до 10.
Верни JSON массив с id товара и его оценкой.`;

    const productsList = products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      rating: p.rating
    }));

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Запрос: "${query}"\n\nТовары:\n${JSON.stringify(productsList)}` }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const rankings = JSON.parse(response.choices[0]?.message?.content || '{"rankings":[]}');
    const rankedIds = new Set(rankings.rankings?.map((r: any) => r.id) || []);
    
    // Сортируем по релевантности
    const rankedProducts = products
      .filter(p => rankedIds.has(p.id))
      .sort((a, b) => {
        const aRank = rankings.rankings?.find((r: any) => r.id === a.id)?.score || 0;
        const bRank = rankings.rankings?.find((r: any) => r.id === b.id)?.score || 0;
        return bRank - aRank;
      })
      .slice(0, maxProducts);

    return rankedProducts.length > 0 ? rankedProducts : products.slice(0, maxProducts);
  } catch (error) {
    console.error('Error ranking products:', error);
    return products.slice(0, maxProducts);
  }
}