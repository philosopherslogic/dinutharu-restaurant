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

  useEffect(() => {
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

  if (!itemId || !selectedItem) return null;

  const handleClose = () => {
    router.back();
  };

  const handleOpenOrder = () => {
    router.replace(`/?order=${selectedItem.id}`, { scroll: false });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative z-10 bg-[#121212] border border-[#292929] rounded-2xl max-w-lg w-full overflow-hidden text-white shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/50 hover:bg-black rounded-full flex items-center justify-center text-gray-300 hover:text-white"
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
              onClick={handleOpenOrder}
              className="px-6 py-3 bg-[#ffbd18] hover:bg-[#e0a410] text-[#070707] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#ffbd18]/20"
            >
              Order Dish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}