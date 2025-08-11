'use client';

import React from 'react';
import { Brain, Globe, FileSpreadsheet, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './SearchBar';

interface SearchHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchError: string | null;
  setSearchError: (error: string | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  searchMode: 'standard' | 'ai';
  setSearchMode: (mode: 'standard' | 'ai') => void;
  onSearch: (query: string) => void;
  isDarkTheme: boolean;
  toggleTheme: () => void;
  onOpenAIExcelFiller: () => void;
  onOpenAIChat?: () => void;
}

export default function SearchHeader({
  searchQuery,
  setSearchQuery,
  searchError,
  setSearchError,
  isLoading,
  setIsLoading,
  searchMode,
  setSearchMode,
  onSearch,
  isDarkTheme,
  toggleTheme,
  onOpenAIExcelFiller,
  onOpenAIChat
}: SearchHeaderProps) {
  
  const handleSearch = (query: string) => {
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className={`p-4 shadow-sm border-b ${
      isDarkTheme 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <SearchBar 
            isDarkTheme={isDarkTheme}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchError={searchError}
            onSearch={handleSearch}
          />
        </div>
        
        {/* Кнопки управления */}
        <div className="ml-4 flex items-center space-x-3">
          {/* Кнопка AI Excel */}
          <motion.button
            onClick={onOpenAIExcelFiller}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkTheme 
                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            title="AI Заполнение Excel"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <FileSpreadsheet className="w-4 h-4" />
            AI Excel
          </motion.button>
          
          {/* Переключатель режима поиска и AI Chat */}
          <div className="flex items-center">
            <span className={`text-sm mr-2 ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>Поиск:</span>
            <div className={`flex rounded-lg p-1 ${
              isDarkTheme ? 'bg-gray-700' : 'bg-slate-200'
            }`}>
              <motion.button
                onClick={() => setSearchMode('standard')}
                className={`flex items-center px-3 py-1 text-sm font-medium transition-colors rounded-md ${
                  searchMode === 'standard'
                    ? isDarkTheme
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-blue-600 shadow-sm'
                    : isDarkTheme
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-slate-600 hover:text-slate-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <Globe className="w-4 h-4 mr-1" />
                Обычный
              </motion.button>
              <motion.button
                onClick={() => setSearchMode('ai')}
                className={`flex items-center px-3 py-1 text-sm font-medium transition-colors rounded-md ${
                  searchMode === 'ai'
                    ? isDarkTheme
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-blue-600 shadow-sm'
                    : isDarkTheme
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-slate-600 hover:text-slate-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
              >
                <Brain className="w-4 h-4 mr-1" />
                ИИ
              </motion.button>
            </div>
          </div>
          <motion.button
            onClick={() => { setSearchMode('ai'); onOpenAIChat?.(); }}
            className={`ml-3 px-3 py-1.5 rounded-md text-sm font-medium ${isDarkTheme ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            AI Chat
          </motion.button>
          
          {/* Переключатель темы */}
          <div className="flex items-center">
            <span className={`text-sm mr-2 ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>Тема:</span>
            <motion.button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDarkTheme
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
              title="Переключить тему"
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.4 }}
            >
              <Moon className="w-4 h-4" />
            </motion.button>
          </div>
          

        </div>
      </div>
    </div>
  );
} 