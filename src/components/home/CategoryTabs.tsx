"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string; // Assume your API can send category thumbnails
}

export const CategoryTabs = ({ data }: { data: Category[] }) => {
  if (!data || data.length === 0) return null;

  return (
    <section className="w-full border-b border-gray-100 bg-white py-8">
      {/* Hide scrollbar but keep functionality */}
      <div className="no-scrollbar mx-auto max-w-7xl overflow-x-auto px-4">
        <div className="flex min-w-max space-x-6 pb-2 md:justify-center">
          {data.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/collections/${cat.slug}`} 
              className="group flex flex-col items-center"
            >
              {/* Circular Avatar */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-transparent bg-gray-50 p-1 transition-all group-hover:border-green-600 group-hover:shadow-md">
                <div className="relative h-full w-full overflow-hidden rounded-full bg-gray-200">
                  {cat.imageUrl ? (
                    <Image 
                      src={cat.imageUrl} 
                      alt={cat.name} 
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    // Fallback pattern if no image
                    <div className="h-full w-full bg-gradient-to-br from-green-50 to-green-100"></div>
                  )}
                </div>
              </div>
              <span className="mt-3 text-xs font-bold uppercase tracking-wider text-gray-700 transition-colors group-hover:text-green-700">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryTabs;