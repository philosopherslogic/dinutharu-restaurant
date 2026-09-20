'use client';

import { useState } from 'react';

// Replace these with the exact coordinates you copied from Google Maps
const RESTAURANT_LAT = 6.8221006502870924;
const RESTAURANT_LNG = 79.92155467055221;

export default function Contact() {
  const [platformNotice, setPlatformNotice] = useState<string | null>(null);

  // Construct precise URL formats
  const mapEmbedUrl = `https://www.google.com/maps?q=${RESTAURANT_LAT},${RESTAURANT_LNG}&hl=en&z=17&output=embed`;
  const mapDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${RESTAURANT_LAT},${RESTAURANT_LNG}`;

  const handlePlatformClick = (platformName: string) => {
    setPlatformNotice(platformName);
  };

  return (
    <section id="contact" className="py-20 bg-[#0d0d0d] text-white border-t border-[#222222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[#ffbd18] text-xs font-black tracking-[0.25em] uppercase">
            Contact Us
          </span>
          <h2 className="text-4xl font-extrabold mt-2">
            Come & Enjoy
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            Find us in Niwanthidiya, Piliyandala or get your meal delivered hot.
          </p>
        </div>

        {/* Info & Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Contact Details Card */}
          <div className="bg-[#121212] border border-[#292929] rounded-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-start gap-4 pb-6 border-b border-[#1f1f1f]">
              <span className="text-3xl">📍</span>
              <div>
                <b className="block text-[#ffbd18] text-sm uppercase tracking-wider mb-1">
                  Address
                </b>
                <span className="text-gray-300 text-sm leading-relaxed">
                  25/A School Lane, Niwanthidiya, Piliyandala
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-6 border-b border-[#1f1f1f]">
              <span className="text-3xl">📞</span>
              <div>
                <b className="block text-[#ffbd18] text-sm uppercase tracking-wider mb-1">
                  Phone / Order Line
                </b>
                <a 
                  href="tel:+94711242301" 
                  className="text-gray-300 text-sm hover:text-[#ffbd18] transition-colors"
                >
                  071 124 2301
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-6 border-b border-[#1f1f1f]">
              <span className="text-3xl">🛵</span>
              <div>
                <b className="block text-[#ffbd18] text-sm uppercase tracking-wider mb-1">
                  Delivery Coverage
                </b>
                <span className="text-gray-300 text-sm">
                  Bokundara • Piliyandala & nearby areas
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-3xl">📱</span>
              <div>
                <b className="block text-[#ffbd18] text-sm uppercase tracking-wider mb-1">
                  Order Platforms
                </b>
                <span className="text-gray-300 text-sm">
                  • Restaurant Takeaway • Order from Website (Dinutharu Delivery) • PickMe • Uber Eats
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Google Maps Embed & Actions */}
          <div className="bg-[#121212] border border-[#292929] rounded-2xl p-6 sm:p-8 flex flex-col justify-between h-full">
            <div>
              <h3 className="text-xl font-bold text-[#ffbd18] mb-4">
                Locate DinuTharu
              </h3>

              <div className="relative w-full h-72 rounded-xl overflow-hidden border border-[#292929]">
                <iframe
                  className="w-full h-full border-0 grayscale-[0.2]"
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="DinuTharu Location Map"
                />
              </div>
            </div>

            {/* Platform Shortcuts */}
            <div className="flex flex-wrap gap-3 mt-6">
              <a
                href={mapDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] text-center px-4 py-3 bg-[#ffbd18] text-[#070707] font-black text-xs uppercase tracking-wider rounded-xl hover:bg-[#e0a410] transition-all"
              >
                📍 Get Directions
              </a>

              <button
                type="button"
                onClick={() => handlePlatformClick('PickMe Food')}
                className="px-4 py-3 bg-[#181818] border border-[#333333] hover:border-[#ffbd18] text-gray-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                PickMe
              </button>

              <button
                type="button"
                onClick={() => handlePlatformClick('Uber Eats')}
                className="px-4 py-3 bg-[#181818] border border-[#333333] hover:border-[#ffbd18] text-gray-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Uber Eats
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* PLATFORM COMING SOON NOTICE MODAL */}
      {platformNotice && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <div className="w-16 h-16 bg-[#ffbd18]/10 border border-[#ffbd18]/20 rounded-full flex items-center justify-center mx-auto text-3xl">
              🛵
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                {platformNotice} Coming Soon
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Orders via <strong className="text-white">{platformNotice}</strong> are not available right now and will be launched soon!
              </p>
            </div>

            <div className="bg-[#080808] p-4 rounded-2xl border border-[#222222] space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#ffbd18] block">
                Use Dinutharu Delivery Or Restaurant pickup for now
              </span>
              <p className="text-xs font-bold text-gray-300">
                You can order directly through our website menu or call us directly at <span className="text-white">071 124 2301</span>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPlatformNotice(null)}
              className="w-full py-3.5 bg-gradient-to-r from-[#ffbd18] to-amber-500 text-[#070707] font-black text-xs uppercase tracking-wider rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#ffbd18]/25 cursor-pointer"
            >
              Understand
            </button>
          </div>
        </div>
      )}

    </section>
  );
}