'use client';

import { useState, useCallback } from 'react';
import { AppError, logError, formatErrorMessage } from './error-handler';

// Хук для обработки ошибок в компонентах
export const useErrorHandler = () => {
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error: any, context?: string) => {
    const appError = AppError.fromError(error);
    logError(appError, context);
    setError(appError);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    setIsLoading(true);
    clearError();
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      handleError(err, context);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  // Получить форматированное сообщение об ошибке
  const getErrorMessage = useCallback(() => {
    return error ? formatErrorMessage(error) : null;
  }, [error]);

  return {
    error,
    isLoading,
    handleError,
    clearError,
    executeWithErrorHandling,
    getErrorMessage
  };
};