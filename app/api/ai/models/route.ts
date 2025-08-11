import { NextRequest, NextResponse } from 'next/server';

interface AIModel {
  id: string;
  name: string;
  description?: string;
  parameters?: number;
  context_length?: number;
  format?: string;
  family?: string;
  architecture?: string;
  provider?: string;
  cost?: string;
  type?: 'openrouter' | 'lmstudio' | 'neuroparser';
}

export async function GET(request: NextRequest) {
  try {
    const allModels: AIModel[] = [];
    const modelsByType = {
      openrouter: [] as AIModel[],
      lmstudio: [] as AIModel[],
      neuroparser: [] as AIModel[]
    };

    // Модели OpenRouter (только DeepSeek)
    const openRouterModels: AIModel[] = [
      {
        id: 'deepseek/deepseek-chat-v3-0324:free',
        name: 'DeepSeek Chat',
        description: 'Быстрая и умная модель для чата',
        parameters: 32,
        family: 'DeepSeek',
        provider: 'OpenRouter',
        cost: 'Бесплатно',
        type: 'openrouter'
      }
    ];
    
    allModels.push(...openRouterModels);
    modelsByType.openrouter = openRouterModels;

    // Нейропарсер модель (использует OpenRouter)
    const neuroParserModel: AIModel = {
      id: 'neuroparser',
      name: 'NeuroParser AI',
      description: 'Интеллектуальный парсер товаров с маркетплейсов',
      provider: 'NeuroParser (OpenRouter)',
      cost: 'По запросу',
      type: 'neuroparser'
    };
    
    allModels.push(neuroParserModel);
    modelsByType.neuroparser = [neuroParserModel];

    // Проверка доступности OpenRouter
    let openRouterStatus = 'unavailable';
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const testResponse = await fetch('https://openrouter.ai/api/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        });
        openRouterStatus = testResponse.ok ? 'available' : 'error';
      } catch (error) {
        openRouterStatus = 'error';
      }
    }

    // Пробуем загрузить локальные модели из LM Studio
    let lmStudioStatus = 'unavailable';
    try {
      const localResponse = await fetch(`${process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234'}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });

      if (localResponse.ok) {
        lmStudioStatus = 'available';
        const localData = await localResponse.json();
        if (localData.data && localData.data.length > 0) {
          const localModels: AIModel[] = localData.data.map((model: any) => ({
            id: model.id,
            name: model.name || model.id,
            description: model.description || `Локальная модель ${model.id}`,
            parameters: model.parameters,
            context_length: model.context_length,
            format: model.format,
            family: model.family,
            architecture: model.architecture,
            provider: 'LM Studio (Local)',
            cost: 'Бесплатно (локально)',
            type: 'lmstudio' as const
          }));

          allModels.push(...localModels);
          modelsByType.lmstudio = localModels;
        }
      }
    } catch (error) {
      console.log('LM Studio недоступен:', error);
      lmStudioStatus = 'unavailable';
    }

    // Возвращаем ответ с типами моделей и статусом провайдеров
    return NextResponse.json({
      success: true,
      models: allModels,
      modelsByType: modelsByType,
      total: allModels.length,
      counts: {
        openrouter: modelsByType.openrouter.length,
        lmstudio: modelsByType.lmstudio.length,
        neuroparser: modelsByType.neuroparser.length
      },
      status: {
        openrouter: openRouterStatus,
        lmstudio: lmStudioStatus
      },
      defaultModel: process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-chat-v3-0324:free'
    });

  } catch (error) {
    console.error('Error fetching models:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Ошибка при получении списка моделей',
      models: [],
      modelsByType: {
        openrouter: [],
        lmstudio: [],
        neuroparser: []
      },
      status: {
        openrouter: 'error',
        lmstudio: 'error'
      },
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
}