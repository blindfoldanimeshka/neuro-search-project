'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, SortAsc, SortDesc, Search, Tag, Star, Clock } from 'lucide-react';

interface FilterState {
  sources: string[];
  priceRange: [number, number];
  rating: [number, number];
  availability: boolean | null;
  categories: string[];
  dateRange: [number, number];
}

interface SortOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface SearchFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
  uniqueSources: string[];
  uniqueCategories: string[];
  onSearch: () => void;
  onReset: () => void;
}

export default function SearchFilters({
  filters,
  setFilters,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  uniqueSources,
  uniqueCategories,
  onSearch,
  onReset
}: SearchFiltersProps) {
  const sortOptions: SortOption[] = [
    { value: 'relevance', label: 'По релевантности', icon: <Search className="w-4 h-4" /> },
    { value: 'price', label: 'По цене', icon: <Tag className="w-4 h-4" /> },
    { value: 'rating', label: 'По рейтингу', icon: <Star className="w-4 h-4" /> },
    { value: 'date', label: 'По дате', icon: <Clock className="w-4 h-4" /> },
    { value: 'title', label: 'По названию', icon: <Tag className="w-4 h-4" /> }
  ];

  // Форматирование цены
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Фильтры и сортировка
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Источники */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Источники</label>
            <div className="space-y-2">
              {uniqueSources.map(source => (
                <div key={source} className="flex items-center space-x-2">
                  <Checkbox
                    id={`source-${source}`}
                    checked={filters.sources.includes(source)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters(prev => ({
                          ...prev,
                          sources: [...prev.sources, source]
                        }));
                      } else {
                        setFilters(prev => ({
                          ...prev,
                          sources: prev.sources.filter(s => s !== source)
                        }));
                      }
                    }}
                  />
                  <label htmlFor={`source-${source}`} className="text-sm capitalize">
                    {source}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Диапазон цен */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Диапазон цен: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
            </label>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
              max={100000}
              step={1000}
              className="w-full"
            />
          </div>

          {/* Диапазон рейтинга */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Рейтинг: {filters.rating[0]} - {filters.rating[1]}
            </label>
            <Slider
              value={filters.rating}
              onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value as [number, number] }))}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Наличие */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Наличие</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="availability-all"
                  checked={filters.availability === null}
                  onCheckedChange={() => setFilters(prev => ({ ...prev, availability: null }))}
                />
                <label htmlFor="availability-all" className="text-sm">Все</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="availability-available"
                  checked={filters.availability === true}
                  onCheckedChange={() => setFilters(prev => ({ ...prev, availability: true }))}
                />
                <label htmlFor="availability-available" className="text-sm">В наличии</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="availability-unavailable"
                  checked={filters.availability === false}
                  onCheckedChange={() => setFilters(prev => ({ ...prev, availability: false }))}
                />
                <label htmlFor="availability-unavailable" className="text-sm">Нет в наличии</label>
              </div>
            </div>
          </div>

          {/* Сортировка */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Сортировка</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="w-full"
            >
              {sortOrder === 'asc' ? (
                <>
                  <SortAsc className="w-4 h-4 mr-1" />
                  По возрастанию
                </>
              ) : (
                <>
                  <SortDesc className="w-4 h-4 mr-1" />
                  По убыванию
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSearch} className="flex-1">
            Применить фильтры
          </Button>
          <Button variant="outline" onClick={onReset}>
            Сбросить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
