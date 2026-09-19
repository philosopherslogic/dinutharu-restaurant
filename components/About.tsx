'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const FEATURES = [
  {
    id: 'craft',
    title: 'High-Heat Wok Mastery',
    subtitle: 'Sizzling Flame Cooking',
    desc: 'Our signature Nasi Goreng and Fried Rice packs are stir-fried on intense wok flames to lock in smoky aroma, crispy texture, and bold spices.',
    icon: '🔥',
    highlight: 'Freshly Wok-Tossed',
  },
  {
    id: 'quality',
    title: 'Farm-Fresh Daily Stock',
    subtitle: 'Zero Preservatives',
    desc: 'We source fresh ingredients every morning. Non-reused oils and hygienic kitchen standards guarantee clean, healthy, and satisfying meals.',
    icon: '🌿',
    highlight: '100% Quality Ingredients',
  },
  {
    id: 'speed',
    title: 'Hot Thermal Dispatch',
    subtitle: 'Fast Local Delivery',
    desc: 'Equipped with heat-retention packaging and direct local rider dispatch, your meal arrives piping hot whether delivered or picked up.',
    icon: '🛵',
    highlight: 'Under 30 Min Avg',
  },
];

export default function About() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-play interval (switches feature every 4 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FEATURES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const activeFeature = FEATURES[currentIndex];

  return (
    <section id="about" className="py-24 bg-[#050505] text-white relative overflow-hidden border-t border-[#181818]">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#ffbd18]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -top-10 right-0 w-96 h-96 bg-[#e52a20]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[#ffbd18] bg-[#ffbd18]/10 border border-[#ffbd18]/20 px-4 py-1 rounded-full text-[10px] font-black tracking-[0.25em] uppercase inline-block shadow-sm">
            Our Passion & Quality
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Crafting Unforgettable Flavors, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffbd18] via-amber-200 to-[#e52a20]">
              Taste The Difference.
            </span>
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            DinuTharu brings authentic wok-charred Nasi Goreng & Fried Rice directly to Piliyandala and surrounding areas.
          </p>
        </div>

        {/* Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          
          {/* Left: Animated Circular Badge Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
              
              {/* Rotating Gold Accent Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#ffbd18]/30 animate-[spin_25s_linear_infinite]" />
              
              {/* Outer Glow Halo */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#ffbd18]/20 via-transparent to-[#e52a20]/20 blur-xl" />

              {/* Main Circular Image Wrapper */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-2 border-[#262626] shadow-[0_0_50px_rgba(255,189,24,0.15)] bg-[#0d0d0d] group">
                <Image
                  src="/logo.jpg"
                  alt="DinuTharu Badge"
                  fill
                  priority
                  className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Floating Live Badge */}
              <div className="absolute -bottom-2 bg-[#121212]/95 backdrop-blur-md border border-[#2a2a2a] px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Open & Cooking Hot
                </span>
              </div>

            </div>
          </div>

          {/* Right: Auto-Cycling Feature Display */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Auto-Slide Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-extrabold uppercase tracking-widest">
                <span className="text-[#ffbd18] flex items-center gap-2">
                  <span>{activeFeature.icon}</span> {activeFeature.subtitle}
                </span>
                <span className="text-gray-500">0{currentIndex + 1} / 0{FEATURES.length}</span>
              </div>
              <div className="w-full h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div 
                  key={currentIndex}
                  className="h-full bg-gradient-to-r from-[#ffbd18] to-[#e52a20] rounded-full"
                  style={{
                    animation: 'progress 4s linear forwards',
                  }}
                />
              </div>
            </div>

            {/* Active Content Block */}
            <div key={activeFeature.id} className="bg-gradient-to-b from-[#121212] to-[#090909] border border-[#222222] rounded-3xl p-8 space-y-4 shadow-2xl transition-all duration-500">
              <div className="inline-block bg-[#ffbd18]/10 border border-[#ffbd18]/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-[#ffbd18] tracking-wider">
                {activeFeature.highlight}
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {activeFeature.title}
              </h3>

              <p className="text-gray-300 text-sm leading-relaxed">
                {activeFeature.desc}
              </p>
            </div>

            {/* Visual Indicators */}
            <div className="flex items-center gap-3 pt-2">
              {FEATURES.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    currentIndex === idx ? 'w-10 bg-[#ffbd18]' : 'w-2.5 bg-[#222222]'
                  }`}
                />
              ))}
            </div>

          </div>

        </div>

        {/* Live Counter Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-[#0f0f0f]/80 backdrop-blur-md border border-[#222222] rounded-3xl p-6 sm:p-8">
          <div className="text-center space-y-1">
            <span className="text-2xl sm:text-4xl font-black text-[#ffbd18]">100%</span>
            <p className="text-[10px] sm:text-xs text-gray-400 font-extrabold uppercase tracking-wider">Freshly Made</p>
          </div>
          <div className="text-center space-y-1 border-l border-[#222222]">
            <span className="text-2xl sm:text-4xl font-black text-white">&lt;30 Mins</span>
            <p className="text-[10px] sm:text-xs text-gray-400 font-extrabold uppercase tracking-wider">Avg Delivery</p>
          </div>
          <div className="text-center space-y-1 border-l border-[#222222]">
            <span className="text-2xl sm:text-4xl font-black text-[#ffbd18]">5.0 ★</span>
            <p className="text-[10px] sm:text-xs text-gray-400 font-extrabold uppercase tracking-wider">Taste Rating</p>
          </div>
          <div className="text-center space-y-1 border-l border-[#222222]">
            <span className="text-2xl sm:text-4xl font-black text-white">5 KM</span>
            <p className="text-[10px] sm:text-xs text-gray-400 font-extrabold uppercase tracking-wider">Direct Coverage</p>
          </div>
        </div>

      </div>

      {/* Global CSS Keyframes for Progress Bar */}
      <style jsx global>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </section>
  );
}