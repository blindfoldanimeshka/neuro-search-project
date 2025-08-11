'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Brain, Bot, Send } from 'lucide-react';
import { useAI } from '../hooks/useAI';
import { Product, Filters, AIMessage } from './types';

interface AIChatSidebarProps {
  isDarkTheme: boolean;
  selectedProducts: Product[];
  filteredProducts: Product[];
  filters: Filters;
}

export default function AIChatSidebar({
  isDarkTheme,
  selectedProducts,
  filteredProducts,
  filters
}: AIChatSidebarProps) {
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInputMessage, setAiInputMessage] = useState('');
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  // Создаем контекст для AI
  const aiContext = `
    Пользователь работает с системой поиска товаров.
    Выбрано товаров: ${selectedProducts?.length || 0}
    Найдено товаров: ${filteredProducts?.length || 0}
    Текущие фильтры: ${JSON.stringify(filters || {})}
    
    ДОПОЛНИТЕЛЬНЫЕ ВОЗМОЖНОСТИ:
    - Поиск товаров в интернете (Wildberries, Ozon, Авито, Яндекс.Маркет)
    - Анализ цен и сравнение между площадками
    - Рекомендации по покупкам
    - Помощь с госзакупками
    - Поиск по описанию товаров
  `;

  const { sendMessage: sendAIMessage, isLoading: isAILoading } = useAI({ context: aiContext });

  const scrollToBottom = () => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages]);

  const handleSendAIMessage = async () => {
    if (!aiInputMessage.trim() || isAILoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: aiInputMessage,
      timestamp: new Date(),
    };

    setAiMessages(prev => [...prev, userMessage]);
    setAiInputMessage('');

    try {
      const response = await sendAIMessage(aiInputMessage);
      
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setAiMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Извините, произошла ошибка при обработке вашего запроса. Попробуйте еще раз.',
        timestamp: new Date(),
      };

      setAiMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleAIKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAIMessage();
    }
  };

  const clearAIChat = () => {
    setAiMessages([]);
  };

  const suggestedQuestions = [
    'Помоги найти товары по описанию',
    'Какие товары популярны в этой категории?',
    'Анализируй выбранные товары',
    'Предложи похожие товары',
    'Помоги с категоризацией',
    'Найди товары в интернете',
    'Сравни цены на площадках',
    'Помоги с госзакупками',
    'Рекомендуй лучшие предложения',
    'Анализируй рынок товаров',
  ];

  return (
    <div className={`p-3 shadow-sm border flex-1 flex flex-col ${
      isDarkTheme 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center mb-3">
        <Brain className={`mr-2 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} size={16} />
        <h2 className={`text-base font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-700'}`}>AI Помощник</h2>
      </div>
      
      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {aiMessages.length === 0 ? (
          <div className="text-center py-3">
            <Bot className={`mx-auto mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-slate-400'}`} size={24} />
            <h4 className={`font-medium mb-1 text-sm ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
              AI Помощник
            </h4>
            <p className={`text-xs mb-3 ${isDarkTheme ? 'text-gray-400' : 'text-slate-600'}`}>
              Задайте вопрос о товарах
            </p>
            
            {/* Предлагаемые вопросы */}
            <div className="space-y-1">
              {suggestedQuestions.slice(0, 5).map((question, index) => (
                <button
                  key={index}
                  onClick={() => setAiInputMessage(question)}
                  className={`w-full p-1.5 text-left text-xs transition-colors ${
                    isDarkTheme 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          aiMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-1.5 text-xs ${
                  message.role === 'user'
                    ? isDarkTheme
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : isDarkTheme
                      ? 'bg-gray-700 text-gray-200'
                      : 'bg-slate-100 text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 opacity-60 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isAILoading && (
          <div className="flex justify-start">
            <div className={`max-w-[85%] p-1.5 text-xs ${
              isDarkTheme ? 'bg-gray-700' : 'bg-slate-100'
            }`}>
              <div className="flex items-center space-x-1">
                <div className="animate-spin h-2.5 w-2.5 border-b-2 border-blue-500"></div>
                <span className={`${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>
                  AI думает...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={aiMessagesEndRef} />
      </div>
      
      {/* Поле ввода */}
      <div className={`p-2 border-t ${
        isDarkTheme ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex space-x-1">
          <input
            type="text"
            value={aiInputMessage}
            onChange={(e) => setAiInputMessage(e.target.value)}
            onKeyPress={handleAIKeyPress}
            placeholder="Введите сообщение..."
            className={`flex-1 p-1.5 border text-xs focus:outline-none focus:ring-1 transition-colors ${
              isDarkTheme 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500' 
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500'
            }`}
          />
          <button
            onClick={handleSendAIMessage}
            disabled={!aiInputMessage.trim() || isAILoading}
            className={`p-1.5 transition-colors ${
              isDarkTheme 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Send size={12} />
          </button>
        </div>
        
        {/* Кнопка очистки чата */}
        {aiMessages.length > 0 && (
          <button
            onClick={clearAIChat}
            className={`mt-1.5 text-xs px-1.5 py-0.5 rounded transition-colors ${
              isDarkTheme
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            Очистить чат
          </button>
        )}
      </div>
    </div>
  );
} 