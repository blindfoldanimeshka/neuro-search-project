'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Brain, Bot, Send, Search, Sparkles, Loader2, Settings, ChevronDown, ChevronUp, Zap, Globe, Cpu } from 'lucide-react';
import { useAI } from '../hooks/useAI';
import { Product, Filters, AIMessage } from './types';
import NeuroParserResults from './NeuroParserResults';

interface AIModel {
  id: string;
  name: string;
  description?: string;
  parameters?: number;
  context_length?: number;
  format?: string;
  family?: string;
  architecture?: string;
  provider?: string;
  cost?: string;
  type?: 'openrouter' | 'lmstudio' | 'neuroparser';
}

interface NeuroParserData {
  products: any[];
  summary: string;
  query: string;
  sourcesUsed: string[];
  totalFound: number;
  filteredCount: number;
}

interface AIChatSidebarWithModelsProps {
  isDarkTheme: boolean;
  selectedProducts?: Product[];
  filteredProducts?: Product[];
  filters?: Filters;
  onProductsFound?: (products: any[]) => void;
}

export default function AIChatSidebarWithModels({
  isDarkTheme,
  selectedProducts = [],
  filteredProducts = [],
  filters = {},
  onProductsFound
}: AIChatSidebarWithModelsProps) {
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInputMessage, setAiInputMessage] = useState('');
  const [neuroParserData, setNeuroParserData] = useState<NeuroParserData | null>(null);
  const [isNeuroParserLoading, setIsNeuroParserLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('qwen/qwen3-4b');
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [modelsByType, setModelsByType] = useState<Record<string, AIModel[]>>({});
  const [providerStatus, setProviderStatus] = useState<Record<string, string>>({});
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  // Создаем контекст для AI
  const aiContext = `
    Пользователь работает с системой поиска товаров с нейропарсером.
    Выбрано товаров: ${selectedProducts?.length || 0}
    Найдено товаров: ${filteredProducts?.length || 0}
    Текущие фильтры: ${JSON.stringify(filters || {})}
    
    ДОПОЛНИТЕЛЬНЫЕ ВОЗМОЖНОСТИ:
    - Нейропарсер для поиска товаров в интернете (Wildberries, Ozon)
    - ИИ анализ товаров с оценкой плюсов и минусов
    - Умное ранжирование результатов
    - Анализ цен и сравнение между площадками
    - Рекомендации по покупкам
    - Помощь с госзакупками
    - Поиск по описанию товаров
  `;

  const { sendMessage: sendAIMessage, isLoading: isAILoading } = useAI({ 
    context: aiContext,
    model: selectedModel 
  });

  const scrollToBottom = () => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages, neuroParserData]);

  // Загрузка доступных моделей
  useEffect(() => {
    loadAvailableModels();
  }, []);

  const loadAvailableModels = async () => {
    setIsModelsLoading(true);
    try {
      const response = await fetch('/api/ai/models');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.models) {
          setAvailableModels(data.models);
          setModelsByType(data.modelsByType || {});
          setProviderStatus(data.status || {});
        }
      }
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setIsModelsLoading(false);
    }
  };

  const callNeuroParser = async (query: string, userPrompt?: string) => {
    setIsNeuroParserLoading(true);
    try {
      const response = await fetch('/api/ai-neuro-parser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          userPrompt,
          sources: ['wildberries', 'ozon'],
          maxProducts: 12,
          includeAnalysis: true,
          saveToDatabase: true,
          context: {
            previousProducts: selectedProducts,
            searchHistory: aiMessages.filter(m => m.role === 'user').map(m => m.content),
            userPreferences: filters
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка нейропарсера');
      }

      const data = await response.json();
      setNeuroParserData(data.data);
      
      // Добавляем сообщение с результатами
      const resultMessage: AIMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `🧠 Нейропарсер нашел ${data.data.filteredCount} товаров по запросу "${query}". Результаты отображены ниже.`,
        timestamp: new Date(),
      };
      
      setAiMessages(prev => [...prev, resultMessage]);

      // Добавляем товары в таблицу
      if (onProductsFound && data.data.products) {
        onProductsFound(data.data.products);
      }
    } catch (error) {
      console.error('Neuro parser error:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '❌ Произошла ошибка при работе нейропарсера. Попробуйте еще раз.',
        timestamp: new Date(),
      };
      setAiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsNeuroParserLoading(false);
    }
  };

  const handleSendAIMessage = async () => {
    if (!aiInputMessage.trim() || isAILoading || isNeuroParserLoading) return;

    const currentMessage = aiInputMessage.trim();
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      timestamp: new Date(),
    };

    setAiMessages(prev => [...prev, userMessage]);
    setAiInputMessage('');

    // Определяем, нужно ли использовать нейропарсер
    const shouldUseNeuroParser = detectSearchIntent(currentMessage);
    
    if (shouldUseNeuroParser) {
      // Сначала отправляем сообщение о запуске нейропарсера
      const loadingMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '🧠 Запускаю нейропарсер для поиска товаров...',
        timestamp: new Date(),
      };
      
      setAiMessages(prev => [...prev, loadingMessage]);
      
      // Вызываем нейропарсер
      await callNeuroParser(extractSearchQuery(currentMessage), currentMessage);
    } else {
      // Используем обычный ИИ чат
      try {
        const response = await sendAIMessage(currentMessage);
        
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
    }
  };

  // Определение намерения поиска
  const detectSearchIntent = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const searchKeywords = [
      'найди', 'найти', 'поиск', 'ищи', 'ищу', 'покажи', 'найди товары',
      'поиск товаров', 'ищу товары', 'покажи товары', 'найди продукты',
      'поиск продуктов', 'ищу продукты', 'покажи продукты'
    ];
    
    return searchKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Извлечение поискового запроса
  const extractSearchQuery = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    const searchKeywords = [
      'найди', 'найти', 'поиск', 'ищи', 'ищу', 'покажи'
    ];
    
    for (const keyword of searchKeywords) {
      if (lowerMessage.includes(keyword)) {
        const index = lowerMessage.indexOf(keyword);
        return message.substring(index + keyword.length).trim();
      }
    }
    
    return message;
  };

  const handleAIKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendAIMessage();
    }
  };

  const clearAIChat = () => {
    setAiMessages([]);
    setNeuroParserData(null);
  };

  const suggestedQuestions = [
    'Найди смартфоны',
    'Покажи ноутбуки для работы',
    'Ищу кроссовки',
    'Найди товары для дома',
    'Покажи лучшие предложения',
    'Анализируй выбранные товары'
  ];

  const currentModel = availableModels.find(m => m.id === selectedModel);

  return (
    <div className={`p-3 shadow-sm border flex-1 flex flex-col ${
      isDarkTheme 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Заголовок с настройками */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Brain className={`mr-2 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} size={16} />
          <h2 className={`text-base font-semibold ${isDarkTheme ? 'text-white' : 'text-slate-700'}`}>
            AI Помощник с Нейропарсером
          </h2>
          <Sparkles className={`ml-2 ${isDarkTheme ? 'text-purple-400' : 'text-purple-600'}`} size={14} />
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1 rounded transition-colors ${
            isDarkTheme 
              ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Settings size={14} />
        </button>
      </div>

      {/* Настройки моделей */}
      {showSettings && (
        <div className={`mb-3 p-2 rounded border ${
          isDarkTheme ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-700'}`}>
              Модель ИИ
            </span>
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className={`p-1 rounded transition-colors ${
                isDarkTheme 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {showModelSelector ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          
          {showModelSelector && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isModelsLoading ? (
                <div className="flex items-center space-x-2 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Загрузка моделей...</span>
                </div>
              ) : (
                <>
                  {/* OpenRouter модели */}
                  {modelsByType.openrouter && modelsByType.openrouter.length > 0 && (
                    <div>
                      <div className={`text-xs font-medium mb-1 flex items-center ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                        <Globe size={12} className="mr-1" />
                        OpenRouter API
                        <span className={`ml-2 text-xs ${
                          providerStatus.openrouter === 'available' ? 'text-green-500' : 
                          providerStatus.openrouter === 'unavailable' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {providerStatus.openrouter === 'available' ? '● Доступен' : 
                           providerStatus.openrouter === 'unavailable' ? '● Не настроен' : '● Ошибка'}
                        </span>
                      </div>
                      {modelsByType.openrouter.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelSelector(false);
                          }}
                          disabled={providerStatus.openrouter !== 'available'}
                          className={`w-full p-1.5 text-left text-xs rounded transition-colors mb-1 ${
                            selectedModel === model.id
                              ? isDarkTheme
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-500 text-white'
                              : providerStatus.openrouter !== 'available'
                                ? isDarkTheme
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isDarkTheme
                                  ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                                  : 'bg-white hover:bg-gray-100 text-gray-700 border'
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <span className="truncate">{model.name}</span>
                          </div>
                          {model.description && (
                            <div className={`text-xs mt-1 ${
                              selectedModel === model.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {model.description}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* LM Studio модели */}
                  {modelsByType.lmstudio && modelsByType.lmstudio.length > 0 && (
                    <div>
                      <div className={`text-xs font-medium mb-1 flex items-center ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                        <Cpu size={12} className="mr-1" />
                        LM Studio (Локально)
                        <span className={`ml-2 text-xs ${
                          providerStatus.lmstudio === 'available' ? 'text-green-500' : 
                          providerStatus.lmstudio === 'unavailable' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {providerStatus.lmstudio === 'available' ? '● Доступен' : 
                           providerStatus.lmstudio === 'unavailable' ? '● Не запущен' : '● Ошибка'}
                        </span>
                      </div>
                      {modelsByType.lmstudio.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelSelector(false);
                          }}
                          disabled={providerStatus.lmstudio !== 'available'}
                          className={`w-full p-1.5 text-left text-xs rounded transition-colors mb-1 ${
                            selectedModel === model.id
                              ? isDarkTheme
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-500 text-white'
                              : providerStatus.lmstudio !== 'available'
                                ? isDarkTheme
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isDarkTheme
                                  ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                                  : 'bg-white hover:bg-gray-100 text-gray-700 border'
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <span className="truncate">{model.name}</span>
                          </div>
                          {model.description && (
                            <div className={`text-xs mt-1 ${
                              selectedModel === model.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {model.description}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* NeuroParser */}
                  {modelsByType.neuroparser && modelsByType.neuroparser.length > 0 && (
                    <div>
                      <div className={`text-xs font-medium mb-1 flex items-center ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                        <Brain size={12} className="mr-1" />
                        Специальные модели
                      </div>
                      {modelsByType.neuroparser.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelSelector(false);
                          }}
                          className={`w-full p-1.5 text-left text-xs rounded transition-colors mb-1 ${
                            selectedModel === model.id
                              ? isDarkTheme
                                ? 'bg-purple-600 text-white'
                                : 'bg-purple-500 text-white'
                              : isDarkTheme
                                ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                                : 'bg-white hover:bg-gray-100 text-gray-700 border'
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <Sparkles size={10} />
                            <span className="truncate">{model.name}</span>
                          </div>
                          {model.description && (
                            <div className={`text-xs mt-1 ${
                              selectedModel === model.id ? 'text-purple-100' : 'text-gray-500'
                            }`}>
                              {model.description}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Если нет доступных моделей */}
                  {availableModels.length === 0 && (
                    <div className={`text-xs text-center p-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                      Нет доступных моделей
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!showModelSelector && (
            <div className={`text-xs ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="flex items-center space-x-1">
                {currentModel?.type === 'lmstudio' && <Cpu size={10} />}
                {currentModel?.type === 'openrouter' && <Globe size={10} />}
                {currentModel?.type === 'neuroparser' && <Sparkles size={10} />}
                <span>{currentModel?.name || 'Модель не выбрана'}</span>
              </div>
              {/* Статус провайдера */}
              {currentModel && (
                <div className={`text-xs mt-1 ${
                  (currentModel.type === 'openrouter' && providerStatus.openrouter === 'available') ||
                  (currentModel.type === 'lmstudio' && providerStatus.lmstudio === 'available') ||
                  currentModel.type === 'neuroparser'
                    ? 'text-green-500' : 'text-red-500'
                }`}>
                  {currentModel.type === 'openrouter' && (
                    providerStatus.openrouter === 'available' ? '● Подключено' : '● Недоступно'
                  )}
                  {currentModel.type === 'lmstudio' && (
                    providerStatus.lmstudio === 'available' ? '● Подключено' : '● Не запущен LM Studio'
                  )}
                  {currentModel.type === 'neuroparser' && '● Готов к работе'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {!aiMessages || aiMessages.length === 0 ? (
          <div className="text-center py-3">
            <Bot className={`mx-auto mb-2 ${isDarkTheme ? 'text-gray-400' : 'text-slate-400'}`} size={24} />
            <h4 className={`font-medium mb-1 text-sm ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
              AI Помощник с Нейропарсером
            </h4>
            <p className={`text-xs mb-3 ${isDarkTheme ? 'text-gray-400' : 'text-slate-600'}`}>
              Задайте вопрос о товарах или попросите найти что-то
            </p>
            
            {/* Предлагаемые вопросы */}
            <div className="space-y-1">
              {(suggestedQuestions || []).slice(0, 6).map((question, index) => (
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
          (aiMessages || []).map((message) => (
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

        {isNeuroParserLoading && (
          <div className="flex justify-start">
            <div className={`max-w-[85%] p-1.5 text-xs ${
              isDarkTheme ? 'bg-gray-700' : 'bg-slate-100'
            }`}>
              <div className="flex items-center space-x-1">
                <Loader2 className="h-2.5 w-2.5 animate-spin text-purple-500" />
                <span className={`${isDarkTheme ? 'text-gray-300' : 'text-slate-600'}`}>
                  Нейропарсер ищет товары...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={aiMessagesEndRef} />
      </div>

      {/* Результаты нейропарсера */}
      {neuroParserData && (
        <div className="mb-3">
          <NeuroParserResults
            products={neuroParserData.products || []}
            summary={neuroParserData.summary || ''}
            query={neuroParserData.query || ''}
            sourcesUsed={neuroParserData.sourcesUsed || []}
            totalFound={neuroParserData.totalFound || 0}
            filteredCount={neuroParserData.filteredCount || 0}
            onProductClick={(product) => {
              // Обработка клика по товару
              console.log('Product clicked:', product);
            }}
          />
        </div>
      )}
      
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
            placeholder="Введите сообщение или запрос на поиск..."
            disabled={isAILoading || isNeuroParserLoading}
            className={`flex-1 p-1.5 border text-xs focus:outline-none focus:ring-1 transition-colors ${
              isDarkTheme 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500' 
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500'
            }`}
          />
          <button
            onClick={handleSendAIMessage}
            disabled={!aiInputMessage.trim() || isAILoading || isNeuroParserLoading}
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
        {((aiMessages && aiMessages.length > 0) || neuroParserData) && (
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
