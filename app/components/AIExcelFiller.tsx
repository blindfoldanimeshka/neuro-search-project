'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, Brain, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { saveAs } from 'file-saver';

interface AIExcelFillerProps {
  isDarkTheme: boolean;
  onClose?: () => void;
}

interface ExcelFillResult {
  success: boolean;
  fileContent?: string;
  fileName?: string;
  message?: string;
  error?: string;
  changes?: Array<{
    sheet: string;
    cell: string;
    oldValue: string;
    newValue: string;
    reasoning: string;
  }>;
}

export default function AIExcelFiller({ isDarkTheme, onClose }: AIExcelFillerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExcelFillResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const placeholderText = "Опишите, как заполнить файл. Например: 'Заполни колонку \"Название товара\" реалистичными названиями электроники, а колонку \"Цена\" ценами от 1000 до 50000 рублей'";

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          droppedFile.type === 'application/vnd.ms-excel') {
        setFile(droppedFile);
      } else {
        alert('Пожалуйста, загрузите Excel файл (.xlsx или .xls)');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.type === 'application/vnd.ms-excel') {
        setFile(selectedFile);
      } else {
        alert('Пожалуйста, выберите Excel файл (.xlsx или .xls)');
      }
    }
  };

  const handleFillExcel = async () => {
    if (!file) {
      alert('Пожалуйста, выберите файл');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Читаем файл как Base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const response = await fetch('/api/ai-excel-fill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent: base64,
          fileName: file.name,
          instructions: instructions,
          model: 'qwen/qwen3-4b'
        }),
      });

      const result: ExcelFillResult = await response.json();

      if (result.success) {
        setResult(result);
        alert(result.message || 'Файл успешно заполнен!');
      } else {
        setResult(result);
        alert(`Ошибка: ${result.error}`);
      }
    } catch (error) {
      console.error('Error filling Excel:', error);
      setResult({
        success: false,
        error: 'Ошибка при заполнении файла'
      });
      alert('Произошла ошибка при заполнении файла');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (result?.fileContent) {
      const binaryString = atob(result.fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, result.fileName || 'filled_file.xlsx');
    }
  };

  const clearAll = () => {
    setFile(null);
    setInstructions('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`p-6 rounded-lg border ${
      isDarkTheme 
        ? 'bg-gray-800 border-gray-600' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className={`w-6 h-6 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            AI Заполнение Excel
          </h2>
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Qwen3-4B
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkTheme 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="w-5 h-5">✕</div>
          </button>
        )}
      </div>

      {/* Загрузка файла */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-2 ${
          isDarkTheme ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Выберите Excel файл
        </label>
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? isDarkTheme 
                ? 'border-blue-400 bg-blue-900/20' 
                : 'border-blue-400 bg-blue-50'
              : isDarkTheme 
                ? 'border-gray-600 hover:border-gray-500' 
                : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className={`w-8 h-8 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`} />
              <div className="text-left">
                <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  {file.name}
                </p>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={clearAll}
                className={`p-1 rounded-full hover:bg-red-100 ${
                  isDarkTheme ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className={`mx-auto mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                Перетащите Excel файл сюда или{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`underline hover:no-underline ${
                    isDarkTheme ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                  }`}
                >
                  выберите файл
                </button>
              </p>
              <p className={`text-xs mt-1 ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                Поддерживаемые форматы: .xlsx, .xls
              </p>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Инструкции */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-2 ${
          isDarkTheme ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Инструкции для заполнения
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={placeholderText}
          className={`w-full p-3 rounded-lg border resize-none ${
            isDarkTheme 
              ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' 
              : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          rows={4}
        />
      </div>

      {/* Кнопка заполнения */}
      <div className="mb-6">
        <button
          onClick={handleFillExcel}
          disabled={!file || isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            !file || isLoading
              ? isDarkTheme 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : isDarkTheme 
                ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Заполняю файл...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Заполнить с помощью AI
            </>
          )}
        </button>
      </div>

      {/* Результат */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            result.success
              ? isDarkTheme 
                ? 'bg-green-900/20 border-green-600' 
                : 'bg-green-50 border-green-200'
              : isDarkTheme 
                ? 'bg-red-900/20 border-red-600' 
                : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={`font-medium ${
              result.success 
                ? isDarkTheme ? 'text-green-400' : 'text-green-700'
                : isDarkTheme ? 'text-red-400' : 'text-red-700'
            }`}>
              {result.success ? 'Успешно заполнено' : 'Ошибка'}
            </span>
          </div>
          
          {result.message && (
            <p className={`text-sm mb-3 ${
              isDarkTheme ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {result.message}
            </p>
          )}

          {result.changes && result.changes.length > 0 && (
            <div className="mb-3">
              <p className={`text-sm font-medium mb-2 ${
                isDarkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Внесенные изменения:
              </p>
              <div className={`max-h-32 overflow-y-auto rounded ${
                isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {result.changes.map((change, index) => (
                  <div key={index} className={`p-2 border-b ${
                    isDarkTheme ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                    <p className={`text-xs font-medium ${
                      isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {change.sheet} - {change.cell}
                    </p>
                    <p className={`text-xs ${
                      isDarkTheme ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {change.newValue}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.error && (
            <p className={`text-sm ${
              isDarkTheme ? 'text-red-400' : 'text-red-600'
            }`}>
              {result.error}
            </p>
          )}

          {result.success && result.fileContent && (
            <button
              onClick={handleDownload}
              className={`mt-3 w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                isDarkTheme 
                  ? 'bg-green-600 hover:bg-green-500 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              Скачать заполненный файл
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
