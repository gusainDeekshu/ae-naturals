"use client";

import { useCartStore } from "@/store/useCartStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { orderService } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { addressService, Address } from "@/services/address.service";
import { shippingService } from "@/services/shipping.service";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PaymentInitiateResponse } from "@/types/payment";
import { executePaymentFlow } from "@/lib/payment-handler";

export default function CheckoutPage() {
  const { items } = useCartStore();
  const router = useRouter();

  // State Management
  const [isProcessing, setIsProcessing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  // Shipping State
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  // Form State
  const [newAddress, setNewAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    label: "Home",
    isDefault: false,
  });

  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const grandTotal = cartTotal + shippingCost;
  const storeId = items[0]?.storeId || "default-store";

  // Load Addresses
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await addressService.getUserAddresses();
      setAddresses(data);

      if (data.length > 0) {
        const defaultAddr = data.find((a) => a.isDefault) || data[0];
        setSelectedAddress(defaultAddr);
      } else {
        setShowAddAddressForm(true);
      }
    } catch (error) {
      console.error("Failed to fetch addresses", error);
      toast.error("Failed to load addresses");
    }
  };

  // Shipping Calculation
  useEffect(() => {
    if (selectedAddress && items.length > 0) {
      calculateShipping(selectedAddress.state, selectedAddress.pincode);
    }
  }, [selectedAddress, items]);

  const calculateShipping = async (state: string, pincode: string) => {
    setIsCalculatingShipping(true);
    setShippingError(null);

    try {
      const payload = {
        storeId,
        address: { state, pincode },
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        paymentMethod: "PREPAID" as const,
        cartTotal,
      };

      const res = await shippingService.calculateShipping(payload);
      setShippingCost(res.shippingCost);

      if (res.shippingCost === 0) {
        toast.success("Free delivery available 🎉");
      }
    } catch (error: any) {
      console.error("Shipping error", error);

      const msg =
        error.response?.data?.message ||
        `Delivery not available for pincode ${pincode}`;

      setShippingError(msg);
      setShippingCost(0);
      toast.error(msg);
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  // Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const added = await addressService.addAddress({
        ...newAddress,
        label: newAddress.label.toUpperCase() as "HOME" | "WORK" | "OTHER",
      });

      setAddresses([...addresses, added]);
      setSelectedAddress(added);
      setShowAddAddressForm(false);

      toast.success("Address added successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to add address");
    }
  };

  // Place Order
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    const currentItems = useCartStore.getState().items;

    if (!currentItems || currentItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const currentStoreId = currentItems[0]?.storeId;

    if (!currentStoreId) {
      toast.error("Store info missing");
      return;
    }

    setIsProcessing(true);

    try {
      toast.loading("Placing your order...");

      const order = await orderService.createOrder(
        currentStoreId,
        selectedAddress.id,
        shippingCost.toString()
      );

      useCartStore.getState().clearCart();

      toast.success("Order created!");

      // Call your backend which now strictly returns PaymentInitiateResponse
    const payRes = await paymentService.initiatePayment(order.id);
    const responseData: PaymentInitiateResponse = payRes?.data || payRes;

    // ADD THIS LINE TO DEBUG:
    console.log("BACKEND PAYLOAD:", responseData);

    // 🔥 Delegate to Universal Handler
    executePaymentFlow(responseData, order.id, router);

      const checkoutUrl =
        payRes?.data?.url ||
        payRes?.data?.checkoutUrl ||
        payRes?.checkoutUrl;

      if (checkoutUrl) {
        toast.loading("Redirecting to payment...");
        window.location.href = checkoutUrl;
      } else {
        toast.success("Order placed successfully!");
        router.push(`/order-success/${order.id}`);
      }
    } catch (err: any) {
      console.error(err);

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Checkout failed";

      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium mt-10">
        Your cart is empty. Please add items to proceed.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* LEFT */}
      <div>
        <h2 className="text-xl font-bold mb-4">Delivery Address</h2>

        {addresses.length > 0 && !showAddAddressForm ? (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => setSelectedAddress(addr)}
                className={`p-4 border rounded-xl cursor-pointer ${
                  selectedAddress?.id === addr.id
                    ? "border-[#006044] bg-[#006044]/5"
                    : "border-gray-200"
                }`}
              >
                <div className="font-semibold">{addr.name}</div>
                <div className="text-sm">
                  {addr.addressLine}, {addr.city}
                </div>
                <div className="text-sm">
                  {addr.state} - {addr.pincode}
                </div>
              </div>
            ))}

            <Button onClick={() => setShowAddAddressForm(true)}>
              + Add Address
            </Button>
          </div>
        ) : (
          <form onSubmit={handleAddAddress} className="space-y-3">
            <input placeholder="First Name" required onChange={(e) => setNewAddress({ ...newAddress, firstName: e.target.value })} />
            <input placeholder="Last Name" required onChange={(e) => setNewAddress({ ...newAddress, lastName: e.target.value })} />
            <input placeholder="Email" required onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })} />
            <input placeholder="Phone" required onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
            <input placeholder="Address" required onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })} />
            <input placeholder="City" required onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
            <input placeholder="State" required onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
            <input placeholder="Pincode" required onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />

            <Button type="submit">Save Address</Button>
          </form>
        )}
      </div>

      {/* RIGHT */}
      <div className="bg-white p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Summary</h2>

        {items.map((item) => (
          <div key={item.productId} className="flex justify-between">
            <span>{item.name} x{item.quantity}</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}

        <div className="mt-4">
          <div>Subtotal: ₹{cartTotal}</div>
          <div>Shipping: ₹{shippingCost}</div>
          <div className="font-bold">Total: ₹{grandTotal}</div>
        </div>

        <Button
          onClick={handlePlaceOrder}
          disabled={isProcessing || !!shippingError}
          className="w-full mt-4"
        >
          {isProcessing ? <Loader2 className="animate-spin" /> : `Pay ₹${grandTotal}`}
        </Button>
      </div>
    </div>
  );
}