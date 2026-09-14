'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface PromoCard {
  id: string;
  badge: string;
  title: string;
  description: string;
  originalPrice: number;
  promoPrice: number;
  image: string;
}

const promoItems: PromoCard[] = [
  {
    id: 'promo-1',
    badge: 'Special Offer',
    title: 'Nasi Goreng Combo Special',
    description: 'Flavorful Indonesian style rice served with fried egg, extra chili paste, and savory side garnishes.',
    originalPrice: 1600,
    promoPrice: 1350,
    image: '/nasi-goreng.jpg',
  },
  {
    id: 'promo-2',
    badge: 'Popular Deal',
    title: 'Chicken Fried Rice Meal',
    description: 'Hot wok-fried rice tossed with juicy tender chicken slices, fresh veggies, and signature chili paste.',
    originalPrice: 1400,
    promoPrice: 1200,
    image: '/chicken-fried-rice.jpg',
  },
  {
    id: 'promo-3',
    badge: 'Budget Choice',
    title: 'Egg & Veggie Rice Pack',
    description: 'Satisfying garden-fresh vegetable fried rice topped with a perfectly fried sunny-side egg.',
    originalPrice: 1100,
    promoPrice: 950,
    image: '/egg-vegetable-rice.jpg',
  },
];

export default function Promos() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Mobile Auto-scroll loop every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (currentIndex + 1) % promoItems.length;
      scrollToIndex(nextIndex);
    }, 4000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index);
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const cardWidth = scrollContainerRef.current.clientWidth;
      const newIndex = Math.round(scrollContainerRef.current.scrollLeft / cardWidth);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < promoItems.length) {
        setCurrentIndex(newIndex);
      }
    }
  };

  return (
    <section className="py-14 bg-[#0d0d0d] border-t border-b border-[#222222] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[#ffbd18] text-xs font-black tracking-[0.25em] uppercase">
            Limited Time Offers
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Hot Deals & Special Combos
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Save more on your favorite meals prepared fresh to order.
          </p>
        </div>

        {/* Responsive Container: Horizontal Carousel on Mobile (below md), 3-Column Grid on Desktop (md+) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex md:grid md:grid-cols-3 gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-2xl"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {promoItems.map((item) => (
            <div
              key={item.id}
              className="w-full flex-shrink-0 snap-center md:flex-shrink bg-[#121212] border border-[#292929] rounded-2xl overflow-hidden hover:border-[#ffbd18]/50 transition-all duration-300 shadow-xl flex flex-col justify-between group"
            >
              <div>
                {/* Image & Badge Wrapper */}
                <div className="relative w-full h-52 bg-[#070707] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-[#e52a20] text-white text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-full shadow-lg">
                    {item.badge}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white group-hover:text-[#ffbd18] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-2 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Price & Action Footer */}
              <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-[#1f1f1f] mt-2">
                <div>
                  <span className="text-xs text-gray-500 line-through mr-2">
                    LKR {item.originalPrice}
                  </span>
                  <span className="text-lg font-black text-[#ffbd18]">
                    LKR {item.promoPrice}
                  </span>
                </div>

                <a
                  href="#menu"
                  className="px-4 py-2 bg-[#ffbd18]/10 text-[#ffbd18] hover:bg-[#ffbd18] hover:text-[#070707] border border-[#ffbd18]/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Order Offer
                </a>
              </div>

            </div>
          ))}
        </div>

        {/* Active Navigation Dots (Mobile View Only) */}
        <div className="flex md:hidden items-center justify-center gap-2 mt-6">
          {promoItems.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentIndex === index
                  ? 'w-8 bg-[#ffbd18]'
                  : 'w-2.5 bg-[#333333]'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}