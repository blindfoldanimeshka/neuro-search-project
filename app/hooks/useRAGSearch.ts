'use client';

import { useState, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  brand: string;
  rating: number;
  availability: boolean;
  images: string[];
  category: string;
  attributes: Record<string, any>;
}

interface RAGSearchResult {
  products: Product[];
  generatedDescription: string;
  categories: string[];
  suggestions: string[];
  confidence: number;
}

interface RAGStatus {
  status: string;
  rag?: {
    configured: boolean;
    lmStudio?: {
      available: boolean;
      endpoint: string;
      models: any[];
    };
    searchEngines?: string[];
    config?: {
      maxResults: number;
      temperature: number;
      maxTokens: number;
    };
  };
}

interface UseRAGSearchReturn {
  searchProducts: (query: string) => Promise<RAGSearchResult>;
  isLoading: boolean;
  error: string | null;
  results: RAGSearchResult | null;
  ragStatus: RAGStatus | null;
  checkRAGStatus: () => Promise<void>;
  clearError: () => void;
  clearResults: () => void;
}

export function useRAGSearch(): UseRAGSearchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RAGSearchResult | null>(null);
  const [ragStatus, setRagStatus] = useState<RAGStatus | null>(null);

  const checkRAGStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/rag');
      if (!response.ok) {
        throw new Error('Failed to check RAG status');
      }
      const data = await response.json();
      setRagStatus(data);
    } catch (err) {
      console.error('Failed to check RAG status:', err);
      setRagStatus({ status: 'error' });
    }
  }, []);

  const searchProducts = useCallback(async (query: string): Promise<RAGSearchResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Ошибка при выполнении RAG поиска');
      }

      const result = data.data as RAGSearchResult;
      setResults(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  return {
    searchProducts,
    isLoading,
    error,
    results,
    ragStatus,
    checkRAGStatus,
    clearError,
    clearResults,
  };
}