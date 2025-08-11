export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  seller: string;
  source: string;
  url: string;
  image?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  availability: boolean;
  deliveryTime?: string;
  location?: string;
}

export interface Filters {
  yearFrom: number;
  yearTo: number;
  priceFrom: number;
  priceTo: number;
  category: string;
  subcategory: string;
}

export interface AIThought {
  id: string;
  thought: string;
  reasoning?: string;
  confidence?: number;
  step?: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thoughts?: AIThought[]; // Мысли модели
  searchResult?: unknown; // Опциональное поле для результатов поиска
  productInfo?: {
    name?: string;
    description?: string;
    price?: string;
    category?: string;
    source?: string;
  };
  metadata?: {
    model?: string;
    processingTime?: number;
    tokensUsed?: number;
    confidence?: number;
  };
} 