'use client';

import React, { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  isDarkTheme: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchError?: string | null;
  onSearch?: (query: string) => void;
}

export default function SearchBar({
  isDarkTheme,
  searchQuery,
  setSearchQuery,
  searchError,
  onSearch
}: SearchBarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onSearch?.(searchQuery);
    }
  };

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery);
    }
  };

  return (
    <motion.div 
      className="relative flex-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Поисковая строка */}
      <div className="relative">
        <motion.div
          animate={{ 
            scale: isSearchFocused ? 1.02 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <Search 
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors duration-200 ${
              isSearchFocused 
                ? isDarkTheme ? 'text-blue-400' : 'text-blue-600'
                : isDarkTheme ? 'text-gray-400' : 'text-slate-500'
            }`} 
          />
        </motion.div>
        
        <input
          ref={searchRef}
          type="text"
          placeholder="Поиск товаров..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onKeyDown={handleKeyDown}
          className={`w-full pl-10 pr-20 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
            isDarkTheme
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
              : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-blue-300 focus:border-blue-500'
          }`}
        />

        {/* Кнопка очистки */}
        <AnimatePresence>
          {searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClearSearch}
              className={`absolute right-16 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                isDarkTheme
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
              }`}
              aria-label="Очистить поиск"
            >
              <X size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Кнопка поиска */}
        <motion.button
          onClick={handleSearchClick}
          disabled={!searchQuery.trim()}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            searchQuery.trim()
              ? isDarkTheme
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              : isDarkTheme
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          Найти
        </motion.button>
      </div>

      {searchError && (
        <div className={`mt-2 text-sm ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`}>
          {searchError}
        </div>
      )}
    </motion.div>
  );
} 