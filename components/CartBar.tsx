'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { supabase } from '@/lib/supabaseClient';

function ThickGoldArrow() {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className="w-16 h-16 sm:w-20 sm:h-20 filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE072"/>
          <stop offset="40%" stopColor="#FFBD18"/>
          <stop offset="75%" stopColor="#E0A410"/>
          <stop offset="100%" stopColor="#996A00"/>
        </linearGradient>

        <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.8"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#goldGlow)">
        <path 
          d="M 80 15 
             L 52 43 
             L 62 53 
             L 20 60 
             L 27 18 
             L 37 28 
             L 65 0 
             Z" 
          fill="url(#goldGradient)" 
          stroke="#050505" 
          strokeWidth="2.5" 
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default function CartBar() {
  const [isMounted, setIsMounted] = useState(false);

  // Store Operational Status States
  const [isStoreOpen, setIsStoreOpen] = useState<boolean | null>(null);
  const [showClosedModal, setShowClosedModal] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);

    // 1. Fetch live store status
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

    // 2. Real-time Subscription for Store Settings (Admin Panel sync)
    const channel = supabase
      .channel('cart-bar-store-status')
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

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (isStoreOpen === false) {
      e.preventDefault();
      setShowClosedModal(true);
      return;
    }
  };

  if (!isMounted || totalItems === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-2xl mx-auto transition-all duration-300">
        <div className="bg-[#050505]/95 backdrop-blur-xl border border-[#ffbd18]/40 p-4 rounded-2xl shadow-2xl flex items-center justify-between text-white relative">
          
          {/* Floating Thick Golden Arrow Positioned Outside Top-Right Pointing Directly at Button */}
          <div className="absolute -top-12 sm:-top-14 right-2 sm:right-6 pointer-events-none z-50 animate-bounce-diagonal">
            <ThickGoldArrow />
          </div>

          {/* Cart Item Counter & Subtotal */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-[#ffbd18] text-[#070707] font-black rounded-xl flex items-center justify-center text-sm shadow-md">
              🛒
              <span className="absolute -top-1.5 -right-1.5 bg-[#e52a20] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#050505]">
                {totalItems}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Your Order
              </p>
              <p className="text-base font-extrabold text-[#ffbd18]">
                LKR {totalPrice}
              </p>
            </div>
          </div>

          {/* Action Button to Checkout */}
          <Link
            href="/checkout"
            onClick={handleCheckoutClick}
            className="relative px-6 py-3 bg-[#ffbd18] hover:bg-[#e0a410] text-[#070707] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#ffbd18]/25 flex items-center gap-2 hover:scale-105 active:scale-95 ring-2 ring-[#ffbd18]/50 cursor-pointer"
          >
            <span>Complete Order</span>
            <span>➔</span>
          </Link>

        </div>

        {/* Diagonal Pushing Animation towards the Complete Order Button */}
        <style jsx global>{`
          @keyframes bounceDiagonal {
            0%, 100% {
              transform: translate(0, 0);
            }
            50% {
              transform: translate(-6px, 8px);
            }
          }
          .animate-bounce-diagonal {
            animation: bounceDiagonal 0.7s infinite ease-in-out;
          }
        `}</style>
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