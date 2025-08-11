import { useState, useCallback } from 'react';
import { ExternalProduct } from '../lib/external-apis';

interface WebSearchResult {
  searchQuery: string;
  analysis: {
    searchQuery: string;
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    location: string | null;
    additionalRequirements: string | null;
  };
  products: ExternalProduct[];
  totalProducts: number;
  sources: {
    total: number;
    successful: number;
    failed: number;
  };
  scrapingResults: any[];
  aiAnalysis: string;
}

interface UseAIWebSearchProps {
  onResultsReceived?: (results: WebSearchResult) => void;
  onError?: (error: string) => void;
}

export function useAIWebSearch({ onResultsReceived, onError }: UseAIWebSearchProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<WebSearchResult | null>(null);
  const [lastQuery, setLastQuery] = useState<string>('');

  const searchProducts = useCallback(async (
    message: string, 
    options: {
      sources?: string[];
      maxProducts?: number;
      filters?: {
        minPrice?: number;
        maxPrice?: number;
        category?: string;
        location?: string;
      };
    } = {}
  ) => {
    if (!message.trim()) {
      const errorMsg = 'Введите поисковый запрос';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastQuery(message);

    try {
      const response = await fetch('/api/ai-web-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          ...options
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data);
        onResultsReceived?.(data.data);
      } else {
        throw new Error(data.error || 'Неизвестная ошибка');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      setSearchResults(null);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onResultsReceived, onError]);

  const clearResults = useCallback(() => {
    setSearchResults(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    searchProducts,
    isLoading,
    error,
    searchResults,
    lastQuery,
    clearResults,
    clearError,
  };
}
