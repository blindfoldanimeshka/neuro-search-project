'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Product } from './types';

interface ExportSidebarProps {
  selectedProducts: Product[];
  productQuantities: {[key: string]: number};
  onQuantityChange: (productId: string, quantity: number) => void;
  onClearAll: () => void;
}

export default function ExportSidebar({
  selectedProducts,
  productQuantities,
  onQuantityChange,
  onClearAll
}: ExportSidebarProps) {
  const isDarkTheme = document.documentElement.classList.contains('dark');
  const totalItems = selectedProducts.reduce((sum, item) => sum + (productQuantities[item.id] || 1), 0);

  const handleExportToExcel = () => {
    if (!selectedProducts || selectedProducts.length === 0) return;

    // Подготовка данных для экспорта
    const exportData = selectedProducts.map(product => ({
      'Название': product.name,
      'Цена': product.price,
      'Количество': productQuantities[product.id] || 1,
      'Сумма': product.price * (productQuantities[product.id] || 1),
      'Категория': product.category || '-',
      'Подкатегория': product.subcategory || '-',
      'Год': product.year || '-'
    }));

    // Создание книги Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Товары');

    // Сохранение файла
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `products_export_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <motion.div 
      className={`p-3 shadow-sm border ${
        isDarkTheme 
          ? 'bg-card-bg border-card-border' 
          : 'bg-card-bg border-card-border'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div 
        className="flex items-center mb-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
        >
          <Download className={`mr-2 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`} size={16} />
        </motion.div>
        <h2 className={`text-base font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-700'}`}>Экспорт</h2>
      </motion.div>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center">
          <Download className={`mx-auto mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-slate-400'}`} size={24} />
          <p className={`text-xs mb-3 ${isDarkTheme ? 'text-gray-400' : 'text-slate-600'}`}>
            Экспорт выбранных товаров
          </p>
          
          <motion.button
            onClick={handleExportToExcel}
            disabled={!selectedProducts || selectedProducts.length === 0}
            className={`w-full py-2 px-3 font-medium text-xs transition-colors duration-200 flex items-center justify-center ${
              !selectedProducts || selectedProducts.length === 0
                ? isDarkTheme 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isDarkTheme 
                  ? 'bg-green-800 hover:bg-green-700 text-green-300' 
                  : 'bg-green-100 hover:bg-green-200 text-green-700'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Экспорт в Excel ({totalItems})
          </motion.button>
          
          <AnimatePresence>
            {selectedProducts && selectedProducts.length > 0 && (
              <motion.button
                onClick={onClearAll}
                className={`w-full mt-2 py-2 px-3 font-medium text-xs transition-colors duration-200 ${
                  isDarkTheme 
                    ? 'bg-red-800 hover:bg-red-700 text-red-300' 
                    : 'bg-red-100 hover:bg-red-200 text-red-700'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Очистить все
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
} 