// src/hooks/useCartActions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CartService } from '@/services/cart.service';
import { AddToCartPayload, BuyNowPayload } from '@/types/cart';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const useAddToCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddToCartPayload) => CartService.addToCart(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add item to cart');
    },
  });
};

export const useBuyNow = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BuyNowPayload) => {
      // Clear existing cart and add the Buy Now item to guarantee standard checkout flow
      await CartService.clearCart();
      return await CartService.addToCart(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Redirect to standard checkout to capture Address and Shipping properly
      router.push(`/checkout`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Item out of stock or unavailable');
    },
  });
};