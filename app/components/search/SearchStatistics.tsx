'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SearchStatisticsProps {
  totalProducts: number;
  totalSources: number;
  executionTime: number;
}

export default function SearchStatistics({
  totalProducts,
  totalSources,
  executionTime
}: SearchStatisticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика поиска</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalProducts}
            </div>
            <div className="text-sm text-gray-600">Всего товаров</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalSources}
            </div>
            <div className="text-sm text-gray-600">Источников</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(executionTime / 1000)}с
            </div>
            <div className="text-sm text-gray-600">Время выполнения</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
