'use client';

import React from 'react';
import { Plus, Loader2, Search, AlertCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useCallback } from 'react';
import { Product } from './types';
import { ExternalProduct } from '../lib/external-apis';
import ExternalProductCard from './ExternalProductCard';

interface ProductGridProps {
  isDarkTheme: boolean;
  filteredProducts: Product[];
  selectedProducts: Product[];
  productQuantities: {[key: string]: number};
  addToTable: (product: Product) => void;
  setQuantity: (productId: string, quantity: number) => void;
  isLoading: boolean;
  isAISearchLoading: boolean;
  searchMode: 'standard' | 'ai';
  searchQuery: string;
  aiSearchError: string | null;
  externalProducts?: ExternalProduct[];
}

const ProductGrid = React.memo(function ProductGrid({
  isDarkTheme,
  filteredProducts,
  selectedProducts,
  productQuantities,
  addToTable,
  setQuantity,
  isLoading,
  isAISearchLoading,
  searchMode,
  searchQuery,
  aiSearchError,
  externalProducts
}: ProductGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    }
  };

  const loadingVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    }
  };

  const errorVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const
      }
    }
  };

  // Мемоизируем вычисления состояния
  const hasActiveSearch = useMemo(() => searchQuery && searchQuery.trim().length > 0, [searchQuery]);
  const hasSearchResults = useMemo(() => externalProducts && externalProducts.length > 0, [externalProducts]);
  const hasLocalProducts = useMemo(() => filteredProducts && filteredProducts.length > 0, [filteredProducts]);

  // Мемоизируем заголовок
  const gridTitle = useMemo(() => {
    if (hasActiveSearch) {
      return `Результаты поиска "${searchQuery || ''}" (${hasSearchResults ? externalProducts!.length : 0})`;
    }
    return `Выведенные товары (${filteredProducts?.length || 0})`;
  }, [hasActiveSearch, searchQuery, hasSearchResults, externalProducts, filteredProducts]);

  // Мемоизируем обработчики событий
  const handleQuantityIncrease = useCallback((productId: string) => {
    const currentQty = productQuantities[productId] || 0;
    setQuantity(productId, currentQty + 1);
  }, [productQuantities, setQuantity]);

  const handleAddToTable = useCallback((product: Product) => {
    addToTable(product);
  }, [addToTable]);

  return (
    <motion.div 
      className={`shadow-sm border p-3 flex-1 ${
        isDarkTheme 
          ? 'bg-card-bg border-card-border' 
          : 'bg-card-bg border-card-border'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="flex justify-between items-center mb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h2 className={`text-base font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-700'}`}>
          {gridTitle}
        </h2>
        <AnimatePresence>
          {(isLoading || isAISearchLoading) && (
            <motion.div 
              className="flex items-center text-xs text-blue-600"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="mr-1" size={12} />
              </motion.div>
              {searchMode === 'ai' ? 'ИИ-поиск...' : 'Поиск...'}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        <AnimatePresence mode="wait">
          {isLoading || isAISearchLoading ? (
            <motion.div 
              key="loading"
              className="flex flex-col items-center justify-center py-12"
              variants={loadingVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className={`w-12 h-12 flex items-center justify-center mb-4 ${
                  isDarkTheme ? 'bg-gray-700' : 'bg-slate-200'
                }`}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className={`w-6 h-6 ${isDarkTheme ? 'text-blue-400' : 'text-blue-500'}`} />
              </motion.div>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>
                {isAISearchLoading ? '🤖 AI ищет товары...' : '🔍 Поиск товаров...'}
              </p>
              <p className={`text-xs mt-2 ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                Запрос: "{searchQuery || ''}"
              </p>
            </motion.div>
          ) : aiSearchError ? (
            <motion.div 
              key="error"
              className="flex flex-col items-center justify-center py-12"
              variants={errorVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className={`w-12 h-12 flex items-center justify-center mb-4 ${
                  isDarkTheme ? 'bg-red-500/20' : 'bg-red-100'
                }`}
              >
                <AlertCircle className="w-6 h-6 text-red-500" />
              </motion.div>
              <p className={`text-sm font-medium ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
                Ошибка поиска
              </p>
              <p className={`text-xs mt-1 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                {aiSearchError}
              </p>
            </motion.div>
          ) : hasSearchResults ? (
            <motion.div 
              key="search-results"
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                  🔍 Результаты поиска
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-600'}`}>
                    Найдено: {externalProducts!.length}
                  </span>
                  <ExternalLink size={16} className={isDarkTheme ? 'text-gray-400' : 'text-slate-600'} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {externalProducts!.map((product, index) => (
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
            </motion.div>
          ) : hasActiveSearch && !hasSearchResults ? (
            <motion.div 
              key="no-search-results"
              className="flex flex-col items-center justify-center py-12"
              variants={loadingVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className={`w-12 h-12 flex items-center justify-center mb-4 ${
                  isDarkTheme ? 'bg-gray-700' : 'bg-slate-200'
                }`}
                animate={{ 
                  scale: [1, 1.1, 1],
                  transition: { duration: 2, repeat: Infinity }
                }}
              >
                🔍
              </motion.div>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-slate-500'}`}>
                Товары не найдены
              </p>
              <p className={`mt-1 text-xs ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                По запросу "{searchQuery || ''}" ничего не найдено
              </p>
              <p className={`mt-2 text-xs ${isDarkTheme ? 'text-gray-400' : 'text-slate-300'}`}>
                Попробуйте изменить формулировку или использовать другие ключевые слова
              </p>
            </motion.div>
          ) : !hasActiveSearch && !hasLocalProducts ? (
            <motion.div 
              key="empty"
              className="flex flex-col items-center justify-center py-12"
              variants={loadingVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className={`w-12 h-12 flex items-center justify-center mb-4 ${
                  isDarkTheme ? 'bg-gray-700' : 'bg-slate-200'
                }`}
                animate={{ 
                  scale: [1, 1.1, 1],
                  transition: { duration: 2, repeat: Infinity }
                }}
              >
                📦
              </motion.div>
              <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-slate-500'}`}>
                Начните поиск товаров
              </p>
              <p className={`mt-1 text-xs ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                Введите название товара в поиск
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="local-products"
              className="grid grid-cols-4 gap-2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {(filteredProducts || []).map((product, index) => (
                <motion.div 
                  key={product.id} 
                  className={`border p-2 hover:shadow-sm transition-shadow duration-200 ${
                    isDarkTheme 
                      ? 'border-card-border bg-card-bg' 
                      : 'border-card-border bg-card-bg'
                  }`}
                  variants={itemVariants}
                  whileHover={{ 
                    y: -2,
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-medium truncate ${
                        isDarkTheme ? 'text-white' : 'text-slate-900'
                      }`}>
                        {product.name}
                      </h3>
                      <p className={`text-xs ${
                        isDarkTheme ? 'text-gray-400' : 'text-slate-500'
                      }`}>
                        {product.price.toLocaleString()} ₽
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <motion.button
                      onClick={() => handleQuantityIncrease(product.id)}
                      className={`flex-1 py-1 px-2 text-xs font-medium transition-colors ${
                        isDarkTheme
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-3 h-3" />
                    </motion.button>
                    
                    <motion.div 
                      className={`flex-1 text-center py-1 px-2 text-xs font-medium ${
                        isDarkTheme ? 'bg-gray-700 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {productQuantities[product.id] || 0}
                    </motion.div>
                    
                    <motion.button
                      onClick={() => handleAddToTable(product)}
                      className={`flex-1 py-1 px-2 text-xs font-medium transition-colors ${
                        isDarkTheme
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Добавить
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default ProductGrid;