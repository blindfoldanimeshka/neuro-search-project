'use client';

import { useState } from 'react';
import { Product, NeuroScrapeResponse } from '@/app/types/neuro';

interface NeuroParserResultsProps {
  onParse?: (url: string) => void;
}

export default function NeuroParserResults({ onParse }: NeuroParserResultsProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NeuroScrapeResponse | null>(null);
  const [usePlaywright, setUsePlaywright] = useState(false);
  const [model, setModel] = useState<'openrouter' | 'lmstudio'>('openrouter');
  const [fallbackEnabled, setFallbackEnabled] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) return;

    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/neuro-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          scrapingOptions: {
            usePlaywright,
          },
          parsingOptions: {
            model,
            fallbackToLocal: fallbackEnabled,
          },
        }),
      });

      const data: NeuroScrapeResponse = await response.json();
      setResults(data);
      
      if (onParse) {
        onParse(url);
      }
    } catch (error) {
      setResults({
        success: false,
        products: [],
        error: 'Failed to connect to the server',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (product: Product) => {
    if (product.price === null) return 'N/A';
    return `${product.currency || '$'}${product.price.toFixed(2)}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Neural Product Parser
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product Page URL
            </label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/products"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={usePlaywright}
                onChange={(e) => setUsePlaywright(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Use Playwright (for JS-rendered sites)
              </span>
            </label>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Model:</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as 'openrouter' | 'lmstudio')}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="lmstudio">LM Studio</option>
              </select>
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={fallbackEnabled}
                onChange={(e) => setFallbackEnabled(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Fallback to local model
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Parsing...' : 'Parse Products'}
          </button>
        </form>

        {results && (
          <div className="space-y-4">
            {results.success ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Found {results.products.length} products
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Model: {results.model} | Time: {results.processingTime}ms
                  </div>
                </div>

                {results.products.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.products.map((product, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-48 object-cover mb-3 rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {product.name}
                        </h4>
                        
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {formatPrice(product)}
                        </p>
                        
                        {product.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {product.description.length > 150
                              ? product.description.substring(0, 150) + '...'
                              : product.description}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center text-sm">
                          {product.availability && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              product.availability.toLowerCase().includes('stock')
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {product.availability}
                            </span>
                          )}
                          
                          {product.rating && (
                            <div className="text-gray-600 dark:text-gray-400">
                              ⭐ {product.rating.toFixed(1)}
                              {product.reviewCount && ` (${product.reviewCount})`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    No products found on this page
                  </p>
                )}
              </>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-red-800 dark:text-red-200">
                  Error: {results.error}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}