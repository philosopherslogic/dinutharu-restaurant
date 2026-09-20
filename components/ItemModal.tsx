'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { MenuItem } from '@/types';

export default function ItemModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('item');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Store Operational Status States
  const [isStoreOpen, setIsStoreOpen] = useState<boolean | null>(null);
  const [showClosedModal, setShowClosedModal] = useState(false);

  useEffect(() => {
    // 1. Fetch Item Details
    if (!itemId) {
      setSelectedItem(null);
      return;
    }

    async function fetchItemDetails() {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', itemId)
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

    fetchItemDetails();
  }, [itemId]);

  useEffect(() => {
    // 2. Fetch Live Store Status
    async function fetchStoreStatus() {
      try {
        const { data } = await supabase
          .from('store_settings')
          .select('is_open')
          .limit(1)
          .maybeSingle();

        if (data && typeof data.is_open === 'boolean') {
          setIsStoreOpen(data.is_open);
        } else {
          setIsStoreOpen(true); // Fallback default
        }
      } catch (err) {
        console.error('Error fetching store settings:', err);
        setIsStoreOpen(true);
      }
    }

    fetchStoreStatus();

    // 3. Real-time Subscription for Store Settings (Admin Panel sync)
    const channel = supabase
      .channel('item-modal-store-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'store_settings' },
        (payload) => {
          if (payload.new && typeof payload.new.is_open === 'boolean') {
            setIsStoreOpen(payload.new.is_open);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!itemId || !selectedItem) return null;

  const handleClose = () => {
    router.back();
  };

  const handleOpenOrder = () => {
    // If store is explicitly closed, intercept and show store closed modal
    if (isStoreOpen === false) {
      setShowClosedModal(true);
      return;
    }

    // Otherwise proceed to ordering screen
    router.replace(`/?order=${selectedItem.id}`, { scroll: false });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="absolute inset-0" onClick={handleClose} />

        <div className="relative z-10 bg-[#121212] border border-[#292929] rounded-2xl max-w-lg w-full overflow-hidden text-white shadow-2xl">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/50 hover:bg-black rounded-full flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>

          <div className="relative w-full h-64 bg-[#070707]">
            <Image
              src={selectedItem.image}
              alt={selectedItem.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="p-6">
            <span className="text-xs text-[#ffbd18] font-bold uppercase tracking-wider">
              {selectedItem.category}
            </span>
            <h3 className="text-2xl font-extrabold mt-1">{selectedItem.title}</h3>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">
              {selectedItem.description}
            </p>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#222222]">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Price</span>
                <span className="text-2xl font-black text-[#ffbd18]">
                  LKR {selectedItem.price}
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenOrder}
                className="px-6 py-3 bg-[#ffbd18] hover:bg-[#e0a410] text-[#070707] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#ffbd18]/20 cursor-pointer"
              >
                Order Dish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STORE CLOSED WARNING MODAL */}
      {showClosedModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-3xl">
              🌙
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                Store is Currently Closed
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                We are not taking online orders right now. Our direct ordering system reopens during our regular operational hours.
              </p>
            </div>

            <div className="bg-[#080808] p-4 rounded-2xl border border-[#222222] space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ffbd18] block">
                Standard Business Hours
              </span>
              <p className="text-xs font-bold text-gray-200">
                Daily: 3:30 PM - 12:30 AM
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowClosedModal(false)}
              className="w-full py-3.5 bg-gradient-to-r from-[#ffbd18] to-amber-500 text-[#070707] font-black text-xs uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#ffbd18]/25 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}