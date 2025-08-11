import OpenAI from 'openai';
import { ProductData } from './web-scraper-types';
import { productDatabase } from './product-database';

// Инициализация OpenAI клиента для OpenRouter
const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
}) : null;

const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-chat-v3-0324:free';

export interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  priceAnalysis: {
    averagePrice: number;
    priceRange: string;
    bestValue: string;
    priceTrend: string;
  };
  qualityAnalysis: {
    averageRating: number;
    ratingDistribution: string;
    topFeatures: string[];
    commonIssues: string[];
  };
  marketAnalysis: {
    competition: string;
    marketPosition: string;
    demand: string;
    seasonality: string;
  };
}

export interface RecommendationResult {
  products: ProductData[];
  reasoning: string;
  alternatives: string[];
  priceComparison: string;
}

export interface ComparisonResult {
  source1: {
    name: string;
    products: ProductData[];
    averagePrice: number;
    averageRating: number;
  };
  source2: {
    name: string;
    products: ProductData[];
    averagePrice: number;
    averageRating: number;
  };
  winner: string;
  priceDifference: number;
  qualityDifference: number;
  recommendations: string[];
}

export class AIAnalyzer {
  private openai: OpenAI | null;

  constructor() {
    this.openai = openai;
  }

  // Анализ найденных товаров
  async analyzeProducts(products: ProductData[], query: string): Promise<AnalysisResult> {
    if (!this.openai || products.length === 0) {
      return this.generateFallbackAnalysis(products, query);
    }

    try {
      const prompt = this.buildAnalysisPrompt(products, query);
      
      const response = await this.openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Ты эксперт по анализу товаров на маркетплейсах. Проанализируй данные и дай полезные выводы на русском языке.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return this.parseAnalysisResponse(content, products);
      }
    } catch (error) {
      console.error('Error analyzing products with AI:', error);
    }

