'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { MenuItem } from '@/types';

const categories = [
  { id: 'all', label: 'All Dishes', icon: '🍽️' },
  { id: 'nasi-goreng', label: 'Nasi Goreng', icon: '🔥' },
  { id: 'rice', label: 'Fried Rice', icon: '🍚' },
  { id: 'sides', label: 'Sides', icon: '🍗' },
  { id: 'drinks', label: 'Drinks', icon: '🥤' },
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
    <section id="menu" className="py-24 bg-[#050505] text-white relative overflow-hidden border-t border-[#181818]">
      
      {/* Dynamic Background FX & Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-[#ffbd18]/5 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-10 -left-20 w-[600px] h-[600px] bg-[#e52a20]/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[#ffbd18] bg-[#ffbd18]/10 border border-[#ffbd18]/20 px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.25em] uppercase inline-block shadow-sm">
            Wok-Fired Excellence
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd18] via-amber-200 to-[#e52a20]">Signature Menu</span>
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Sizzling hot Sri Lankan and Asian fusion delights prepared fresh to order. Select your dish to order online for express delivery or pickup.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-14 flex-wrap">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ffbd18] to-amber-500 text-[#070707] shadow-lg shadow-[#ffbd18]/20 scale-105'
                    : 'bg-[#121212] text-gray-400 border border-[#222222] hover:border-[#ffbd18]/40 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Loading Skeleton Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-[#121212] border border-[#222222] rounded-3xl h-[420px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          /* Food Items Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-gradient-to-b from-[#121212] to-[#080808] border rounded-3xl overflow-hidden flex flex-col justify-between group transition-all duration-500 shadow-2xl relative ${
                  !item.isAvailable
                    ? 'opacity-60 border-red-500/20'
                    : 'border-[#222222] hover:border-[#ffbd18]/60 hover:shadow-[#ffbd18]/10'
                }`}
              >
                <div>
                  {/* Image Container */}
                  <div className="relative w-full h-60 bg-[#000] overflow-hidden">
                    <Image
                      src={item.image || '/logo.jpg'}
                      alt={item.title}
                      fill
                      className={`object-cover transition-transform duration-700 ease-out ${
                        item.isAvailable ? 'group-hover:scale-110' : 'grayscale'
                      }`}
                    />
                    
                    {/* Dark Bottom Fade Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-90" />

                    {/* Popular Badge */}
                    {item.isPopular && item.isAvailable && (
                      <span className="absolute top-4 right-4 bg-gradient-to-r from-[#ffbd18] to-amber-500 text-[#070707] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-[#ffbd18]/50 flex items-center gap-1">
                        <span>🔥</span> Popular
                      </span>
                    )}

                    {/* Sold Out Overlay Badge */}
                    {!item.isAvailable && (
                      <span className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-red-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-red-500/50">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Card Main Info */}
                  <div className="p-6 sm:p-7 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`text-xl font-black transition-colors leading-tight ${
                          item.isAvailable
                            ? 'text-white group-hover:text-[#ffbd18]'
                            : 'text-gray-400'
                        }`}
                      >
                        {item.title}
                      </h3>
                    </div>
                    
                    <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {item.description || 'Authentic wok-fried specialty prepared with signature spices and fresh ingredients.'}
                    </p>
                  </div>
                </div>

                {/* Card Action Controls Footer */}
                <div className="p-6 sm:p-7 pt-0 border-t border-[#1a1a1a] mt-4 space-y-4">
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest">
                      Price
                    </span>
                    <span className="text-2xl font-black text-[#ffbd18]">
                      LKR {item.price}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(item.id)}
                      className="py-3 px-3 bg-[#181818] border border-[#2e2e2e] hover:border-[#ffbd18] text-gray-200 text-xs font-black uppercase tracking-wider rounded-2xl transition-all hover:text-white"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      disabled={!item.isAvailable}
                      onClick={() => handleOpenOrder(item.id)}
                      className="py-3 px-3 bg-gradient-to-r from-[#ffbd18] to-amber-500 text-[#070707] text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-[#ffbd18]/20 hover:scale-[1.02] active:scale-95 disabled:bg-gray-800 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {item.isAvailable ? 'Order Now' : 'Unavailable'}
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