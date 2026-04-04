// src/services/order.service.ts
import { apiClient } from '@/lib/api-client';

export const orderService = {
  async createOrder(storeId: string,  addressId: string,
        shippingCost: string ) {
    const { data } = await apiClient.post('/orders/create', { storeId,addressId,shippingCost });
    return data;
  },

  async getMyOrders() {
    const { data } = await apiClient.get('/orders/my-orders');
    return data;
  },
  async getOrderById(orderId: string) {
    const { data } = await apiClient.get(`/orders/${orderId}/status`);
    return data;
  }
};