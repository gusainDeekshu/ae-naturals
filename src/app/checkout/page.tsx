// src/app/checkout/page.tsx
"use client";
import { useCartStore } from "@/store/useCartStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      // 1. Create Order
      const orderRes = await fetch("/api/orders/create", { method: "POST" });
      const order = await orderRes.json();

      // 2. Initiate Payment
      const payRes = await fetch("/api/payments/create", {
        method: "POST",
        body: JSON.stringify({ orderId: order.id, provider: "STRIPE" }),
      });
      const { checkoutUrl } = await payRes.json();

      // Redirect to Gateway or Success
      if (checkoutUrl) window.location.href = checkoutUrl;
      else router.push(`/order-success/${order.id}`);
      
      clearCart();
    } catch (err) {
      console.error("Checkout failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Order Summary</h1>
      {items.map((item) => (
        <div key={item.productId} className="flex justify-between border-b py-2">
          <span>{item.name} x {item.quantity}</span>
          <span>₹{item.price * item.quantity}</span>
        </div>
      ))}
      <div className="text-xl font-bold mt-4 text-right">Total: ₹{total}</div>
      <Button 
        onClick={handlePlaceOrder} 
        disabled={isProcessing || items.length === 0}
        className="w-full mt-6"
      >
        {isProcessing ? "Processing..." : "Pay & Place Order"}
      </Button>
    </div>
  );
}