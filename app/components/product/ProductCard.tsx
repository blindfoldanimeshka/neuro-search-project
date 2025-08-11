'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ExternalLink, Eye, Clock } from 'lucide-react';
import { ScrapedProduct } from '@/app/lib/web-scraper';

interface ProductCardProps {
  product: ScrapedProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Форматирование цены
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Форматирование даты
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Получение цвета для источника
  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      wildberries: 'bg-blue-100 text-blue-800',
      ozon: 'bg-orange-100 text-orange-800',
      avito: 'bg-green-100 text-green-800',
      yandex: 'bg-red-100 text-red-800',
      sbermegamarket: 'bg-purple-100 text-purple-800'
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Badge className={getSourceColor(product.source)}>
            {product.source}
          </Badge>
          {product.availability ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              В наличии
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              Нет в наличии
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="aspect-square mb-4 overflow-hidden rounded-lg">
          <img
            src={product.image || '/placeholder-product.jpg'}
            alt={product.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
            onError={(e) => {
              e.currentTarget.src = '/placeholder-product.jpg';
            }}
          />
        </div>
        
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 h-12">
          {product.title}
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-green-600">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{product.rating}</span>
              {product.reviewsCount && (
                <span className="text-xs text-gray-500">
                  ({product.reviewsCount})
                </span>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {formatDate(product.scrapedAt)}
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => window.open(product.url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Перейти
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(product.url, '_blank')}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
