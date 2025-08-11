import { useState, useCallback, useEffect } from 'react';

interface LocalAIResponse {
  response: string;
  model: string;
  thoughts?: Array<{
    id: string;
    thought: string;
    reasoning?: string;
    confidence?: number;
    step?: number;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
}

interface UseLocalAIProps {
  context?: string;
  model?: string;
  includeThoughts?: boolean;
}

export function useLocalAI({ context, model = 'default', includeThoughts = true }: UseLocalAIProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<LocalAIResponse | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          model,
          context,
          include_thoughts: includeThoughts,
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
        if (errorData.status) {
          (error as any).status = errorData.status;
        }
        
        throw error;
      }

      const data: LocalAIResponse = await response.json();
      setLastResponse(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [context, model, includeThoughts]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResponse = useCallback(() => {
    setLastResponse(null);
  }, []);

  // Availability check on mount (best-effort)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/ai-local');
        const data = await resp.json().catch(() => ({}));
        if (!cancelled && typeof (data as any).available === 'boolean') {
          setIsAvailable((data as any).available);
        }
      } catch {
        if (!cancelled) setIsAvailable(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    lastResponse,
    clearError,
    clearResponse,
    isAvailable,
  };
}

