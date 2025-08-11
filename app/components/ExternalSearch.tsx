'use client';

import React, { useState } from 'react';
import { Search, Filter, Globe, TrendingUp, ShoppingCart, Heart } from 'lucide-react';
import { useExternalSearch } from '../hooks/useExternalSearch';
import { ExternalProduct } from '../lib/external-apis';
import ExternalProductCard from './ExternalProductCard';
import LoadingSpinner from './LoadingSpinner';

interface ExternalSearchProps {
  isDarkTheme: boolean;
}

export default function ExternalSearch({ isDarkTheme }: ExternalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    category: '',
    sortBy: 'relevance' as 'price' | 'rating' | 'relevance' | 'date',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  const {
    searchProducts,
    isLoading,
    error,
    searchResults,
    lastQuery,
    clearResults,
    groupedProducts,
    sourceStats,
    topRatedProducts,
    cheapestProducts
  } = useExternalSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchFilters = {
        ...filters,
        minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined
      };
      searchProducts(searchQuery, searchFilters);
    }
  };

  const handleAddToCart = (product: ExternalProduct) => {
    // Здесь будет логика добавления в корзину
    console.log('Добавить в корзину:', product);
  };

  const handleAddToFavorites = (product: ExternalProduct) => {
    // Здесь будет логика добавления в избранное
    console.log('Добавить в избранное:', product);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Globe className={`mr-3 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} size={32} />
          <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
            Поиск товаров в интернете
          </h1>
        </div>
        <p className={`text-lg ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>
          Ищем товары на Wildberries, Ozon, Авито и других площадках
        </p>
      </div>

      {/* Форма поиска */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              isDarkTheme ? 'text-gray-400' : 'text-slate-400'
            }`} size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Введите название товара..."
              className={`w-full pl-10 pr-4 py-3 border focus:outline-none focus:ring-2 transition-colors ${
                isDarkTheme
                  ? 'bg-input-bg border-input-border text-foreground placeholder-gray-400 focus:ring-blue-500'
                  : 'bg-input-bg border-input-border text-foreground placeholder-slate-400 focus:ring-blue-300'
              }`}
            />
          </div>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border transition-colors ${
              isDarkTheme
                ? 'border-input-border hover:bg-card-bg text-gray-300'
                : 'border-input-border hover:bg-card-bg text-slate-600'
            }`}
          >
            <Filter size={20} />
          </button>
          
          <button
            type="submit"
            disabled={!searchQuery.trim() || isLoading}
            className={`px-6 py-3 font-medium transition-colors ${
              searchQuery.trim() && !isLoading
                ? isDarkTheme
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                : isDarkTheme
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Найти'}
          </button>
        </div>

        {/* Фильтры */}
        {showFilters && (
          <div className={`mt-4 p-4 border ${
            isDarkTheme ? 'bg-card-bg border-card-border' : 'bg-card-bg border-card-border'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Цена от
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  placeholder="0"
                  className={`w-full px-3 py-2 border ${
                    isDarkTheme
                      ? 'bg-input-bg border-input-border text-foreground'
                      : 'bg-input-bg border-input-border text-foreground'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Цена до
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  placeholder="100000"
                  className={`w-full px-3 py-2 border ${
                    isDarkTheme
                      ? 'bg-input-bg border-input-border text-foreground'
                      : 'bg-input-bg border-input-border text-foreground'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Сортировка
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as 'relevance' | 'price' | 'rating' | 'date' })}
                  className={`w-full px-3 py-2 border ${
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
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Порядок
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })}
                  className={`w-full px-3 py-2 border ${
                    isDarkTheme
                      ? 'bg-input-bg border-input-border text-foreground'
                      : 'bg-input-bg border-input-border text-foreground'
                  }`}
                >
                  <option value="asc">По возрастанию</option>
                  <option value="desc">По убыванию</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Ошибка */}
      {error && (
        <div className={`mb-6 p-4 rounded-xl ${
          isDarkTheme ? 'bg-red-900/20 border border-red-500' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </p>
          {error.includes('OpenRouter API key not configured') && (
            <div className={`mt-2 text-sm ${isDarkTheme ? 'text-red-300' : 'text-red-500'}`}>
              <p>Для работы поиска необходимо создать файл .env.local с API ключом OpenRouter.</p>
              <p>Получите бесплатный ключ на <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai</a></p>
            </div>
          )}
        </div>
      )}

      {/* Результаты поиска */}
      {searchResults && (
        <div className="space-y-6">
          {/* Статистика */}
          <div className={`p-4 rounded-xl ${
            isDarkTheme ? 'bg-gray-800' : 'bg-slate-50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${
                isDarkTheme ? 'text-white' : 'text-slate-800'
              }`}>
                Результаты поиска
              </h2>
              <button
                onClick={clearResults}
                className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                  isDarkTheme
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                }`}
              >
                Очистить
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-3 rounded-lg ${
                isDarkTheme ? 'bg-gray-700' : 'bg-white'
              }`}>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                  Найдено товаров
                </p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                  {searchResults.total}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${
                isDarkTheme ? 'bg-gray-700' : 'bg-white'
              }`}>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                  Источники
                </p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                  {searchResults.sources.length}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${
                isDarkTheme ? 'bg-gray-700' : 'bg-white'
              }`}>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                  Время поиска
                </p>
                <p className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                  {searchResults.searchTime}мс
                </p>
              </div>
            </div>
          </div>

          {/* Статистика по источникам */}
          {sourceStats.length > 0 && (
            <div className={`p-4 rounded-xl ${
              isDarkTheme ? 'bg-gray-800' : 'bg-slate-50'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDarkTheme ? 'text-white' : 'text-slate-800'
              }`}>
                Статистика по источникам
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sourceStats.map((stat) => (
                  <div key={stat.source} className={`p-3 rounded-lg ${
                    isDarkTheme ? 'bg-gray-700' : 'bg-white'
                  }`}>
                    <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                      {stat.source}
                    </p>
                    <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                      {stat.count} товаров
                    </p>
                    <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                      Средняя цена: {formatPrice(stat.avgPrice)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Товары по источникам */}
          {Object.entries(groupedProducts).map(([source, products]) => (
            <div key={source} className="space-y-4">
              <h3 className={`text-xl font-semibold ${
                isDarkTheme ? 'text-white' : 'text-slate-800'
              }`}>
                {source.charAt(0).toUpperCase() + source.slice(1)} ({products.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ExternalProductCard
                    key={`${product.source}-${product.id}`}
                    product={product}
                    isDarkTheme={isDarkTheme}
                    onAddToCart={handleAddToCart}
                    onAddToFavorites={handleAddToFavorites}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Пустое состояние */}
      {!searchResults && !isLoading && (
        <div className={`text-center py-12 ${
          isDarkTheme ? 'text-gray-400' : 'text-slate-500'
        }`}>
          <Globe size={64} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">Начните поиск товаров</h3>
          <p>Введите название товара и нажмите &quot;Найти&quot;</p>
        </div>
      )}
    </div>
  );
} 