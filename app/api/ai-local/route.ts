import { NextRequest, NextResponse } from 'next/server';

// LM Studio API configuration
const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234';
const DEFAULT_MODEL = process.env.LOCAL_AI_MODEL || 'default';

interface LocalAIRequest {
  message: string;
  context?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  include_thoughts?: boolean;
}

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
}

// Функция для получения списка доступных моделей
async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${LM_STUDIO_BASE_URL}/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

// Функция для извлечения мыслей из ответа модели
function extractThoughts(response: string): Array<{
  id: string;
  thought: string;
  reasoning?: string;
  confidence?: number;
  step?: number;
}> {
  const thoughts: Array<{
    id: string;
    thought: string;
    reasoning?: string;
    confidence?: number;
    step?: number;
  }> = [];
  
  // Ищем мысли в различных форматах
  const thoughtPatterns = [
    // Основные паттерны мыслей
    /💭\s*Мысль[:\s]*([^\n]+)/gi,
    /🔍\s*Анализ[:\s]*([^\n]+)/gi,
    /🧠\s*Размышление[:\s]*([^\n]+)/gi,
    /💡\s*Идея[:\s]*([^\n]+)/gi,
    /🤔\s*Размышляю[:\s]*([^\n]+)/gi,
    /🎯\s*Цель[:\s]*([^\n]+)/gi,
    /⚡\s*Инсайт[:\s]*([^\n]+)/gi,
    /🔎\s*Исследую[:\s]*([^\n]+)/gi,
    // Альтернативные форматы
    /Мысль[:\s]*([^\n]+)/gi,
    /Анализ[:\s]*([^\n]+)/gi,
    /Размышление[:\s]*([^\n]+)/gi,
    /Идея[:\s]*([^\n]+)/gi
  ];
  
  let stepCount = 0;
  const usedThoughts = new Set<string>();
  
  thoughtPatterns.forEach(pattern => {
    const matches = response.matchAll(pattern);
    for (const match of matches) {
      const thoughtText = match[1]?.trim() || 'Мысль модели';
      
      // Проверяем, не дублируется ли мысль
      if (!usedThoughts.has(thoughtText.toLowerCase())) {
        stepCount++;
        usedThoughts.add(thoughtText.toLowerCase());
        
        // Определяем уровень уверенности на основе ключевых слов
        let confidence = 0.8; // По умолчанию
        const lowerThought = thoughtText.toLowerCase();
        
        if (lowerThought.includes('уверен') || lowerThought.includes('точно') || lowerThought.includes('определенно')) {
          confidence = 0.95;
        } else if (lowerThought.includes('возможно') || lowerThought.includes('может быть') || lowerThought.includes('потенциально')) {
          confidence = 0.6;
        } else if (lowerThought.includes('сомневаюсь') || lowerThought.includes('не уверен') || lowerThought.includes('под вопросом')) {
          confidence = 0.3;
        }
        
        thoughts.push({
          id: `thought_${Date.now()}_${stepCount}`,
          thought: thoughtText,
          step: stepCount,
          confidence: confidence,
          reasoning: generateReasoning(thoughtText)
        });
      }
    }
  });
  
  // Если мыслей не найдено, но есть длинный ответ, создаем обобщенную мысль
  if (thoughts.length === 0 && response.length > 100) {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      thoughts.push({
        id: `thought_${Date.now()}_1`,
        thought: sentences[0].trim(),
        step: 1,
        confidence: 0.7,
        reasoning: 'Автоматически извлеченная мысль из ответа модели'
      });
    }
  }
  
  return thoughts;
}

// Функция для генерации обоснования мысли
function generateReasoning(thought: string): string {
  const lowerThought = thought.toLowerCase();
  
  if (lowerThought.includes('анализ') || lowerThought.includes('анализирую')) {
    return 'Модель проводит анализ предоставленной информации';
  } else if (lowerThought.includes('поиск') || lowerThought.includes('ищу')) {
    return 'Модель ищет релевантную информацию';
  } else if (lowerThought.includes('сравниваю') || lowerThought.includes('сравнение')) {
    return 'Модель сравнивает различные варианты';
  } else if (lowerThought.includes('рекомендую') || lowerThought.includes('рекомендация')) {
    return 'Модель выдает рекомендации на основе анализа';
  } else if (lowerThought.includes('оцениваю') || lowerThought.includes('оценка')) {
    return 'Модель оценивает качество или характеристики';
  } else {
    return 'Модель обрабатывает информацию и формирует выводы';
  }
}

