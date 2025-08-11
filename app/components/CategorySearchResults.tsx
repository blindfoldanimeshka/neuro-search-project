'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalProduct } from '../lib/external-apis';
import ProductCategoriesGrid from './ProductCategoriesGrid';
import { X, Search, Filter, Grid, List } from 'lucide-react';

interface CategorySearchResultsProps {
  query: string;
  isDarkTheme: boolean;
  isVisible: boolean;
  onClose: () => void;
  onProductsLoaded?: (products: ExternalProduct[]) => void;
}

export default function CategorySearchResults({
  query,
  isDarkTheme,
  isVisible,
  onClose,
  onProductsLoaded
}: CategorySearchResultsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allProducts, setAllProducts] = useState<ExternalProduct[]>([]);

  useEffect(() => {
    if (isVisible && query.trim()) {
      setAllProducts([]);
    }
  }, [isVisible, query]);

  const handleProductsLoaded = (products: ExternalProduct[]) => {
    setAllProducts(prev => {
      const newProducts = [...prev, ...products];
      onProductsLoaded?.(newProducts);
      return newProducts;
    });
  };

  const handleError = (error: string) => {
    console.error('Category search error:', error);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        className={`relative w-full max-w-7xl h-full max-h-[90vh] shadow-2xl overflow-hidden ${
          isDarkTheme ? 'bg-background' : 'bg-background'
        }`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkTheme ? 'border-card-border' : 'border-card-border'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 flex items-center justify-center ${
              isDarkTheme ? 'bg-blue-600' : 'bg-blue-500'
            } text-white`}>
              <Search size={20} />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${
                isDarkTheme ? 'text-white' : 'text-slate-800'
              }`}>
                Результаты поиска по категориям
              </h2>
              <p className={`text-sm ${
                isDarkTheme ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Запрос: &quot;{query}&quot;
              </p>
            </div>
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

            {/* Кнопка закрытия */}
            <motion.button
              onClick={onClose}
              className={`p-2 transition-colors ${
                isDarkTheme
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                  : 'text-slate-600 hover:text-slate-700 hover:bg-slate-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={20} />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto">
          <div className={`p-6 ${
            viewMode === 'list' ? 'max-w-4xl mx-auto' : ''
          }`}>
            <ProductCategoriesGrid
              query={query}
              isDarkTheme={isDarkTheme}
              onProductsLoaded={handleProductsLoaded}
              onError={handleError}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${
          isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`text-sm ${
                isDarkTheme ? 'text-gray-400' : 'text-slate-600'
              }`}>
                Найдено товаров: {allProducts.length}
              </span>
              
              {allProducts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${
                    isDarkTheme ? 'text-gray-500' : 'text-slate-500'
                  }`}>
                    Источники:
                  </span>
                  {Array.from(new Set(allProducts.map(p => p.source))).slice(0, 3).map(source => (
                    <span
                      key={source}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isDarkTheme ? 'bg-gray-700 text-gray-300' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {source}
                    </span>
                  ))}
                  {Array.from(new Set(allProducts.map(p => p.source))).length > 3 && (
                    <span className={`text-xs ${
                      isDarkTheme ? 'text-gray-500' : 'text-slate-500'
                    }`}>
                      +{Array.from(new Set(allProducts.map(p => p.source))).length - 3}
                    </span>
                  )}
                </div>
              )}
              
              {allProducts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${
                    isDarkTheme ? 'text-gray-500' : 'text-slate-500'
                  }`}>
                    Ценовой диапазон:
                  </span>
                  <span className={`text-xs font-medium ${
                    isDarkTheme ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {Math.min(...allProducts.map(p => p.price)).toLocaleString()}₽ - {Math.max(...allProducts.map(p => p.price)).toLocaleString()}₽
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkTheme
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Закрыть
              </motion.button>
              
              {allProducts.length > 0 && (
                <motion.button
                  onClick={() => {
                    // Здесь можно добавить функциональность экспорта
                    console.log('Export products:', allProducts);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkTheme
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Экспорт
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 