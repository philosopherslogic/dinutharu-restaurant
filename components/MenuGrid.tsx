'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { MenuItem } from '@/types';

const categories = [
  { id: 'all', label: 'All Dishes' },
  { id: 'nasi-goreng', label: 'Nasi Goreng' },
  { id: 'rice', label: 'Fried Rice' },
  { id: 'sides', label: 'Sides' },
  { id: 'drinks', label: 'Drinks' },
];

export default function MenuGrid() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch menu directly from Supabase on mount
  useEffect(() => {
    async function fetchMenu() {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          // Map DB snake_case columns to TypeScript interface
          const mappedItems: MenuItem[] = data.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description || '',
            price: item.price,
            image: item.image_url,
            category: item.category,
            isPopular: item.is_popular,
            isAvailable: item.is_available ?? true,
          }));
          setMenuItems(mappedItems);
        }
      } catch (err) {
        console.error('Error fetching menu from Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMenu();
  }, []);

  const filteredItems =
    activeCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  const handleOpenDetails = (id: string) => {
    router.push(`/?item=${id}`, { scroll: false });
  };

  const handleOpenOrder = (id: string) => {
    router.push(`/?order=${id}`, { scroll: false });
  };

  return (
    <section id="menu" className="py-20 bg-[#070707] text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[#ffbd18] text-xs font-black tracking-[0.25em] uppercase">
            Our Specialities
          </span>
          <h2 className="text-4xl font-extrabold mt-2">
            Signature Menu
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Choose your favourite rice dish and order today.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-3 mb-12 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#ffbd18] text-[#070707] shadow-lg shadow-[#ffbd18]/20'
                  : 'bg-[#121212] text-gray-300 border border-[#292929] hover:border-[#ffbd18]/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#121212] border border-[#292929] rounded-2xl h-96 animate-pulse"
              />
            ))}
          </div>
        ) : (
          /* Food Items Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-[#121212] border rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 shadow-xl ${
                  !item.isAvailable
                    ? 'opacity-60 border-red-500/20'
                    : 'border-[#292929] hover:border-[#ffbd18]/40'
                }`}
              >
                <div>
                  {/* Image & Badges Container */}
                  <div className="relative w-full h-56 bg-[#070707] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className={`object-cover transition-transform duration-500 ${
                        item.isAvailable ? 'group-hover:scale-105' : 'grayscale'
                      }`}
                    />

                    {/* Popular Badge */}
                    {item.isPopular && item.isAvailable && (
                      <span className="absolute top-4 right-4 bg-[#ffbd18] text-[#070707] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                        Popular
                      </span>
                    )}

                    {/* Sold Out Overlay Badge */}
                    {!item.isAvailable && (
                      <span className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                        Sold Out
                      </span>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <h3
                      className={`text-xl font-bold transition-colors ${
                        item.isAvailable
                          ? 'text-white group-hover:text-[#ffbd18]'
                          : 'text-gray-400'
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 pt-0 border-t border-[#1a1a1a] mt-4">
                  <div className="flex items-center justify-between mb-4 pt-4">
                    <span className="text-xs text-gray-400 font-medium">
                      Price
                    </span>
                    <span className="text-xl font-extrabold text-[#ffbd18]">
                      LKR {item.price}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(item.id)}
                      className="py-2.5 px-3 bg-[#181818] border border-[#333333] hover:border-[#ffbd18] text-gray-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      disabled={!item.isAvailable}
                      onClick={() => handleOpenOrder(item.id)}
                      className="py-2.5 px-3 bg-[#ffbd18] text-[#070707] text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#ffbd18]/10 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {item.isAvailable ? 'Order Now' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}