'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ExternalLink, Eye, Clock, Tag } from 'lucide-react';
import { ScrapedProduct } from '@/app/lib/web-scraper';

interface ProductListItemProps {
  product: ScrapedProduct;
}

export default function ProductListItem({ product }: ProductListItemProps) {
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={product.image || '/placeholder-product.jpg'}
              alt={product.title}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.jpg';
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg line-clamp-2">
                {product.title}
              </h3>
              <div className="flex gap-2">
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
            </div>
            
            <div className="flex items-center gap-4 mb-2">
              <span className="text-xl font-bold text-green-600">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {product.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{product.rating}</span>
                  {product.reviewsCount && (
                    <span className="text-sm text-gray-500">
                      ({product.reviewsCount})
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(product.scrapedAt)}
              </span>
              {product.category && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {product.category}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm"
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
        </div>
      </CardContent>
    </Card>
  );
}
