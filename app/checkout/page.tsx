'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { supabase } from '@/lib/supabaseClient';

export default function CheckoutPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { cart, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCartStore();
  const totalPrice = getTotalPrice();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Handles Supabase DB order insertion + WhatsApp redirection
  const handleWhatsAppCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !phoneNumber || (deliveryType === 'delivery' && !address)) {
      alert('Please fill in all required contact details.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Log order payload to Supabase Database
      const { error } = await supabase.from('orders').insert([
        {
          customer_name: customerName,
          phone: phoneNumber,
          delivery_type: deliveryType,
          address: deliveryType === 'delivery' ? address : null,
          notes: notes || null,
          items: cart,
          total_price: totalPrice,
          status: 'pending',
        },
      ]);

      if (error) {
        console.error('Supabase Order Log Error:', error);
      }
    } catch (err) {
      console.error('Failed to log order to database:', err);
    } finally {
      setIsSubmitting(false);
    }

    // 2. Format WhatsApp Receipt Message
    const itemDetails = cart
      .map((item) => `• ${item.quantity}x ${item.title} (LKR ${item.price * item.quantity})`)
      .join('\n');

    const message = 
      `*NEW ORDER - DinuTharu Restaurant*\n\n` +
      `*Customer Details:*\n` +
      `Name: ${customerName}\n` +
      `Phone: ${phoneNumber}\n` +
      `Fulfillment: ${deliveryType === 'delivery' ? '🛵 Delivery' : '🏪 Pickup'}\n` +
      (deliveryType === 'delivery' ? `Address: ${address}\n` : '') +
      (notes ? `Notes: ${notes}\n` : '') +
      `\n*Order Items:*\n${itemDetails}\n\n` +
      `*Total Amount:* LKR ${totalPrice}\n\n` +
      `Please confirm my order!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/94711242301?text=${encodedMessage}`;

    // Clear client cart state and dispatch to WhatsApp
    clearCart();
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header & Back Navigation */}
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

        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="text-center py-20 bg-[#121212] border border-[#292929] rounded-2xl p-8">
            <span className="text-5xl">🛒</span>
            <h2 className="text-2xl font-bold mt-4">Your Cart is Empty</h2>
            <p className="text-gray-400 text-sm mt-2">
              Browse our delicious menu and add some items to get started.
            </p>
            <Link
              href="/#menu"
              className="inline-block mt-6 px-6 py-3 bg-[#ffbd18] text-[#070707] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#e0a410] transition-all"
            >
              Back to Menu
            </Link>
          </div>
        ) : (
          /* Active Checkout Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Cart Items List */}
            <div className="bg-[#121212] border border-[#292929] rounded-2xl p-6 h-fit">
              <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-[#222222]">
                Order Summary
              </h2>

              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-[#070707] p-3 rounded-xl border border-[#1f1f1f]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#121212] flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{item.title}</h3>
                        <p className="text-xs text-[#ffbd18] font-semibold mt-0.5">
                          LKR {item.price * item.quantity}
                        </p>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 bg-[#181818] border border-[#333333] hover:border-[#ffbd18] rounded-lg text-white font-bold flex items-center justify-center text-sm"
                      >
                        -
                      </button>
                      <span className="text-sm font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 bg-[#181818] border border-[#333333] hover:border-[#ffbd18] rounded-lg text-white font-bold flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Subtotal Display */}
              <div className="mt-6 pt-4 border-t border-[#222222] flex items-center justify-between">
                <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">
                  Total Subtotal
                </span>
                <span className="text-2xl font-black text-[#ffbd18]">
                  LKR {totalPrice}
                </span>
              </div>
            </div>

            {/* Right Column: Customer Details Form */}
            <form onSubmit={handleWhatsAppCheckout} className="bg-[#121212] border border-[#292929] rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white mb-2 pb-3 border-b border-[#222222]">
                Delivery Details
              </h2>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  Full Name *
                </label>
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
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 077 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              {/* Fulfillment Option Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-2">
                  Order Type
                </label>
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

              {deliveryType === 'delivery' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. 25/A School Lane, Niwanthidiya, Piliyandala"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  Special Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extra chilli paste, less oil"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#20c45a] hover:bg-[#1bb050] text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#20c45a]/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                <span>💬 {isSubmitting ? 'Processing...' : 'Place Order via WhatsApp'}</span>
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
}