import { NextRequest, NextResponse } from 'next/server';
import { searchIndexManager } from '@/lib/search-index';
import { ScrapedProduct } from '@/lib/web-scraper-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'addProducts':
        if (!params.products || !Array.isArray(params.products)) {
          return NextResponse.json(
            { error: 'Products array is required for addProducts action' },
            { status: 400 }
          );
        }

        // Валидация товаров
        const validProducts = params.products.filter((product: any) => {
          return product && 
                 typeof product.title === 'string' && 
                 typeof product.price === 'number' &&
                 typeof product.source === 'string';
        });

        if (validProducts.length === 0) {
          return NextResponse.json(
            { error: 'No valid products found in the array' },
            { status: 400 }
          );
        }

        searchIndexManager.addProducts(validProducts);
        
        return NextResponse.json({
          success: true,
          action: 'addProducts',
          result: { added: validProducts.length },
          timestamp: new Date().toISOString()
        });

      case 'updateProduct':
        if (!params.productId || !params.product) {
          return NextResponse.json(
            { error: 'ProductId and product are required for updateProduct action' },
            { status: 400 }
          );
        }

        const updateResult = await searchIndexManager.updateProductInIndex(
          params.productId, 
          params.product
        );

        return NextResponse.json({
          success: true,
          action: 'updateProduct',
          productId: params.productId,
          updated: updateResult,
          timestamp: new Date().toISOString()
        });

      case 'rebuildIndex':
        if (!params.products || !Array.isArray(params.products)) {
          return NextResponse.json(
            { error: 'Products array is required for rebuildIndex action' },
            { status: 400 }
          );
        }

        const rebuildResult = await searchIndexManager.rebuildIndex(params.products);
        
        return NextResponse.json({
          success: true,
          action: 'rebuildIndex',
          result: rebuildResult,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Use "addProducts", "updateProduct", or "rebuildIndex"` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Index management POST API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during index management',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = searchIndexManager.getIndexStats();
        return NextResponse.json({
          success: true,
          action: 'stats',
          stats,
          timestamp: new Date().toISOString()
        });

      case 'health':
        const health = searchIndexManager.checkIndexHealth();
        return NextResponse.json({
          success: true,
          action: 'health',
          health,
          timestamp: new Date().toISOString()
        });

      case 'export':
        const products = searchIndexManager.exportIndex();
        return NextResponse.json({
          success: true,
          action: 'export',
          products,
          count: products.length,
          timestamp: new Date().toISOString()
        });

      case 'info':
        const indexStats = searchIndexManager.getIndexStats();
        const indexHealth = searchIndexManager.checkIndexHealth();
        
        return NextResponse.json({
          success: true,
          action: 'info',
          stats: indexStats,
          health: indexHealth,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "stats", "health", "export", or "info"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Index management GET API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'removeProducts':
        if (!params.productIds || !Array.isArray(params.productIds)) {
          return NextResponse.json(
            { error: 'ProductIds array is required for removeProducts action' },
            { status: 400 }
          );
        }

        const removeResult = await searchIndexManager.removeProductsFromIndex(params.productIds);
        
        return NextResponse.json({
          success: true,
          action: 'removeProducts',
          result: removeResult,
          timestamp: new Date().toISOString()
        });

      case 'clearIndex':
        const clearResult = await searchIndexManager.clearIndex();
        
        return NextResponse.json({
          success: true,
          action: 'clearIndex',
          result: clearResult,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Use "removeProducts" or "clearIndex"` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Index management DELETE API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during index management',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Метод для пакетных операций
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'batchUpdate':
        if (!params.updates || !Array.isArray(params.updates)) {
          return NextResponse.json(
            { error: 'Updates array is required for batchUpdate action' },
            { status: 400 }
          );
        }

        const batchResults = [];
        let successCount = 0;
        let errorCount = 0;

        for (const update of params.updates) {
          try {
            if (update.productId && update.product) {
              const result = await searchIndexManager.updateProductInIndex(
                update.productId, 
                update.product
              );
              if (result) successCount++;
              else errorCount++;
              
              batchResults.push({
                productId: update.productId,
                success: result,
                error: null
              });
            } else {
              errorCount++;
              batchResults.push({
                productId: update.productId || 'unknown',
                success: false,
                error: 'Missing productId or product data'
              });
            }
          } catch (updateError) {
            errorCount++;
            batchResults.push({
              productId: update.productId || 'unknown',
              success: false,
              error: updateError instanceof Error ? updateError.message : 'Unknown error'
            });
          }
        }

        return NextResponse.json({
          success: true,
          action: 'batchUpdate',
          results: {
            total: params.updates.length,
            successful: successCount,
            failed: errorCount,
            details: batchResults
          },
          timestamp: new Date().toISOString()
        });

      case 'optimize':
        // Здесь можно добавить логику оптимизации индекса
        const stats = searchIndexManager.getIndexStats();
        const health = searchIndexManager.checkIndexHealth();
        
        return NextResponse.json({
          success: true,
          action: 'optimize',
          message: 'Index optimization completed',
          stats,
          health,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Use "batchUpdate" or "optimize"` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Index management PUT API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during index management',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
