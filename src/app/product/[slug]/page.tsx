import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import ProductGallery from './ProductGallery';
import ProductInfoBox from './ProductInfoBox';
import { ProductApi } from '@/services/product.service';

// Dynamically import heavy components for better page load speed
const ProductDetailsTable = dynamic(() => import('./ProductDetailsTable'));
const APlusContent = dynamic(() => import('./APlusContent'));
const SimilarProducts = dynamic(() => import('./SimilarProducts')); // Added this
const StickyAddToCart = dynamic(() => import('./StickyAddToCart'));

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await ProductApi.getProductBySlug(resolvedParams.slug);
  
  // Use the first image from the images array for the OpenGraph/SEO image
  const ogImage = product.images && product.images.length > 0 ? product.images[0] : undefined;

  return {
    title: `${product.name} | AE Naturals`,
    description: product.description?.substring(0, 160) || '',
    openGraph: ogImage ? { images: [ogImage] } : undefined
  };
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await ProductApi.getProductBySlug(resolvedParams.slug);
console.log("🚀 Fetched product:", product);
  // Fetch similar products based on the product's category slug
  // This matches your backend: productsService.getSimilarProducts(categorySlug)
  const similarProducts = product.category?.slug 
    ? await ProductApi.getSimilarProducts(product.category.slug)
    : [];

  // Structure SEO Schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.[0] || '', // Use first image
    description: product.description,
    brand: { '@type': 'Brand', name: product.extra?.manufacturer || 'AE Naturals' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    }
  };

  return (
    <>
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} 
      />
      
      <main className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-12 space-y-16">
        
        {/* 1. HERO: GALLERY & INFO BOX */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Passed 'images' array instead of single 'image' to match your Prisma schema */}
          <ProductGallery images={product.images || []} variants={product.variants || []} />
          <ProductInfoBox product={product} />
        </div>

        <hr className="border-zinc-200" />

        {/* 2. TECHNICAL SPECS & IMPORTANT INFO */}
        {product.extra && (
          <section>
            <ProductDetailsTable productData={product} extra={product.extra} />
          </section>
        )}

        {/* 3. A+ RICH CONTENT (From your modular builder) */}
        {product.extra?.aPlusContent && product.extra.aPlusContent.length > 0 && (
          <section>
            <APlusContent blocks={product.extra.aPlusContent} />
          </section>
        )}

        {/* 4. SIMILAR PRODUCTS (Cross-selling) */}
        {similarProducts && similarProducts.length > 0 && (
          <section className="pt-8 border-t border-zinc-100">
            <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight mb-8">
              Similar Products You May Like
            </h2>
            {/* Filter out the current product from the similar products list */}
            <SimilarProducts products={similarProducts.filter((p: any) => p.id !== product.id)} />
          </section>
        )}

        {/* 5. STICKY MOBILE ADD-TO-CART */}
        <StickyAddToCart product={product} />
        
      </main>
    </>
  );
}