// src/app/orders/[id]/track/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Search,
  Loader2,
  AlertCircle,
  Package,
} from 'lucide-react';

import { TrackingTimeline } from '@/components/ui/profile/TrackingTimeline';

export default function TrackOrderPage() {
  const params = useParams();

  const [orderId, setOrderId] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

  // ✅ Auto fill orderId from URL
  useEffect(() => {
    if (params?.id) {
      setOrderId(params.id as string);
    }
  }, [params]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const res = await fetch(
        `/api/v1/webhooks/shipping/public?orderId=${orderId}&contact=${encodeURIComponent(contact)}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Failed to fetch tracking data'
        );
      }

      setTrackingData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#009688]/10">
            <Package className="h-8 w-8 text-[#009688]" />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Track Your Order
          </h1>

          <p className="mt-4 text-lg text-gray-500">
            Enter your Email or Phone number used during checkout.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow rounded-2xl sm:px-10 mb-8 border border-gray-100">
          <form onSubmit={handleTrack} className="space-y-6">

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

              {/* Order ID */}
              <div>
                <label
                  htmlFor="orderId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Order ID
                </label>

                <div className="mt-1">
                  <input
                    id="orderId"
                    type="text"
                    required
                    value={orderId}
                    onChange={(e) =>
                      setOrderId(e.target.value)
                    }
                    placeholder="e.g. clq123abc..."
                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm outline-none transition focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20"
                  />
                </div>
              </div>

              {/* Contact */}
              <div>
                <label
                  htmlFor="contact"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email or Phone
                </label>

                <div className="mt-1">
                  <input
                    id="contact"
                    type="text"
                    required
                    value={contact}
                    onChange={(e) =>
                      setContact(e.target.value)
                    }
                    placeholder="name@email.com or 9876543210"
                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 shadow-sm outline-none transition focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20"
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />

                  <div>
                    <h3 className="text-sm font-semibold text-red-700">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {/* Button */}
            <div>
              <button
                type="submit"
                disabled={loading || !orderId || !contact}
                className="flex w-full items-center justify-center rounded-xl bg-[#009688] px-4 py-3 text-base font-bold text-white shadow-lg shadow-[#009688]/20 transition hover:bg-[#007A6E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Search className="mr-2 h-5 w-5" />
                )}

                Track Package
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {trackingData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TrackingTimeline
              shipment={trackingData.shipment}
              events={trackingData.events}
            />
          </div>
        )}
      </div>
    </div>
  );
}