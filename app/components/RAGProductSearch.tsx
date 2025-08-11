'use client';

import React, { useState } from 'react';
import { Search, AlertCircle, Loader2, Sparkles } from 'lucide-react';

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

export function RAGProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RAGSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragStatus, setRagStatus] = useState<any>(null);

  // Проверка статуса RAG при загрузке
  React.useEffect(() => {
    checkRAGStatus();
  }, []);

  const checkRAGStatus = async () => {
    try {
      const response = await fetch('/api/rag');
      const data = await response.json();
      setRagStatus(data);
    } catch (err) {
      console.error('Failed to check RAG status:', err);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
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
        throw new Error(data.error || 'Ошибка при поиске');
      }

      setResults(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Заголовок с статусом */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-blue-500" />
          RAG Поиск Товаров
        </h1>
        <p className="text-gray-600">
          Интеллектуальный поиск с использованием RAG и LM Studio
        </p>
        {ragStatus && (
          <div className="text-sm">
            {ragStatus.rag?.lmStudio?.available ? (
              <span className="text-green-600">✓ LM Studio подключен</span>
            ) : (
              <span className="text-yellow-600">⚠ LM Studio недоступен</span>
            )}
          </div>
        )}
      </div>

      {/* Поисковая форма */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Например: смартфон Samsung с хорошей камерой..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          disabled={isLoading}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Поиск...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Найти
            </>
          )}
        </button>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Ошибка</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Результаты поиска */}
      {results && (
        <div className="space-y-6">
          {/* AI анализ */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              AI Анализ результатов
            </h2>
            <p className="text-gray-700 mb-4">{results.generatedDescription}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Категории */}
              {results.categories.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-gray-600 mb-2">Категории:</h3>
                  <div className="flex flex-wrap gap-2">
                    {results.categories.map((cat, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Уверенность */}
              <div>
                <h3 className="font-medium text-sm text-gray-600 mb-2">Уверенность AI:</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${results.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {(results.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Предложения */}
          {results.suggestions.length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold mb-2 text-yellow-900">
                💡 Предложения для улучшения поиска:
              </h3>
              <ul className="space-y-1">
                {results.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-yellow-800 text-sm flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Список товаров */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Найденные товары ({results.products.length})
            </h2>
            
            {results.products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Изображение */}
                    {product.images && product.images.length > 0 && (
                      <div className="aspect-square bg-gray-100 relative">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-product.jpg';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Информация о товаре */}
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      {product.brand && (
                        <p className="text-sm text-gray-600">
                          Бренд: <span className="font-medium">{product.brand}</span>
                        </p>
                      )}
                      
                      {product.price > 0 && (
                        <p className="text-2xl font-bold text-green-600">
                          {product.price.toLocaleString('ru-RU')} ₽
                        </p>
                      )}
                      
                      {product.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                        </div>
                      )}
                      
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {product.description}
                      </p>
                      
                      {product.category && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {product.category}
                        </span>
                      )}
                      
                      <div className="pt-3">
                        <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                          Подробнее
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Товары не найдены. Попробуйте изменить запрос.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Состояние загрузки */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Выполняется интеллектуальный поиск...</p>
        </div>
      )}
    </div>
  );
}