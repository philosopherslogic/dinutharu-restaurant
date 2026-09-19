'use client';

// Replace these with the exact coordinates you copied from Google Maps
const RESTAURANT_LAT = 6.8221006502870924;
const RESTAURANT_LNG = 79.92155467055221;

export default function Contact() {
  // Construct precise URL formats
  const mapEmbedUrl = `https://www.google.com/maps?q=${RESTAURANT_LAT},${RESTAURANT_LNG}&hl=en&z=17&output=embed`;
  const mapDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${RESTAURANT_LAT},${RESTAURANT_LNG}`;

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
                  Direct WhatsApp Order • PickMe • Uber Eats
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
              <a
                href="https://pickme.lk/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 bg-[#181818] border border-[#333333] hover:border-[#ffbd18] text-gray-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                PickMe
              </a>
              <a
                href="https://www.ubereats.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 bg-[#181818] border border-[#333333] hover:border-[#ffbd18] text-gray-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Uber Eats
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}