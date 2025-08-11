import { useState, useCallback } from 'react';

interface AIResponse {
  response: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface UseAIProps {
  context?: string;
  model?: string;
}

export function useAI({ context, model = 'deepseek/deepseek-chat-v3-0324:free' }: UseAIProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          model,
          context,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage);
        
        // Добавляем дополнительную информацию об ошибке
        if (errorData.details) {
          (error as any).details = errorData.details;
        }
        if (errorData.retryAfter) {
          (error as any).retryAfter = errorData.retryAfter;
        }
        
        throw error;
      }

      const data: AIResponse = await response.json();
      setLastResponse(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [context, model]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResponse = useCallback(() => {
    setLastResponse(null);
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    lastResponse,
    clearError,
    clearResponse,
  };
} 