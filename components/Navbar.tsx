'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { useAuth } from '@/lib/authContext';
import AuthModal from '@/components/AuthModal';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#050505]/90 backdrop-blur-md border-b border-[#222222] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Brand Logo & Name */}
          <Link href="/#home" onClick={closeMobileMenu} className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-xl border-2 border-[#ffbd18] overflow-hidden bg-[#070707] transition-transform group-hover:scale-105">
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
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-gray-300">
            <Link href="/#home" className="hover:text-[#ffbd18] transition-colors">
              Home
            </Link>
            <Link href="/#about" className="hover:text-[#ffbd18] transition-colors">
              About
            </Link>
            <Link href="/#menu" className="hover:text-[#ffbd18] transition-colors">
              Menu
            </Link>
            <Link href="/#contact" className="hover:text-[#ffbd18] transition-colors">
              Contact
            </Link>
          </div>

          {/* Action Controls Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* My Orders Button */}
            <Link
              href="/my-orders"
              onClick={closeMobileMenu}
              className="px-3 py-2 bg-[#121212] border border-[#292929] hover:border-[#ffbd18] text-xs font-bold uppercase rounded-xl transition-all text-[#ffbd18] flex items-center gap-1.5 shadow-sm"
            >
              <span>📦</span>
              <span className="hidden sm:inline">My Orders</span>
            </Link>

            {/* Shopping Cart Button */}
            <Link
              href="/checkout"
              onClick={closeMobileMenu}
              className="relative flex items-center justify-center p-2.5 bg-[#121212] border border-[#292929] rounded-xl hover:border-[#ffbd18] transition-all text-white"
              aria-label="View Shopping Cart"
            >
              <span className="text-lg">🛒</span>
              {isMounted && totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#e52a20] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#050505] animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Auth Controls */}
            {user ? (
              <div className="hidden lg:flex items-center gap-3 bg-[#121212] border border-[#292929] px-3 py-1.5 rounded-xl">
                <span className="text-xs text-gray-300 font-semibold max-w-[120px] truncate">
                  👤 {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-[10px] font-bold uppercase rounded-lg transition-all"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 bg-[#ffbd18] text-[#070707] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#e0a410] transition-all shadow-md"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white focus:outline-none"
              aria-label="Toggle Mobile Navigation Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#050505] border-b border-[#222222] px-4 pt-3 pb-6 space-y-3">
            <Link
              href="/#home"
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-[#ffbd18] hover:bg-[#121212] transition-all"
            >
              Home
            </Link>
            <Link
              href="/#about"
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-[#ffbd18] hover:bg-[#121212] transition-all"
            >
              About
            </Link>
            <Link
              href="/#menu"
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-[#ffbd18] hover:bg-[#121212] transition-all"
            >
              Menu
            </Link>
            <Link
              href="/#contact"
              onClick={closeMobileMenu}
              className="block px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-300 hover:text-[#ffbd18] hover:bg-[#121212] transition-all"
            >
              Contact
            </Link>

            {/* Mobile Auth & Call Controls */}
            <div className="pt-2 space-y-2">
              {user ? (
                <div className="flex items-center justify-between p-3 bg-[#121212] border border-[#292929] rounded-xl">
                  <span className="text-xs text-gray-300 font-semibold truncate">
                    👤 {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <button
                    type="button"
                    onClick={() => { signOut(); closeMobileMenu(); }}
                    className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase rounded-lg"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsAuthOpen(true); closeMobileMenu(); }}
                  className="w-full py-3 bg-[#ffbd18] text-[#070707] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#e0a410] transition-colors"
                >
                  🔑 Sign In / Register Account
                </button>
              )}

              <a
                href="tel:+94711242301"
                className="w-full flex items-center justify-center py-3 bg-[#181818] border border-[#292929] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                📞 Call Now
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Authentication Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}