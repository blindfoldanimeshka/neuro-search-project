import { useState, useCallback } from 'react';

interface HybridAIResponse {
  response: string;
  source: 'ai' | 'duckduckgo' | 'hybrid' | 'product_search';
  model: string;
  aiResponse?: string;
  duckDuckGoResponse?: string;
  productInfo?: {
    name?: string;
    description?: string;
    price?: string;
    category?: string;
    source?: string;
  };
  products?: any[];
  searchQuery?: string;
  category?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface UseHybridAIProps {
  context?: string;
  model?: string;
  searchType?: 'ai' | 'duckduckgo' | 'hybrid' | 'product_search';
}

export function useHybridAI({ 
  context, 
  model = 'deepseek/deepseek-chat-v3-0324:free',
  searchType = 'hybrid'
}: UseHybridAIProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<HybridAIResponse | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Определяем endpoint в зависимости от типа поиска
      let endpoint = '/api/ai';
      let requestBody: any = {
        message,
        model,
        context,
      };

      if (searchType === 'duckduckgo') {
        endpoint = '/api/ai-hybrid';
        requestBody.searchType = 'duckduckgo';
      } else if (searchType === 'hybrid') {
        endpoint = '/api/ai-hybrid';
        requestBody.searchType = 'hybrid';
      } else if (searchType === 'product_search') {
        endpoint = '/api/ai-product-search';
        requestBody.searchType = 'all';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage);
        
        // Добавляем дополнительную информацию об ошибке
        if (errorData.details) {
          (error as any).details = errorData.details;
        }
        if (errorData.retryAfter) {
          (error as any).retryAfter = errorData.retryAfter;
        }
        
        throw error;
      }

      const data: HybridAIResponse = await response.json();
      setLastResponse(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [context, model, searchType]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResponse = useCallback(() => {
    setLastResponse(null);
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    lastResponse,
    clearError,
    clearResponse,
  };
} 