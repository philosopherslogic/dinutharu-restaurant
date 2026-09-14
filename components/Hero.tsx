'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <header id="home" className="relative min-h-screen pt-28 pb-16 flex items-center bg-[#070707] overflow-hidden">
      {/* 1. Background Video with Poster Fallback */}
      <div className="absolute inset-0 z-0">
        <video
          poster="/hero-thumb.jpg"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="w-full h-full object-cover opacity-30"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Dark radial overlay for high text contrast */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#070707]/70 to-[#070707]" />
      </div>

      {/* 2. Hero Content Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Text & CTAs */}
          <div className="space-y-6">
            <span className="inline-block text-[#ffbd18] text-xs sm:text-sm font-black tracking-[0.25em] uppercase bg-[#ffbd18]/10 border border-[#ffbd18]/20 px-4 py-1.5 rounded-full">
              Fresh • Tasty • Satisfying
            </span>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05]">
              Dinu<span className="text-[#ffbd18]">Tharu</span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl font-medium text-gray-200">
                Restaurant
              </span>
            </h1>

            <p className="text-gray-300 text-base sm:text-lg max-w-xl leading-relaxed">
              Hot, fresh, and flavour-packed <strong className="text-white">Nasi Goreng & Fried Rice</strong> prepared to order. Enjoy your favourite rice dishes delivered hot in Bokundara, Piliyandala, and nearby areas.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="#menu"
                className="inline-flex items-center justify-center px-6 py-4 bg-[#ffbd18] text-[#070707] font-black text-sm uppercase tracking-wider rounded-xl hover:bg-[#e0a410] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#ffbd18]/20"
              >
                🍚 View Menu
              </Link>
              <a
                href="tel:+94711242301"
                className="inline-flex items-center justify-center px-6 py-4 bg-[#e52a20] text-white font-black text-sm uppercase tracking-wider rounded-xl hover:bg-[#c42017] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#e52a20]/20"
              >
                📞 Call Now
              </a>
            </div>
          </div>

          

        </div>
      </div>
    </header>
  );
}