import { useState, useCallback } from 'react';

export interface Context7Thought {
  id: string;
  thought: string;
  reasoning?: string;
  confidence?: number;
  step?: number;
}

export interface Context7Response {
  response: string;
  model: string;
  thoughts?: Context7Thought[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface UseContext7Props {
  context?: string;
  model?: string;
  provider?: 'openrouter' | 'local';
}

export function useContext7({ context, model, provider }: UseContext7Props = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<Context7Response | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/context7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, context, provider, includeThoughts: true }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error((data as any).error || `HTTP ${resp.status}`);
      }
      const data: Context7Response = await resp.json();
      setLastResponse(data);
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [context, model, provider]);

  const clearError = useCallback(() => setError(null), []);
  const clearResponse = useCallback(() => setLastResponse(null), []);

  return { sendMessage, isLoading, error, lastResponse, clearError, clearResponse };
}

