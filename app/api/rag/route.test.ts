import { GET, POST } from './route';
import { NextRequest } from 'next/server';

describe('/api/rag endpoint', () => {
  describe('GET /api/rag', () => {
    it('should return RAG status', async () => {
      const request = new NextRequest('http://localhost:3000/api/rag');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.rag).toBeDefined();
      expect(data.rag.configured).toBe(true);
    });
  });

  describe('POST /api/rag', () => {
    it('should reject empty query', async () => {
      const request = new NextRequest('http://localhost:3000/api/rag', {
        method: 'POST',
        body: JSON.stringify({ query: '' }),
      });
      
      const response = await POST(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Query is required');
    });

    it('should handle valid query', async () => {
      // Mock fetch для LM Studio
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false, // LM Studio не доступен в тестах
          json: () => Promise.resolve({ data: [] }),
        })
      ) as jest.Mock;

      const request = new NextRequest('http://localhost:3000/api/rag', {
        method: 'POST',
        body: JSON.stringify({ query: 'смартфон' }),
      });
      
      const response = await POST(request);
      expect(response.status).toBe(503); // Service unavailable
      
      const data = await response.json();
      expect(data.error).toContain('LM Studio недоступен');
    });
  });
});