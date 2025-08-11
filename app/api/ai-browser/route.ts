import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Инициализация OpenAI клиента для OpenRouter
const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
}) : null;

// Модель по умолчанию
const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-chat-v3-0324:free';

interface BrowserAction {
  type: 'navigate' | 'search' | 'click' | 'scroll' | 'extract' | 'wait';
  payload: any;
}

interface BrowserRequest {
  message: string;
  currentUrl?: string;
  pageContent?: string;
  model?: string;
  actions?: BrowserAction[];
}

interface BrowserResponse {
  success: boolean;
  data?: {
    actions: BrowserAction[];
    analysis: string;
    nextSteps: string[];
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      currentUrl = 'https://www.google.com',
      pageContent = '',
      model = DEFAULT_MODEL,
      actions = []
    }: BrowserRequest = await request.json();

    if (!process.env.OPENROUTER_API_KEY || !openai) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Анализируем сообщение пользователя и генерируем действия для браузера
    const analysisPrompt = `Ты - ИИ-ассистент, который управляет браузером для выполнения задач пользователя.

Текущая ситуация:
- URL: ${currentUrl}
- Контент страницы: ${pageContent.substring(0, 500)}${pageContent.length > 500 ? '...' : ''}
- Выполненные действия: ${actions.map(a => `${a.type}: ${JSON.stringify(a.payload)}`).join(', ')}

Задача пользователя: "${message}"

Твоя задача - определить, какие действия нужно выполнить в браузере для решения задачи пользователя.

Доступные действия:
1. navigate - переход на URL
2. search - поиск в Google
3. click - клик по элементу (CSS селектор)
4. scroll - прокрутка страницы (top/bottom/число)
5. extract - извлечение контента (CSS селекторы)
6. wait - ожидание (миллисекунды)

Ответь в формате JSON:
{
  "actions": [
    {
      "type": "тип_действия",
      "payload": { "параметры": "значения" }
    }
  ],
  "analysis": "Анализ задачи и плана действий",
  "nextSteps": ["шаг 1", "шаг 2", "шаг 3"]
}

Примеры действий:
- Поиск: {"type": "search", "payload": {"query": "iPhone 15 цена"}}
- Переход: {"type": "navigate", "payload": {"url": "https://www.wildberries.ru"}}
- Клик: {"type": "click", "payload": {"selector": ".search-button"}}
- Извлечение: {"type": "extract", "payload": {"selectors": [".product-title", ".price"]}}
- Ожидание: {"type": "wait", "payload": {"duration": 2000}}`;

    const analysisResponse = await openai.chat.completions.create({
      model: model,
      messages: [
        { 
          role: 'system', 
          content: 'Ты - ИИ-ассистент для управления браузером. Отвечай только в формате JSON с действиями для выполнения.' 
        },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const analysisText = analysisResponse.choices[0]?.message?.content || '{}';
    let browserActions;
    
    try {
      browserActions = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI analysis:', parseError);
      // Fallback: создаем базовые действия
      browserActions = {
        actions: [
          {
            type: 'search',
            payload: { query: message }
          }
        ],
        analysis: `Не удалось проанализировать запрос. Выполняю поиск: "${message}"`,
        nextSteps: ['Выполнить поиск', 'Проанализировать результаты']
      };
    }

    // Валидация действий
    const validatedActions = browserActions.actions?.filter((action: any) => {
      const validTypes = ['navigate', 'search', 'click', 'scroll', 'extract', 'wait'];
      return validTypes.includes(action.type) && action.payload;
    }) || [];

    const response: BrowserResponse = {
      success: true,
      data: {
        actions: validatedActions,
        analysis: browserActions.analysis || 'Анализ выполнен',
        nextSteps: browserActions.nextSteps || ['Продолжить выполнение действий']
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Browser API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Ошибка обработки запроса: ${errorMessage}` 
      },
      { status: 500 }
    );
  }
}

// GET метод для получения статуса браузера
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'ready',
      capabilities: [
        'navigate',
        'search', 
        'click',
        'scroll',
        'extract',
        'wait'
      ],
      supportedSites: [
        'google.com',
        'wildberries.ru',
        'ozon.ru',
        'avito.ru',
        'yandex.ru'
      ]
    }
  });
}