export async function GET() {
  try {
    const isAvailable = await checkLMStudioAvailability();
    if (!isAvailable) {
      return NextResponse.json({
        available: false,
        error: 'LM Studio недоступен',
        models: []
      });
    }

    const models = await getAvailableModels();
    return NextResponse.json({
      available: true,
      models,
      defaultModel: DEFAULT_MODEL
    });
  } catch (error) {
    return NextResponse.json({
      available: false,
      error: 'Ошибка при проверке доступности LM Studio',
      models: []
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, model = DEFAULT_MODEL, temperature = 0.7, max_tokens = 1000, include_thoughts = true }: LocalAIRequest = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Проверяем доступность LM Studio
    const isAvailable = await checkLMStudioAvailability();
    if (!isAvailable) {
      return NextResponse.json(
        { 
          error: 'Локальный ИИ недоступен. Проверьте, что LM Studio запущен и доступен по адресу: ' + LM_STUDIO_BASE_URL,
          details: 'LM Studio is not available. Please ensure it is running and accessible.',
          status: 'lm_studio_unavailable'
        },
        { status: 503 }
      );
    }

    // Формируем промпт с контекстом и инструкциями для мыслей
    const systemPrompt = `Ты - AI помощник для системы управления товарами. 
    
Контекст: ${context || 'Пользователь работает с системой поиска и управления товарами'}

Твои задачи:
1. Помогать пользователю в поиске товаров
2. Анализировать данные о товарах
3. Предоставлять рекомендации
4. Помогать с категоризацией товаров
5. Генерировать описания товаров
6. Отвечать на вопросы о товарах и их характеристиках

${include_thoughts ? `
ВАЖНО: При ответе на сложные вопросы используй формат мышления с эмодзи:

💭 Мысль: [твоя мысль о том, как подойти к решению]
🔍 Анализ: [анализ ситуации или проблемы]
💡 Идея: [идея или предложение]
🧠 Размышление: [глубокое размышление о теме]
🤔 Размышляю: [процесс обдумывания]
🎯 Цель: [что ты стремишься достичь]
⚡ Инсайт: [неожиданное понимание или озарение]
🔎 Исследую: [что ты исследуешь или изучаешь]

Пример ответа с мыслями:
💭 Мысль: Пользователь ищет товар, нужно проанализировать его потребности
🔍 Анализ: Это может быть поиск по конкретному товару или категории
💡 Идея: Предложу несколько вариантов поиска и источников
🧠 Размышление: Учитывая контекст системы, лучше всего подойдет...

Используй эти эмодзи-мысли только когда это уместно и добавляет ценность к ответу.` : ''}

Отвечай на русском языке, будь полезным и дружелюбным. Используй эмодзи для лучшего восприятия.`;

    // Подготавливаем запрос к LM Studio
    const lmStudioRequest = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: temperature,
      max_tokens: max_tokens,
      stream: false
    };

    // Отправляем запрос к LM Studio
    const response = await fetch(`${LM_STUDIO_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lmStudioRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LM Studio API Error:', response.status, errorText);
      
      // Проверяем, недоступен ли LM Studio
      if (response.status === 503 || response.status === 404) {
        return NextResponse.json(
          { 
            error: 'Локальный ИИ недоступен. Проверьте, что LM Studio запущен и доступен по адресу: ' + LM_STUDIO_BASE_URL,
            details: 'LM Studio is not available. Please ensure it is running and accessible.',
            status: 'lm_studio_unavailable'
          },
          { status: 503 }
        );
      }

      // Проверяем, не существует ли модель
      if (response.status === 400 && errorText.includes('model')) {
        return NextResponse.json(
          { 
            error: `Модель "${model}" не найдена. Проверьте, что модель загружена в LM Studio.`,
            details: `Model "${model}" not found. Please ensure the model is loaded in LM Studio.`,
            status: 'model_not_found'
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Ошибка при обращении к локальному ИИ',
          details: errorText,
          status: 'lm_studio_error'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Извините, не удалось получить ответ от локального ИИ';

    // Извлекаем мысли из ответа
    const thoughts = include_thoughts ? extractThoughts(aiResponse) : [];

    const result: LocalAIResponse = {
      response: aiResponse,
      model: model,
      thoughts: thoughts.length > 0 ? thoughts : undefined,
      usage: data.usage
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Local AI API Error:', error);
    
    // Проверяем, доступен ли LM Studio
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          error: 'Локальный ИИ недоступен. Проверьте, что LM Studio запущен и доступен.',
          details: 'LM Studio is not accessible. Please ensure it is running.',
          status: 'lm_studio_unavailable'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Ошибка при обработке запроса к локальному ИИ. Попробуйте еще раз.' },
      { status: 500 }
    );
  }
}

