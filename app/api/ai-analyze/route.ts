import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Инициализация OpenAI клиента для OpenRouter
const openai = process.env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
}) : null;

const DEFAULT_MODEL = process.env.DEFAULT_AI_MODEL || 'deepseek/deepseek-chat-v3-0324:free';

interface AnalyzeRequest {
  message: string;
  context?: string;
}

interface AnalyzeResponse {
  isSearchQuery: boolean;
  query: string;
  category: 'goszakupki' | 'marketplaces' | 'private' | 'all';
  categoryName: string;
  confidence: number;
  suggestions?: string[];
  analysis?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, context = '' }: AnalyzeRequest = await request.json();

    if (!process.env.OPENROUTER_API_KEY || !openai) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured. Please create .env.local file with OPENROUTER_API_KEY' },
        { status: 500 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const systemPrompt = `Ты - эксперт по анализу поисковых запросов для системы поиска товаров.

Задача: Проанализируй сообщение пользователя и определи, является ли оно поисковым запросом, извлеки поисковый запрос и определи категорию.

Категории поиска:
- goszakupki: Госзакупки, тендеры, государственные закупки
- marketplaces: Маркетплейсы (Wildberries, Ozon, Яндекс.Маркет, СберМегаМаркет)
- private: Частные объявления (Авито, Юла, Из рук в руки)
- all: Все источники (по умолчанию)

Ключевые слова для определения категорий:
- Госзакупки: "госзакупки", "тендеры", "государственные закупки", "zakupki.gov.ru"
- Маркетплейсы: "маркетплейс", "wildberries", "ozon", "яндекс маркет", "сбермегамаркет"
- Частные объявления: "частные", "авито", "юла", "из рук в руки"

Верни JSON в следующем формате:
{
  "isSearchQuery": boolean,
  "query": "извлеченный поисковый запрос",
  "category": "goszakupki|marketplaces|private|all",
  "categoryName": "название категории на русском",
  "confidence": 0.95,
  "suggestions": ["предложение 1", "предложение 2"],
  "analysis": "краткий анализ запроса"
}

Контекст: ${context}`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    try {
      const analysis: AnalyzeResponse = JSON.parse(response);
      
      return NextResponse.json({
        success: true,
        data: analysis
      });
    } catch (parseError) {
      // Если не удалось распарсить JSON, возвращаем базовый анализ
      const basicAnalysis: AnalyzeResponse = {
        isSearchQuery: message.toLowerCase().includes('найди') || message.toLowerCase().includes('поиск'),
        query: message.replace(/найди|поиск|ищи|найти|покажи/gi, '').trim(),
        category: 'all',
        categoryName: 'Все источники',
        confidence: 0.5,
        analysis: 'Базовый анализ запроса'
      };
      
      return NextResponse.json({
        success: true,
        data: basicAnalysis
      });
    }

  } catch (error) {
    console.error('AI analyze API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка при анализе запроса',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
} 