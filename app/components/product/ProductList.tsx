'use client';

import React from 'react';
import ProductListItem from './ProductListItem';
import { ScrapedProduct } from '@/app/lib/web-scraper';

interface ProductListProps {
  products: ScrapedProduct[];
}

export default function ProductList({ products }: ProductListProps) {
  return (
    <div className="space-y-4">
      {products.map(product => (
        <ProductListItem key={product.id} product={product} />
      ))}
    </div>
  );
}
