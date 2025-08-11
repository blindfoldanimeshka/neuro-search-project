interface DuckDuckGoResponse {
  Abstract: string;
  AbstractText: string;
  AbstractSource: string;
  AbstractURL: string;
  Image: string;
  Heading: string;
  Answer: string;
  AnswerType: string;
  Definition: string;
  DefinitionSource: string;
  RelatedTopics: Array<{
    FirstURL: string;
    Icon: {
      URL: string;
      Height: string;
      Width: string;
    };
    Result: string;
    Text: string;
  }>;
  Results: Array<{
    FirstURL: string;
    Icon: {
      URL: string;
      Height: string;
      Width: string;
    };
    Result: string;
    Text: string;
  }>;
  Type: string;
}

export async function searchDuckDuckGo(query: string): Promise<DuckDuckGoResponse | null> {
  try {
    // DuckDuckGo Instant Answer API
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data: DuckDuckGoResponse = await response.json();
    
    // Проверяем, есть ли полезная информация
    if (data.Abstract || data.Answer || data.Definition || data.RelatedTopics?.length > 0 || data.Heading) {
      return data;
    }
    
    // Если нет готового ответа, но есть результаты поиска
    if (data.Results && data.Results.length > 0) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('DuckDuckGo API Error:', error);
    return null;
  }
}

export function formatDuckDuckGoResponse(data: DuckDuckGoResponse): string {
  let result = '';
  
  if (data.Heading) {
    result += `**${data.Heading}**\n\n`;
  }
  
  if (data.Abstract) {
    result += `${data.Abstract}\n\n`;
  }
  
  if (data.Answer) {
    result += `**Ответ:** ${data.Answer}\n\n`;
  }
  
  if (data.Definition) {
    result += `**Определение:** ${data.Definition}\n\n`;
  }
  
  if (data.RelatedTopics && data.RelatedTopics.length > 0) {
    result += `**Связанные темы:**\n`;
    data.RelatedTopics.slice(0, 3).forEach(topic => {
      result += `• ${topic.Text}\n`;
    });
    result += '\n';
  }
  
  // Если есть результаты поиска, но нет готового ответа
  if (data.Results && data.Results.length > 0 && !data.Abstract && !data.Answer) {
    result += `**Результаты поиска:**\n`;
    data.Results.slice(0, 3).forEach(result_item => {
      result += `• ${result_item.Text}\n`;
    });
    result += '\n';
  }
  
  if (data.AbstractSource) {
    result += `*Источник: ${data.AbstractSource}*\n`;
  }
  
  // Если нет никакой информации, возвращаем сообщение
  if (!result.trim()) {
    return 'К сожалению, для данного запроса не найдено готовой информации в базе знаний DuckDuckGo. Попробуйте переформулировать запрос или использовать другую модель AI.';
  }
  
  return result.trim();
}

export function extractProductInfoFromDuckDuckGo(data: DuckDuckGoResponse): {
  name?: string;
  description?: string;
  price?: string;
  category?: string;
  source?: string;
} {
  const info: any = {};
  
  if (data.Heading) {
    info.name = data.Heading;
  }
  
  if (data.Abstract) {
    info.description = data.Abstract;
  }
  
  if (data.AbstractSource) {
    info.source = data.AbstractSource;
  }
  
  // Извлекаем цену из ответа, если есть
  const priceMatch = data.Answer?.match(/(\d+[\.,]\d+|\d+)\s*(руб|₽|USD|\$)/i);
  if (priceMatch) {
    info.price = priceMatch[0];
  }
  
  return info;
} 