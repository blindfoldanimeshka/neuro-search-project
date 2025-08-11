import { Product, NeuroParsingOptions, OpenRouterConfig, LMStudioConfig } from '@/app/types/neuro';

const DEFAULT_PARSING_PROMPT = `
Analyze the following HTML content and extract product information.
Return a JSON array of products with the following structure:
{
  "name": "Product name",
  "price": numeric price or null,
  "currency": "USD/EUR/etc",
  "description": "Product description",
  "imageUrl": "Image URL if available",
  "availability": "In stock/Out of stock/etc",
  "rating": numeric rating if available,
  "reviewCount": number of reviews if available
}

Focus on extracting actual products, not navigation elements or advertisements.
If no products are found, return an empty array [].

HTML Content:
`;

export class NeuroParser {
  private openRouterConfig: OpenRouterConfig;
  private lmStudioConfig: LMStudioConfig;

  constructor() {
    this.openRouterConfig = {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
      baseUrl: 'https://openrouter.ai/api/v1'
    };

    this.lmStudioConfig = {
      baseUrl: process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234',
      model: process.env.LMSTUDIO_MODEL || 'qwen/qwen3-4b'
    };
  }

  async parseWithOpenRouter(
    html: string, 
    options: Partial<NeuroParsingOptions> = {}
  ): Promise<{ products: Product[], model: string }> {
    const prompt = options.prompt || DEFAULT_PARSING_PROMPT;
    
    try {
      const response = await fetch(`${this.openRouterConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterConfig.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
          'X-Title': 'Product Parser'
        },
        body: JSON.stringify({
          model: this.openRouterConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that extracts structured product data from HTML. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt + html.substring(0, 10000) // Limit HTML size
            }
          ],
          temperature: options.temperature || 0.3,
          max_tokens: options.maxTokens || 2000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in OpenRouter response');
      }

      const parsed = JSON.parse(content);
      const products = Array.isArray(parsed) ? parsed : (parsed.products || []);
      
      return {
        products: this.validateProducts(products),
        model: this.openRouterConfig.model
      };
    } catch (error) {
      throw new Error(`OpenRouter parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async parseWithLMStudio(
    html: string,
    options: Partial<NeuroParsingOptions> = {}
  ): Promise<{ products: Product[], model: string }> {
    const prompt = options.prompt || DEFAULT_PARSING_PROMPT;
    
    try {
      // Используем правильный эндпоинт для LM Studio
      const response = await fetch(`${this.lmStudioConfig.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.lmStudioConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that extracts structured product data from HTML. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt + html.substring(0, 10000)
            }
          ],
          temperature: options.temperature || 0.3,
          max_tokens: options.maxTokens || 2000,
          stream: false,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LM Studio API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in LM Studio response');
      }

      const parsed = JSON.parse(content);
      const products = Array.isArray(parsed) ? parsed : (parsed.products || []);
      
      return {
        products: this.validateProducts(products),
        model: this.lmStudioConfig.model || 'lmstudio'
      };
    } catch (error) {
      throw new Error(`LM Studio parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async parse(
    html: string,
    options: Partial<NeuroParsingOptions> = {}
  ): Promise<{ products: Product[], model: string }> {
    const model = options.model || 'openrouter';
    
    try {
      if (model === 'openrouter') {
        return await this.parseWithOpenRouter(html, options);
      } else if (model === 'lmstudio') {
        return await this.parseWithLMStudio(html, options);
      }
      
      throw new Error(`Unknown model: ${model}`);
    } catch (error) {
      if (options.fallbackToLocal && model === 'openrouter') {
        console.log('OpenRouter failed, falling back to LM Studio:', error);
        return await this.parseWithLMStudio(html, options);
      }
      throw error;
    }
  }

  private validateProducts(products: any[]): Product[] {
    return products.map(product => ({
      name: String(product.name || ''),
      price: typeof product.price === 'number' ? product.price : null,
      currency: product.currency || undefined,
      description: String(product.description || ''),
      imageUrl: product.imageUrl || undefined,
      availability: product.availability || undefined,
      rating: typeof product.rating === 'number' ? product.rating : undefined,
      reviewCount: typeof product.reviewCount === 'number' ? product.reviewCount : undefined
    })).filter(p => p.name && p.name.length > 0);
  }
}