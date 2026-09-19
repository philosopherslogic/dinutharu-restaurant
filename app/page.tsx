import { Suspense } from 'react';
import Hero from '@/components/Hero';
import MenuGrid from '@/components/MenuGrid';
import CartBar from '@/components/CartBar';
import ItemModal from '@/components/ItemModal';
import OrderModal from '@/components/OrderModal';
import Navbar from '@/components/Navbar';
import Promos from '@/components/Promos';
import Contact from '@/components/Contact';
import About from '@/components/About';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070707]">
      <Navbar />
      <Hero />
      <Promos />
      <MenuGrid />
      <About />
      <Contact />
      <CartBar />

      {/* Wrap searchParams modals in Suspense boundaries for Next.js build */}
      <Suspense fallback={null}>
        <ItemModal />
      </Suspense>

      <Suspense fallback={null}>
        <OrderModal />
      </Suspense>
    </main>
  );
}