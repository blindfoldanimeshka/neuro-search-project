'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import HeaderNew from '../components/HeaderNew';
import SearchHeader from '../components/SearchHeader';
import { useTheme } from '../hooks/useTheme';

export default function HeaderDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'standard' | 'ai'>('standard');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [showNew, setShowNew] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkTheme, toggleTheme } = useTheme();

  const handleSearch = (query: string) => {
    console.log('Searching for:', query, 'in mode:', searchMode);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleToggleAIChat = () => {
    setIsAIChatOpen(!isAIChatOpen);
    console.log('AI Chat toggled:', !isAIChatOpen);
  };

  const handleOpenAIExcelFiller = () => {
    console.log('Opening AI Excel Filler');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Кнопка переключения */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setShowNew(!showNew)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isDarkTheme 
              ? 'bg-gray-800 hover:bg-gray-700 text-white' 
              : 'bg-white hover:bg-gray-50 text-gray-900 shadow-lg'
          }`}
        >
          {showNew ? 'Показать старый Header' : 'Показать новый Header'}
        </button>
      </div>

      {/* Хедер */}
      {showNew ? (
        <HeaderNew
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          onSearch={handleSearch}
          onToggleAIChat={handleToggleAIChat}
          isAIChatOpen={isAIChatOpen}
          onOpenAIExcelFiller={handleOpenAIExcelFiller}
          searchError={searchError}
          setSearchError={setSearchError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      ) : (
        <>
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
            onToggleAIChat={handleToggleAIChat}
            isAIChatOpen={isAIChatOpen}
          />
          <SearchHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchError={searchError}
            setSearchError={setSearchError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            onSearch={handleSearch}
            isDarkTheme={isDarkTheme}
            toggleTheme={toggleTheme}
            onOpenAIExcelFiller={handleOpenAIExcelFiller}
            onOpenAIChat={handleToggleAIChat}
          />
        </>
      )}

      {/* Контент для демонстрации */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className={`p-6 rounded-lg ${
            isDarkTheme ? 'bg-gray-800' : 'bg-white shadow-lg'
          }`}>
            <h2 className="text-2xl font-bold mb-4">Демонстрация нового Header</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Основные улучшения:</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Визуальное разделение на секции (поиск, AI инструменты, пользовательские действия)</li>
                  <li>Интегрированный селектор режима поиска прямо в строке поиска</li>
                  <li>Анимированные переходы и hover эффекты</li>
                  <li>Группировка AI функций (Excel и Chat) в отдельной секции</li>
                  <li>Улучшенная мобильная версия с выпадающим меню</li>
                  <li>Индикатор загрузки в кнопке поиска</li>
                  <li>Поддержка отображения ошибок поиска</li>
                  <li>Современный дизайн с использованием blur эффектов</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Текущее состояние:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Поисковый запрос:</span>
                    <p className="text-muted-foreground">{searchQuery || 'Пусто'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Режим поиска:</span>
                    <p className="text-muted-foreground">{searchMode === 'ai' ? 'ИИ поиск' : 'Обычный поиск'}</p>
                  </div>
                  <div>
                    <span className="font-medium">AI Chat:</span>
                    <p className="text-muted-foreground">{isAIChatOpen ? 'Открыт' : 'Закрыт'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Тема:</span>
                    <p className="text-muted-foreground">{isDarkTheme ? 'Темная' : 'Светлая'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Chat Demo */}
          {isAIChatOpen && (
            <div className={`p-6 rounded-lg ${
              isDarkTheme ? 'bg-gray-800' : 'bg-white shadow-lg'
            }`}>
              <h3 className="font-semibold mb-4">AI Chat (Demo)</h3>
              <div className={`h-64 rounded-lg ${
                isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'
              } flex items-center justify-center`}>
                <p className="text-muted-foreground">AI Chat интерфейс будет здесь</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}