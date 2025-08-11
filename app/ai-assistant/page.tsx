'use client';

import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import AIChatSidebarWithModels from '../components/AIChatSidebarWithModels';
import { Product, Filters } from '../components/types';

export default function AIAssistantPage() {
  const { isDarkTheme } = useTheme();
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<Filters>({
    yearFrom: 2020,
    yearTo: 2024,
    priceFrom: 0,
    priceTo: 10000000,
    category: '',
    subcategory: ''
  });

  const handleProductsFound = (products: any[]) => {
    console.log('Найдены товары:', products);
    // Здесь можно добавить логику для обработки найденных товаров
  };

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            🤖 ИИ Помощник с Нейропарсером
          </h1>
          <p className="text-lg max-w-2xl mx-auto">
            Интеллектуальный помощник, который находит товары на маркетплейсах, 
            анализирует цены и дает рекомендации по выбору
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основная область */}
          <div className="lg:col-span-2">
            <div className={`p-6 rounded-lg border ${
              isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className="text-xl font-semibold mb-4">Основная область</h2>
              <p className="mb-4">
                Здесь будет основная функциональность приложения. 
                Сейчас тестируем новый сайдбар с ИИ чатом и нейропарсером.
              </p>
              
              <div className="space-y-2">
                <div>
                  <strong>Выбрано товаров:</strong> {selectedProducts.length}
                </div>
                <div>
                  <strong>Найдено товаров:</strong> {filteredProducts.length}
                </div>
                <div>
                  <strong>Фильтры:</strong> {JSON.stringify(filters)}
                </div>
              </div>
            </div>
          </div>

          {/* AI Сайдбар */}
          <div className="lg:col-span-1">
            <div className="h-[600px]">
              <AIChatSidebarWithModels
                isDarkTheme={isDarkTheme}
                selectedProducts={selectedProducts}
                filteredProducts={filteredProducts}
                filters={filters}
                onProductsFound={handleProductsFound}
              />
            </div>
          </div>
        </div>

        {/* Инструкции */}
        <div className={`mt-8 p-6 rounded-lg border ${
          isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-xl font-semibold mb-4">Инструкции по использованию</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🔍 Поиск товаров</h4>
              <ul className="space-y-1 text-sm">
                <li>• "Найди смартфоны"</li>
                <li>• "Покажи ноутбуки для работы"</li>
                <li>• "Ищу кроссовки"</li>
                <li>• "Найди товары для дома"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🤖 ИИ помощник</h4>
              <ul className="space-y-1 text-sm">
                <li>• "Помоги с категоризацией"</li>
                <li>• "Анализируй выбранные товары"</li>
                <li>• "Предложи похожие товары"</li>
                <li>• "Сравни цены на площадках"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
