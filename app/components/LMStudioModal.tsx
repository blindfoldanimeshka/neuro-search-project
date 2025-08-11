'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface LMStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LMStudioModal({ isOpen, onClose }: LMStudioModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const testLMStudio = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const availabilityResponse = await fetch('/api/ai-local');
      const availabilityData = await availabilityResponse.json();

      if (!availabilityData.available) {
        setStatus('warning');
        setMessage('LM Studio не запущен. Запустите LM Studio и загрузите модель.');
        return;
      }

      const testResponse = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Привет! Расскажи немного о себе.',
          model: 'qwen/qwen3-4b',
          temperature: 0.7,
          maxTokens: 200
        }),
      });

      const testData = await testResponse.json();

      if (testResponse.ok) {
        setStatus('success');
        setMessage(`LM Studio работает! Модель: ${testData.model}, Провайдер: ${testData.provider}`);
      } else {
        setStatus('error');
        setMessage(testData.error || 'Ошибка при запросе к LM Studio');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Ошибка сети. Проверьте, что LM Studio запущен.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Тест LM Studio
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={testLMStudio}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                Тестирование...
              </>
            ) : (
              'Протестировать LM Studio'
            )}
          </button>

          {message && (
            <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
              status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
              status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
              status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
              ''
            }`}>
              {status === 'success' && <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
              {status === 'error' && <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
              {status === 'warning' && <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-semibold mb-2">Как настроить LM Studio:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Скачайте и установите LM Studio</li>
              <li>Загрузите модель (например, Qwen 3 4B)</li>
              <li>Запустите локальный сервер (порт 1234)</li>
              <li>Убедитесь, что сервер доступен по адресу http://127.0.0.1:1234</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
