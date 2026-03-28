// src/app/product/[slug]/SimilarProducts.tsx
import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  images: string[];
  rating?: number;
  reviewCount?: number;
};

type Props = {
  products: Product[];
};

export default function SimilarProducts({ products }: Props) {
  if (!products || products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => {
        // Calculate discount percentage
        const discount = product.oldPrice && product.oldPrice > product.price
          ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
          : 0;

        return (
          <Link 
            href={`/product/${product.slug}`} 
            key={product.id} 
            className="group flex flex-col bg-white rounded-2xl border border-zinc-100 overflow-hidden hover:shadow-xl hover:border-zinc-200 transition-all duration-300"
          >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-zinc-50">
              <img 
                src={product.images?.[0] || '/placeholder.png'} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Discount Badge */}
              {discount > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">
                  {discount}% OFF
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-4 flex flex-col flex-grow space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 line-clamp-2 leading-snug group-hover:text-[#006044] transition-colors">
                {product.name}
              </h3>
              
              <div className="mt-auto space-y-1">
                {/* Rating (Optional UI) */}
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-zinc-700">{product.rating || "4.5"}</span>
                  <span className="text-xs font-medium text-zinc-400">({product.reviewCount || 0})</span>
                </div>

                {/* Pricing */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-black text-zinc-900">
                    ₹{product.price}
                  </span>
                  {product.oldPrice && (
                    <span className="text-sm font-bold text-zinc-400 line-through">
                      ₹{product.oldPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}