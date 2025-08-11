'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search } from 'lucide-react';
import { ScrapedProduct, ScrapingResult } from '@/app/lib/web-scraper';
import { SearchHeader, SearchFilters, SearchStatistics } from './search';
import { ProductGrid, ProductList } from './product';

interface ProductSearchResultsProps {
  query: string;
  results?: any;
  onSearch: (query: string, filters?: any) => void;
  loading?: boolean;
}

interface FilterState {
  sources: string[];
  priceRange: [number, number];
  rating: [number, number];
  availability: boolean | null;
  categories: string[];
  dateRange: [number, number];
}

export default function ProductSearchResults({ query, results, onSearch, loading }: ProductSearchResultsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    sources: [],
    priceRange: [0, 100000],
    rating: [0, 5],
    availability: null,
    categories: [],
    dateRange: [Date.now() - 30 * 24 * 60 * 60 * 1000, Date.now()]
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [itemsPerPage] = useState(20);

  // Получаем уникальные значения для фильтров
  const uniqueSources = useMemo(() => {
    if (!results?.sources?.scraped) return [];
    return Object.keys(results.sources.scraped);
  }, [results]);

  const uniqueCategories = useMemo(() => {
    if (!results?.indexed?.stats?.categories) return [];
    return Object.keys(results.indexed.stats.categories);
  }, [results]);

  // Применяем фильтры и поиск
  const handleSearch = () => {
    const activeFilters = {
      sources: filters.sources.length > 0 ? filters.sources : undefined,
      priceRange: filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 ? {
        min: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
        max: filters.priceRange[1] < 100000 ? filters.priceRange[1] : undefined
      } : undefined,
      rating: filters.rating[0] > 0 || filters.rating[1] < 5 ? {
        min: filters.rating[0] > 0 ? filters.rating[0] : undefined,
        max: filters.rating[1] < 5 ? filters.rating[1] : undefined
      } : undefined,
      availability: filters.availability,
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      dateRange: {
        from: filters.dateRange[0],
        to: filters.dateRange[1]
      }
    };

    onSearch(query, activeFilters);
    setCurrentPage(1);
  };

  // Сброс фильтров
  const resetFilters = () => {
    setFilters({
      sources: [],
      priceRange: [0, 100000],
      rating: [0, 5],
      availability: null,
      categories: [],
      dateRange: [Date.now() - 30 * 24 * 60 * 60 * 1000, Date.now()]
    });
    setSortBy('relevance');
    setSortOrder('desc');
  };

  if (!results) {
    return (
      <div className="text-center py-12">
        <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          Начните поиск товаров
        </h3>
        <p className="text-gray-500">
          Введите запрос в поле поиска выше, чтобы найти товары
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <SearchHeader
        query={query}
        totalProducts={results.totalProducts || 0}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Фильтры */}
      {showFilters && (
        <SearchFilters
          filters={filters}
          setFilters={setFilters}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          uniqueSources={uniqueSources}
          uniqueCategories={uniqueCategories}
          onSearch={handleSearch}
          onReset={resetFilters}
        />
      )}

      {/* Результаты поиска */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Поиск товаров...</p>
        </div>
      ) : results.combined && results.combined.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <ProductGrid products={results.combined} />
          ) : (
            <ProductList products={results.combined} />
          )}

          {/* Пагинация */}
          {results.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, results.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(results.totalPages, prev + 1))}
                    className={currentPage === results.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Товары не найдены
          </h3>
          <p className="text-gray-500">
            Попробуйте изменить запрос или фильтры
          </p>
        </div>
      )}

      {/* Статистика */}
      {results.sources && (
        <SearchStatistics
          totalProducts={results.totalProducts || 0}
          totalSources={results.sources.total?.sources || 0}
          executionTime={results.executionTime || 0}
        />
      )}
    </div>
  );
}
