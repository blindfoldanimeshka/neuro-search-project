'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useAISearch } from '../hooks/useAISearch';
import { useTheme } from '../hooks/useTheme';
import { useProductManagement } from '../hooks/useProductManagement';
import { Filters } from './types';
import { ExternalProduct } from '../lib/external-apis';
import HeaderNew from './HeaderNew';
import ProductGrid from './ProductGrid';

// Ленивая загрузка тяжелых компонентов
const FilterSidebar = lazy(() => import('./FilterSidebar'));
const ExportSidebar = lazy(() => import('./ExportSidebar'));
const AIChatSidebarWithModels = lazy(() => import('./AIChatSidebarWithModels'));
const CategorySearchResults = lazy(() => import('./CategorySearchResults'));
const AIExcelFiller = lazy(() => import('./AIExcelFiller'));

// Ленивая загрузка framer-motion
const motion = lazy(() => import('framer-motion').then(mod => ({ default: mod.motion })));
const AnimatePresence = lazy(() => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })));

// Компонент загрузки для ленивых компонентов
const ComponentLoader = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function ProductSearchApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'standard' | 'ai'>('standard');
  const [isAIChatOpen, setIsAIChatOpen] = useState(true);
  const [isAIExcelFillerOpen, setIsAIExcelFillerOpen] = useState(false);
  const [panelSizes, setPanelSizes] = useState({ main: 70, chat: 30 });
  const [showCategoryResults, setShowCategoryResults] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [externalProducts, setExternalProducts] = useState<ExternalProduct[]>([]);
  const [filters, setFilters] = useState<Filters>({
    yearFrom: 2020,
    yearTo: 2024,
    priceFrom: 0,
    priceTo: 10000000,
    category: '',
    subcategory: ''
  });
  
  const {
    selectedProducts,
    productQuantities,
    filteredProducts,
    customCategories,
    setCustomCategories,
    customSubcategories,
    setCustomSubcategories,
    addToTable,
    setQuantity,
    clearAll
  } = useProductManagement();
  
  const { isDarkTheme, isThemeLoaded, toggleTheme } = useTheme();
  const { searchWithAI, isLoading: isAISearchLoading, error: aiSearchError, lastResult: aiSearchResult } = useAISearch();

  // Загрузка сохраненных размеров панелей
  useEffect(() => {
    const savedSizes = localStorage.getItem('panelSizes');
    if (savedSizes) {
      try {
        setPanelSizes(JSON.parse(savedSizes));
      } catch (error) {
        console.error('Ошибка при загрузке размеров панелей:', error);
      }
    }
  }, []);

  // Сохранение размеров панелей
  const handlePanelSizesChange = (sizes: number[]) => {
    if (sizes.length >= 2) {
      const newSizes = { main: sizes[0], chat: sizes[1] };
      setPanelSizes(newSizes);
      localStorage.setItem('panelSizes', JSON.stringify(newSizes));
    }
  };

  // Обработчик обычного поиска
  const handleStandardSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setSearchError(null);
    
    try {
      const response = await fetch('/api/search-external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: query.trim(),
          filters: {
            minPrice: filters.priceFrom,
            maxPrice: filters.priceTo,
            category: filters.category
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при поиске товаров');
      }

      const data = await response.json();
      setExternalProducts(data.products || []);
    } catch (error) {
      console.error('Ошибка при поиске:', error);
      setSearchError('Произошла ошибка при поиске товаров');
      setExternalProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик AI поиска
  const handleAISearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setSearchError(null);
    
    try {
      const result = await searchWithAI(query, filters);
      if (result) {
        setExternalProducts(result.products || []);
      }
    } catch (error) {
      console.error('Ошибка при AI поиске:', error);
      setSearchError('Произошла ошибка при AI поиске товаров');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (searchMode === 'ai') {
      await handleAISearch(query);
    } else {
      await handleStandardSearch(query);
    }
  };

  const handleCategorySearch = (query: string) => {
    setCategorySearchQuery(query);
    setShowCategoryResults(true);
  };

  const handleCloseCategoryResults = () => {
    setShowCategoryResults(false);
    setCategorySearchQuery('');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      <HeaderNew
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        onToggleAIChat={() => setIsAIChatOpen(!isAIChatOpen)}
        isAIChatOpen={isAIChatOpen}
        onOpenAIExcelFiller={() => setIsAIExcelFillerOpen(!isAIExcelFillerOpen)}
        searchError={searchError}
        setSearchError={setSearchError}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />

      <div className="flex-1 overflow-hidden">
        <PanelGroup 
          direction="horizontal" 
          onLayout={handlePanelSizesChange}
          style={{ height: '100%' }}
        >
          <Panel defaultSize={panelSizes.main} minSize={30}>
            <div className="flex h-full gap-2 p-2">
              {/* Левый сайдбар - Фильтры */}
              <div className="w-64 flex-shrink-0">
                <Suspense fallback={<ComponentLoader />}>
                  <FilterSidebar
                    filters={filters}
                    setFilters={setFilters}
                    customCategories={customCategories}
                    setCustomCategories={setCustomCategories}
                    customSubcategories={customSubcategories}
                    setCustomSubcategories={setCustomSubcategories}
                    onCategorySearch={handleCategorySearch}
                  />
                </Suspense>
              </div>

              {/* Центральная часть - Товары */}
              <div className="flex-1 flex flex-col min-w-0">
                {searchError && (
                  <div className="mb-2">
                    <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                      {searchError}
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-hidden">
                  <ProductGrid
                    isDarkTheme={isDarkTheme}
                    filteredProducts={filteredProducts}
                    selectedProducts={selectedProducts}
                    productQuantities={productQuantities}
                    addToTable={addToTable}
                    setQuantity={setQuantity}
                    isLoading={isLoading}
                    isAISearchLoading={isAISearchLoading}
                    searchMode={searchMode}
                    searchQuery={searchQuery}
                    aiSearchError={aiSearchError}
                    externalProducts={externalProducts}
                  />
                </div>
              </div>

              {/* Правый сайдбар - Экспорт */}
              <div className="w-64 flex-shrink-0">
                <Suspense fallback={<ComponentLoader />}>
                  <ExportSidebar
                    selectedProducts={selectedProducts}
                    productQuantities={productQuantities}
                    onQuantityChange={setQuantity}
                    onClearAll={clearAll}
                  />
                </Suspense>
              </div>
            </div>
          </Panel>

          {isAIChatOpen && (
            <>
              <PanelResizeHandle className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors cursor-col-resize" />
              <Panel defaultSize={panelSizes.chat} minSize={20}>
                <Suspense fallback={<ComponentLoader />}>
                  <AIChatSidebarWithModels
                    isDarkTheme={isDarkTheme}
                    selectedProducts={selectedProducts}
                    filteredProducts={filteredProducts}
                    filters={filters}
                    onProductsFound={addToTable}
                  />
                </Suspense>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      <AnimatePresence>
        {showCategoryResults && (
          <Suspense fallback={<ComponentLoader />}>
            <CategorySearchResults
              searchQuery={categorySearchQuery}
              onClose={handleCloseCategoryResults}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAIExcelFillerOpen && (
          <Suspense fallback={<ComponentLoader />}>
            <AIExcelFiller
              isOpen={isAIExcelFillerOpen}
              onClose={() => setIsAIExcelFillerOpen(false)}
              isDarkTheme={isDarkTheme}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}