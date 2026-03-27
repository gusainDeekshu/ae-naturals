// src/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useProducts(categorySlug?: string) {
  return useQuery({
    // 1. Remove categorySlug from the queryKey. The query fetches the WHOLE catalog.
    queryKey: ['products', 'flower-fairy-dehradun', 'catalog'],
    
    queryFn: async () => {
      const response: any = await apiClient.get('/products/catalog/flower-fairy-dehradun');
      const data = response?.data || response;
      return Array.isArray(data?.products) ? data.products : (Array.isArray(data) ? data : []); 
    },
    
    // 2. Use `select` to filter the data. React Query is smart enough to 
    // memoize this and only return the filtered subset to the specific component.
    select: (products) => {
      if (categorySlug && products.length > 0) {
        return products.filter((p: any) => p.category?.slug === categorySlug);
      }
      return products;
    },
    
    // 3. Keep staleTime high. Products don't change every second.
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}