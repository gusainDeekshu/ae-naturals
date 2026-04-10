"use client";

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/ui/ProductCard';

interface ProductGridProps {
  data: Product[];
  settings?: {
    title?: string;
    subtitle?: string;
    viewAllLink?: string;
  };
}

export const ProductGrid = ({ data, settings }: ProductGridProps) => {
  // Graceful fallback if no products are passed
  if (!data || data.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
      {/* Section Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-gray-900 md:text-3xl">
            {settings?.title || 'Bestsellers'}
          </h2>
          {settings?.subtitle && (
            <p className="mt-1 text-sm text-gray-500">{settings.subtitle}</p>
          )}
        </div>
        <Link 
          href={settings?.viewAllLink || '/collections/all'}
          className="border-b-2 border-transparent pb-1 text-xs font-bold uppercase tracking-wider text-green-700 transition-colors hover:border-black hover:text-black md:text-sm"
        >
          View All
        </Link>
      </div>

      {/* High-Density Flush Grid (WOW Style) */}
      <div className="grid grid-cols-2 border-l border-t border-gray-100 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {data.map((product) => (
          <div key={product.id} className="border-b border-r border-gray-100">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;