import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Promos from '@/components/Promos';
import MenuGrid from '@/components/MenuGrid';
import Contact from '@/components/Contact';
import ItemModal from '@/components/ItemModal';
import OrderModal from '@/components/OrderModal';
import CartBar from '@/components/CartBar';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <Navbar />
      <Hero />
      <Promos />
      <MenuGrid />
      <Contact />

      {/* URL Parameter Modals & Dynamic Floating Cart */}
      <ItemModal />
      <OrderModal />
      <CartBar />

      {/* Footer */}
      <footer className="py-8 bg-[#050505] border-t border-[#222222] text-center text-xs text-gray-500">
        <p>
          © 2026 <strong className="text-[#ffbd18]">DinuTharu Restaurant</strong> • Nasi Goreng & Fried Rice Speciality[cite: 1]
        </p>
      </footer>
    </main>
  );
}