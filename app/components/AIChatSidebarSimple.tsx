'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot } from 'lucide-react';
import { useAI } from '../hooks/useAI';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatSidebarSimpleProps {
  isDarkTheme: boolean;
}

export default function AIChatSidebarSimple({ isDarkTheme }: AIChatSidebarSimpleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { sendMessage, isLoading } = useAI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const response = await sendMessage(inputMessage);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Произошла ошибка. Попробуйте еще раз.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className={`h-full flex flex-col ${
      isDarkTheme ? 'bg-gray-800' : 'bg-white'
    }`}>
      {/* Заголовок */}
      <div className={`p-4 border-b ${
        isDarkTheme ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className={isDarkTheme ? 'text-blue-400' : 'text-blue-600'} size={20} />
            <h2 className={`text-lg font-semibold ${
              isDarkTheme ? 'text-white' : 'text-gray-800'
            }`}>
              AI Чат
            </h2>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className={`p-1.5 rounded-lg transition-colors ${
                isDarkTheme 
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
              title="Очистить чат"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Сообщения */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
        isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className={`mb-4 ${
              isDarkTheme ? 'text-gray-600' : 'text-gray-400'
            }`} size={48} />
            <p className={`text-lg font-medium mb-2 ${
              isDarkTheme ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Начните диалог с AI
            </p>
            <p className={`text-sm ${
              isDarkTheme ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Задайте любой вопрос или попросите помощи
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    message.role === 'user'
                      ? isDarkTheme
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 text-white'
                      : isDarkTheme
                        ? 'bg-gray-700 text-gray-100'
                        : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' 
                      ? 'text-blue-100' 
                      : isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className={`p-4 rounded-lg ${
                  isDarkTheme ? 'bg-gray-700' : 'bg-white border border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className={`text-sm ${
                      isDarkTheme ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      AI думает...
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Поле ввода */}
      <div className={`p-4 border-t ${
        isDarkTheme ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${
              isDarkTheme 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500' 
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 border'
            }`}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
              !inputMessage.trim() || isLoading
                ? isDarkTheme
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isDarkTheme
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Send size={18} />
            <span className="text-sm font-medium">Отправить</span>
          </button>
        </div>
      </div>
    </div>
  );
}