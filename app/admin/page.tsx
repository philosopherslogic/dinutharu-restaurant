'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_available: boolean;
}

interface PromoItem {
  id: string;
  badge: string;
  title: string;
  description: string;
  original_price: number;
  promo_price: number;
  image_url: string;
  is_active: boolean;
}

interface Order {
  id: string;
  order_code: number;
  customer_name: string;
  phone: string;
  delivery_type: 'delivery' | 'pickup';
  address?: string;
  pickup_time?: string;
  distance_km?: number;
  delivery_fee?: number;
  lat?: number;
  lng?: number;
  notes?: string;
  items: Array<{ title?: string; name?: string; quantity: number; price: number }>;
  total_price: number;
  status: 'pending' | 'accepted' | 'preparing' | 'in_delivery' | 'completed' | 'cancelled';
  created_at: string;
}

const RESTAURANT_LAT = 6.8221;
const RESTAURANT_LNG = 79.9215;

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'promos' | 'settings'>('orders');
  const [loading, setLoading] = useState(true);

  // Database States
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [isTempClosed, setIsTempClosed] = useState(false);
  // Delivery & Store Status Toggles
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [directDeliveryEnabled, setDirectDeliveryEnabled] = useState(true);
  const [ubereatsEnabled, setUbereatsEnabled] = useState(true);
  const [pickmeEnabled, setPickmeEnabled] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Audio / Sound State
  const [isRinging, setIsRinging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Add/Edit Menu Item States
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('rice');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Add/Edit Promo States
  const [newPromoBadge, setNewPromoBadge] = useState('Special Offer');
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoDesc, setNewPromoDesc] = useState('');
  const [newPromoOrigPrice, setNewPromoOrigPrice] = useState('');
  const [newPromoPrice, setNewPromoPrice] = useState('');
  const [editingPromo, setEditingPromo] = useState<PromoItem | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/alert.mp3');
    audioRef.current.loop = true;

    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
        }).catch(() => { });
      }
      window.removeEventListener('click', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
    };
  }, []);

  const playRingtone = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => console.log('Autoplay waiting for initial page interaction:', err));
      setIsRinging(true);
    }
  };

  const stopRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsRinging(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((prevOrders) => [newOrder, ...prevOrders]);
          playRingtone();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      stopRingtone();
    };
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchMenu(),
        fetchPromos(),
        fetchSettings(),
      ]);
    } catch (error) {
      console.error('Data fetching error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  }

  async function fetchMenu() {
    const { data } = await supabase.from('menu_items').select('*').order('created_at', { ascending: false });
    if (data) setMenuItems(data);
  }

  async function fetchPromos() {
    const { data } = await supabase.from('promos').select('*').order('created_at', { ascending: false });
    if (data) setPromos(data);
  }

  async function fetchSettings() {
    try {
      const { data } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
      if (data) {
        setIsStoreOpen(data.is_open ?? true);
        setIsTempClosed(data.is_temp_closed ?? false); // <--- LOAD TEMP CLOSED STATE
        setDirectDeliveryEnabled(data.direct_delivery_enabled ?? true);
        setUbereatsEnabled(data.ubereats_enabled ?? true);
        setPickmeEnabled(data.pickme_enabled ?? true);
        setSettingsId(data.id);
      }
    } catch (err) {
      console.error('Settings error:', err);
    }
  }
  async function toggleTempClosed() {
    const nextStatus = !isTempClosed;
    setIsTempClosed(nextStatus); // Optimistic UI update

    if (settingsId) {
      const { error } = await supabase
        .from('store_settings')
        .update({ is_temp_closed: nextStatus })
        .eq('id', settingsId);

      if (error) {
        console.error('Failed to update temp closed state:', error);
        setIsTempClosed(!nextStatus); // Revert on failure
      }
    } else {
      const { data, error } = await supabase
        .from('store_settings')
        .insert([{ is_temp_closed: nextStatus }])
        .select();
      if (!error && data && data.length > 0) setSettingsId(data[0].id);
    }
  }

  const getGoogleMapsDirectionsUrl = (order: Order) => {
    if (order.lat && order.lng) return `https://www.google.com/maps/dir/?api=1&origin=${RESTAURANT_LAT},${RESTAURANT_LNG}&destination=${order.lat},${order.lng}&travelmode=driving`;
    if (order.address) return `https://www.google.com/maps/dir/?api=1&origin=${RESTAURANT_LAT},${RESTAURANT_LNG}&destination=${encodeURIComponent(order.address)}&travelmode=driving`;
    return '#';
  };

  async function updateOrderStatus(id: string, newStatus: Order['status']) {
    stopRingtone();
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if (!error) setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
  }

  // --- Shared Image Upload Logic ---
  async function handleImageUpload(file: File): Promise<string | null> {
    setUploadingImage(true);

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${Date.now()}-${sanitizedName}`;

    const { error } = await supabase.storage
      .from('restaurant-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    setUploadingImage(false);

    if (error) {
      console.error('Supabase Upload Error:', error);
      alert(`Upload failed: ${error.message}\n\nHint: Check if your 'restaurant-assets' bucket limits file size or MIME types.`);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from('restaurant-assets').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  }

  // --- Menu CRUD Functions ---
  async function toggleMenuStock(id: string, currentStatus: boolean) {
    const { error } = await supabase.from('menu_items').update({ is_available: !currentStatus }).eq('id', id);
    if (!error) setMenuItems(menuItems.map((m) => (m.id === id ? { ...m, is_available: !currentStatus } : m)));
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (!error) setMenuItems(menuItems.filter((m) => m.id !== id));
  }

  async function handleAddMenuItem(imageUrl: string) {
    if (!newTitle || !newPrice || !imageUrl) return alert('Please fill out all fields and select an image.');
    const { data, error } = await supabase.from('menu_items').insert([{ title: newTitle, description: newDesc, price: parseFloat(newPrice), category: newCategory, image_url: imageUrl, is_available: true }]).select();
    if (!error && data) {
      setMenuItems([data[0], ...menuItems]);
      setNewTitle(''); setNewDesc(''); setNewPrice('');
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    const inputEl = document.getElementById('edit-img-input') as HTMLInputElement;
    let imageUrl = editingItem.image_url;
    if (inputEl?.files?.[0]) {
      const uploadedUrl = await handleImageUpload(inputEl.files[0]);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    const { error } = await supabase.from('menu_items').update({ title: editingItem.title, description: editingItem.description, price: editingItem.price, category: editingItem.category, image_url: imageUrl }).eq('id', editingItem.id);
    if (!error) {
      setMenuItems(menuItems.map((m) => (m.id === editingItem.id ? { ...editingItem, image_url: imageUrl } : m)));
      setEditingItem(null);
    }
  }

  // --- Promos CRUD Functions ---
  async function togglePromoActive(id: string, currentStatus: boolean) {
    const { error } = await supabase.from('promos').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) setPromos(promos.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p)));
  }

  async function handleDeletePromo(id: string) {
    if (!confirm('Are you sure you want to delete this promotional deal?')) return;
    const { error } = await supabase.from('promos').delete().eq('id', id);
    if (!error) setPromos(promos.filter((p) => p.id !== id));
  }

  async function handleAddPromo(imageUrl: string) {
    if (!newPromoTitle || !newPromoPrice || !newPromoOrigPrice || !imageUrl) return alert('Fill out all promo fields and image.');

    const { data, error } = await supabase.from('promos').insert([{
      badge: newPromoBadge,
      title: newPromoTitle,
      description: newPromoDesc,
      original_price: parseFloat(newPromoOrigPrice),
      promo_price: parseFloat(newPromoPrice),
      image_url: imageUrl,
      is_active: true
    }]).select();

    if (!error && data) {
      setPromos([data[0], ...promos]);
      setNewPromoBadge('Special Offer'); setNewPromoTitle(''); setNewPromoDesc(''); setNewPromoOrigPrice(''); setNewPromoPrice('');
    }
  }

  async function handleSavePromoEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPromo) return;

    const inputEl = document.getElementById('edit-promo-img') as HTMLInputElement;
    let imageUrl = editingPromo.image_url;
    if (inputEl?.files?.[0]) {
      const uploadedUrl = await handleImageUpload(inputEl.files[0]);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    const { error } = await supabase.from('promos').update({
      badge: editingPromo.badge,
      title: editingPromo.title,
      description: editingPromo.description,
      original_price: editingPromo.original_price,
      promo_price: editingPromo.promo_price,
      image_url: imageUrl
    }).eq('id', editingPromo.id);

    if (!error) {
      setPromos(promos.map((p) => (p.id === editingPromo.id ? { ...editingPromo, image_url: imageUrl } : p)));
      setEditingPromo(null);
    }
  }

  // --- Store Settings Toggles ---
  async function toggleStoreOpen() {
    const nextStatus = !isStoreOpen;
    setIsStoreOpen(nextStatus);

    if (settingsId) {
      const { error } = await supabase.from('store_settings').update({ is_open: nextStatus }).eq('id', settingsId);
      if (error) {
        console.error('Failed to update store open state:', error);
        alert(`Error updating status: ${error.message}`);
        setIsStoreOpen(!nextStatus);
      }
    } else {
      const { data, error } = await supabase.from('store_settings').insert([{ is_open: nextStatus }]).select();
      if (!error && data && data.length > 0) {
        setSettingsId(data[0].id);
      } else if (error) {
        console.error('Error creating store_settings row:', error);
        alert(`Error: ${error.message}`);
        setIsStoreOpen(!nextStatus);
      }
    }
  }

  async function toggleDirectDelivery() {
    const nextStatus = !directDeliveryEnabled;
    setDirectDeliveryEnabled(nextStatus);

    if (settingsId) {
      const { error } = await supabase.from('store_settings').update({ direct_delivery_enabled: nextStatus }).eq('id', settingsId);
      if (error) setDirectDeliveryEnabled(!nextStatus);
    } else {
      const { data, error } = await supabase.from('store_settings').insert([{ direct_delivery_enabled: nextStatus }]).select();
      if (!error && data && data.length > 0) setSettingsId(data[0].id);
    }
  }

  async function toggleUberEats() {
    const nextStatus = !ubereatsEnabled;
    setUbereatsEnabled(nextStatus);

    if (settingsId) {
      const { error } = await supabase.from('store_settings').update({ ubereats_enabled: nextStatus }).eq('id', settingsId);
      if (error) setUbereatsEnabled(!nextStatus);
    } else {
      const { data, error } = await supabase.from('store_settings').insert([{ ubereats_enabled: nextStatus }]).select();
      if (!error && data && data.length > 0) setSettingsId(data[0].id);
    }
  }

  async function togglePickMe() {
    const nextStatus = !pickmeEnabled;
    setPickmeEnabled(nextStatus);

    if (settingsId) {
      const { error } = await supabase.from('store_settings').update({ pickme_enabled: nextStatus }).eq('id', settingsId);
      if (error) setPickmeEnabled(!nextStatus);
    } else {
      const { data, error } = await supabase.from('store_settings').insert([{ pickme_enabled: nextStatus }]).select();
      if (!error && data && data.length > 0) setSettingsId(data[0].id);
    }
  }

  const getStatusBadgeColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'accepted': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'preparing': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'in_delivery': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-[#121212] border-r border-[#222222] p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-wider text-[#ffbd18]">DinuTharu Admin</h2>
          <nav className="mt-8 space-y-2">
            <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'orders' ? 'bg-[#ffbd18] text-[#070707]' : 'text-gray-400 hover:bg-[#1f1f1f]'}`}>📦 Live Orders ({orders.filter((o) => o.status === 'pending').length})</button>
            <button onClick={() => setActiveTab('menu')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'menu' ? 'bg-[#ffbd18] text-[#070707]' : 'text-gray-400 hover:bg-[#1f1f1f]'}`}>🍚 Menu CRUD & Stock</button>
            <button onClick={() => setActiveTab('promos')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'promos' ? 'bg-[#ffbd18] text-[#070707]' : 'text-gray-400 hover:bg-[#1f1f1f]'}`}>🏷️ Promos Management</button>
            <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-[#ffbd18] text-[#070707]' : 'text-gray-400 hover:bg-[#1f1f1f]'}`}>⚙️ Store Controls</button>
          </nav>
        </div>
        <Link href="/" className="mt-8 text-xs text-gray-500 hover:text-white uppercase font-bold tracking-wider">← Exit to Storefront</Link>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-6xl">
        {isRinging && (
          <div className="mb-6 p-4 bg-red-600 animate-bounce rounded-2xl flex items-center justify-between shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-spin">🔔</span>
              <div>
                <h3 className="font-black text-lg uppercase tracking-wider">NEW ORDER INCOMING!</h3>
                <p className="text-xs text-white/90">A new customer order has been received in real-time.</p>
              </div>
            </div>
            <button onClick={stopRingtone} className="px-6 py-2.5 bg-black text-amber-400 font-black text-xs uppercase rounded-xl hover:bg-gray-900 shadow-lg">🔕 Stop Sound</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading Supabase Data...</div>
        ) : (
          <>
            {/* 1. ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-black">Incoming Customer Orders</h1>
                  <span className="text-xs text-green-400 font-bold flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span> Live Realtime Active
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {orders.length === 0 ? (
                    <p className="text-gray-500 text-sm">No orders recorded yet.</p>
                  ) : (
                    orders.map((order) => {
                      // Calculate item subtotal safely
                      const itemsSubtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

                      // Calculate or fall back for delivery fee
                      const effectiveDeliveryFee = order.delivery_type === 'delivery'
                        ? (order.delivery_fee !== undefined ? order.delivery_fee : Math.max(0, order.total_price - itemsSubtotal))
                        : 0;

                      return (
                        <div key={order.id} className="bg-[#121212] border border-[#292929] rounded-2xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 shadow-xl">
                          <div className="space-y-3 flex-1">

                            {/* Order ID + Status Badge */}
                            <div className="flex items-center gap-3">
                              <span className="font-black text-lg text-[#ffbd18]">#{order.order_code || 'ORD'}</span>
                              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${getStatusBadgeColor(order.status)}`}>
                                {order.status.replace('_', ' ')}
                              </span>
                            </div>

                            {/* EXACT ORDER DATE & TIME BADGE */}
                            <div className="p-2.5 bg-[#070707] border border-[#222222] rounded-xl flex items-center gap-2 text-xs font-bold text-gray-300 w-fit">
                              <span>🕒 Order Placed:</span>
                              <span className="text-[#ffbd18]">
                                {order.created_at ? new Date(order.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                }) : 'N/A'}
                              </span>
                            </div>

                            <div>
                              <h3 className="text-lg font-bold text-white">{order.customer_name}</h3>
                              <a href={`tel:${order.phone}`} className="text-xs text-[#ffbd18] hover:underline font-semibold block mt-0.5">📞 {order.phone}</a>
                            </div>

                            <div className="bg-[#070707] p-3.5 rounded-xl border border-[#1f1f1f] text-xs space-y-1">
                              {order.delivery_type === 'delivery' ? (
                                <>
                                  <p className="font-bold text-green-400">🛵 Home Delivery ({order.distance_km ? order.distance_km.toFixed(2) : 0} km away)</p>
                                  <p className="text-gray-300 mt-1"><strong className="text-gray-400">Address:</strong> {order.address || 'N/A'}</p>
                                </>
                              ) : (
                                <p className="font-bold text-amber-400">🏪 Store Pickup scheduled at: <span className="text-white font-extrabold">{order.pickup_time || 'Not specified'}</span></p>
                              )}
                            </div>

                            {order.notes && (
                              <p className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">📝 <strong>Note:</strong> {order.notes}</p>
                            )}

                            {/* ORDER ITEMS LIST */}
                            <div className="bg-[#070707] p-3.5 rounded-xl border border-[#1f1f1f] text-xs space-y-1.5">
                              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Items Ordered:</p>
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <span className="text-white font-medium">• {item.quantity}x {item.title || item.name}</span>
                                  <span className="text-gray-400">LKR {item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            {/* PRICE BREAKDOWN & DELIVERY FEE DISPLAY */}
                            <div className="bg-[#090909] p-3.5 rounded-xl border border-[#222222] space-y-1.5 text-xs">
                              <div className="flex justify-between items-center text-gray-400">
                                <span>Items Subtotal:</span>
                                <span>LKR {itemsSubtotal}</span>
                              </div>

                              <div className="flex justify-between items-center text-gray-300 font-semibold">
                                <span>
                                  🛵 Delivery Fee {order.delivery_type === 'delivery' && order.distance_km ? `(${order.distance_km.toFixed(1)} km)` : ''}:
                                </span>
                                <span className={order.delivery_type === 'delivery' ? 'text-[#ffbd18] font-bold' : 'text-gray-500'}>
                                  {order.delivery_type === 'delivery' ? `LKR ${effectiveDeliveryFee}` : 'Free (Pickup)'}
                                </span>
                              </div>

                              <div className="pt-2 flex items-center justify-between text-sm border-t border-[#222]">
                                <span className="text-xs text-gray-400 font-bold uppercase">Total Charged:</span>
                                <span className="text-lg font-black text-[#ffbd18]">LKR {order.total_price}</span>
                              </div>
                            </div>

                          </div>

                          <div className="flex flex-col gap-2 min-w-[200px]">
                            {order.delivery_type === 'delivery' && (
                              <a href={getGoogleMapsDirectionsUrl(order)} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 px-4 bg-[#181818] border border-[#292929] hover:border-green-500 text-green-400 hover:text-white text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-md mb-2">
                                <span>📍</span> Open in Maps
                              </a>
                            )}
                            {order.status === 'pending' && (
                              <>
                                <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="w-full py-3 bg-[#20c45a] hover:bg-[#1bb050] text-white font-black text-xs uppercase rounded-xl transition-all shadow-lg">✓ Accept Order</button>
                                <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="w-full py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold uppercase rounded-xl transition-all">✕ Decline Order</button>
                              </>
                            )}
                            {order.status === 'accepted' && <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="w-full py-3 bg-[#ffbd18] hover:bg-[#e0a410] text-[#070707] font-black text-xs uppercase rounded-xl transition-all shadow-lg">👨‍🍳 Set to "Preparing"</button>}
                            {order.status === 'preparing' && <button onClick={() => updateOrderStatus(order.id, 'in_delivery')} className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase rounded-xl transition-all shadow-lg">🛵 Set to "In Delivery"</button>}
                            {order.status === 'in_delivery' && <button onClick={() => updateOrderStatus(order.id, 'completed')} className="w-full py-3 bg-green-500 hover:bg-green-600 text-black font-black text-xs uppercase rounded-xl transition-all shadow-lg">🎉 Mark as "Completed"</button>}
                            {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'pending' && (
                              <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="w-full py-1.5 text-[11px] text-red-400 hover:underline font-bold uppercase mt-1 text-center">Cancel Order</button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 2. MENU CRUD TAB */}
            {activeTab === 'menu' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-black">Menu Items Management</h1>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const inputEl = document.getElementById('menu-img-input') as HTMLInputElement;
                    const file = inputEl?.files?.[0];
                    if (!file) {
                      alert('Please select an image file first.');
                      return;
                    }
                    const imageUrl = await handleImageUpload(file);
                    if (imageUrl) handleAddMenuItem(imageUrl);
                  }}
                  className="bg-[#121212] border border-[#292929] rounded-2xl p-6 space-y-4"
                >
                  <h3 className="text-sm font-bold text-[#ffbd18] uppercase">Add New Food Dish</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Dish Title" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none" />
                    <input type="number" placeholder="Price (LKR)" required value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none" />
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none">
                      <option value="rice">Fried Rice</option>
                      <option value="nasi-goreng">Nasi Goreng</option>
                      <option value="kottu">Kottu</option>

                      <option value="sides">Sides</option>
                      <option value="drinks">Drinks</option>
                    </select>
                  </div>
                  <input type="text" placeholder="Short Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none" />
                  <div className="flex items-center gap-4">
                    <input id="menu-img-input" type="file" accept="image/*" className="text-xs text-gray-400" />
                    <button type="submit" disabled={uploadingImage} className="px-6 py-2.5 bg-[#ffbd18] text-[#070707] font-black text-xs uppercase rounded-xl hover:bg-[#e0a410]">
                      {uploadingImage ? 'Uploading...' : '+ Save Dish'}
                    </button>
                  </div>
                </form>

                <div className="space-y-4">
                  {menuItems.map((item) => (
                    <div key={item.id} className="bg-[#121212] border border-[#292929] rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#070707]">
                          <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{item.title}</h3>
                          <p className="text-xs text-[#ffbd18] font-bold">LKR {item.price}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleMenuStock(item.id, item.is_available)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition-all ${item.is_available ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}
                        >
                          {item.is_available ? 'In Stock' : 'Out of Stock'}
                        </button>
                        <button onClick={() => setEditingItem(item)} className="px-3 py-1.5 bg-[#181818] border border-[#333] hover:border-[#ffbd18] text-xs font-bold rounded-lg">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white text-xs font-bold rounded-lg">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. PROMOS TAB */}
            {activeTab === 'promos' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-black">Promotional Deals Management</h1>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const inputEl = document.getElementById('promo-img-input') as HTMLInputElement;
                    const file = inputEl?.files?.[0];
                    if (!file) return alert('Please select an image file first.');
                    const imageUrl = await handleImageUpload(file);
                    if (imageUrl) handleAddPromo(imageUrl);
                  }}
                  className="bg-[#121212] border border-[#292929] rounded-2xl p-6 space-y-4 shadow-xl"
                >
                  <h3 className="text-sm font-bold text-[#ffbd18] uppercase tracking-wider">Add New Promotion</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Promo Title (e.g. Combo Special)" required value={newPromoTitle} onChange={(e) => setNewPromoTitle(e.target.value)} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none focus:border-[#ffbd18]" />
                    <input type="text" placeholder="Badge Text (e.g. Special Offer)" required value={newPromoBadge} onChange={(e) => setNewPromoBadge(e.target.value)} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none focus:border-[#ffbd18]" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="number" placeholder="Original Price (LKR)" required value={newPromoOrigPrice} onChange={(e) => setNewPromoOrigPrice(e.target.value)} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none focus:border-[#ffbd18]" />
                    <input type="number" placeholder="Discounted Price (LKR)" required value={newPromoPrice} onChange={(e) => setNewPromoPrice(e.target.value)} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none focus:border-[#ffbd18]" />
                  </div>

                  <textarea rows={2} placeholder="Appetizing Description" required value={newPromoDesc} onChange={(e) => setNewPromoDesc(e.target.value)} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none focus:border-[#ffbd18]" />

                  <div className="flex items-center justify-between gap-4 border-t border-[#222222] pt-4">
                    <input id="promo-img-input" type="file" accept="image/*" className="text-xs text-gray-400" />
                    <button type="submit" disabled={uploadingImage} className="px-6 py-2.5 bg-[#ffbd18] text-[#070707] font-black text-xs uppercase rounded-xl hover:bg-[#e0a410] shadow-lg">
                      {uploadingImage ? 'Uploading Image...' : '+ Publish Promo'}
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 gap-4">
                  {promos.length === 0 ? (
                    <p className="text-gray-500 text-sm">No active promo items created yet.</p>
                  ) : (
                    promos.map((promo) => (
                      <div key={promo.id} className="bg-[#121212] border border-[#292929] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">

                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#070707] flex-shrink-0 border border-[#222]">
                            <Image src={promo.image_url} alt={promo.title} fill className="object-cover" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-[#e52a20] bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">{promo.badge}</span>
                            <h3 className="font-bold text-white text-base">{promo.title}</h3>
                            <p className="text-[10px] text-gray-400 line-clamp-1">{promo.description}</p>
                            <p className="text-xs text-[#ffbd18] font-black mt-1">
                              LKR {promo.promo_price} <span className="line-through text-gray-500 text-[10px] ml-1">LKR {promo.original_price}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <button
                            onClick={() => togglePromoActive(promo.id, promo.is_active)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${promo.is_active ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500 hover:text-black' : 'bg-[#181818] text-gray-400 border-[#333] hover:text-white'
                              }`}
                          >
                            {promo.is_active ? 'Active' : 'Hidden'}
                          </button>
                          <button onClick={() => setEditingPromo(promo)} className="px-4 py-2 bg-[#181818] border border-[#333] hover:border-[#ffbd18] text-[#ffbd18] text-[10px] font-black uppercase rounded-xl">
                            Edit
                          </button>
                          <button onClick={() => handleDeletePromo(promo.id)} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase rounded-xl">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 4. SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-black">Store Operations & Channels</h1>
                <div className="bg-[#121212] border border-[#292929] rounded-2xl p-6 space-y-6">

                  {/* STORE OPEN / CLOSED MANUAL TOGGLE */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
                    <div>
                      <h3 className="text-base font-bold text-white">Store Status (Open / Closed)</h3>
                      <p className="text-xs text-gray-400 mt-1">When closed, checkout will block customer orders and display standard operating hours.</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleStoreOpen}
                      className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${isStoreOpen ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-[#e52a20] text-white shadow-lg shadow-red-500/20'
                        }`}
                    >
                      {isStoreOpen ? 'STORE IS OPEN' : 'STORE IS CLOSED'}
                    </button>
                  </div>
                  {/* Store temporarily closed/*}
                  {/* TEMPORARY CLOSED TOGGLE SWITCH */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>🛑</span> Temporary Close Store Today
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        When turned ON, displays &quot;The restaurant is temporarily closed today&quot; banner on the home page.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={toggleTempClosed}
                      className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${isTempClosed
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                          : 'bg-[#181818] text-gray-400 border border-[#333]'
                        }`}
                    >
                      {isTempClosed ? 'TEMP CLOSED: ON' : 'TEMP CLOSED: OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
                    <div>
                      <h3 className="text-base font-bold text-white">DinuTharu Direct Delivery</h3>
                      <p className="text-xs text-gray-400 mt-1">Enable or disable direct website delivery checkout.</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleDirectDelivery}
                      className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${directDeliveryEnabled ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-[#e52a20] text-white shadow-lg shadow-red-500/20'
                        }`}
                    >
                      {directDeliveryEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
                    <div>
                      <h3 className="text-base font-bold text-white">Uber Eats Redirect</h3>
                      <p className="text-xs text-gray-400 mt-1">Show or hide Uber Eats order button on the site.</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleUberEats}
                      className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${ubereatsEnabled ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-[#e52a20] text-white shadow-lg shadow-red-500/20'
                        }`}
                    >
                      {ubereatsEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">PickMe Food Redirect</h3>
                      <p className="text-xs text-gray-400 mt-1">Show or hide PickMe Food order button on the site.</p>
                    </div>
                    <button
                      type="button"
                      onClick={togglePickMe}
                      className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${pickmeEnabled ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-[#e52a20] text-white shadow-lg shadow-red-500/20'
                        }`}
                    >
                      {pickmeEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Edit Menu Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#292929] rounded-2xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <h3 className="text-lg font-bold text-[#ffbd18]">Edit Item: {editingItem.title}</h3>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Title</label>
              <input type="text" value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm text-white outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Price (LKR)</label>
              <input type="number" value={editingItem.price} onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm text-white outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Description</label>
              <textarea rows={3} value={editingItem.description} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm text-white outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Replace Image (Optional)</label>
              <input id="edit-img-input" type="file" accept="image/*" className="text-xs text-gray-400" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
              <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleSaveEdit} className="px-6 py-2 bg-[#ffbd18] text-[#070707] text-xs font-black rounded-xl hover:bg-[#e0a410]">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Promo Modal */}
      {editingPromo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#292929] rounded-3xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <h3 className="text-lg font-bold text-[#ffbd18]">Edit Promo Deal</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Title</label>
                <input type="text" value={editingPromo.title} onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Badge</label>
                <input type="text" value={editingPromo.badge} onChange={(e) => setEditingPromo({ ...editingPromo, badge: e.target.value })} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Orig. Price (LKR)</label>
                <input type="number" value={editingPromo.original_price} onChange={(e) => setEditingPromo({ ...editingPromo, original_price: parseFloat(e.target.value) || 0 })} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Promo Price (LKR)</label>
                <input type="number" value={editingPromo.promo_price} onChange={(e) => setEditingPromo({ ...editingPromo, promo_price: parseFloat(e.target.value) || 0 })} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Description</label>
              <textarea rows={2} value={editingPromo.description} onChange={(e) => setEditingPromo({ ...editingPromo, description: e.target.value })} className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm outline-none" />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Replace Image</label>
              <input id="edit-promo-img" type="file" accept="image/*" className="text-xs text-gray-400" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
              <button type="button" onClick={() => setEditingPromo(null)} className="px-5 py-2.5 text-xs font-bold text-gray-400 hover:text-white">Cancel</button>
              <button type="button" onClick={handleSavePromoEdit} className="px-6 py-2.5 bg-[#ffbd18] text-[#070707] text-xs font-black uppercase rounded-xl hover:bg-[#e0a410] shadow-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}