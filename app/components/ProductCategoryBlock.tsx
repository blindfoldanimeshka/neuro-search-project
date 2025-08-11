'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalProduct } from '../lib/external-apis';
import ExternalProductCard from './ExternalProductCard';
import LoadingSpinner from './LoadingSpinner';
import { Filter, SortAsc, SortDesc, RefreshCw, AlertCircle, Search } from 'lucide-react';

interface ProductCategoryBlockProps {
  category: 'goszakupki' | 'marketplaces' | 'private' | 'all';
  query: string;
  isDarkTheme: boolean;
  onProductsLoaded?: (products: ExternalProduct[]) => void;
  onError?: (error: string) => void;
}

interface CategoryConfig {
  name: string;
  description: string;
  icon: string;
  color: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  goszakupki: {
    name: 'Госзакупки',
    description: 'Тендеры и государственные закупки',
    icon: '🏛️',
    color: 'bg-blue-500'
  },
  marketplaces: {
    name: 'Маркетплейсы',
    description: 'Wildberries, Ozon, Яндекс.Маркет',
    icon: '🛒',
    color: 'bg-green-500'
  },
  private: {
    name: 'Частные объявления',
    description: 'Авито, Юла и другие площадки',
    icon: '🏠',
    color: 'bg-orange-500'
  },
  all: {
    name: 'Все источники',
    description: 'Поиск по всем доступным источникам',
    icon: '🔍',
    color: 'bg-purple-500'
  }
};

