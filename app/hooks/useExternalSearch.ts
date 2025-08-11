import { useState, useCallback } from 'react';
import { ExternalProduct, SearchFilters, SearchResult } from '../lib/external-apis';

interface UseExternalSearchProps {
  initialFilters?: Partial<SearchFilters>;
}

export function useExternalSearch({ initialFilters = {} }: UseExternalSearchProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [lastQuery, setLastQuery] = useState<string>('');

  const searchProducts = useCallback(async (query: string, filters?: Partial<SearchFilters>) => {
    if (!query.trim()) {
      setError('Введите поисковый запрос');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLastQuery(query);

    try {
      const response = await fetch('/api/search-external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          filters: { ...initialFilters, ...filters }
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
      } else {
        throw new Error(data.error || 'Неизвестная ошибка');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      setSearchResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [initialFilters]);

  const searchByUrl = useCallback(async (url: string) => {
    try {
      const urlObj = new URL(url);
      const query = urlObj.searchParams.get('q');
      const minPrice = urlObj.searchParams.get('minPrice');
      const maxPrice = urlObj.searchParams.get('maxPrice');
      const category = urlObj.searchParams.get('category');
      const sortBy = urlObj.searchParams.get('sortBy') as any;
      const sortOrder = urlObj.searchParams.get('sortOrder') as any;

      if (!query) {
        setError('Отсутствует параметр поиска в URL');
        return;
      }

      const filters: Partial<SearchFilters> = {
        ...(minPrice && { minPrice: parseInt(minPrice) }),
        ...(maxPrice && { maxPrice: parseInt(maxPrice) }),
        ...(category && { category }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      };

      await searchProducts(query, filters);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
    }
  }, [searchProducts]);

  const clearResults = useCallback(() => {
    setSearchResults(null);
    setError(null);
    setLastQuery('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Группировка товаров по источникам
  const groupedProducts = searchResults?.products.reduce((acc, product) => {
    if (!acc[product.source]) {
      acc[product.source] = [];
    }
    acc[product.source].push(product);
    return acc;
  }, {} as Record<string, ExternalProduct[]>) || {};

  // Статистика по источникам
  const sourceStats = Object.entries(groupedProducts).map(([source, products]) => ({
    source,
    count: products.length,
    avgPrice: products.reduce((sum, p) => sum + p.price, 0) / products.length,
    minPrice: Math.min(...products.map(p => p.price)),
    maxPrice: Math.max(...products.map(p => p.price))
  }));

  // Топ товаров по рейтингу
  const topRatedProducts = searchResults?.products
    .filter(p => p.rating && p.rating > 0)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5) || [];

  // Самые дешевые товары
  const cheapestProducts = searchResults?.products
    .sort((a, b) => a.price - b.price)
    .slice(0, 5) || [];

  return {
    searchProducts,
    searchByUrl,
    isLoading,
    error,
    searchResults,
    lastQuery,
    clearResults,
    clearError,
    groupedProducts,
    sourceStats,
    topRatedProducts,
    cheapestProducts
  };
} 