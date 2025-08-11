'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Brain, Package, ExternalLink } from 'lucide-react';
import { Product } from './types';
import DuckDuckGoProductCard from './DuckDuckGoProductCard';

interface HybridSearchResultsProps {
  products: Product[];
  duckDuckGoInfo?: {
    name?: string;
    description?: string;
    price?: string;
    category?: string;
    source?: string;
  };
  isDarkTheme: boolean;
  searchQuery: string;
}

export default function HybridSearchResults({ 
  products, 
  duckDuckGoInfo, 
  isDarkTheme, 
  searchQuery 
}: HybridSearchResultsProps) {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Заголовок результатов */}
      <motion.div
        className={`p-4 border ${
          isDarkTheme 
            ? 'bg-card-bg border-card-border text-gray-200' 
            : 'bg-card-bg border-card-border text-slate-800'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className={`p-2 ${
            isDarkTheme ? 'bg-blue-600' : 'bg-blue-500'
          }`}>
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${
              isDarkTheme ? 'text-white' : 'text-slate-900'
            }`}>
              Результаты поиска
            </h2>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-400' : 'text-slate-600'
            }`}>
              По запросу: &quot;{searchQuery}&quot;
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <Brain className={`w-4 h-4 ${
              isDarkTheme ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <span className={isDarkTheme ? 'text-gray-300' : 'text-slate-600'}>
              AI анализ
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Package className={`w-4 h-4 ${
              isDarkTheme ? 'text-green-400' : 'text-green-600'
            }`} />
            <span className={isDarkTheme ? 'text-gray-300' : 'text-slate-600'}>
              DuckDuckGo данные
            </span>
          </div>
        </div>
      </motion.div>

      {/* Информация от DuckDuckGo */}
      {duckDuckGoInfo && Object.keys(duckDuckGoInfo).length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <DuckDuckGoProductCard 
            productInfo={duckDuckGoInfo}
            isDarkTheme={isDarkTheme}
          />
        </motion.div>
      )}

      {/* Список товаров */}
      {products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className={`p-4 border ${
            isDarkTheme 
              ? 'bg-card-bg border-card-border' 
              : 'bg-card-bg border-card-border'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkTheme ? 'text-white' : 'text-slate-900'
            }`}>
              Найденные товары ({products.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  className={`p-4 border ${
                    isDarkTheme 
                      ? 'bg-card-bg border-card-border text-gray-200' 
                      : 'bg-card-bg border-card-border text-slate-800'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm line-clamp-2">
                      {product.name}
                    </h4>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      isDarkTheme 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {product.source}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${
                        isDarkTheme ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {product.price.toLocaleString()} ₽
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className={`text-xs line-through ${
                          isDarkTheme ? 'text-gray-400' : 'text-slate-500'
                        }`}>
                          {product.originalPrice.toLocaleString()} ₽
                        </span>
                      )}
                    </div>
                    
                    {product.description && (
                      <p className="text-xs line-clamp-2 opacity-80">
                        {product.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="opacity-70">
                        {product.seller}
                      </span>
                      <a 
                        href={product.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`flex items-center space-x-1 ${
                          isDarkTheme ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Открыть</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Сообщение, если товары не найдены */}
      {products.length === 0 && !duckDuckGoInfo && (
        <motion.div
          className={`p-8 text-center rounded-lg border ${
            isDarkTheme 
              ? 'bg-gray-800 border-gray-700 text-gray-400' 
              : 'bg-white border-slate-200 text-slate-600'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>По вашему запросу ничего не найдено</p>
          <p className="text-sm mt-2">Попробуйте изменить поисковый запрос</p>
        </motion.div>
      )}
    </motion.div>
  );
} 