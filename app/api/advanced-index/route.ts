import { NextRequest, NextResponse } from 'next/server';
import { advancedSearchIndex } from '@/lib/advanced-search-index';
import { ScrapedProduct } from '@/lib/web-scraper-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (Array.isArray(body)) {
      // Массовое добавление товаров
      const products: ScrapedProduct[] = body;
      
      for (const product of products) {
        await advancedSearchIndex.addProduct(product);
      }
      
      return NextResponse.json({
        message: `Successfully indexed ${products.length} products`,
        indexed: products.length
      });
    } else if (body.product) {
      // Добавление одного товара
      const product: ScrapedProduct = body.product;
      await advancedSearchIndex.addProduct(product);
      
      return NextResponse.json({
        message: 'Product successfully indexed',
        productId: product.id
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid request body. Expected array of products or single product object.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Advanced index POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error during indexing' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = advancedSearchIndex.getIndexStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Advanced index GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error while getting index stats' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    advancedSearchIndex.clearIndex();
    return NextResponse.json({
      message: 'Advanced search index cleared successfully'
    });
  } catch (error) {
    console.error('Advanced index DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error while clearing index' },
      { status: 500 }
    );
  }
}
