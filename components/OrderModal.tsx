'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { supabase } from '@/lib/supabaseClient';
import { MenuItem } from '@/types';

export default function OrderModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [directDeliveryEnabled, setDirectDeliveryEnabled] = useState(true);
  const [showClosedNotice, setShowClosedNotice] = useState(false);

  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    if (!orderId) {
      setSelectedItem(null);
      return;
    }

    // 1. Fetch Item Details
    async function fetchOrderItem() {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', orderId)
        .single();

      if (data) {
        setSelectedItem({
          id: data.id,
          title: data.title,
          description: data.description || '',
          price: data.price,
          image: data.image_url,
          category: data.category,
          isPopular: data.is_popular,
          isAvailable: data.is_available,
        });
      }
    }

    // 2. Fetch Live Store Direct Delivery Settings
    async function fetchStoreSettings() {
      const { data } = await supabase
        .from('store_settings')
        .select('direct_delivery_enabled')
        .limit(1)
        .single();

      if (data) {
        setDirectDeliveryEnabled(data.direct_delivery_enabled);
      }
    }

    fetchOrderItem();
    fetchStoreSettings();
  }, [orderId]);

  if (!orderId || !selectedItem) return null;

  const handleClose = () => {
    router.back();
  };

  const handleUberEats = () => {
    window.open('https://www.ubereats.com/', '_blank');
    handleClose();
  };

  const handlePickMe = () => {
    window.open('https://pickme.lk/', '_blank');
    handleClose();
  };

  const handleDirectOrder = () => {
    if (!directDeliveryEnabled) {
      setShowClosedNotice(true);
      return;
    }
    addToCart(selectedItem);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative z-10 bg-[#121212] border border-[#292929] rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-sm"
        >
          ✕
        </button>

        <span className="text-xs text-[#ffbd18] font-bold uppercase tracking-wider">
          Choose Order Option
        </span>
        <h3 className="text-xl font-extrabold mt-1">{selectedItem.title}</h3>
        <p className="text-xs text-gray-400 mt-1">
          Select how you would like to complete your order:
        </p>

        {/* Closed Notice Banner */}
        {showClosedNotice && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center justify-between">
            <span>⚠️ Direct Delivery is unavailable right now. Please order via Uber Eats or PickMe!</span>
            <button
              onClick={() => setShowClosedNotice(false)}
              className="text-white font-bold text-sm ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <div className="space-y-3 mt-6">
          {/* Uber Eats */}
          <button
            onClick={handleUberEats}
            className="w-full p-4 bg-[#181818] border border-[#292929] hover:border-green-500/50 rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🟢</span>
              <div className="text-left">
                <p className="font-bold text-sm text-white group-hover:text-green-400">
                  Order on Uber Eats
                </p>
                <p className="text-[11px] text-gray-400">Delivered via Uber driver</p>
              </div>
            </div>
            <span className="text-xs text-gray-500 group-hover:text-white">↗</span>
          </button>

          {/* PickMe */}
          <button
            onClick={handlePickMe}
            className="w-full p-4 bg-[#181818] border border-[#292929] hover:border-yellow-500/50 rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🟡</span>
              <div className="text-left">
                <p className="font-bold text-sm text-white group-hover:text-yellow-400">
                  Order on PickMe
                </p>
                <p className="text-[11px] text-gray-400">Delivered via PickMe rider</p>
              </div>
            </div>
            <span className="text-xs text-gray-500 group-hover:text-white">↗</span>
          </button>

          {/* Direct Order Button */}
          <button
            onClick={handleDirectOrder}
            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
              directDeliveryEnabled
                ? 'bg-[#ffbd18]/10 border border-[#ffbd18]/40 hover:bg-[#ffbd18] hover:text-[#070707] group'
                : 'bg-gray-900/50 border border-gray-800 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛵</span>
              <div className="text-left">
                <p
                  className={`font-black text-sm ${
                    directDeliveryEnabled
                      ? 'text-[#ffbd18] group-hover:text-[#070707]'
                      : 'text-gray-500 line-through'
                  }`}
                >
                  Order Direct (Fastest)
                </p>
                <p
                  className={`text-[11px] ${
                    directDeliveryEnabled
                      ? 'text-gray-300 group-hover:text-[#070707]/80'
                      : 'text-red-400 font-semibold'
                  }`}
                >
                  {directDeliveryEnabled
                    ? 'Add to site cart & checkout direct'
                    : 'Currently Unavailable'}
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-bold ${
                directDeliveryEnabled
                  ? 'text-[#ffbd18] group-hover:text-[#070707]'
                  : 'text-gray-500'
              }`}
            >
              {directDeliveryEnabled ? '+ Add' : 'Disabled'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}