'use client';

import React from 'react';
import { Filter, Calendar, DollarSign, Tag, Plus } from 'lucide-react';
import { Range } from 'react-range';
import { motion, AnimatePresence } from 'framer-motion';
import { Filters } from './types';

interface FilterSidebarProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  customCategories: string[];
  setCustomCategories: (categories: string[]) => void;
  customSubcategories: string[];
  setCustomSubcategories: (subcategories: string[]) => void;
  onCategorySearch?: (query: string) => void;
}

export default function FilterSidebar({
  filters,
  setFilters,
  customCategories,
  setCustomCategories,
  customSubcategories,
  setCustomSubcategories,
  onCategorySearch
}: FilterSidebarProps) {
  const isDarkTheme = document.documentElement.classList.contains('dark');
  const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const
      }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <motion.div 
      className={`p-3 shadow-sm border flex-1 ${
        isDarkTheme 
          ? 'bg-card-bg border-card-border' 
          : 'bg-card-bg border-card-border'
      }`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex items-center mb-3"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
        >
          <Filter className={`mr-2 ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`} size={16} />
        </motion.div>
        <h2 className={`text-base font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-700'}`}>Фильтры</h2>
      </motion.div>

      <div className="space-y-3">
        {/* Год */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center mb-2">
            <Calendar className={`mr-1 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`} size={14} />
            <label className={`text-xs font-medium ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>Год</label>
          </div>
          <div className="space-y-2">
            <motion.div 
              className="flex justify-between text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className={`${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>{filters.yearFrom}</span>
              <span className={`${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>{filters.yearTo}</span>
            </motion.div>
            
            <div className="px-1">
              <Range
                step={1}
                min={2010}
                max={2024}
                values={[filters.yearFrom, filters.yearTo]}
                onChange={(values) => {
                  setFilters({ 
                    ...filters, 
                    yearFrom: values[0], 
                    yearTo: values[1] 
                  });
                }}
                renderTrack={({ props, children }) => (
                  <div
                    {...props}
                    className={`h-1.5 w-full relative ${
                      isDarkTheme ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                    style={{
                      ...props.style,
                      height: '6px'
                    }}
                  >
                    <div
                      className={`h-full absolute top-0 ${
                        isDarkTheme ? 'bg-blue-500' : 'bg-blue-400'
                      }`}
                      style={{
                        left: `${((filters.yearFrom - 2010) / (2024 - 2010)) * 100}%`,
                        width: `${((filters.yearTo - filters.yearFrom) / (2024 - 2010)) * 100}%`
                      }}
                    />
                    {children}
                  </div>
                )}
                renderThumb={({ props }) => {
                  const { key, ...thumbProps } = props;
                  return (
                    <div
                      key={key}
                      {...thumbProps}
                      className={`w-4 h-4 border-2 shadow-lg ${
                        isDarkTheme 
                          ? 'bg-white border-blue-500' 
                          : 'bg-white border-blue-400'
                      }`}
                      style={{
                        ...thumbProps.style,
                        cursor: 'grab'
                      }}
                    />
                  );
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Цена */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center mb-2">
            <DollarSign className={`mr-1 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`} size={14} />
            <label className={`text-xs font-medium ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>Цена (₽)</label>
          </div>
          <div className="space-y-2">
            <motion.div 
              className="flex justify-between text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className={`${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>{filters.priceFrom.toLocaleString()} ₽</span>
              <span className={`${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>{filters.priceTo.toLocaleString()} ₽</span>
            </motion.div>
            
            <div className="px-1">
              <Range
                step={1000}
                min={0}
                max={10000000}
                values={[filters.priceFrom, filters.priceTo]}
                onChange={(values) => {
                  setFilters({ 
                    ...filters, 
                    priceFrom: values[0], 
                    priceTo: values[1] 
                  });
                }}
                renderTrack={({ props, children }) => (
                  <div
                    {...props}
                    className={`h-1.5 w-full rounded-full relative ${
                      isDarkTheme ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                    style={{
                      ...props.style,
                      height: '6px'
                    }}
                  >
                    <div
                      className={`h-full rounded-full absolute top-0 ${
                        isDarkTheme ? 'bg-green-500' : 'bg-green-400'
                      }`}
                      style={{
                        left: `${(filters.priceFrom / 10000000) * 100}%`,
                        width: `${((filters.priceTo - filters.priceFrom) / 10000000) * 100}%`
                      }}
                    />
                    {children}
                  </div>
                )}
                renderThumb={({ props }) => {
                  const { key, ...thumbProps } = props;
                  return (
                    <div
                      key={key}
                      {...thumbProps}
                      className={`w-4 h-4 rounded-full border-2 shadow-lg ${
                        isDarkTheme 
                          ? 'bg-green-500 border-green-400' 
                          : 'bg-green-500 border-white'
                      }`}
                      style={{
                        ...thumbProps.style,
                        height: '16px',
                        width: '16px'
                      }}
                    />
                  );
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Категория */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Tag className={`mr-1 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`} size={14} />
              <label className={`text-xs font-medium ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>Категория</label>
            </div>
            <motion.button
              onClick={() => {
                const newCategory = prompt('Введите название новой категории:');
                if (newCategory && newCategory.trim()) {
                  const category = newCategory.trim().toLowerCase();
                  if (!customCategories.includes(category)) {
                    setCustomCategories([...customCategories, category]);
                    setFilters({ ...filters, category });
                  }
                }
              }}
              className={`p-1 rounded text-xs transition-colors ${
                isDarkTheme 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Plus className="w-3 h-3" />
            </motion.button>
          </div>
          
          <div className="space-y-1">
            <AnimatePresence>
              {/* Опция "Все категории" */}
              <motion.button
                onClick={() => setFilters({ ...filters, category: '' })}
                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                  !filters.category
                    ? isDarkTheme
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDarkTheme
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Все категории
              </motion.button>
              
              {/* Пользовательские категории */}
              {customCategories.map((category, index) => (
                <motion.button
                  key={category}
                  onClick={() => setFilters({ ...filters, category })}
                  className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                    filters.category === category
                      ? isDarkTheme
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDarkTheme
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {category}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Подкатегория */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Tag className={`mr-1 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`} size={14} />
              <label className={`text-xs font-medium ${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>Подкатегория</label>
            </div>
            <motion.button
              onClick={() => {
                const newSubcategory = prompt('Введите название новой подкатегории:');
                if (newSubcategory && newSubcategory.trim()) {
                  const subcategory = newSubcategory.trim().toLowerCase();
                  if (!customSubcategories.includes(subcategory)) {
                    setCustomSubcategories([...customSubcategories, subcategory]);
                    setFilters({ ...filters, subcategory });
                  }
                }
              }}
              className={`p-1 rounded text-xs transition-colors ${
                isDarkTheme 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Plus className="w-3 h-3" />
            </motion.button>
          </div>
          
          <div className="space-y-1">
            <AnimatePresence>
              {/* Опция "Все подкатегории" */}
              <motion.button
                onClick={() => setFilters({ ...filters, subcategory: '' })}
                className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                  !filters.subcategory
                    ? isDarkTheme
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-500 text-white'
                    : isDarkTheme
                    ? 'text-gray-300 hover:bg-gray-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Все подкатегории
              </motion.button>
              
              {/* Пользовательские подкатегории */}
              {customSubcategories.map((subcategory, index) => (
                <motion.button
                  key={subcategory}
                  onClick={() => setFilters({ ...filters, subcategory })}
                  className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                    filters.subcategory === subcategory
                      ? isDarkTheme
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-500 text-white'
                      : isDarkTheme
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {subcategory}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Сброс фильтров */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
        >
          <motion.button
            onClick={() => {
              setFilters({
                yearFrom: 2010,
                yearTo: 2024,
                priceFrom: 0,
                priceTo: 10000000,
                category: '',
                subcategory: ''
              });
            }}
            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              isDarkTheme
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Сбросить фильтры
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
} 