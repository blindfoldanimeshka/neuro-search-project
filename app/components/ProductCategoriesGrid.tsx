'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalProduct } from '../lib/external-apis';
import ProductCategoryBlock from './ProductCategoryBlock';
import { Search, Grid, List, Filter } from 'lucide-react';

interface ProductCategoriesGridProps {
  query: string;
  isDarkTheme: boolean;
  onProductsLoaded?: (products: ExternalProduct[]) => void;
  onError?: (error: string) => void;
}

interface CategoryInfo {
  id: 'goszakupki' | 'marketplaces' | 'private' | 'all';
  name: string;
  description: string;
  icon: string;
  color: string;
  sources: string[];
}

const CATEGORIES: CategoryInfo[] = [
  {
    id: 'goszakupki',
    name: 'Госзакупки',
    description: 'Тендеры и государственные закупки',
    icon: '🏛️',
    color: 'bg-blue-500',
    sources: ['zakupki.gov.ru', 'tender.pro', 'goszakupki.ru']
  },
  {
    id: 'marketplaces',
    name: 'Маркетплейсы',
    description: 'Wildberries, Ozon, Яндекс.Маркет',
    icon: '🛒',
    color: 'bg-green-500',
    sources: ['Wildberries', 'Ozon', 'Яндекс.Маркет', 'СберМегаМаркет']
  },
  {
    id: 'private',
    name: 'Частные объявления',
    description: 'Авито, Юла и другие площадки',
    icon: '🏠',
    color: 'bg-orange-500',
    sources: ['Авито', 'Юла', 'Из рук в руки']
  },
  {
    id: 'all',
    name: 'Все источники',
    description: 'Поиск по всем доступным источникам',
    icon: '🔍',
    color: 'bg-purple-500',
    sources: ['Все источники']
  }
];

export default function ProductCategoriesGrid({
  query,
  isDarkTheme,
  onProductsLoaded,
  onError
}: ProductCategoriesGridProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (categoryId === 'all') {
        return ['all'];
      }
      
      if (prev.includes(categoryId)) {
        const newSelection = prev.filter(id => id !== categoryId);
        return newSelection.length === 0 ? ['all'] : newSelection;
      } else {
        const newSelection = prev.filter(id => id !== 'all');
        return [...newSelection, categoryId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedCategories(['all']);
  };

  const handleSelectNone = () => {
    setSelectedCategories([]);
  };

  const handleSelectMultiple = (categoryIds: string[]) => {
    setSelectedCategories(categoryIds);
  };

  const allProducts: ExternalProduct[] = [];

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className={`p-4 border ${
        isDarkTheme ? 'bg-card-bg border-card-border' : 'bg-card-bg border-card-border'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-xl font-semibold ${
              isDarkTheme ? 'text-white' : 'text-slate-800'
            }`}>
              Поиск товаров по категориям
            </h2>
            <p className={`text-sm mt-1 ${
              isDarkTheme ? 'text-gray-400' : 'text-slate-600'
            }`}>
              Запрос: &quot;{query}&quot;
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Переключатель режима просмотра */}
            <div className={`flex p-1 ${
              isDarkTheme ? 'bg-gray-700' : 'bg-slate-100'
            }`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm transition-colors ${
                  viewMode === 'grid'
                    ? isDarkTheme
                      ? 'bg-gray-600 text-white'
                      : 'bg-white text-slate-800 shadow-sm'
                    : isDarkTheme
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-slate-600 hover:text-slate-700'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm transition-colors ${
                  viewMode === 'list'
                    ? isDarkTheme
                      ? 'bg-gray-600 text-white'
                      : 'bg-white text-slate-800 shadow-sm'
                    : isDarkTheme
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-slate-600 hover:text-slate-700'
                }`}
              >
                <List size={16} />
              </button>
            </div>

            {/* Кнопка выбора категорий */}
            <motion.button
              onClick={() => setShowCategorySelector(!showCategorySelector)}
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
          </div>
        </div>

        {/* Селектор категорий */}
        <AnimatePresence>
          {showCategorySelector && (
            <motion.div
              className={`p-4 border ${
                isDarkTheme ? 'bg-card-bg border-card-border' : 'bg-card-bg border-card-border'
              }`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-3">
                <h3 className={`text-sm font-medium mb-2 ${
                  isDarkTheme ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  Выберите категории для поиска:
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleSelectAll}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      selectedCategories.includes('all')
                        ? isDarkTheme
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : isDarkTheme
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Все
                  </button>
                  <button
                    onClick={handleSelectNone}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      selectedCategories.length === 0
                        ? isDarkTheme
                          ? 'bg-red-600 text-white'
                          : 'bg-red-500 text-white'
                        : isDarkTheme
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Ничего
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CATEGORIES.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`p-3 border transition-all ${
                      selectedCategories.includes(category.id)
                        ? isDarkTheme
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-blue-400 bg-blue-50'
                        : isDarkTheme
                        ? 'border-gray-600 bg-gray-700 hover:border-gray-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 flex items-center justify-center text-white ${category.color}`}>
                        <span className="text-sm">{category.icon}</span>
                      </div>
                      <div className="text-left">
                        <div className={`font-medium text-sm ${
                          isDarkTheme ? 'text-white' : 'text-slate-800'
                        }`}>
                          {category.name}
                        </div>
                        <div className={`text-xs ${
                          isDarkTheme ? 'text-gray-400' : 'text-slate-600'
                        }`}>
                          {category.sources.join(', ')}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Статистика выбранных категорий */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t ${
          isDarkTheme ? 'border-card-border' : 'border-card-border'
        }">
          <div className="flex items-center space-x-2">
            <Search size={16} className={isDarkTheme ? 'text-gray-400' : 'text-slate-600'} />
            <span className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-slate-600'
            }`}>
              Выбрано категорий: {selectedCategories.length}
            </span>
          </div>
          
          {selectedCategories.length > 0 && (
            <div className="flex items-center space-x-2">
              {selectedCategories.map((categoryId) => {
                const category = CATEGORIES.find(c => c.id === categoryId);
                return category ? (
                  <span
                    key={categoryId}
                    className={`px-2 py-1 text-xs font-medium ${
                      isDarkTheme ? 'bg-gray-700 text-gray-300' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {category.name}
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Отображение выбранных категорий */}
      <AnimatePresence>
        {selectedCategories.length > 0 ? (
          <div className={`space-y-6 ${
            viewMode === 'list' ? 'max-w-4xl mx-auto' : ''
          }`}>
            {selectedCategories.map((categoryId, index) => (
              <motion.div
                key={categoryId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <ProductCategoryBlock
                  category={categoryId as any}
                  query={query}
                  isDarkTheme={isDarkTheme}
                  onProductsLoaded={(products) => {
                    allProducts.push(...products);
                    onProductsLoaded?.(allProducts);
                  }}
                  onError={onError}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className={`text-center py-12 border ${
              isDarkTheme ? 'bg-card-bg border-card-border' : 'bg-card-bg border-card-border'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={`w-16 h-16 flex items-center justify-center mx-auto mb-4 ${
              isDarkTheme ? 'bg-gray-700' : 'bg-slate-200'
            }`}>
              <Search size={24} className={isDarkTheme ? 'text-gray-400' : 'text-slate-600'} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${
              isDarkTheme ? 'text-white' : 'text-slate-800'
            }`}>
              Выберите категории для поиска
            </h3>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-slate-600'
            }`}>
              Нажмите на кнопку фильтра выше, чтобы выбрать категории товаров для поиска
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 