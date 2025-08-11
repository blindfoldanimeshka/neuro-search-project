import * as cheerio from 'cheerio';
import { chromium, Browser, Page } from 'playwright';
import { ScrapingOptions } from '@/app/types/neuro';

export class WebScraper {
  private browser: Browser | null = null;

  async scrapeWithCheerio(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      throw new Error(`Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async scrapeWithPlaywright(options: ScrapingOptions): Promise<string> {
    let page: Page | null = null;
    
    try {
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }

      page = await this.browser.newPage();
      
      await page.goto(options.url, {
        waitUntil: 'networkidle',
        timeout: options.timeout || 30000
      });

      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, {
          timeout: options.timeout || 30000
        });
      }

      const html = await page.content();
      return html;
    } catch (error) {
      throw new Error(`Playwright scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async scrape(options: ScrapingOptions): Promise<string> {
    if (options.usePlaywright) {
      return this.scrapeWithPlaywright(options);
    }
    return this.scrapeWithCheerio(options.url);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  extractStructuredData(html: string, selectors?: {
    products?: string;
    name?: string;
    price?: string;
    description?: string;
    image?: string;
  }): any[] {
    const $ = cheerio.load(html);
    const results: any[] = [];

    if (selectors?.products) {
      $(selectors.products).each((_, element) => {
        const product: any = {};
        
        if (selectors.name) {
          product.name = $(element).find(selectors.name).text().trim();
        }
        
        if (selectors.price) {
          const priceText = $(element).find(selectors.price).text().trim();
          product.price = this.parsePrice(priceText);
        }
        
        if (selectors.description) {
          product.description = $(element).find(selectors.description).text().trim();
        }
        
        if (selectors.image) {
          product.imageUrl = $(element).find(selectors.image).attr('src') || 
                            $(element).find(selectors.image).attr('data-src');
        }
        
        if (Object.keys(product).length > 0) {
          results.push(product);
        }
      });
    }

    return results;
  }

  private parsePrice(priceText: string): number | null {
    const cleanedPrice = priceText.replace(/[^\d.,]/g, '');
    const price = parseFloat(cleanedPrice.replace(',', '.'));
    return isNaN(price) ? null : price;
  }
}