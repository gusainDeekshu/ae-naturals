// src/components/storefront/product/ProductAPlusContent.tsx
import React from "react";
import Image from "next/image";

// Match this with your Prisma JSON structure
type APlusBlock = {
  type: "banner" | "split";
  imageUrl: string;
  title?: string;
  text?: string;
  align?: "left" | "right";
};

interface ProductAPlusContentProps {
  blocks?: APlusBlock[] | null;
}

export default function ProductAPlusContent({ blocks }: ProductAPlusContentProps) {
  // If no blocks exist, don't render the section at all
  if (!blocks || blocks.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-100 mt-12 bg-white">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          From the Manufacturer
        </h2>
        <div className="w-24 h-1 bg-indigo-500 mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="space-y-16 lg:space-y-24">
        {blocks.map((block, index) => {
          
          // ================= RENDER BANNER BLOCK =================
          if (block.type === "banner") {
            return (
              <div 
                key={index} 
                className="relative w-full h-[350px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg group"
              >
                <Image
                  src={block.imageUrl}
                  alt={block.title || "Product banner"}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority={index === 0} // Load first image faster
                />
                {/* Optional Title Overlay */}
                {block.title && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-center p-8 md:p-12">
                    <h3 className="text-3xl md:text-5xl font-extrabold text-white text-center drop-shadow-md">
                      {block.title}
                    </h3>
                  </div>
                )}
              </div>
            );
          }

          // ================= RENDER SPLIT BLOCK =================
          if (block.type === "split") {
            const isImgLeft = block.align === "left" || !block.align;

            return (
              <div 
                key={index} 
                className={`flex flex-col md:flex-row items-center gap-8 lg:gap-16 ${
                  !isImgLeft ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Image Side */}
                <div className="w-full md:w-1/2 relative h-[300px] md:h-[450px] rounded-2xl overflow-hidden shadow-md">
                  <Image
                    src={block.imageUrl}
                    alt="Product feature details"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                
                {/* Text Side */}
                <div className="w-full md:w-1/2 space-y-6 px-4 md:px-0">
                  <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
                    {block.text}
                  </p>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </section>
  );
}