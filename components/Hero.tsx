'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const ROTATING_HIGHLIGHTS = [
  { text: 'GENEROUS PORTIONS', icon: '🍲', color: 'from-[#ffbd18] to-amber-400' },
  { text: '100% FRESH INGREDIENTS', icon: '🌿', color: 'from-green-400 to-emerald-400' },
  { text: 'EXPRESS LOCAL DELIVERY', icon: '🛵', color: 'from-[#e52a20] to-red-500' },
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
    <header id="home" className="relative min-h-[100dvh] pt-28 pb-16 flex items-center justify-center bg-[#070707] overflow-hidden">
      
      {/* 1. Background Video & Soft Ambient Masks */}
      <div className="absolute inset-0 z-0">
        <video
          poster="/hero-thumb.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="w-full h-full object-cover opacity-55 scale-100"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Ambient Radial Overlay for High Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070707]/80 via-[#070707]/50 to-[#070707]" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#070707]/30 to-[#070707]" />

        {/* Ambient Glowing Flares */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ffbd18]/10 rounded-full blur-[160px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#e52a20]/10 rounded-full blur-[140px] pointer-events-none" />
      </div>

      {/* 2. Hero Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        
        <div className="space-y-8 flex flex-col items-center">
          
          {/* Live Operational Status + Cycling Feature Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 bg-[#121212]/90 border border-[#2a2a2a] px-4 sm:px-5 py-2 rounded-full shadow-2xl backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-gray-300 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              Kitchen Open
            </span>
            <span className="text-[#333]">|</span>
            <div key={currentHighlight.text} className="flex items-center gap-1.5 animate-fadeIn">
              <span className="text-sm">{currentHighlight.icon}</span>
              <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${currentHighlight.color}`}>
                {currentHighlight.text}
              </span>
            </div>
          </div>

          {/* Alive Brand Title */}
          <div className="space-y-1 drop-shadow-2xl relative">
            
            {/* Floating Sparkle Accents */}
            <span className="absolute -top-6 left-1/4 text-xl sm:text-2xl animate-bounce [animation-duration:4s]">✨</span>
            <span className="absolute -bottom-2 right-1/4 text-xl sm:text-2xl animate-bounce [animation-duration:5s]">🔥</span>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.02]">
              Dinu
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd18] via-amber-200 to-[#e52a20] animate-pulse">
                Tharu
              </span>
            </h1>
            <p className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-200 tracking-tight">
              Restaurant
            </p>
          </div>

          {/* Concise Alive Description */}
          <p className="text-gray-200 text-sm sm:text-lg lg:text-xl max-w-2xl leading-relaxed font-medium drop-shadow-md">
            Generous portions, vibrant local spices, and unbeatable wok-tossed flavor prepared fresh to order. Fast direct delivery to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd18] to-amber-200 font-black">
              Bokundara, Piliyandala
            </span>{' '}
            and nearby areas.
          </p>

          {/* Action Call-to-Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 w-full max-w-md">
            <Link
              href="#menu"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#ffbd18] to-amber-500 text-[#070707] font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#ffbd18]/25"
            >
              🍚 View Live Menu
            </Link>
            <a
              href="tel:+94711242301"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-8 py-4 bg-[#121212]/90 backdrop-blur-md border border-[#333] hover:border-[#e52a20] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              📞 Call Direct
            </a>
          </div>

          {/* Micro Highlights Bar */}
          <div className="pt-8 grid grid-cols-3 gap-4 sm:gap-8 border-t border-[#222222]/80 w-full max-w-lg backdrop-blur-sm">
            <div className="text-center">
              <p className="text-[#ffbd18] font-black text-lg sm:text-2xl">100%</p>
              <p className="text-[9px] sm:text-xs text-gray-300 uppercase font-extrabold tracking-wider mt-0.5">Fresh Ingredients</p>
            </div>
            <div className="text-center border-l border-[#222222] pl-4 sm:pl-8">
              <p className="text-white font-black text-lg sm:text-2xl">&lt; 30 Mins</p>
              <p className="text-[9px] sm:text-xs text-gray-300 uppercase font-extrabold tracking-wider mt-0.5">Avg Delivery</p>
            </div>
            <div className="text-center border-l border-[#222222] pl-4 sm:pl-8">
              <p className="text-[#ffbd18] font-black text-lg sm:text-2xl">5.0 ★</p>
              <p className="text-[9px] sm:text-xs text-gray-300 uppercase font-extrabold tracking-wider mt-0.5">Taste Rating</p>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Floating Scroll Down Pill */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
        <Link href="#menu" className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Scroll Down</span>
          <div className="w-5 h-9 rounded-full border-2 border-gray-400 flex justify-center p-1 backdrop-blur-sm">
            <div className="w-1 h-2 bg-[#ffbd18] rounded-full animate-bounce" />
          </div>
        </Link>
      </div>

    </header>
  );
}