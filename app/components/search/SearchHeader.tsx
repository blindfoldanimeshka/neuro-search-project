'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter, Grid3X3, List } from 'lucide-react';

interface SearchHeaderProps {
  query: string;
  totalProducts: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export default function SearchHeader({
  query,
  totalProducts,
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters
}: SearchHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">
          Результаты поиска: "{query}"
        </h2>
        <p className="text-gray-600">
          Найдено {totalProducts} товаров
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
        >
          <Filter className="w-4 h-4 mr-1" />
          Фильтры
        </Button>
        
        <div className="flex items-center gap-1 border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
