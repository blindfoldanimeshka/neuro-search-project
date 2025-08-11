'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, Info, ExternalLink } from 'lucide-react';

interface DuckDuckGoProductInfo {
  name?: string;
  description?: string;
  price?: string;
  category?: string;
  source?: string;
}

interface DuckDuckGoProductCardProps {
  productInfo: DuckDuckGoProductInfo;
  isDarkTheme: boolean;
}

export default function DuckDuckGoProductCard({ productInfo, isDarkTheme }: DuckDuckGoProductCardProps) {
  if (!productInfo || Object.keys(productInfo).length === 0) {
    return null;
  }

  return (
    <motion.div
      className={`border p-4 mb-4 ${
        isDarkTheme 
          ? 'bg-card-bg border-card-border text-gray-200' 
          : 'bg-card-bg border-card-border text-slate-800'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start space-x-3">
        <div className={`p-2 ${
          isDarkTheme ? 'bg-blue-600' : 'bg-blue-500'
        }`}>
          <Package className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className={`font-semibold text-lg ${
              isDarkTheme ? 'text-white' : 'text-slate-900'
            }`}>
              {productInfo.name || 'Информация о товаре'}
            </h3>
            <div className={`px-2 py-1 text-xs ${
              isDarkTheme 
                ? 'bg-green-600 text-white' 
                : 'bg-green-100 text-green-800'
            }`}>
              DuckDuckGo
            </div>
          </div>
          
          {productInfo.description && (
            <p className={`text-sm mb-3 ${
              isDarkTheme ? 'text-gray-300' : 'text-slate-600'
            }`}>
              {productInfo.description}
            </p>
          )}
          
          <div className="space-y-2">
            {productInfo.price && (
              <div className="flex items-center space-x-2">
                <DollarSign className={`w-4 h-4 ${
                  isDarkTheme ? 'text-green-400' : 'text-green-600'
                }`} />
                <span className={`font-medium ${
                  isDarkTheme ? 'text-green-400' : 'text-green-600'
                }`}>
                  {productInfo.price}
                </span>
              </div>
            )}
            
            {productInfo.category && (
              <div className="flex items-center space-x-2">
                <Info className={`w-4 h-4 ${
                  isDarkTheme ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`text-sm ${
                  isDarkTheme ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  Категория: {productInfo.category}
                </span>
              </div>
            )}
            
            {productInfo.source && (
              <div className="flex items-center space-x-2">
                <ExternalLink className={`w-4 h-4 ${
                  isDarkTheme ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <span className={`text-sm ${
                  isDarkTheme ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  Источник: {productInfo.source}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 