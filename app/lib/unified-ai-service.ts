import OpenAI from 'openai';

/**
 * Унифицированный AI сервис для интеграции RAG с другими AI системами
 */

export interface AIProvider {
  type: 'openrouter' | 'lmstudio' | 'auto';
  model?: string;
  fallback?: boolean;
}

export interface AIGenerateOptions {
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
}

export class UnifiedAIService {
  private openrouter?: OpenAI;
  private lmStudioEndpoint: string;
  private ragSystem?: any; // RAGSystem instance

  constructor() {
    // Инициализация OpenRouter если есть ключ
    if (process.env.OPENROUTER_API_KEY) {
      this.openrouter = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
      });
    }

    // LM Studio endpoint
    this.lmStudioEndpoint = process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234/v1';
  }

  /**
   * Проверяет доступность AI провайдеров
   */
  async checkAvailability() {
    const status = {
      openrouter: false,
      lmstudio: false,
      rag: false,
    };

    // Проверка OpenRouter
    if (this.openrouter) {
      try {
        await this.openrouter.models.list();
        status.openrouter = true;
      } catch (error) {
        console.error('OpenRouter недоступен:', error);
      }
    }

    // Проверка LM Studio
    try {
      const response = await fetch(`${this.lmStudioEndpoint}/models`);
      status.lmstudio = response.ok;
    } catch (error) {
      console.error('LM Studio недоступен:', error);
    }

    // Проверка RAG
    try {
      const response = await fetch('/api/rag');
      const data = await response.json();
      status.rag = data.status === 'ok';
    } catch (error) {
      console.error('RAG система недоступна:', error);
    }

    return status;
  }

  /**
   * Универсальный метод генерации текста
   */
  async generate(prompt: string, options: AIGenerateOptions = {}): Promise<string> {
    const provider = options.provider || { type: 'auto', fallback: true };

    try {
      switch (provider.type) {
        case 'lmstudio':
          return await this.generateWithLMStudio(prompt, options);
        
        case 'openrouter':
          return await this.generateWithOpenRouter(prompt, options);
        
        case 'auto':
        default:
          // Автоматический выбор провайдера
          return await this.generateAuto(prompt, options);
      }
    } catch (error) {
      if (provider.fallback) {
        console.warn('Основной провайдер недоступен, пробуем fallback:', error);
        return await this.generateFallback(prompt, options);
      }
      throw error;
    }
  }

  /**
   * Поиск с использованием RAG и AI
   */
  async searchWithRAG(query: string): Promise<any> {
    try {
      // Сначала используем RAG
      const ragResponse = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!ragResponse.ok) {
        throw new Error('RAG недоступен');
      }

      const ragData = await ragResponse.json();
      
      // Если RAG дал хорошие результаты, возвращаем их
      if (ragData.data?.products?.length > 0) {
        return ragData.data;
      }

      // Если результатов мало, дополняем через AI Assistant
      const aiResponse = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          action: 'search',
          context: {
            previousProducts: ragData.data?.products || []
          }
        }),
      });

      const aiData = await aiResponse.json();
      
      // Объединяем результаты
      return {
        ...ragData.data,
        products: [...(ragData.data?.products || []), ...(aiData.data?.products || [])],
        enhanced: true,
        sources: ['rag', 'ai-assistant']
      };

    } catch (error) {
      console.error('Ошибка в searchWithRAG:', error);
      // Fallback на обычный поиск
      return this.searchFallback(query);
    }
  }

  /**
   * Анализ с использованием обоих AI систем
   */
  async analyzeWithAI(data: any, context: string = ''): Promise<any> {
    const analyses = [];

    // Анализ через LM Studio (если доступен)
    try {
      const lmAnalysis = await this.generateWithLMStudio(
        `Проанализируй следующие данные: ${JSON.stringify(data)}. Контекст: ${context}`,
        { temperature: 0.3, maxTokens: 500 }
      );
      analyses.push({
        source: 'lmstudio',
        analysis: lmAnalysis,
        model: process.env.LOCAL_AI_MODEL || 'qwen/qwen3-4b'
      });
    } catch (error) {
      console.warn('LM Studio анализ недоступен:', error);
    }

    // Анализ через OpenRouter (если доступен)
    if (this.openrouter) {
      try {
        const orAnalysis = await this.generateWithOpenRouter(
          `Проанализируй следующие данные: ${JSON.stringify(data)}. Контекст: ${context}`,
          { temperature: 0.3, maxTokens: 500 }
        );
        analyses.push({
          source: 'openrouter',
          analysis: orAnalysis,
          model: process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-chat-v3-0324:free'
        });
      } catch (error) {
        console.warn('OpenRouter анализ недоступен:', error);
      }
    }

    // Объединение анализов
    return {
      analyses,
      combined: this.combineAnalyses(analyses),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Приватные методы генерации
   */
  private async generateWithLMStudio(prompt: string, options: AIGenerateOptions): Promise<string> {
    const response = await fetch(`${this.lmStudioEndpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.provider?.model || process.env.LOCAL_AI_MODEL || 'qwen/qwen3-4b',
        messages: [
          ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: options.stream || false
      })
    });

    if (!response.ok) {
      throw new Error(`LM Studio error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private async generateWithOpenRouter(prompt: string, options: AIGenerateOptions): Promise<string> {
    if (!this.openrouter) {
      throw new Error('OpenRouter не настроен');
    }

    const response = await this.openrouter.chat.completions.create({
      model: options.provider?.model || process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-chat-v3-0324:free',
      messages: [
        ...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      stream: options.stream || false
    });

    return response.choices[0]?.message?.content || '';
  }

  private async generateAuto(prompt: string, options: AIGenerateOptions): Promise<string> {
    // Пробуем сначала локальный LM Studio (быстрее и приватнее)
    try {
      return await this.generateWithLMStudio(prompt, options);
    } catch (error) {
      // Если не работает, пробуем OpenRouter
      if (this.openrouter) {
        return await this.generateWithOpenRouter(prompt, options);
      }
      throw new Error('Нет доступных AI провайдеров');
    }
  }

  private async generateFallback(prompt: string, options: AIGenerateOptions): Promise<string> {
    // Пробуем альтернативный провайдер
    if (options.provider?.type === 'lmstudio' && this.openrouter) {
      return await this.generateWithOpenRouter(prompt, options);
    } else {
      return await this.generateWithLMStudio(prompt, options);
    }
  }

  private async searchFallback(query: string): Promise<any> {
    // Fallback на обычный поиск через AI Assistant
    const response = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        action: 'search'
      }),
    });

    const data = await response.json();
    return data.data || { products: [], error: 'Поиск недоступен' };
  }

  private combineAnalyses(analyses: any[]): string {
    if (analyses.length === 0) return 'Анализ недоступен';
    if (analyses.length === 1) return analyses[0].analysis;

    // Объединяем анализы от разных моделей
    const combined = analyses.map(a => 
      `**Анализ от ${a.source} (${a.model}):**\n${a.analysis}`
    ).join('\n\n');

    return `Комбинированный анализ от нескольких AI моделей:\n\n${combined}`;
  }
}

// Singleton экземпляр
export const unifiedAI = new UnifiedAIService();