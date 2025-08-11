'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Menu, 
  Moon, 
  Sun, 
  Bot, 
  Brain, 
  Globe, 
  FileSpreadsheet,
  X,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  searchMode?: 'standard' | 'ai';
  setSearchMode?: (mode: 'standard' | 'ai') => void;
  onToggleAIChat?: () => void;
  isAIChatOpen?: boolean;
  onOpenAIExcelFiller?: () => void;
  searchError?: string | null;
  setSearchError?: (error: string | null) => void;
  isLoading?: boolean;
  setIsLoading?: (loading: boolean) => void;
}

export default function HeaderNew({ 
  onSearch, 
  searchQuery = '', 
  setSearchQuery,
  searchMode = 'standard',
  setSearchMode,
  onToggleAIChat, 
  isAIChatOpen = false,
  onOpenAIExcelFiller,
  searchError,
  setSearchError,
  isLoading = false,
  setIsLoading
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const { isDarkTheme, toggleTheme } = useTheme();
  const searchOptionsRef = React.useRef<HTMLDivElement>(null);

  // Закрытие выпадающего меню при клике вне его
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchOptionsRef.current && !searchOptionsRef.current.contains(event.target as Node)) {
        setShowSearchOptions(false);
      }
    };

    if (showSearchOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchOptions]);

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-50 w-full border-b ${
        isDarkTheme 
          ? 'bg-gray-900/95 border-gray-800' 
          : 'bg-white/95 border-gray-200'
      } backdrop-blur-md shadow-sm`}>
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Логотип */}
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
            </motion.div>

            {/* Центральная секция - Поиск */}
            <motion.div 
              className="hidden md:flex flex-1 max-w-3xl mx-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className={`relative w-full rounded-xl overflow-hidden ${
                isDarkTheme 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-gray-50 border border-gray-200'
              } shadow-sm`} ref={searchOptionsRef}>
                {/* Селектор режима поиска внутри поисковой строки */}
                <div className="flex items-center">
                  <button
                    onClick={() => setShowSearchOptions(!showSearchOptions)}
                    className={`flex items-center gap-2 px-4 py-3 border-r ${
                      isDarkTheme 
                        ? 'border-gray-700 hover:bg-gray-700' 
                        : 'border-gray-200 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    {searchMode === 'ai' ? (
                      <>
                        <Brain className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium">ИИ</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">Обычный</span>
                      </>
                    )}
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>

                  {/* Поисковое поле */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={searchMode === 'ai' ? "Опишите, что вы ищете..." : "Поиск товаров..."}
                      className={`pl-10 pr-4 py-3 w-full border-0 focus:ring-0 ${
                        isDarkTheme ? 'bg-transparent text-white' : 'bg-transparent'
                      }`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery?.(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>

                  {/* Кнопка поиска */}
                  <Button 
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || isLoading}
                    className={`mx-2 px-6 ${
                      searchMode === 'ai' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                    size="sm"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Найти'
                    )}
                  </Button>
                </div>

                {/* Выпадающие опции режима поиска */}
                <AnimatePresence>
                  {showSearchOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute left-0 top-full mt-1 w-48 rounded-lg overflow-hidden shadow-lg ${
                        isDarkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSearchMode?.('standard');
                          setShowSearchOptions(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-opacity-10 hover:bg-blue-500 transition-colors ${
                          searchMode === 'standard' ? 'bg-blue-500/10' : ''
                        }`}
                      >
                        <Globe className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Обычный поиск</span>
                      </button>
                      <button
                        onClick={() => {
                          setSearchMode?.('ai');
                          setShowSearchOptions(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-opacity-10 hover:bg-purple-500 transition-colors ${
                          searchMode === 'ai' ? 'bg-purple-500/10' : ''
                        }`}
                      >
                        <Brain className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">ИИ поиск</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Правая секция - Действия */}
            <motion.div 
              className="hidden md:flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {/* AI секция */}
              <div className={`flex items-center gap-2 p-1 rounded-lg ${
                isDarkTheme ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenAIExcelFiller?.()}
                  className="gap-2"
                  title="Открыть AI заполнение Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-sm">AI Excel</span>
                </Button>
                <div className={`w-px h-6 ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-300'}`} />
                <Button
                  variant={isAIChatOpen ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onToggleAIChat?.()}
                  className={`gap-2 ${
                    isAIChatOpen 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : ''
                  }`}
                  title={isAIChatOpen ? 'Закрыть AI чат' : 'Открыть AI чат'}
                >
                  <Bot className="w-4 h-4" />
                  <span className="text-sm">AI Chat</span>
                </Button>
              </div>

              {/* Кнопка смены темы */}
              <div className={`flex items-center p-1 rounded-lg ${
                isDarkTheme ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleTheme}
                  className="gap-2"
                  title={isDarkTheme ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
                >
                  <motion.div
                    animate={{ rotate: isDarkTheme ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isDarkTheme ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4" />}
                  </motion.div>
                  <span className="text-sm">{isDarkTheme ? 'Светлая' : 'Темная'}</span>
                </Button>
              </div>
            </motion.div>

            {/* Мобильное меню */}
            <div className="md:hidden flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
              >
                {isDarkTheme ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Индикатор ошибки */}
        <AnimatePresence>
          {searchError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-red-500/20"
            >
              <div className="container mx-auto px-4 py-2">
                <p className="text-sm text-red-500">{searchError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Мобильное меню */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`md:hidden fixed inset-x-0 top-16 z-40 ${
              isDarkTheme 
                ? 'bg-gray-900/95 border-b border-gray-800' 
                : 'bg-white/95 border-b border-gray-200'
            } backdrop-blur-md shadow-lg`}
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Мобильный поиск */}
              <div className={`rounded-lg overflow-hidden ${
                isDarkTheme 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex gap-2 p-2">
                  <button
                    onClick={() => setSearchMode?.('standard')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                      searchMode === 'standard'
                        ? 'bg-blue-500 text-white'
                        : isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    Обычный
                  </button>
                  <button
                    onClick={() => setSearchMode?.('ai')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                      searchMode === 'ai'
                        ? 'bg-purple-500 text-white'
                        : isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <Brain className="w-4 h-4" />
                    ИИ
                  </button>
                </div>
                <div className="relative p-2 pt-0">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={searchMode === 'ai' ? "Опишите, что вы ищете..." : "Поиск товаров..."}
                    className="pl-10 pr-20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery?.(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || isLoading}
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 h-8 px-3 text-sm ${
                      searchMode === 'ai' 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    size="sm"
                  >
                    Найти
                  </Button>
                </div>
              </div>

              {/* Мобильные действия */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    onOpenAIExcelFiller?.();
                    setIsMenuOpen(false);
                  }}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  AI Excel
                </Button>
                <Button
                  variant={isAIChatOpen ? "default" : "outline"}
                  className={`w-full justify-start gap-2 ${
                    isAIChatOpen ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''
                  }`}
                  onClick={() => {
                    onToggleAIChat?.();
                    setIsMenuOpen(false);
                  }}
                >
                  <Bot className="w-4 h-4" />
                  AI Chat
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}