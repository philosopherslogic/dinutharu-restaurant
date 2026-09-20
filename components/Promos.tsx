'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface PromoItem {
  id: string;
  badge: string;
  title: string;
  description: string;
  original_price: number;
  promo_price: number;
  image_url: string;
  is_active: boolean;
}

export default function Promos() {
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Store Operational Status States
  const [isStoreOpen, setIsStoreOpen] = useState<boolean | null>(null);
  const [showClosedModal, setShowClosedModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // 1. Fetch Active Promos
    async function fetchActivePromos() {
      const { data, error } = await supabase
        .from('promos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setPromos(data);
      }
      setLoading(false);
    }

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

    fetchActivePromos();
    fetchStoreStatus();

    // 3. Real-time Subscription for Store Settings
    const channel = supabase
      .channel('promos-store-status')
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

  const handleOpenOrder = (id: string) => {
    // If store is explicitly closed, intercept and trigger warning modal
    if (isStoreOpen === false) {
      setShowClosedModal(true);
      return;
    }

    // Otherwise proceed to ordering screen
    router.push(`/?order=${id}`, { scroll: false });
  };

  if (!loading && promos.length === 0) return null;

  return (
    <section id="promos" className="py-28 bg-[#040404] text-white relative overflow-hidden border-t border-[#1a1a1a]">
      
      {/* 1. MAXIMUM DYNAMIC BACKGROUND ANIMATIONS */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#e52a20]/20 via-[#ffbd18]/15 to-transparent rounded-full blur-[180px] animate-pulse" />
        <div className="absolute top-1/4 right-10 w-[400px] h-[400px] bg-[#e52a20]/10 rounded-full blur-[140px] animate-[pulse_6s_ease-in-out_infinite]" />

        {/* Floating Ember Particles */}
        <div className="ember-1 absolute top-1/4 left-1/6 w-2 h-2 bg-[#ffbd18] rounded-full blur-[0.5px]" />
        <div className="ember-2 absolute top-1/3 right-1/5 w-3 h-3 bg-[#e52a20] rounded-full blur-[1px]" />
        <div className="ember-3 absolute bottom-1/4 left-1/3 w-2 h-2 bg-amber-400 rounded-full blur-[0.5px]" />
        <div className="ember-1 absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-[#ffbd18] rounded-full" />

        {/* Drifting Wok Smoke Layers */}
        <div className="absolute -top-10 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] animate-[smoke_12s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[130px] animate-[smoke_9s_ease-in-out_infinite]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#e52a20]/25 via-[#ffbd18]/20 to-[#e52a20]/25 border border-[#e52a20]/50 px-5 py-2 rounded-full shadow-2xl backdrop-blur-md animate-bounce">
            <span className="text-base">🔥</span>
            <span className="text-[#ffbd18] text-[11px] font-black tracking-[0.25em] uppercase">
              Limited Time Offers
            </span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Chef Specials & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd18] via-amber-200 to-[#e52a20] animate-pulse">
              Exclusive Combo Offers
            </span>
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Save money by taking advantage of our limited-time offers. Grab your discount before today&apos;s batch sells out!
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="w-full max-w-4xl h-80 bg-[#121212] rounded-3xl animate-pulse border border-[#1f1f1f]" />
          </div>
        ) : (
          <>
            {/* SINGLE PROMO HERO SHOWCASE (When 1 Active Promo Exists) */}
            {promos.length === 1 ? (
              <div className="max-w-4xl mx-auto relative">
                
                <div className="absolute -bottom-6 -right-6 text-3xl sm:text-4xl pointer-events-none z-30 animate-[splash_5s_ease-in-out_infinite_1s]">
                  🌶️
                </div>

                {promos.map((promo) => {
                  const discountPercent = Math.round(
                    ((promo.original_price - promo.promo_price) / promo.original_price) * 100
                  );

                  return (
                    <div
                      key={promo.id}
                      className="relative bg-gradient-to-br from-[#161616] via-[#0d0d0d] to-[#070707] border-2 border-[#ffbd18]/50 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(255,189,24,0.2)] grid grid-cols-1 md:grid-cols-12 items-center group transition-all duration-500 hover:border-[#ffbd18]"
                    >
                      {/* Left Image Showcase */}
                      <div className="md:col-span-6 relative h-72 md:h-[420px] w-full overflow-hidden bg-black">
                        <Image
                          src={promo.image_url}
                          alt={promo.title}
                          fill
                          priority
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-transparent to-[#0d0d0d] opacity-90" />
                        
                        {/* Dynamic Flame Discount Ribbon */}
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-[#e52a20] to-[#c71f16] text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl border border-red-400/40 flex items-center gap-1.5 animate-pulse">
                          <span>💥</span> SAVE {discountPercent > 0 ? `${discountPercent}%` : 'SPECIAL'}
                        </div>
                      </div>

                      {/* Right Details Block */}
                      <div className="md:col-span-6 p-8 sm:p-10 flex flex-col justify-between space-y-6 relative z-10">
                        
                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ffbd18] bg-[#ffbd18]/10 border border-[#ffbd18]/30 px-3.5 py-1.5 rounded-xl inline-block shadow-sm">
                            {promo.badge}
                          </span>
                          
                          <h3 className="text-2xl sm:text-4xl font-black text-white group-hover:text-[#ffbd18] transition-colors leading-tight">
                            {promo.title}
                          </h3>

                          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                            {promo.description}
                          </p>
                        </div>

                        {/* Price & Trigger Order Modal */}
                        <div className="pt-6 border-t border-[#222222] flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Special Combo Price</p>
                            <div className="flex items-baseline gap-3 mt-1">
                              <span className="text-3xl sm:text-4xl font-black text-[#ffbd18]">
                                LKR {promo.promo_price}
                              </span>
                              {promo.original_price > promo.promo_price && (
                                <span className="text-sm text-gray-500 line-through font-semibold">
                                  LKR {promo.original_price}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenOrder(promo.id)}
                            className="px-8 py-4 bg-gradient-to-r from-[#ffbd18] via-amber-400 to-[#e52a20] text-[#070707] font-black text-xs uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#ffbd18]/30 flex items-center gap-2 cursor-pointer"
                          >
                            <span>🛒</span> Order Now
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              
              /* MULTI-PROMO GRID SHOWCASE (When Multiple Active Promos Exist) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {promos.map((promo) => (
                  <div
                    key={promo.id}
                    className="bg-gradient-to-b from-[#141414] to-[#080808] border border-[#222222] rounded-3xl overflow-hidden hover:border-[#ffbd18]/60 transition-all duration-500 shadow-2xl flex flex-col group relative"
                  >
                    <div className="relative w-full h-64 bg-black overflow-hidden">
                      <Image
                        src={promo.image_url}
                        alt={promo.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-transparent opacity-80" />
                      
                      <span className="absolute top-4 left-4 bg-gradient-to-r from-[#e52a20] to-[#c71f16] text-white text-[10px] font-black tracking-widest uppercase px-3.5 py-1.5 rounded-full shadow-lg border border-red-500/50">
                        {promo.badge}
                      </span>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-xl font-black text-white group-hover:text-[#ffbd18] transition-colors leading-tight">
                          {promo.title}
                        </h3>
                        <p className="text-gray-400 text-xs mt-2 leading-relaxed line-clamp-3">
                          {promo.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[#1f1f1f] flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Price</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[#ffbd18]">
                              LKR {promo.promo_price}
                            </span>
                            {promo.original_price > promo.promo_price && (
                              <span className="text-xs text-gray-500 line-through font-semibold">
                                {promo.original_price}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenOrder(promo.id)}
                          className="px-6 py-3 bg-gradient-to-r from-[#ffbd18] to-amber-500 text-[#070707] font-black text-xs uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#ffbd18]/20 cursor-pointer"
                        >
                          Order Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

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

      {/* 2. CUSTOM CSS ANIMATION KEYFRAMES */}
      <style jsx global>{`
        @keyframes emberRise {
          0% { transform: translateY(0px) scale(0.8); opacity: 0.2; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.9; }
          100% { transform: translateY(-70px) scale(0.5); opacity: 0; }
        }

        @keyframes splash {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(12deg); }
        }

        @keyframes smoke {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.3; }
          50% { transform: scale(1.3) translate(20px, -20px); opacity: 0.6; }
        }

        .ember-1 { animation: emberRise 4s ease-in-out infinite; }
        .ember-2 { animation: emberRise 6s ease-in-out infinite 1.5s; }
        .ember-3 { animation: emberRise 5s ease-in-out infinite 3s; }
      `}</style>

    </section>
  );
}