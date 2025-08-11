export interface Product {
  name: string;
  price: number | null;
  currency?: string;
  description: string;
  imageUrl?: string;
  availability?: string;
  rating?: number;
  reviewCount?: number;
}

export interface ScrapingOptions {
  url: string;
  usePlaywright?: boolean;
  waitForSelector?: string;
  timeout?: number;
}

export interface NeuroParsingOptions {
  model: 'openrouter' | 'lmstudio';
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  fallbackToLocal?: boolean;
}

export interface NeuroScrapeRequest {
  url: string;
  scrapingOptions?: Partial<ScrapingOptions>;
  parsingOptions?: Partial<NeuroParsingOptions>;
}

export interface NeuroScrapeResponse {
  success: boolean;
  products: Product[];
  rawHtml?: string;
  error?: string;
  model?: string;
  processingTime?: number;
}

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface LMStudioConfig {
  baseUrl: string;
  model?: string;
}