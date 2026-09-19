'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const ROTATING_HIGHLIGHTS = [
  { text: 'SMOKY WOK SEARS', icon: '🔥', color: 'from-[#ffbd18] to-amber-500' },
  { text: '100% FRESH INGREDIENTS', icon: '🌿', color: 'from-green-400 to-emerald-500' },
  { text: 'EXPRESS HOT DELIVERY', icon: '🛵', color: 'from-[#e52a20] to-red-500' },
];

export default function Hero() {
  const [highlightIdx, setHighlightIdx] = useState(0);

  // Auto-cycle through highlights
  useEffect(() => {
    const timer = setInterval(() => {
      setHighlightIdx((prev) => (prev + 1) % ROTATING_HIGHLIGHTS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const currentHighlight = ROTATING_HIGHLIGHTS[highlightIdx];

  return (
    <header id="home" className="relative min-h-[100dvh] pt-28 pb-20 flex items-center bg-[#070707] overflow-hidden">
      
      {/* 1. Background Ambient Video & Gradient Shadows */}
      <div className="absolute inset-0 z-0">
        <video
          poster="/hero-thumb.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="w-full h-full object-cover opacity-30 scale-105"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Gradient Mask: Solid dark on left for text contrast, open on right for video */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070707]/90 via-transparent to-[#070707]" />

        {/* Subtle Ambient Light Glows */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#ffbd18]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#e52a20]/10 rounded-full blur-[140px] pointer-events-none" />
      </div>

      {/* 2. Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left-Aligned Headline & CTA Column */}
          <div className="lg:col-span-8 space-y-8 text-left">
            
            {/* Live Operational Status + Cycling Feature Badge */}
            <div className="inline-flex flex-wrap items-center gap-3 bg-[#121212]/90 border border-[#262626] px-4 py-2 rounded-full shadow-2xl backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-gray-300 text-[11px] sm:text-xs font-black uppercase tracking-wider">
                Kitchen Open
              </span>
              <span className="text-[#333]">|</span>
              <div key={currentHighlight.text} className="flex items-center gap-1.5 animate-fadeIn">
                <span className="text-sm">{currentHighlight.icon}</span>
                <span className={`text-[11px] sm:text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${currentHighlight.color}`}>
                  {currentHighlight.text}
                </span>
              </div>
            </div>

            {/* Alive Dynamic Headline */}
            <div className="space-y-1">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.02]">
                Dinu
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd18] via-amber-200 to-[#e52a20] animate-pulse">
                  Tharu
                </span>
              </h1>
              <p className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-300 tracking-tight">
                Restaurant
              </p>
            </div>

            {/* Subtitle with Alive Text Glow Effects */}
            <p className="text-gray-300 text-base sm:text-lg lg:text-xl max-w-xl leading-relaxed font-medium">
              Sizzling hot, freshly tossed{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-[#ffbd18] font-black">
                Nasi Goreng
              </span>{' '}
              &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-[#ffbd18] font-black">
                Fried Rice
              </span>{' '}
              crafted on high-heat wok flames. Fast local delivery in Bokundara & Piliyandala.
            </p>

            {/* Action Call-to-Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2 max-w-md">
              <Link
                href="#menu"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-8 py-4 bg-[#ffbd18] text-[#070707] font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl hover:bg-[#e0a410] active:scale-95 transition-all shadow-xl shadow-[#ffbd18]/20"
              >
                🍚 View Live Menu
              </Link>
              <a
                href="tel:+94711242301"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-8 py-4 bg-[#181818] border border-[#333] hover:border-[#e52a20] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl active:scale-95 transition-all shadow-xl"
              >
                📞 Call Direct
              </a>
            </div>

            {/* Micro Highlights Grid */}
            <div className="pt-8 grid grid-cols-3 gap-6 border-t border-[#1f1f1f] max-w-lg">
              <div>
                <p className="text-[#ffbd18] font-black text-xl sm:text-2xl">100%</p>
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-extrabold tracking-wider mt-0.5">Fresh Wok Sear</p>
              </div>
              <div className="border-l border-[#1f1f1f] pl-6">
                <p className="text-white font-black text-xl sm:text-2xl">&lt; 30 Mins</p>
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-extrabold tracking-wider mt-0.5">Avg Delivery</p>
              </div>
              <div className="border-l border-[#1f1f1f] pl-6">
                <p className="text-[#ffbd18] font-black text-xl sm:text-2xl">5.0 ★</p>
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-extrabold tracking-wider mt-0.5">Taste Rating</p>
              </div>
            </div>

          </div>

          {/* Right Column: Subtle Glass Floating Live Ticker Card */}
          <div className="lg:col-span-4 hidden lg:flex justify-end">
            <div className="bg-[#121212]/80 backdrop-blur-md border border-[#292929] p-6 rounded-3xl shadow-2xl max-w-xs space-y-4 animate-bounce [animation-duration:6s]">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ffbd18] to-amber-600 flex items-center justify-center text-xl shadow-lg shadow-[#ffbd18]/20">
                  🔥
                </span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Hot Wok Kitchen</h4>
                  <p className="text-[10px] text-gray-400">Order Online or Call</p>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed border-t border-[#222] pt-3">
                Sizzling portions ready for express delivery or pickup in Piliyandala.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Floating Scroll Down Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
        <Link href="#menu" className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Scroll Down</span>
          <div className="w-5 h-9 rounded-full border-2 border-gray-600 flex justify-center p-1">
            <div className="w-1 h-2 bg-[#ffbd18] rounded-full animate-bounce" />
          </div>
        </Link>
      </div>

    </header>
  );
}