    return this.generateFallbackAnalysis(products, query);
  }

  // Генерация рекомендаций
  async generateRecommendations(
    products: ProductData[], 
    query: string, 
    userPreferences?: any
  ): Promise<RecommendationResult> {
    if (!this.openai || products.length === 0) {
      return this.generateFallbackRecommendations(products, query);
    }

    try {
      const prompt = this.buildRecommendationPrompt(products, query, userPreferences);
      
      const response = await this.openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Ты эксперт по выбору товаров. Дай персональные рекомендации на русском языке.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return this.parseRecommendationResponse(content, products);
      }
    } catch (error) {
      console.error('Error generating recommendations with AI:', error);
    }

    return this.generateFallbackRecommendations(products, query);
  }

  // Сравнение источников
  async compareSources(
    source1Products: ProductData[], 
    source2Products: ProductData[],
    source1Name: string,
    source2Name: string
  ): Promise<ComparisonResult> {
    if (!this.openai) {
      return this.generateFallbackComparison(source1Products, source2Products, source1Name, source2Name);
    }

    try {
      const prompt = this.buildComparisonPrompt(source1Products, source2Products, source1Name, source2Name);
      
      const response = await this.openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Ты эксперт по сравнению маркетплейсов. Сравни источники и дай рекомендации на русском языке.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1200
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return this.parseComparisonResponse(content, source1Products, source2Products, source1Name, source2Name);
      }
    } catch (error) {
      console.error('Error comparing sources with AI:', error);
    }

    return this.generateFallbackComparison(source1Products, source2Products, source1Name, source2Name);
  }

  // Построение промпта для анализа
  private buildAnalysisPrompt(products: ProductData[], query: string): string {
    const totalProducts = products.length;
    const sources = [...new Set(products.map(p => p.source))];
    const priceRange = this.calculatePriceRange(products);
    const averageRating = this.calculateAverageRating(products);

    return `
Проанализируй следующие товары по запросу "${query}":

Общая информация:
- Количество товаров: ${totalProducts}
- Источники: ${sources.join(', ')}
- Диапазон цен: ${priceRange}
- Средний рейтинг: ${averageRating.toFixed(1)}

Данные товаров:
${products.slice(0, 10).map(p => 
  `- ${p.title} | Цена: ${p.price} ${p.currency} | Рейтинг: ${p.rating || 'Н/Д'} | Источник: ${p.source}`
).join('\n')}

Дай анализ в следующем формате:
1. Краткое резюме (2-3 предложения)
2. Ключевые инсайты (3-5 пунктов)
3. Рекомендации (3-5 пунктов)
4. Анализ цен (средняя цена, диапазон, лучшее соотношение цена/качество)
5. Анализ качества (рейтинги, особенности, проблемы)
6. Анализ рынка (конкуренция, позиционирование, спрос)
`;
  }

  // Построение промпта для рекомендаций
  private buildRecommendationPrompt(products: ProductData[], query: string, userPreferences?: any): string {
    const topProducts = products.slice(0, 5);
    
    let preferencesText = '';
    if (userPreferences) {
      preferencesText = `\nПредпочтения пользователя: ${JSON.stringify(userPreferences)}`;
    }

    return `
Дай рекомендации по выбору товара по запросу "${query}".

Доступные товары:
${topProducts.map(p => 
  `- ${p.title} | Цена: ${p.price} ${p.currency} | Рейтинг: ${p.rating || 'Н/Д'} | Источник: ${p.source}`
).join('\n')}${preferencesText}

Дай рекомендации в следующем формате:
1. Лучшие варианты (3 товара с обоснованием)
2. Альтернативы
3. Сравнение цен
4. Общие рекомендации по выбору
`;
  }

  // Построение промпта для сравнения
  private buildComparisonPrompt(
    source1Products: ProductData[], 
    source2Products: ProductData[],
    source1Name: string,
    source2Name: string
  ): string {
    return `
Сравни два источника товаров:

${source1Name}:
${source1Products.slice(0, 5).map(p => 
  `- ${p.title} | Цена: ${p.price} ${p.currency} | Рейтинг: ${p.rating || 'Н/Д'}`
).join('\n')}

${source2Name}:
${source2Products.slice(0, 5).map(p => 
  `- ${p.title} | Цена: ${p.price} ${p.currency} | Рейтинг: ${p.rating || 'Н/Д'}`
).join('\n')}

Дай сравнение в следующем формате:
1. Победитель по цене
2. Победитель по качеству
3. Разница в ценах
4. Разница в качестве
5. Рекомендации по выбору источника
`;
  }

  // Парсинг ответа анализа
  private parseAnalysisResponse(content: string, products: ProductData[]): AnalysisResult {
    // Простой парсинг - в реальном проекте используйте более сложную логику
    const priceAnalysis = this.calculatePriceAnalysis(products);
    const qualityAnalysis = this.calculateQualityAnalysis(products);
    
    return {
      summary: this.extractSection(content, 'резюме', 'анализ') || 'Анализ товаров выполнен успешно',
      insights: this.extractInsights(content),
      recommendations: this.extractRecommendations(content),
      priceAnalysis,
      qualityAnalysis,
      marketAnalysis: {
        competition: 'Средняя',
        marketPosition: 'Стабильная',
        demand: 'Умеренная',
        seasonality: 'Не выражена'
      }
    };
  }

  // Парсинг ответа рекомендаций
  private parseRecommendationResponse(content: string, products: ProductData[]): RecommendationResult {
    const topProducts = products.slice(0, 3);
    
    return {
      products: topProducts,
      reasoning: this.extractSection(content, 'обоснование', 'рекомендации') || 'Товары отобраны по рейтингу и цене',
      alternatives: this.extractAlternatives(content),
      priceComparison: this.extractSection(content, 'сравнение цен', 'цены') || 'Цены варьируются в зависимости от источника'
    };
  }

  // Парсинг ответа сравнения
  private parseComparisonResponse(
    content: string, 
    source1Products: ProductData[], 
    source2Products: ProductData[],
    source1Name: string,
    source2Name: string
  ): ComparisonResult {
    const source1Stats = this.calculateSourceStats(source1Products);
    const source2Stats = this.calculateSourceStats(source2Products);
    
    const priceDifference = source1Stats.averagePrice - source2Stats.averagePrice;
    const qualityDifference = source1Stats.averageRating - source2Stats.averageRating;
    
    return {
      source1: {
        name: source1Name,
        products: source1Products,
        ...source1Stats
      },
      source2: {
        name: source2Name,
        products: source2Products,
        ...source2Stats
      },
      winner: priceDifference < 0 ? source1Name : source2Name,
      priceDifference: Math.abs(priceDifference),
      qualityDifference: Math.abs(qualityDifference),
      recommendations: this.extractRecommendations(content)
    };
  }

  // Вспомогательные методы
  private calculatePriceRange(products: ProductData[]): string {
    if (products.length === 0) return 'Н/Д';
    const prices = products.map(p => p.price).filter(p => p > 0);
    if (prices.length === 0) return 'Н/Д';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return `${min} - ${max}`;
  }

  private calculateAverageRating(products: ProductData[]): number {
    const ratings = products.map(p => p.rating).filter(r => r && r > 0);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }

  private calculatePriceAnalysis(products: ProductData[]) {
    const prices = products.map(p => p.price).filter(p => p > 0);
    const averagePrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
    
    return {
      averagePrice: Math.round(averagePrice),
      priceRange: this.calculatePriceRange(products),
      bestValue: 'Товары с высоким рейтингом и средней ценой',
      priceTrend: 'Стабильные'
    };
  }

  private calculateQualityAnalysis(products: ProductData[]) {
    const ratings = products.map(p => p.rating).filter(r => r && r > 0);
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    
    return {
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution: 'Равномерная',
      topFeatures: ['Качество', 'Цена', 'Отзывы'],
      commonIssues: ['Ограниченный выбор', 'Разброс цен']
    };
  }

  private calculateSourceStats(products: ProductData[]) {
    const prices = products.map(p => p.price).filter(p => p > 0);
    const ratings = products.map(p => p.rating).filter(r => r && r > 0);
    
    return {
      averagePrice: prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0,
      averageRating: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0
    };
  }

  // Fallback методы без ИИ
  private generateFallbackAnalysis(products: ProductData[], query: string): AnalysisResult {
    const priceAnalysis = this.calculatePriceAnalysis(products);
    const qualityAnalysis = this.calculateQualityAnalysis(products);
    
    return {
      summary: `Найдено ${products.length} товаров по запросу "${query}". Товары доступны в различных ценовых категориях.`,
      insights: [
        'Товары представлены в широком ценовом диапазоне',
        'Доступны варианты с различными рейтингами',
        'Множество источников для сравнения'
      ],
      recommendations: [
        'Сравните цены между источниками',
        'Обратите внимание на рейтинги и отзывы',
        'Рассмотрите варианты в разных ценовых категориях'
      ],
      priceAnalysis,
      qualityAnalysis,
      marketAnalysis: {
        competition: 'Средняя',
        marketPosition: 'Стабильная',
        demand: 'Умеренная',
        seasonality: 'Не выражена'
      }
    };
  }

  private generateFallbackRecommendations(products: ProductData[], query: string): RecommendationResult {
    const topProducts = products
      .filter(p => p.rating && p.rating >= 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
    
    return {
      products: topProducts.length > 0 ? topProducts : products.slice(0, 3),
      reasoning: 'Товары отобраны по рейтингу и цене для оптимального выбора',
      alternatives: ['Рассмотрите товары в других ценовых категориях', 'Проверьте альтернативные источники'],
      priceComparison: 'Цены варьируются в зависимости от источника и характеристик товара'
    };
  }

  private generateFallbackComparison(
    source1Products: ProductData[], 
    source2Products: ProductData[],
    source1Name: string,
    source2Name: string
  ): ComparisonResult {
    const source1Stats = this.calculateSourceStats(source1Products);
    const source2Stats = this.calculateSourceStats(source2Products);
    
    const priceDifference = source1Stats.averagePrice - source2Stats.averagePrice;
    const qualityDifference = source1Stats.averageRating - source2Stats.averageRating;
    
    return {
      source1: {
        name: source1Name,
        products: source1Products,
        ...source1Stats
      },
      source2: {
        name: source2Name,
        products: source2Products,
        ...source2Stats
      },
      winner: priceDifference < 0 ? source1Name : source2Name,
      priceDifference: Math.abs(priceDifference),
      qualityDifference: Math.abs(qualityDifference),
      recommendations: [
        'Сравните цены на конкретные товары',
        'Учитывайте рейтинги и отзывы',
        'Проверьте условия доставки'
      ]
    };
  }

  // Методы извлечения информации из текста
  private extractSection(content: string, ...keywords: string[]): string {
    for (const keyword of keywords) {
      const index = content.toLowerCase().indexOf(keyword);
      if (index !== -1) {
        const start = index + keyword.length;
        const end = content.indexOf('\n', start);
        return content.substring(start, end !== -1 ? end : undefined).trim();
      }
    }
    return '';
  }

  private extractInsights(content: string): string[] {
    // Простое извлечение инсайтов
    const lines = content.split('\n');
    return lines
      .filter(line => line.includes('•') || line.includes('-') || line.includes('*'))
      .map(line => line.replace(/^[•\-*]\s*/, '').trim())
      .filter(line => line.length > 10)
      .slice(0, 5);
  }

  private extractRecommendations(content: string): string[] {
    // Простое извлечение рекомендаций
    const lines = content.split('\n');
    return lines
      .filter(line => line.includes('рекоменд') || line.includes('совет'))
      .map(line => line.trim())
      .filter(line => line.length > 10)
      .slice(0, 5);
  }

  private extractAlternatives(content: string): string[] {
    // Простое извлечение альтернатив
    const lines = content.split('\n');
    return lines
      .filter(line => line.includes('альтернатив') || line.includes('вариант'))
      .map(line => line.trim())
      .filter(line => line.length > 10)
      .slice(0, 3);
  }
}

// Создаем единственный экземпляр анализатора
export const aiAnalyzer = new AIAnalyzer();
