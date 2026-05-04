// src\app\track-order\page.tsx



'use client';

import { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { TrackingTimeline } from '@/components/ui/profile/TrackingTimeline';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      // Replace with your actual API Client call
      const res = await fetch(`/api/v1/webhooks/shipping/public?orderId=${orderId}&contact=${encodeURIComponent(contact)}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to fetch tracking data');
      
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
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Track Your Order</h1>
          <p className="mt-4 text-lg text-gray-500">
            Enter your Order ID and the Email or Phone number used during checkout.
          </p>
        </div>

        {/* Tracking Form */}
        <div className="bg-white py-8 px-6 shadow rounded-xl sm:px-10 mb-8">
          <form onSubmit={handleTrack} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="orderId" className="block text-sm font-medium text-gray-700">Order ID</label>
                <div className="mt-1">
                  <input
                    id="orderId"
                    type="text"
                    required
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. clq123abc..."
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Email or Phone</label>
                <div className="mt-1">
                  <input
                    id="contact"
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="name@email.com or 9876543210"
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-100">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !orderId || !contact}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Search className="mr-2 h-5 w-5" />}
                Track Package
              </button>
            </div>
          </form>
        </div>

        {/* Tracking Results */}
        {trackingData && (
          <div className="animate-fade-in-up">
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