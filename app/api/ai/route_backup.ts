import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { handleApiError, createApiError } from '../../lib/error-handler';
import { validateAIRequest, AIRequestSchema } from '../../lib/validation';

// Инициализация OpenAI клиента для OpenRouter
const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
}) : null;

// Конфигурация LM Studio
const LM_STUDIO_BASE_URL = process.env.LMSTUDIO_BASE_URL || 'http://127.0.0.1:1234';

// Модель по умолчанию из переменных окружения
const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-chat-v3-0324:free';

// Функция для проверки доступности LM Studio
async function checkLMStudioAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${LM_STUDIO_BASE_URL}/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}-0324:free';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидируем входные данные
    const validationResult = AIRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const error = createApiError.validation(
        `Ошибка валидации: ${validationResult.error.issues.map(e => e.message).join(', ')}`
      );
      const { error: appError, status } = handleApiError(error);
      return NextResponse.json({ 
        error: appError.message,
        details: validationResult.error.issues 
      }, { status });
    }

    const { message, model = DEFAULT_MODEL, context, temperature = 0.7, maxTokens = 1000 } = validationResult.data;

    // Определяем, является ли модель локальной (LM Studio)
    const isLMStudioModel = model.includes('lmstudio') || model.includes('local') || model === 'qwen/qwen3-4b';

    // Если это модель LM Studio
    if (isLMStudioModel) {
      const isLMStudioAvailable = await checkLMStudioAvailability();
      if (!isLMStudioAvailable) {
        const error = createApiError.serverError(
          'LM Studio недоступен. Убедитесь, что LM Studio запущен и доступен по адресу: ' + LM_STUDIO_BASE_URL
        );
        const { error: appError, status } = handleApiError(error);
        return NextResponse.json({ error: appError.message }, { status });
      }
    } else {
      // Для OpenRouter моделей проверяем API ключ
      if (!process.env.OPENROUTER_API_KEY || !openai) {
        const error = createApiError.serverError('OpenRouter API key not configured. Please create .env.local file with OPENROUTER_API_KEY');
        const { error: appError, status } = handleApiError(error);
        return NextResponse.json({ error: appError.message }, { status });
      }
    }ge }, { status });
    }

    // Формируем промпт с контекстом
    const systemPrompt = `Ты - AI помощник для системы управления товарами. 
    
Контекст: ${context || 'Пользователь работает с системой поиска и управления товарами'}

Твои задачи:
1. Помогать пользователю в поиске товаров
2. Анализировать данные о товарах
3. Предоставлять рекомендации
4. Помогать с категоризацией товаров
5. Генерировать описания товаров
6. Отвечать на вопросы о товарах и их характеристиках

Отвечай на русском языке, будь полезным и дружелюбным. Используй эмодзи для лучшего восприятия.`;

    let response: string;
    let usage: any;

    if (isLMStudioModel) {
      // Запрос к LM Studio
      const lmStudioRequest = {
        model: model === 'qwen/qwen3-4b' ? model : 'default', // Используем конкретную модель или default
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false
      };

      const lmResponse = await fetch(`${LM_STUDIO_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lmStudioRequest),
      });

      if (!lmResponse.ok) {
        const errorText = await lmResponse.text();
        console.error('LM Studio API Error:', lmResponse.status, errorText);
        
        if (lmResponse.status === 503 || lmResponse.status === 404) {
          const error = createApiError.serverError(
            'LM Studio недоступен. Убедитесь, что LM Studio запущен и модель загружена.'
          );
          const { error: appError, status } = handleApiError(error);
          return NextResponse.json({ error: appError.message }, { status });
        }

        const error = createApiError.serverError('Ошибка при обращении к LM Studio');
        const { error: appError, status } = handleApiError(error);
        return NextResponse.json({ error: appError.message }, { status });
      }

      const lmData = await lmResponse.json();
      response = lmData.choices?.[0]?.message?.content || 'Извините, не удалось получить ответ';
      usage = lmData.usage;
    } else {
      // Запрос к OpenRouter
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      response = completion.choices[0]?.message?.content || 'Извините, не удалось получить ответ';
      usage = completion.usage;
    }

    return NextResponse.json({ 
      response,
      model: model,
      usage: usage,
      provider: isLMStudioModel ? 'lmstudio' : 'openrouter'
    });on.usage 
    });

  } catch (error) {
    // Используем централизованную обработку ошибок
    const { error: appError, status } = handleApiError(error);
    
    // Дополнительная обработка специфичных ошибок OpenAI
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        const authError = createApiError.authentication('Неверный API ключ OpenRouter. Проверьте настройки в .env.local');
        const { error: authAppError, status: authStatus } = handleApiError(authError);
        return NextResponse.json({ error: authAppError.message }, { status: authStatus });
      }
      if (error.message.includes('429')) {
        const rateLimitError = createApiError.rateLimit(60);
        const { error: rateLimitAppError, status: rateLimitStatus } = handleApiError(rateLimitError);
        return NextResponse.json({ 
          error: rateLimitAppError.message,
          retryAfter: rateLimitAppError.retryAfter
        }, { status: rateLimitStatus });
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
        const quotaError = createApiError.rateLimit(300);
        const { error: quotaAppError, status: quotaStatus } = handleApiError(quotaError);
        return NextResponse.json({ 
          error: quotaAppError.message,
          retryAfter: quotaAppError.retryAfter
        }, { status: quotaStatus });
      }
    }
    
    return NextResponse.json({ error: appError.message }, { status });
  }
} 