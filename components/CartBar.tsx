'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';

export default function CartBar() {
  const [isMounted, setIsMounted] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  // Prevent SSR hydration mismatches by rendering only after mounting on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-2xl mx-auto transition-all duration-300">
      <div className="bg-[#050505]/95 backdrop-blur-xl border border-[#ffbd18]/40 p-4 rounded-2xl shadow-2xl flex items-center justify-between text-white">
        
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
          className="px-6 py-3 bg-[#ffbd18] hover:bg-[#e0a410] text-[#070707] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#ffbd18]/20 flex items-center gap-2"
        >
          <span>Complete Order</span>
          <span>➔</span>
        </Link>

      </div>
    </div>
  );
}