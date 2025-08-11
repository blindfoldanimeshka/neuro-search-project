'use client';

import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import AIChatSidebarWithModels from '../components/AIChatSidebarWithModels';
import { Product, Filters } from '../components/types';

export default function AIChatTestPage() {
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
        <h1 className="text-2xl font-bold mb-4">Тест AI Помощника с Нейропарсером</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Основная область */}
          <div className="lg:col-span-2">
            <div className={`p-4 rounded-lg border ${
              isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className="text-lg font-semibold mb-4">Основная область</h2>
              <p className="text-sm mb-4">
                Здесь будет основная функциональность приложения. 
                Сейчас тестируем новый сайдбар с ИИ чатом и нейропарсером.
              </p>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Выбрано товаров:</strong> {selectedProducts.length}
                </div>
                <div className="text-sm">
                  <strong>Найдено товаров:</strong> {filteredProducts.length}
                </div>
                <div className="text-sm">
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
        <div className={`mt-6 p-4 rounded-lg border ${
          isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold mb-3">Инструкции по тестированию</h3>
          <div className="space-y-2 text-sm">
            <p><strong>1. Обычный ИИ чат:</strong> Задайте любой вопрос, например "Помоги с категоризацией товаров"</p>
            <p><strong>2. Поиск товаров:</strong> Используйте фразы типа "Найди смартфоны", "Покажи ноутбуки"</p>
            <p><strong>3. Выбор модели:</strong> Нажмите на иконку настроек и выберите другую модель ИИ</p>
            <p><strong>4. Нейропарсер:</strong> Автоматически запускается при поисковых запросах</p>
          </div>
        </div>
      </div>
    </div>
  );
}
