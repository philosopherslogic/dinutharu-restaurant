'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';

export default function Navbar() {
  const [isMounted, setIsMounted] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());

  // Prevent hydration mismatch between server and client for dynamic state (like local storage cart count)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-[#222222] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <Link href="#home" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 rounded-xl border-2 border-[#ffbd18] overflow-hidden bg-[#070707] transition-transform group-hover:scale-105">
            <Image
              src="/logo.jpg"
              alt="DinuTharu Logo"
              fill
              className="object-contain p-0.5"
              priority
            />
          </div>
          <span className="text-xl font-extrabold tracking-wider text-white">
            Dinu<span className="text-[#ffbd18]">Tharu</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider text-gray-300">
          <Link href="#home" className="hover:text-[#ffbd18] transition-colors">
            Home
          </Link>
          <Link href="#about" className="hover:text-[#ffbd18] transition-colors">
            About
          </Link>
          <Link href="#menu" className="hover:text-[#ffbd18] transition-colors">
            Menu
          </Link>
          <Link href="#contact" className="hover:text-[#ffbd18] transition-colors">
            Contact
          </Link>
        </div>

        {/* Action / Cart Section */}
        <div className="flex items-center gap-4">
          <Link
            href="/checkout"
            className="relative flex items-center justify-center p-2.5 bg-[#121212] border border-[#292929] rounded-xl hover:border-[#ffbd18] transition-all text-white"
            aria-label="View Shopping Cart"
          >
            <span className="text-xl">🛒</span>

            {/* Render dynamic badge counter only after client mounts to avoid React hydration errors */}
            {isMounted && totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#e52a20] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#050505] animate-pulse">
                {totalItems}
              </span>
            )}
          </Link>

          {/* Quick Call Action */}
          <a
            href="tel:+94711242301"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 bg-[#ffbd18] text-[#070707] font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#e0a410] transition-colors"
          >
            📞 Call Now
          </a>
        </div>

      </div>
    </nav>
  );
}