export default function ProductCategoryBlock({
  category,
  query,
  isDarkTheme,
  onProductsLoaded,
  onError
}: ProductCategoryBlockProps) {
  const [products, setProducts] = useState<ExternalProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    sortBy: 'relevance' as 'price' | 'rating' | 'relevance' | 'date',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  const config = CATEGORY_CONFIGS[category];

  const fetchProducts = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder })
      });

      const response = await fetch(`/api/search/${category}?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.products || []);
        onProductsLoaded?.(data.data.products || []);
      } else {
        throw new Error(data.error || 'Неизвестная ошибка');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, query, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    fetchProducts();
  };

  const sortedProducts = [...products].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price':
        return filters.sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      case 'rating':
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return filters.sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      case 'date':
        // Для даты используем ID как прокси (более новые товары имеют больший ID)
        return filters.sortOrder === 'asc' ? parseInt(a.id) - parseInt(b.id) : parseInt(b.id) - parseInt(a.id);
      default:
        return 0;
    }
  });

  const filteredProducts = sortedProducts.filter(product => {
    if (filters.minPrice && product.price < parseInt(filters.minPrice)) return false;
    if (filters.maxPrice && product.price > parseInt(filters.maxPrice)) return false;
    return true;
  });

  return (
    <motion.div
      className={`border overflow-hidden ${
        isDarkTheme ? 'bg-card-bg border-card-border' : 'bg-card-bg border-card-border'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Заголовок категории */}
      <div className={`p-4 border-b ${
        isDarkTheme ? 'border-card-border' : 'border-card-border'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 flex items-center justify-center text-white ${config.color}`}>
              <span className="text-lg">{config.icon}</span>
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${
                isDarkTheme ? 'text-white' : 'text-slate-800'
              }`}>
                {config.name}
              </h3>
              <p className={`text-sm ${
                isDarkTheme ? 'text-gray-400' : 'text-slate-600'
              }`}>
                {config.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 transition-colors ${
                isDarkTheme
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  : 'text-slate-600 hover:text-slate-700 hover:bg-slate-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter size={18} />
            </motion.button>
            
            <motion.button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`p-2 transition-colors ${
                isLoading
                  ? 'text-gray-500'
                  : isDarkTheme
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  : 'text-slate-600 hover:text-slate-700 hover:bg-slate-100'
              }`}
              whileHover={{ scale: isLoading ? 1 : 1.05 }}
              whileTap={{ scale: isLoading ? 1 : 0.95 }}
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </motion.button>
          </div>
        </div>

        {/* Статистика */}
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-sm ${
            isDarkTheme ? 'text-gray-400' : 'text-slate-600'
          }`}>
                            Найдено: {filteredProducts?.length || 0} товаров
          </span>
          
          {isLoading && (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="sm" />
              <span className={`text-sm ${
                isDarkTheme ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Поиск...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Фильтры */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className={`p-4 border-b ${
              isDarkTheme ? 'border-card-border bg-card-bg' : 'border-card-border bg-card-bg'
            }`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkTheme ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Мин. цена
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className={`w-full px-3 py-2 border text-sm ${
                    isDarkTheme
                      ? 'bg-input-bg border-input-border text-foreground placeholder-gray-400'
                      : 'bg-input-bg border-input-border text-foreground placeholder-slate-500'
                  }`}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkTheme ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Макс. цена
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className={`w-full px-3 py-2 border text-sm ${
                    isDarkTheme
                      ? 'bg-input-bg border-input-border text-foreground placeholder-gray-400'
                      : 'bg-input-bg border-input-border text-foreground placeholder-slate-500'
                  }`}
                  placeholder="∞"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkTheme ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Сортировка
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className={`w-full px-3 py-2 border text-sm ${
                    isDarkTheme
                      ? 'bg-input-bg border-input-border text-foreground'
                      : 'bg-input-bg border-input-border text-foreground'
                  }`}
                >
                  <option value="relevance">По релевантности</option>
                  <option value="price">По цене</option>
                  <option value="rating">По рейтингу</option>
                  <option value="date">По дате</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkTheme ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Порядок
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleFilterChange('sortOrder', 'asc')}
                    className={`flex-1 px-3 py-2 border text-sm transition-colors ${
                      filters.sortOrder === 'asc'
                        ? isDarkTheme
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-blue-500 border-blue-400 text-white'
                        : isDarkTheme
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <SortAsc size={14} className="inline mr-1" />
                    Возр.
                  </button>
                  <button
                    onClick={() => handleFilterChange('sortOrder', 'desc')}
                    className={`flex-1 px-3 py-2 border text-sm transition-colors ${
                      filters.sortOrder === 'desc'
                        ? isDarkTheme
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-blue-500 border-blue-400 text-white'
                        : isDarkTheme
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <SortDesc size={14} className="inline mr-1" />
                    Убыв.
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ошибка */}
      {error && (
        <motion.div
          className={`p-4 border-b ${
            isDarkTheme ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'
          }`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-500" />
            <span className={`text-sm ${
              isDarkTheme ? 'text-red-400' : 'text-red-600'
            }`}>
              {error}
            </span>
          </div>
          <div className="mt-2">
            <button
              onClick={handleRefresh}
              className={`text-xs px-3 py-1 transition-colors ${
                isDarkTheme
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              Попробовать снова
            </button>
          </div>
        </motion.div>
      )}

      {/* Список товаров */}
      <div className={`p-4 ${
        isDarkTheme ? 'bg-background' : 'bg-background'
      }`}>
                    {filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <ExternalProductCard
                    product={product}
                    isDarkTheme={isDarkTheme}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : !isLoading && !error ? (
          <motion.div
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={`w-16 h-16 flex items-center justify-center mx-auto mb-4 ${
              isDarkTheme ? 'bg-gray-700' : 'bg-slate-200'
            }`}>
              <Search size={24} className={isDarkTheme ? 'text-gray-400' : 'text-slate-600'} />
            </div>
            <p className={`text-lg ${
              isDarkTheme ? 'text-gray-400' : 'text-slate-600'
            }`}>
              Товары не найдены
            </p>
            <p className={`text-sm mt-2 ${
              isDarkTheme ? 'text-gray-500' : 'text-slate-500'
            }`}>
              Попробуйте изменить запрос или фильтры
            </p>
            <button
              onClick={handleRefresh}
              className={`mt-4 px-4 py-2 text-sm font-medium transition-colors ${
                isDarkTheme
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Обновить поиск
            </button>
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
} 