'use client';

import React from 'react';
import { Heart, ShoppingCart, Star, ExternalLink, Eye } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  discount?: number;
  url?: string;
  seller?: string;
  availability?: boolean;
}

const ProductCard = React.memo(function ProductCard({
  name,
  price,
  originalPrice,
  image,
  rating,
  reviewCount,
  isNew = false,
  discount,
  url,
  seller,
  availability
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Мемоизируем форматирование цены
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  }, [price]);

  const formattedOriginalPrice = useMemo(() => {
    if (!originalPrice || originalPrice <= price) return null;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(originalPrice);
  }, [originalPrice, price]);

  // Мемоизируем звезды рейтинга
  const ratingStars = useMemo(() => {
    return [...Array(5)].map((_, i) => ({
      key: i,
      filled: i < Math.floor(rating)
    }));
  }, [rating]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/placeholder-product.jpg';
  }, []);

  const handleWishlistToggle = useCallback(() => {
    setIsWishlisted(prev => !prev);
  }, []);

  const handleExternalLink = useCallback(() => {
    if (url) {
      window.open(url, '_blank');
    }
  }, [url]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
      layout
    >
      <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg">
        {/* Изображение товара */}
        <div className="relative aspect-square overflow-hidden">
          <motion.img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
          />
          
          {/* Бейджи */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <AnimatePresence>
              {isNew && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  Новинка
                </Badge>
              )}
              {discount && (
                <Badge variant="destructive">
                  -{discount}%
                </Badge>
              )}
            </AnimatePresence>
          </div>

          {/* Кнопки действий */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleWishlistToggle}
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            {url && (
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={handleExternalLink}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Название товара */}
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {name}
          </h3>

          {/* Рейтинг */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              {ratingStars.map(({ key, filled }) => (
                <Star
                  key={key}
                  className={`h-3 w-3 ${
                    filled
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-1">
              ({reviewCount})
            </span>
          </div>

          {/* Цена */}
          <div className="flex items-center gap-2 mb-3">
            <span className="font-bold text-lg text-primary">
              {formattedPrice}
            </span>
            {formattedOriginalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formattedOriginalPrice}
              </span>
            )}
          </div>

          {/* Продавец */}
          {seller && (
            <p className="text-xs text-muted-foreground mb-3">
              Продавец: {seller}
            </p>
          )}

          {/* Кнопка добавления в корзину */}
          <Button 
            className="w-full" 
            size="sm"
            disabled={!availability}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {availability ? 'В корзину' : 'Нет в наличии'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default ProductCard;