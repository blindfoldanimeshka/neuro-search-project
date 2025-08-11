import { NextRequest, NextResponse } from 'next/server';
import { RAGSystem, RAGConfig } from '../../../rag-setup/rag-integration';

// Загружаем конфигурацию
const ragConfig: RAGConfig = {
  lmStudio: {
    model: {
      name: process.env.LOCAL_AI_MODEL || "qwen/qwen3-4b",
      architecture: "qwen3",
      parameters: "4B",
      quantization: "Q4_K_M",
      size: "2.50 GB"
    },
    api: {
      endpoint: process.env.LM_STUDIO_BASE_URL || "http://127.0.0.1:1234/v1",
      timeout: parseInt(process.env.LM_STUDIO_TIMEOUT || "30000"),
      maxRetries: 3
    },
    features: {
      functionCalling: true,
      toolUse: true,
      streaming: true
    }
  },
  rag: {
    retriever: {
      maxResults: 10,
      similarityThreshold: 0.7,
      searchEngines: ["duckduckgo", "google", "bing"]
    },
    generator: {
      maxTokens: parseInt(process.env.LM_STUDIO_MAX_TOKENS || "1000"),
      temperature: parseFloat(process.env.LM_STUDIO_TEMPERATURE || "0.7"),
      topP: 0.9
    },
    knowledgeBase: {
      type: "vector",
      embeddingModel: "text-embedding-ada-002",
      chunkSize: 512,
      overlap: 50
    }
  }
};

// Создаем экземпляр RAG системы
const ragSystem = new RAGSystem(ragConfig);

export async function POST(request: NextRequest) {
  try {
    const { query, options = {} } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Проверяем доступность LM Studio
    const lmStudioHealthCheck = await fetch(`${ragConfig.lmStudio.api.endpoint}/models`);
    if (!lmStudioHealthCheck.ok) {
      return NextResponse.json(
        { 
          error: 'LM Studio недоступен',
          details: 'Убедитесь, что LM Studio запущен и доступен по адресу: ' + ragConfig.lmStudio.api.endpoint
        },
        { status: 503 }
      );
    }

    // Выполняем RAG поиск
    const result = await ragSystem.searchProducts(query);

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        model: ragConfig.lmStudio.model.name,
        searchEngines: ragConfig.rag.retriever.searchEngines,
        productsFound: result.products.length
      }
    });

  } catch (error) {
    console.error('RAG API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка при выполнении RAG поиска',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Проверяем статус RAG системы
    const lmStudioCheck = await fetch(`${ragConfig.lmStudio.api.endpoint}/models`);
    const lmStudioAvailable = lmStudioCheck.ok;
    
    let models = [];
    if (lmStudioAvailable) {
      const modelsData = await lmStudioCheck.json();
      models = modelsData.data || [];
    }

    return NextResponse.json({
      status: 'ok',
      rag: {
        configured: true,
        lmStudio: {
          available: lmStudioAvailable,
          endpoint: ragConfig.lmStudio.api.endpoint,
          models: models
        },
        searchEngines: ragConfig.rag.retriever.searchEngines,
        config: {
          maxResults: ragConfig.rag.retriever.maxResults,
          temperature: ragConfig.rag.generator.temperature,
          maxTokens: ragConfig.rag.generator.maxTokens
        }
      }
    });

  } catch (error) {
    console.error('RAG status check error:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Ошибка при проверке статуса RAG системы',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}