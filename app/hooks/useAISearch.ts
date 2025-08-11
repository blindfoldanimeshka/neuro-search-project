import { useState, useCallback } from 'react';
import { ExternalProduct } from '../lib/external-apis';

interface AISearchResult {
  query: string;
  searchUrls: string[];
  products: ExternalProduct[];
  searchTime: number;
  indexedCount: number;
  aiAnalysis?: string;
  recommendations?: string[];
  category?: string;
  categoryName?: string;
}

interface CategorySearchResult {
  category: 'goszakupki' | 'marketplaces' | 'private' | 'all';
  query: string;
  products: ExternalProduct[];
  total: number;
  searchTime: number;
  categoryName: string;
}

interface UseAISearchReturn {
  searchWithAI: (query: string, filters?: Record<string, unknown>) => Promise<AISearchResult>;
  searchWithChat: (message: string) => Promise<AISearchResult>;
  searchByCategory: (query: string, category: 'goszakupki' | 'marketplaces' | 'private' | 'all') => Promise<CategorySearchResult>;
  isLoading: boolean;
  error: string | null;
  lastResult: AISearchResult | null;
  lastCategoryResult: CategorySearchResult | null;
  clearError: () => void;
}

export function useAISearch(): UseAISearchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AISearchResult | null>(null);
  const [lastCategoryResult, setLastCategoryResult] = useState<CategorySearchResult | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const searchWithAI = useCallback(async (query: string, filters: Record<string, unknown> = {}): Promise<AISearchResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search-external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, filters }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при выполнении поиска товаров');
      }

      const data = await response.json();
      const result: AISearchResult = {
        query: data.data.query || query,
        searchUrls: data.data.searchUrls || [],
        products: data.data.products || [],
        searchTime: data.data.searchTime || 0,
        indexedCount: data.data.indexedCount || 0,
      };

      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchWithChat = useCallback(async (message: string): Promise<AISearchResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Извлекаем поисковый запрос из сообщения
      let searchQuery = message.trim();
      
      // Удаляем ключевые слова поиска
      const searchKeywords = ['найди', 'поиск', 'ищи', 'найти', 'покажи', 'сравни', 'рекомендации', 'купить', 'цена', 'стоимость', 'маркетплейс', 'госзакупки', 'тендеры', 'частные'];
      for (const keyword of searchKeywords) {
        searchQuery = searchQuery.replace(new RegExp(keyword, 'gi'), '').trim();
      }

      if (!searchQuery) {
        throw new Error('Не удалось извлечь поисковый запрос из сообщения');
      }

      // Определяем категорию поиска
      let category = 'all';
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('госзакупки') || lowerMessage.includes('тендеры')) {
        category = 'goszakupki';
      } else if (lowerMessage.includes('маркетплейс') || lowerMessage.includes('wildberries') || 
                 lowerMessage.includes('ozon') || lowerMessage.includes('яндекс')) {
        category = 'marketplaces';
      } else if (lowerMessage.includes('частные') || lowerMessage.includes('авито') || 
                 lowerMessage.includes('юла')) {
        category = 'private';
      }

      // Выполняем поиск с извлеченным запросом
      const result = await searchWithAI(searchQuery);
      
      // Добавляем расширенный анализ результатов
      if (result.products.length > 0) {
        const sources = Array.from(new Set(result.products.map(p => p.source)));
        const priceRange = {
          min: Math.min(...result.products.map(p => p.price)),
          max: Math.max(...result.products.map(p => p.price))
        };
        
        result.aiAnalysis = `🔍 **Анализ результатов поиска**\n\n` +
          `**Запрос:** "${searchQuery}"\n` +
          `**Категория:** ${category === 'all' ? 'Все источники' : 
                           category === 'goszakupki' ? 'Госзакупки' : 
                           category === 'marketplaces' ? 'Маркетплейсы' : 
                           'Частные объявления'}\n` +
          `**Найдено товаров:** ${result.products.length}\n` +
          `**Источники:** ${sources.join(', ')}\n` +
          `**Ценовой диапазон:** ${priceRange.min.toLocaleString()}₽ - ${priceRange.max.toLocaleString()}₽\n\n` +
          `**Рекомендации:**\n` +
          `• Обратите внимание на рейтинги и отзывы\n` +
          `• Сравните цены между разными площадками\n` +
          `• Проверьте условия доставки и возврата\n` +
          `• Изучите отзывы о продавцах`;
      } else {
        result.aiAnalysis = `❌ **Товары не найдены**\n\n` +
          `**Запрос:** "${searchQuery}"\n\n` +
          `**Возможные причины:**\n` +
          `• Неправильное написание товара\n` +
          `• Слишком специфичный запрос\n` +
          `• Товар отсутствует в выбранных источниках\n\n` +
          `**Рекомендации:**\n` +
          `• Попробуйте изменить формулировку запроса\n` +
          `• Используйте более общие ключевые слова\n` +
          `• Проверьте правильность написания\n` +
          `• Попробуйте поиск в других категориях`;
      }

      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [searchWithAI]);

  const searchByCategory = useCallback(async (query: string, category: 'goszakupki' | 'marketplaces' | 'private' | 'all'): Promise<CategorySearchResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/search/${category}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при поиске по категории');
      }

      const data = await response.json();
      
      if (data.success) {
        const result: CategorySearchResult = {
          category,
          query: data.data.query,
          products: data.data.products,
          total: data.data.total,
          searchTime: data.data.searchTime,
          categoryName: data.data.categoryName
        };
        
        setLastCategoryResult(result);
        return result;
      } else {
        throw new Error(data.error || 'Неизвестная ошибка');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    searchWithAI,
    searchWithChat,
    searchByCategory,
    isLoading,
    error,
    lastResult,
    lastCategoryResult,
    clearError,
  };
} 