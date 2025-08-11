import { NextRequest, NextResponse } from 'next/server';
import { NeuroScrapeRequest, NeuroScrapeResponse } from '@/app/types/neuro';
import { WebScraper } from '@/app/lib/web-scraper';
import { NeuroParser } from '@/app/lib/neuro-parser';

export async function POST(request: NextRequest) {
  const scraper = new WebScraper();
  const parser = new NeuroParser();
  const startTime = Date.now();

  try {
    const body: NeuroScrapeRequest = await request.json();
    
    if (!body.url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Step 1: Scrape the webpage
    const scrapingOptions = {
      url: body.url,
      ...body.scrapingOptions
    };
    
    const html = await scraper.scrape(scrapingOptions);
    
    if (!html || html.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve HTML content' },
        { status: 500 }
      );
    }

    // Step 2: Parse with neural network
    const parsingOptions = {
      model: body.parsingOptions?.model || 'openrouter',
      ...body.parsingOptions
    };
    
    const { products, model } = await parser.parse(html, parsingOptions);
    
    const response: NeuroScrapeResponse = {
      success: true,
      products,
      model,
      processingTime: Date.now() - startTime,
      ...(process.env.NODE_ENV === 'development' && { rawHtml: html.substring(0, 1000) })
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Neuro-scrape error:', error);
    
    const errorResponse: NeuroScrapeResponse = {
      success: false,
      products: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      processingTime: Date.now() - startTime
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  } finally {
    await scraper.close();
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}