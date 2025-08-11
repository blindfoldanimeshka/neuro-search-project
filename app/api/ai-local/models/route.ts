import { NextRequest, NextResponse } from 'next/server';

// LM Studio API configuration
const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234';

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  parameters?: number;
  context_length?: number;
  format?: string;
  family?: string;
  architecture?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Проверяем доступность LM Studio
    const availabilityResponse = await fetch(`${LM_STUDIO_BASE_URL}/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!availabilityResponse.ok) {
      return NextResponse.json({
        available: false,
        error: 'LM Studio недоступен',
        models: [],
        details: `Не удалось подключиться к ${LM_STUDIO_BASE_URL}. Убедитесь, что LM Studio запущен.`
      });
    }

    const data = await availabilityResponse.json();
    const models: ModelInfo[] = data.data || [];

    // Форматируем информацию о моделях
    const formattedModels = models.map((model: any) => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description || `Модель ${model.id}`,
      parameters: model.parameters,
      context_length: model.context_length,
      format: model.format,
      family: model.family,
      architecture: model.architecture
    }));

    return NextResponse.json({
      available: true,
      models: formattedModels,
      total: formattedModels.length,
      defaultModel: process.env.LOCAL_AI_MODEL || 'default'
    });

  } catch (error) {
    console.error('Error fetching models:', error);
    
    return NextResponse.json({
      available: false,
      error: 'Ошибка при получении списка моделей',
      models: [],
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    });
  }
}
