'use client';

import { ExternalProduct } from '../lib/external-apis';
import { ExternalLink, Star, ShoppingCart, Heart, TrendingUp, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface ExternalProductCardProps {
  product: ExternalProduct;
  isDarkTheme: boolean;
  isSelected?: boolean;
  onSelect?: (product: ExternalProduct) => void;
  onQuantityChange?: (quantity: number) => void;
  quantity?: number;
  onAddToCart?: (product: ExternalProduct) => void;
  onAddToFavorites?: (product: ExternalProduct) => void;
}

export default function ExternalProductCard({ 
  product, 
  isDarkTheme, 
  isSelected = false,
  onSelect,
  onQuantityChange,
  quantity = 0,
  onAddToCart, 
  onAddToFavorites 
}: ExternalProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getSourceColor = (source: string) => {
    const colors = {
      wildberries: 'bg-purple-500',
      ozon: 'bg-blue-500',
      avito: 'bg-green-500',
      yandex: 'bg-red-500',
      sbermegamarket: 'bg-green-600',
      youla: 'bg-orange-500',
      government: 'bg-blue-600',
      custom: 'bg-gray-500'
    };
    return colors[source as keyof typeof colors] || 'bg-gray-500';
  };

  const getSourceName = (source: string) => {
    const names = {
      wildberries: 'Wildberries',
      ozon: 'Ozon',
      avito: 'Авито',
      yandex: 'Яндекс.Маркет',
      sbermegamarket: 'СберМегаМаркет',
      youla: 'Юла',
      government: 'Госзакупки',
      custom: 'Другой сайт'
    };
    return names[source as keyof typeof names] || source;
  };

  const discount = product.originalPrice && product.originalPrice > product.price 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleQuantityIncrease = () => {
    if (onQuantityChange) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleQuantityDecrease = () => {
    if (onQuantityChange && quantity > 0) {
      onQuantityChange(quantity - 1);
    }
  };

  return (
    <div className={`relative border transition-all duration-200 hover:shadow-lg ${
      isSelected
        ? isDarkTheme
          ? 'bg-blue-50/10 border-blue-500'
          : 'bg-blue-50 border-blue-500'
        : isDarkTheme 
          ? 'bg-card-bg border-card-border hover:border-card-border' 
          : 'bg-card-bg border-card-border hover:border-card-border'
    }`}>
      
      {/* Бейдж источника */}
      <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium text-white ${getSourceColor(product.source)}`}>
        {getSourceName(product.source)}
      </div>

      {/* Бейдж скидки */}
      {discount > 0 && (
        <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-white bg-red-500">
          -{discount}%
        </div>
      )}

      {/* Изображение */}
      <div className="relative aspect-square overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-product.jpg';
            }}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${
            isDarkTheme ? 'bg-gray-700' : 'bg-slate-100'
          }`}>
            <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
              Нет фото
            </span>
          </div>
        )}
      </div>

      {/* Информация о товаре */}
      <div className="p-3">
        {/* Название */}
        <h3 className={`font-medium text-sm mb-2 line-clamp-2 ${
          isDarkTheme ? 'text-white' : 'text-slate-900'
        }`}>
          {product.name}
        </h3>

        {/* Цена */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${
              isDarkTheme ? 'text-white' : 'text-slate-900'
            }`}>
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className={`text-sm line-through ${
                isDarkTheme ? 'text-gray-400' : 'text-slate-500'
              }`}>
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          {/* Рейтинг */}
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className={`w-4 h-4 ${isDarkTheme ? 'text-yellow-400' : 'text-yellow-500'}`} fill="currentColor" />
              <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>
                {product.rating}
              </span>
            </div>
          )}
        </div>

        {/* Дополнительная информация */}
        <div className="space-y-1 mb-3">
          {product.year && (
            <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
              Год: {product.year}
            </p>
          )}
          {product.category && (
            <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
              Категория: {product.category}
            </p>
          )}
          {product.subcategory && (
            <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
              Подкатегория: {product.subcategory}
            </p>
          )}
        </div>

        {/* Управление количеством */}
        {isSelected && (
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>
              Количество:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleQuantityDecrease}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  isDarkTheme
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <Minus size={12} />
              </button>
              <span className={`w-8 text-center text-sm font-medium ${
                isDarkTheme ? 'text-white' : 'text-slate-900'
              }`}>
                {quantity}
              </span>
              <button
                onClick={handleQuantityIncrease}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  isDarkTheme
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex gap-2">
          {onSelect && (
            <motion.button
              onClick={() => onSelect(product)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                isSelected
                  ? isDarkTheme
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  : isDarkTheme
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {isSelected ? 'Выбрано' : 'Выбрать'}
            </motion.button>
          )}
          
          {product.url && (
            <motion.a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                isDarkTheme
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <ExternalLink size={14} />
              Открыть
            </motion.a>
          )}
        </div>
      </div>
    </div>
  );
} 