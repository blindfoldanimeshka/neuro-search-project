import NeuroParserResults from '@/app/components/NeuroParserResults';

export default function NeuroParserTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Neural Product Parser Demo
        </h1>
        
        <NeuroParserResults />
        
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
              How it works:
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
              <li>Enter a product page URL (e-commerce site, marketplace, etc.)</li>
              <li>Choose scraping method (Cheerio for static, Playwright for JS-rendered)</li>
              <li>Select AI model (OpenRouter cloud or LM Studio local)</li>
              <li>The neural parser extracts structured product data automatically</li>
            </ol>
          </div>
          
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3 text-yellow-900 dark:text-yellow-100">
              Setup Requirements:
            </h2>
            <ul className="list-disc list-inside space-y-2 text-yellow-800 dark:text-yellow-200">
              <li>OpenRouter API key in .env.local (OPENROUTER_API_KEY)</li>
              <li>LM Studio running locally on port 1234 (optional)</li>
              <li>Playwright browsers installed: npx playwright install</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}