'use client';

import { Brain, Globe, Clock, Database } from 'lucide-react';
import { ExternalProduct } from '../lib/external-apis';

interface AISearchResult {
  query: string;
  searchUrls: string[];
  products: ExternalProduct[];
  searchTime: number;
  indexedCount: number;
}

interface AISearchInfoProps {
  result: AISearchResult | null;
  isDarkTheme: boolean;
}

export default function AISearchInfo({ result, isDarkTheme }: AISearchInfoProps) {
  if (!result) return null;

  return (
    <div className={`p-4 border ${
      isDarkTheme 
        ? 'bg-blue-900/20 border-blue-700 text-blue-300' 
        : 'bg-blue-50 border-blue-200 text-blue-700'
    }`}>
      <div className="flex items-center mb-3">
        <Brain className="w-5 h-5 mr-2" />
        <h3 className="font-medium">ИИ-поиск завершен</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center">
          <Globe className="w-4 h-4 mr-2" />
          <span>Проанализировано сайтов: {result.indexedCount}</span>
        </div>
        
        <div className="flex items-center">
          <Database className="w-4 h-4 mr-2" />
          <span>Найдено товаров: {result.products.length}</span>
        </div>
        
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          <span>Время поиска: {result.searchTime}мс</span>
        </div>
        
        <div className="flex items-center">
          <span>Запрос: &quot;{result.query}&quot;</span>
        </div>
      </div>
      
      {result.searchUrls.length > 0 && (
        <div className="mt-3">
          <h4 className="text-xs font-medium mb-2">Проанализированные источники:</h4>
          <div className="flex flex-wrap gap-1">
            {result.searchUrls.slice(0, 5).map((url, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs ${
                  isDarkTheme 
                    ? 'bg-blue-800/50 text-blue-200' 
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {new URL(url).hostname}
              </span>
            ))}
            {result.searchUrls.length > 5 && (
              <span className={`px-2 py-1 text-xs ${
                isDarkTheme 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                +{result.searchUrls.length - 5} еще
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 