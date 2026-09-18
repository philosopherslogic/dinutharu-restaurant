'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { supabase } from '@/lib/supabaseClient';
import type LocationPickerModalType from '@/components/LocationPickerModal';

// Type the dynamic import explicitly to resolve Next.js SSR & TypeScript IntrinsicAttributes errors
const LocationPickerModal = dynamic<React.ComponentProps<typeof LocationPickerModalType>>(
  () => import('@/components/LocationPickerModal'),
  { ssr: false }
);

export default function CheckoutPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  
  // Delivery Specific States
  const [address, setAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [locationSelected, setLocationSelected] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Pickup Specific States
  const [pickupTime, setPickupTime] = useState('');

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { cart = [], updateQuantity, clearCart, getTotalPrice } = useCartStore();
  const subtotalPrice = getTotalPrice ? getTotalPrice() : 0;

  // Delivery Fee Calculation (100 LKR per KM)
  const deliveryFee = locationSelected && distanceKm !== null ? Math.ceil(distanceKm) * 100 : 0;
  const finalTotalPrice = subtotalPrice + deliveryFee;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute minimum pickup time (+30 minutes from current time)
  const getMinPickupTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toTimeString().slice(0, 5);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !phoneNumber) {
      alert('Please fill in required contact details.');
      return;
    }

    if (deliveryType === 'delivery') {
      if (!address || !locationSelected || distanceKm === null) {
        alert('Please select your location on the map and enter your full delivery address.');
        return;
      }
      if (distanceKm > 5) {
        alert('Delivery distance exceeds our 5km service radius.');
        return;
      }
    }

    if (deliveryType === 'pickup') {
      if (!pickupTime) {
        alert('Please select a pickup time.');
        return;
      }
      if (pickupTime < getMinPickupTime()) {
        alert('Pickup time must be at least 30 minutes from now.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderCode = Math.floor(1000 + Math.random() * 9000);

      const { error } = await supabase.from('orders').insert([
        {
          order_code: orderCode,
          customer_name: customerName,
          phone: phoneNumber,
          delivery_type: deliveryType,
          address: deliveryType === 'delivery' ? address : null,
          pickup_time: deliveryType === 'pickup' ? pickupTime : null,
          distance_km: deliveryType === 'delivery' ? distanceKm : 0,
          delivery_fee: deliveryFee,
          notes: notes || null,
          items: cart,
          total_price: finalTotalPrice,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      clearCart();
      alert(`Order #${orderCode} placed successfully! We are preparing your food.`);
      router.push('/');
    } catch (err: any) {
      console.error('Order Submission Error:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#070707] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-[#222222] pb-6 mb-8">
          <div>
            <span className="text-xs text-[#ffbd18] font-bold uppercase tracking-wider">
              Direct Order
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-1">
              Checkout & Review
            </h1>
          </div>

          <Link
            href="/#menu"
            className="px-4 py-2 bg-[#121212] border border-[#292929] hover:border-[#ffbd18] text-xs font-bold uppercase tracking-wider rounded-xl transition-all text-gray-300 hover:text-white"
          >
            + Add More Items
          </Link>
        </div>

        {(!cart || cart.length === 0) ? (
          <div className="text-center py-20 bg-[#121212] border border-[#292929] rounded-2xl p-8">
            <span className="text-5xl">🛒</span>
            <h2 className="text-2xl font-bold mt-4">Your Cart is Empty</h2>
            <Link
              href="/#menu"
              className="inline-block mt-6 px-6 py-3 bg-[#ffbd18] text-[#070707] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#e0a410]"
            >
              Back to Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Cart Order Summary */}
            <div className="bg-[#121212] border border-[#292929] rounded-2xl p-6 h-fit">
              <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-[#222222]">
                Order Summary
              </h2>

              <div className="space-y-4">
                {cart.map((item) => {
                  const itemTitle = item.title || (item as any).name || 'Food Item';
                  const itemImage = item.image_url || (item as any).image;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-[#070707] p-3 rounded-xl border border-[#1f1f1f]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#121212] flex-shrink-0">
                          {itemImage && (
                            <Image 
                              src={itemImage} 
                              alt={itemTitle} 
                              fill 
                              className="object-cover" 
                            />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">{itemTitle}</h3>
                          <p className="text-xs text-[#ffbd18] font-semibold mt-0.5">
                            LKR {item.price} × {item.quantity} = LKR {item.price * item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 bg-[#181818] border border-[#333333] hover:border-[#ffbd18] rounded-lg text-white font-bold flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 bg-[#181818] border border-[#333333] hover:border-[#ffbd18] rounded-lg text-white font-bold flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="mt-6 pt-4 border-t border-[#222222] space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Items Subtotal</span>
                  <span className="text-white font-bold">LKR {subtotalPrice}</span>
                </div>

                <div className="flex justify-between text-xs text-gray-400">
                  <span>Delivery Charge</span>
                  <span className="text-white font-bold">
                    {deliveryType === 'pickup'
                      ? 'LKR 0 (Pickup)'
                      : locationSelected && distanceKm !== null
                      ? `LKR ${deliveryFee} (${distanceKm.toFixed(1)} km)`
                      : 'Select location to get delivery fee'}
                  </span>
                </div>

                <div className="flex justify-between text-base font-black text-[#ffbd18] pt-2 border-t border-[#1f1f1f]">
                  <span>Total Amount</span>
                  <span>LKR {finalTotalPrice}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Customer & Fulfillment Form */}
            <form onSubmit={handlePlaceOrder} className="bg-[#121212] border border-[#292929] rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white mb-2 pb-3 border-b border-[#222222]">
                Customer Details
              </h2>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ruwan Silva"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 077 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              {/* Order Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-2">Order Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all ${
                      deliveryType === 'delivery'
                        ? 'bg-[#ffbd18] text-[#070707] border-[#ffbd18]'
                        : 'bg-[#070707] text-gray-300 border-[#292929]'
                    }`}
                  >
                    🛵 Home Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all ${
                      deliveryType === 'pickup'
                        ? 'bg-[#ffbd18] text-[#070707] border-[#ffbd18]'
                        : 'bg-[#070707] text-gray-300 border-[#292929]'
                    }`}
                  >
                    🏪 Store Pickup
                  </button>
                </div>
              </div>

              {/* Store Pickup Section */}
              {deliveryType === 'pickup' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                    Pickup Time (At least 30 mins from now) *
                  </label>
                  <input
                    type="time"
                    required
                    min={getMinPickupTime()}
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              )}

              {/* Home Delivery Section */}
              {deliveryType === 'delivery' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                      Delivery Location *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsMapOpen(true)}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                        locationSelected && distanceKm !== null
                          ? 'bg-green-500/10 border-green-500 text-green-400'
                          : 'bg-[#181818] border-[#292929] text-[#ffbd18] hover:border-[#ffbd18]'
                      }`}
                    >
                      <span>📍</span>
                      <span>
                        {locationSelected && distanceKm !== null
                          ? `Location Confirmed (${distanceKm.toFixed(1)} km away)`
                          : 'Select Location on Map'}
                      </span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                      Full Address Details *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. No. 25/A, School Lane, Niwanthidiya, Piliyandala"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Special Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Extra chilli paste"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#ffbd18] hover:bg-[#e0a410] text-[#070707] font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>

          </div>
        )}

      </div>

      {/* Interactive Leaflet Map Modal */}
      <LocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirmLocation={(distance: number) => {
          setDistanceKm(distance);
          setLocationSelected(true);
        }}
      />
    </div>
  );
}