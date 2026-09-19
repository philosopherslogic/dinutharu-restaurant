'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { getGuestDeviceId } from '@/lib/customerIdentity';

interface Order {
  id: string;
  order_code: number;
  delivery_type: 'delivery' | 'pickup';
  total_price: number;
  status: 'pending' | 'accepted' | 'preparing' | 'in_delivery' | 'completed' | 'cancelled';
  items: Array<{ title?: string; name?: string; quantity: number; price: number }>;
  created_at: string;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Sent', icon: '⏳' },
  { key: 'accepted', label: 'Accepted', icon: '✅' },
  { key: 'preparing', label: 'Preparing', icon: '🍳' },
  { key: 'in_delivery', label: 'In Delivery', icon: '🛵' },
  { key: 'completed', label: 'Completed', icon: '🎉' },
];

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');

  useEffect(() => {
    const deviceId = getGuestDeviceId();
    fetchCustomerOrders(deviceId);

    // Subscribe to Realtime order status updates for this customer
    const channel = supabase
      .channel('customer-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCustomerOrders(deviceId: string) {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('guest_device_id', deviceId)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
      
      // Auto-switch tab if no upcoming orders exist
      const hasUpcoming = data.some((o) => ['pending', 'accepted', 'preparing', 'in_delivery'].includes(o.status));
      if (!hasUpcoming && data.length > 0) {
        setActiveCategory('completed');
      }
    }
    setLoading(false);
  }

  const getStepIndex = (status: string) => {
    return STATUS_STEPS.findIndex((s) => s.key === status);
  };

  // Categorize Orders
  const upcomingOrders = orders.filter((o) => ['pending', 'accepted', 'preparing', 'in_delivery'].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled');

  const displayedOrders = 
    activeCategory === 'upcoming' 
      ? upcomingOrders 
      : activeCategory === 'completed' 
      ? completedOrders 
      : cancelledOrders;

  return (
    <div className="w-full min-h-screen bg-[#070707] text-white pt-24 pb-16">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#222222] pb-6 gap-4">
          <div>
            <span className="text-xs text-[#ffbd18] font-black uppercase tracking-widest block">Live Status Tracking</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mt-1">My Orders</h1>
          </div>
          <Link
            href="/"
            className="self-start sm:self-auto px-5 py-2.5 bg-[#121212] border border-[#292929] hover:border-[#ffbd18] text-xs font-extrabold uppercase rounded-xl transition-all text-gray-300 hover:text-white"
          >
            ← Back to Menu
          </Link>
        </div>

        {/* Category Tabs (Mobile & Desktop Responsive) */}
        <div className="flex items-center gap-2 sm:gap-4 border-b border-[#222222] pb-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory('upcoming')}
            className={`px-4 sm:px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              activeCategory === 'upcoming'
                ? 'bg-[#ffbd18] text-[#070707] shadow-xl shadow-[#ffbd18]/20'
                : 'bg-[#121212] border border-[#222222] text-gray-400 hover:text-white'
            }`}
          >
            <span>🍳 Upcoming</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeCategory === 'upcoming' ? 'bg-black text-[#ffbd18]' : 'bg-[#222222] text-gray-300'
            }`}>
              {upcomingOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('completed')}
            className={`px-4 sm:px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              activeCategory === 'completed'
                ? 'bg-green-500 text-black shadow-xl shadow-green-500/20'
                : 'bg-[#121212] border border-[#222222] text-gray-400 hover:text-white'
            }`}
          >
            <span>🎉 Completed</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeCategory === 'completed' ? 'bg-black text-green-400' : 'bg-[#222222] text-gray-300'
            }`}>
              {completedOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('cancelled')}
            className={`px-4 sm:px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              activeCategory === 'cancelled'
                ? 'bg-red-500 text-white shadow-xl shadow-red-500/20'
                : 'bg-[#121212] border border-[#222222] text-gray-400 hover:text-white'
            }`}
          >
            <span>❌ Cancelled</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeCategory === 'cancelled' ? 'bg-black text-red-400' : 'bg-[#222222] text-gray-300'
            }`}>
              {cancelledOrders.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="text-center py-32 text-gray-400 text-sm font-medium animate-pulse">
            Loading order updates...
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="text-center py-24 bg-[#121212] rounded-3xl border border-[#222222] max-w-xl mx-auto space-y-4 p-8 shadow-2xl">
            <span className="text-6xl">📦</span>
            <h2 className="text-2xl font-bold text-white">No {activeCategory.toUpperCase()} Orders Found</h2>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {activeCategory === 'upcoming' 
                ? 'You do not have any active orders currently being prepared.' 
                : `There are no ${activeCategory} orders recorded.`}
            </p>
            <Link
              href="/#menu"
              className="inline-block mt-4 px-8 py-3.5 bg-[#ffbd18] hover:bg-[#e0a410] text-[#070707] font-black text-xs uppercase rounded-xl transition-all shadow-lg"
            >
              Explore Menu & Order
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {displayedOrders.map((order) => {
              const currentStepIdx = getStepIndex(order.status);
              const isCancelled = order.status === 'cancelled';

              return (
                <div
                  key={order.id}
                  className="bg-[#121212] border border-[#222222] hover:border-[#ffbd18]/40 transition-all rounded-3xl p-6 space-y-6 shadow-2xl flex flex-col justify-between"
                >
                  {/* Order Top Card Header */}
                  <div className="flex justify-between items-start border-b border-[#1f1f1f] pb-4">
                    <div>
                      <h3 className="font-black text-[#ffbd18] text-xl tracking-tight">
                        Order No: #{order.order_code}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium">
                        {new Date(order.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Total Charged</span>
                      <span className="text-lg font-black text-white">LKR {order.total_price}</span>
                    </div>
                  </div>

                  {/* Progress Visual Tracker */}
                  {isCancelled ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-bold text-xs flex items-center gap-3">
                      <span className="text-xl">❌</span>
                      <div>
                        <p className="font-black uppercase">Order Cancelled</p>
                        <p className="text-[11px] font-normal text-red-300/80">Order was cancelled or declined by store.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      <div className="grid grid-cols-5 gap-1 text-center relative">
                        
                        {/* Connecting Background Progress Line */}
                        <div className="absolute top-5 left-6 right-6 h-1 bg-[#1a1a1a] z-0 -translate-y-1/2" />
                        
                        {STATUS_STEPS.map((step, idx) => {
                          const isActive = idx <= currentStepIdx;
                          return (
                            <div key={step.key} className="relative z-10 flex flex-col items-center space-y-2">
                              <div
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm transition-all duration-300 ${
                                  isActive
                                    ? 'bg-[#ffbd18] text-[#070707] font-black shadow-lg shadow-[#ffbd18]/20 ring-4 ring-[#ffbd18]/10 scale-105'
                                    : 'bg-[#181818] border border-[#2a2a2a] text-gray-600'
                                }`}
                              >
                                {step.icon}
                              </div>
                              <span
                                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                                  isActive ? 'text-white' : 'text-gray-600'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Items Summary Breakdown */}
                  <div className="bg-[#070707] p-4 rounded-2xl border border-[#1c1c1c] text-xs space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Ordered Items:
                    </p>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-gray-300 font-medium">
                        <span>• {item.quantity}x {item.title || item.name}</span>
                        <span className="text-gray-400 font-semibold">LKR {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Service Type Footer Tag */}
                  <div className="pt-2 flex items-center justify-between text-xs text-gray-400 border-t border-[#1f1f1f]">
                    <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">Service Method</span>
                    <span className="font-black text-white text-xs">
                      {order.delivery_type === 'delivery' ? '🛵 Home Delivery' : '🏪 Store Pickup'}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}