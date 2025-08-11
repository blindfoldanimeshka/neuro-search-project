import { NextRequest, NextResponse } from 'next/server';

// Тестовый endpoint для проверки интеграции RAG с ИИ
export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[]
  };

  // 1. Проверка доступности LM Studio
  try {
    const lmStudioUrl = process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234';
    const lmResponse = await fetch(`${lmStudioUrl}/v1/models`);
    const lmData = await lmResponse.json();
    
    results.tests.push({
      name: 'LM Studio доступность',
      status: lmResponse.ok ? 'success' : 'failed',
      details: {
        endpoint: `${lmStudioUrl}/v1/models`,
        available: lmResponse.ok,
        models: lmData.data?.map((m: any) => m.id) || []
      }
    });
  } catch (error) {
    results.tests.push({
      name: 'LM Studio доступность',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // 2. Проверка OpenRouter API
  try {
    const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
    results.tests.push({
      name: 'OpenRouter API конфигурация',
      status: hasOpenRouterKey ? 'success' : 'warning',
      details: {
        configured: hasOpenRouterKey,
        model: process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-chat-v3-0324:free'
      }
    });
  } catch (error) {
    results.tests.push({
      name: 'OpenRouter API конфигурация',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // 3. Проверка RAG endpoint
  try {
    const ragResponse = await fetch(`${request.nextUrl.origin}/api/rag`);
    const ragData = await ragResponse.json();
    
    results.tests.push({
      name: 'RAG API endpoint',
      status: ragResponse.ok ? 'success' : 'failed',
      details: {
        endpoint: '/api/rag',
        available: ragResponse.ok,
        ragStatus: ragData.status,
        lmStudioAvailable: ragData.rag?.lmStudio?.available
      }
    });
  } catch (error) {
    results.tests.push({
      name: 'RAG API endpoint',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // 4. Тест простого RAG запроса
  try {
    const testQuery = 'тестовый запрос для проверки RAG';
    const ragSearchResponse = await fetch(`${request.nextUrl.origin}/api/rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: testQuery })
    });
    
    const ragSearchData = await ragSearchResponse.json();
    
    results.tests.push({
      name: 'RAG поиск функциональность',
      status: ragSearchResponse.ok ? 'success' : 'failed',
      details: {
        query: testQuery,
        responseOk: ragSearchResponse.ok,
        hasProducts: ragSearchData.data?.products?.length > 0,
        hasDescription: !!ragSearchData.data?.generatedDescription,
        error: ragSearchData.error
      }
    });
  } catch (error) {
    results.tests.push({
      name: 'RAG поиск функциональность',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // 5. Проверка других AI endpoints
  const aiEndpoints = [
    '/api/ai',
    '/api/ai-assistant',
    '/api/ai-local',
    '/api/ai-analyze',
    '/api/ai-search'
  ];

  for (const endpoint of aiEndpoints) {
    try {
      const response = await fetch(`${request.nextUrl.origin}${endpoint}`, {
        method: endpoint === '/api/ai-local/models' ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: endpoint === '/api/ai-local/models' ? undefined : JSON.stringify({ 
          message: 'test',
          query: 'test' 
        })
      });
      
      results.tests.push({
        name: `AI endpoint ${endpoint}`,
        status: response.status < 500 ? 'success' : 'failed',
        details: {
          statusCode: response.status,
          available: response.status < 500
        }
      });
    } catch (error) {
      results.tests.push({
        name: `AI endpoint ${endpoint}`,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Итоговая статистика
  const summary = {
    total: results.tests.length,
    success: results.tests.filter(t => t.status === 'success').length,
    failed: results.tests.filter(t => t.status === 'failed').length,
    errors: results.tests.filter(t => t.status === 'error').length,
    warnings: results.tests.filter(t => t.status === 'warning').length
  };

  return NextResponse.json({
    ...results,
    summary,
    analysis: {
      ragIntegrationStatus: summary.errors === 0 && summary.failed === 0 ? 'working' : 'issues',
      lmStudioRequired: !results.tests.find(t => t.name === 'LM Studio доступность')?.details?.available,
      openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
      recommendations: generateRecommendations(results.tests)
    }
  });
}

function generateRecommendations(tests: any[]): string[] {
  const recommendations: string[] = [];
  
  const lmStudioTest = tests.find(t => t.name === 'LM Studio доступность');
  if (lmStudioTest?.status !== 'success') {
    recommendations.push('Запустите LM Studio для работы RAG системы');
  }
  
  const openRouterTest = tests.find(t => t.name === 'OpenRouter API конфигурация');
  if (openRouterTest?.status === 'warning') {
    recommendations.push('Добавьте OPENROUTER_API_KEY в .env.local для полной функциональности AI');
  }
  
  const ragTest = tests.find(t => t.name === 'RAG поиск функциональность');
  if (ragTest?.status === 'failed' && ragTest?.details?.error?.includes('LM Studio недоступен')) {
    recommendations.push('RAG требует запущенный LM Studio с моделью qwen3-4b');
  }
  
  return recommendations;
}