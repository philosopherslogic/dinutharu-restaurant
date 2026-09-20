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
  
  // Store Channel Toggle States
  const [directDeliveryEnabled, setDirectDeliveryEnabled] = useState(true);
  const [ubereatsEnabled, setUbereatsEnabled] = useState(true);
  const [pickmeEnabled, setPickmeEnabled] = useState(true);

  // Closed Notice States
  const [closedNoticeMessage, setClosedNoticeMessage] = useState<string | null>(null);

  const addToCart = useCartStore((state) => state.addToCart);

  useEffect(() => {
    if (!orderId) {
      setSelectedItem(null);
      return;
    }

    // 1. Fetch Item Details (Checks menu_items first, then promos fallback)
    async function fetchOrderItem() {
      // Try fetching from menu_items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (menuData) {
        setSelectedItem({
          id: menuData.id,
          title: menuData.title,
          description: menuData.description || '',
          price: menuData.price,
          image: menuData.image_url,
          category: menuData.category,
          isPopular: menuData.is_popular,
          isAvailable: menuData.is_available,
        });
        return;
      }

      // Fallback: Check promos table if not in menu_items
      const { data: promoData } = await supabase
        .from('promos')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (promoData) {
        setSelectedItem({
          id: promoData.id,
          title: promoData.title,
          description: promoData.description || '',
          price: promoData.promo_price,
          image: promoData.image_url,
          category: 'promotions',
          isPopular: true,
          isAvailable: promoData.is_active ?? true,
        });
      }
    }

    // 2. Fetch Live Store Channel Settings
    async function fetchStoreSettings() {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('direct_delivery_enabled, ubereats_enabled, pickme_enabled')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching channel settings:', error.message);
          return;
        }

        if (data) {
          setDirectDeliveryEnabled(data.direct_delivery_enabled ?? true);
          setUbereatsEnabled(data.ubereats_enabled ?? true);
          setPickmeEnabled(data.pickme_enabled ?? true);
        }
      } catch (err) {
        console.error('Unexpected settings error:', err);
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
    if (!ubereatsEnabled) {
      setClosedNoticeMessage('⚠️ Uber Eats orders are currently disabled by the store.');
      return;
    }
    window.open('https://www.ubereats.com/', '_blank');
    handleClose();
  };

  const handlePickMe = () => {
    if (!pickmeEnabled) {
      setClosedNoticeMessage('⚠️ PickMe Food orders are currently disabled by the store.');
      return;
    }
    window.open('https://pickme.lk/', '_blank');
    handleClose();
  };

  const handleDirectOrder = () => {
    if (!directDeliveryEnabled) {
      setClosedNoticeMessage('⚠️ Direct Delivery is unavailable right now. Please select an available method!');
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

        {/* Disabled Notice Banner */}
        {closedNoticeMessage && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center justify-between">
            <span>{closedNoticeMessage}</span>
            <button
              onClick={() => setClosedNoticeMessage(null)}
              className="text-white font-bold text-sm ml-2"
            >
              ✕
            </button>
          </div>
        )}

        <div className="space-y-3 mt-6">
          {/* Uber Eats Option */}
          <button
            onClick={handleUberEats}
            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
              ubereatsEnabled
                ? 'bg-[#181818] border border-[#292929] hover:border-green-500/50 group'
                : 'bg-gray-900/50 border border-gray-800 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🟢</span>
              <div className="text-left">
                <p
                  className={`font-bold text-sm ${
                    ubereatsEnabled
                      ? 'text-white group-hover:text-green-400'
                      : 'text-gray-500 line-through'
                  }`}
                >
                  Order on Uber Eats
                </p>
                <p
                  className={`text-[11px] ${
                    ubereatsEnabled ? 'text-gray-400' : 'text-red-400 font-semibold'
                  }`}
                >
                  {ubereatsEnabled ? 'Delivered via Uber driver' : 'Currently Unavailable'}
                </p>
              </div>
            </div>
            <span
              className={`text-xs ${
                ubereatsEnabled ? 'text-gray-500 group-hover:text-white' : 'text-gray-600'
              }`}
            >
              {ubereatsEnabled ? '↗' : 'Disabled'}
            </span>
          </button>

          {/* PickMe Option */}
          <button
            onClick={handlePickMe}
            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
              pickmeEnabled
                ? 'bg-[#181818] border border-[#292929] hover:border-yellow-500/50 group'
                : 'bg-gray-900/50 border border-gray-800 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🟡</span>
              <div className="text-left">
                <p
                  className={`font-bold text-sm ${
                    pickmeEnabled
                      ? 'text-white group-hover:text-yellow-400'
                      : 'text-gray-500 line-through'
                  }`}
                >
                  Order on PickMe
                </p>
                <p
                  className={`text-[11px] ${
                    pickmeEnabled ? 'text-gray-400' : 'text-red-400 font-semibold'
                  }`}
                >
                  {pickmeEnabled ? 'Delivered via PickMe rider' : 'Currently Unavailable'}
                </p>
              </div>
            </div>
            <span
              className={`text-xs ${
                pickmeEnabled ? 'text-gray-500 group-hover:text-white' : 'text-gray-600'
              }`}
            >
              {pickmeEnabled ? '↗' : 'Disabled'}
            </span>
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
                  Dinutharu Delivery OR Pickup
                </p>
                <p
                  className={`text-[11px] ${
                    directDeliveryEnabled
                      ? 'text-gray-300 group-hover:text-[#070707]/80'
                      : 'text-red-400 font-semibold'
                  }`}
                >
                  {directDeliveryEnabled
                    ? '💵 Cash on Delivery / Checkout at restaurant'
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