import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { WebScraper } from '../../lib/web-scraper';
import { SearchFilters } from '../../lib/external-apis';
import { Product } from '../../components/types';

// Инициализация OpenAI клиента для OpenRouter
const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
}) : null;

// Модель по умолчанию
const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-chat-v3-0324:free';

export async function POST(request: NextRequest) {
  try {
    const { message, model = DEFAULT_MODEL, context, searchType = 'all' } = await request.json();

    if (!process.env.OPENROUTER_API_KEY || !openai) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Please create .env.local file with OPENROUTER_API_KEY' },
        { status: 500 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Извлекаем поисковый запрос из сообщения
    const searchQuery = extractSearchQuery(message);
    
    if (!searchQuery) {
      return NextResponse.json({
        response: '🔍 **AI Поиск Товаров**\n\nПожалуйста, укажите, какой товар вы ищете. Например:\n• "Найди iPhone 15"\n• "Поиск ноутбука Dell"\n• "Купить трактор МТЗ"\n• "Сравни цены на Samsung Galaxy"\n• "Госзакупки компьютеры"\n• "Маркетплейсы смартфоны"\n• "Частные объявления автомобили"',
        source: 'product_search',
        model: 'product-search-ai'
      });
    }

    // Определяем категорию поиска
    const category = determineSearchCategory(message);
    
    // Создаем фильтры для поиска
    const filters: SearchFilters = {
      query: searchQuery,
      category: category,
      minPrice: extractMinPrice(message),
      maxPrice: extractMaxPrice(message),
      rating: extractMinRating(message),
      location: extractLocation(message)
    };

    // Выполняем поиск товаров
    const scraper = new WebScraper();
    const searchResults: Product[] = [];

    try {
      // Инициализируем scraper
      await scraper.initialize();
      
      // Определяем источники для поиска
      let sources: string[] = [];
      
      if (searchType === 'all' || searchType === 'marketplaces') {
        sources = ['wildberries', 'ozon', 'yandex', 'sbermegamarket'];
      } else if (searchType === 'private') {
        sources = ['avito', 'youla'];
      } else if (searchType === 'goszakupki') {
        sources = ['government'];
      }
      
      // Выполняем поиск
      const results = await scraper.scrapeProducts(searchQuery, sources);
      
      // Преобразуем результаты в нужный формат
      results.forEach(result => {
        if (result.success && result.products) {
          searchResults.push(...result.products.map(product => ({
            id: product.id,
            name: product.title,
            price: product.price,
            originalPrice: product.originalPrice,
            rating: product.rating,
            reviews: product.reviewsCount,
            seller: 'Не указан',
            source: product.source,
            url: product.url,
            image: product.image,
            description: product.description,
            category: product.category,
            subcategory: '',
            availability: product.availability
          })));
        }
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      await scraper.close();
    }

    // Анализируем результаты с помощью AI
    let aiAnalysis = '';

    if (searchResults.length > 0) {
      const analysisPrompt = `Проанализируй найденные товары и дай рекомендации:

Товары:
${searchResults.slice(0, 10).map((product, index) => 
  `${index + 1}. ${product.name} - ${product.price}₽ (${product.source})
   Рейтинг: ${product.rating}/5, Отзывов: ${product.reviews}
   Продавец: ${product.seller}, Доставка: ${product.deliveryTime}`
).join('\n')}

Запрос пользователя: "${message}"

Дай анализ в следующем формате:
1. **Общий анализ рынка** (цены, качество, доступность)
2. **Топ-3 лучших предложения** с обоснованием
3. **Рекомендации по покупке** (когда покупать, на что обратить внимание)
4. **Альтернативные варианты** (если есть)

Используй эмодзи для лучшего восприятия.`;

      try {
        const aiResponse = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: 'system', content: 'Ты - эксперт по анализу товаров и покупкам. Помогай пользователям делать правильный выбор.' },
            { role: 'user', content: analysisPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        });

        aiAnalysis = aiResponse.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('AI analysis error:', error);
        aiAnalysis = 'Не удалось выполнить AI анализ результатов.';
      }
    }

    // Формируем ответ
    let response = `🔍 **AI Поиск Товаров: "${searchQuery}"**\n\n`;

    if (searchResults.length > 0) {
      response += `✅ Найдено товаров: ${searchResults.length}\n\n`;
      response += aiAnalysis;
      
      // Добавляем краткий список товаров
      response += '\n\n**📋 Найденные товары:**\n';
      searchResults.slice(0, 5).forEach((product, index) => {
        response += `${index + 1}. **${product.name}** - ${product.price}₽\n`;
        response += `   📍 ${product.source} | ⭐ ${product.rating}/5 | 🚚 ${product.deliveryTime}\n\n`;
      });
    } else {
      response += `❌ К сожалению, товары не найдены.\n\n`;
      response += `💡 **Рекомендации:**\n`;
      response += `• Попробуйте изменить запрос\n`;
      response += `• Используйте более общие ключевые слова\n`;
      response += `• Проверьте правильность написания\n`;
      response += `• Попробуйте поиск в других категориях`;
    }

    return NextResponse.json({
      response: response,
      source: 'product_search',
      products: searchResults,
      searchQuery: searchQuery,
      category: category,
      model: 'product-search-ai'
    });

  } catch (error) {
    console.error('Product Search API Error:', error);
    
    return NextResponse.json(
      { error: 'Ошибка при поиске товаров. Попробуйте еще раз.' },
      { status: 500 }
    );
  }
}

// Вспомогательные функции
function extractSearchQuery(message: string): string | null {
  const searchKeywords = ['найди', 'поиск', 'ищи', 'найти', 'покажи', 'купить', 'цена', 'стоимость', 'сравни', 'рекомендации'];
  const hasSearchKeyword = searchKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
  
  if (!hasSearchKeyword) return null;
  
  // Извлекаем запрос после ключевых слов
  for (const keyword of searchKeywords) {
    if (message.toLowerCase().includes(keyword)) {
      const afterKeyword = message.toLowerCase().split(keyword)[1];
      if (afterKeyword) {
        return afterKeyword.trim().split(' ').slice(0, 5).join(' '); // Берем первые 5 слов
      }
    }
  }
  
  return null;
}

function determineSearchCategory(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('госзакупки') || lowerMessage.includes('тендеры')) {
    return 'goszakupki';
  }
  if (lowerMessage.includes('маркетплейс') || lowerMessage.includes('wildberries') || 
      lowerMessage.includes('ozon') || lowerMessage.includes('яндекс')) {
    return 'marketplaces';
  }
  if (lowerMessage.includes('частные') || lowerMessage.includes('авито') || 
      lowerMessage.includes('юла') || lowerMessage.includes('из рук в руки')) {
    return 'private';
  }
  
  return 'all';
}

function extractMinPrice(message: string): number | undefined {
  const match = message.match(/от\s*(\d+)/i);
  return match ? parseInt(match[1]) : undefined;
}

function extractMaxPrice(message: string): number | undefined {
  const match = message.match(/до\s*(\d+)/i);
  return match ? parseInt(match[1]) : undefined;
}

function extractMinRating(message: string): number | undefined {
  const match = message.match(/рейтинг\s*(\d+)/i);
  return match ? parseInt(match[1]) : undefined;
}

function extractLocation(message: string): string | undefined {
  const locations = ['москва', 'спб', 'санкт-петербург', 'екатеринбург', 'новосибирск'];
  const lowerMessage = message.toLowerCase();
  
  for (const location of locations) {
    if (lowerMessage.includes(location)) {
      return location;
    }
  }
  
  return undefined;
} 