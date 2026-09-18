'use client';

import { useState, useEffect } from 'react';
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
  notes?: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  total_price: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'promos' | 'settings'>('menu');
  const [loading, setLoading] = useState(true);

  // Database States
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [promos, setPromos] = useState<PromoItem[]>([]);
  
  // Delivery Channel Toggle States
  const [directDeliveryEnabled, setDirectDeliveryEnabled] = useState(true);
  const [ubereatsEnabled, setUbereatsEnabled] = useState(true);
  const [pickmeEnabled, setPickmeEnabled] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Add Item State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('rice');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit Item State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchAllData();
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
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Settings Fetch Error:', error.message);
        return;
      }

      if (data) {
        setDirectDeliveryEnabled(data.direct_delivery_enabled ?? true);
        setUbereatsEnabled(data.ubereats_enabled ?? true);
        setPickmeEnabled(data.pickme_enabled ?? true);
        setSettingsId(data.id);
      }
    } catch (err) {
      console.error('Unexpected error fetching settings:', err);
    }
  }

  // --- ACTIONS ---

  async function markOrderCompleted(id: string) {
    const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', id);
    if (!error) {
      setOrders(orders.map((o) => (o.id === id ? { ...o, status: 'completed' } : o)));
    }
  }

  async function toggleMenuStock(id: string, currentStatus: boolean) {
    const { error } = await supabase.from('menu_items').update({ is_available: !currentStatus }).eq('id', id);
    if (!error) {
      setMenuItems(menuItems.map((m) => (m.id === id ? { ...m, is_available: !currentStatus } : m)));
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (!error) {
      setMenuItems(menuItems.filter((m) => m.id !== id));
    }
  }

  // Delivery Channel Actions
  async function toggleDirectDelivery() {
    if (!settingsId) return;
    const newStatus = !directDeliveryEnabled;
    const { error } = await supabase.from('store_settings').update({ direct_delivery_enabled: newStatus }).eq('id', settingsId);
    if (!error) setDirectDeliveryEnabled(newStatus);
  }

  async function toggleUberEats() {
    if (!settingsId) return;
    const newStatus = !ubereatsEnabled;
    const { error } = await supabase.from('store_settings').update({ ubereats_enabled: newStatus }).eq('id', settingsId);
    if (!error) setUbereatsEnabled(newStatus);
  }

  async function togglePickMe() {
    if (!settingsId) return;
    const newStatus = !pickmeEnabled;
    const { error } = await supabase.from('store_settings').update({ pickme_enabled: newStatus }).eq('id', settingsId);
    if (!error) setPickmeEnabled(newStatus);
  }

  // Image Upload Helper
  async function handleImageUpload(file: File): Promise<string | null> {
    setUploadingImage(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('restaurant-assets').upload(fileName, file);
    setUploadingImage(false);

    if (error) {
      alert('Failed to upload image');
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from('restaurant-assets').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  }

  // Save New Menu Item
  async function handleAddMenuItem(imageUrl: string) {
    if (!newTitle || !newPrice || !imageUrl) {
      alert('Please fill out all fields and select an image.');
      return;
    }

    const { data, error } = await supabase.from('menu_items').insert([
      {
        title: newTitle,
        description: newDesc,
        price: parseFloat(newPrice),
        category: newCategory,
        image_url: imageUrl,
        is_available: true,
      },
    ]).select();

    if (!error && data) {
      setMenuItems([data[0], ...menuItems]);
      setNewTitle('');
      setNewDesc('');
      setNewPrice('');
    }
  }

  // Save Edits to Existing Menu Item
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    const inputEl = document.getElementById('edit-img-input') as HTMLInputElement;
    let imageUrl = editingItem.image_url;

    if (inputEl?.files?.[0]) {
      const uploadedUrl = await handleImageUpload(inputEl.files[0]);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    const { error } = await supabase
      .from('menu_items')
      .update({
        title: editingItem.title,
        description: editingItem.description,
        price: editingItem.price,
        category: editingItem.category,
        image_url: imageUrl,
      })
      .eq('id', editingItem.id);

    if (!error) {
      setMenuItems(menuItems.map((m) => (m.id === editingItem.id ? { ...editingItem, image_url: imageUrl } : m)));
      setEditingItem(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#121212] border-r border-[#222222] p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-extrabold tracking-wider text-[#ffbd18]">DinuTharu Admin</h2>
          <nav className="mt-8 space-y-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === 'orders' ? 'bg-[#ffbd18] text-[#070707]' : 'text-gray-400 hover:bg-[#1f1f1f]'
              }`}
            >
              📦 Live Orders ({orders.filter((o) => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === 'menu' ? 'bg-[#ffbd18] text-[#070707]' : 'text-gray-400 hover:bg-[#1f1f1f]'
              }`}
            >
              🍚 Menu CRUD & Stock
            </button>
            <button
              onClick={() => setActiveTab('promos')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === 'promos' ? 'bg-[#ffbd18] text-[#070707]' : 'text-gray-400 hover:bg-[#1f1f1f]'
              }`}
            >
              🏷️ Promos Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeTab === 'settings' ? 'bg-[#ffbd18] text-[#070707]' : 'text-gray-400 hover:bg-[#1f1f1f]'
              }`}
            >
              ⚙️ Delivery Toggles
            </button>
          </nav>
        </div>

        <Link href="/" className="mt-8 text-xs text-gray-500 hover:text-white uppercase font-bold tracking-wider">
          ← Exit to Storefront
        </Link>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading Supabase Data...</div>
        ) : (
          <>
            {/* 1. ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-black">Incoming Customer Orders</h1>
                <div className="grid grid-cols-1 gap-4">
                  {orders.length === 0 ? (
                    <p className="text-gray-500 text-sm">No orders recorded yet.</p>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="bg-[#121212] border border-[#292929] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-[#ffbd18]">#{order.order_code || 'ORD'}</span>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                              {order.status}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-white mt-2">{order.customer_name} ({order.phone})</h3>
                          <p className="text-xs text-gray-400 mt-1">Type: {order.delivery_type === 'delivery' ? `🛵 Delivery to ${order.address}` : '🏪 Pickup'}</p>
                          <div className="mt-3 text-xs text-gray-300 space-y-1">
                            {order.items?.map((i, idx) => (
                              <p key={idx}>• {i.quantity}x {i.title}</p>
                            ))}
                          </div>
                          <p className="text-sm font-extrabold text-[#ffbd18] mt-3">Total: LKR {order.total_price}</p>
                        </div>
                        {order.status === 'pending' && (
                          <button onClick={() => markOrderCompleted(order.id)} className="px-6 py-3 bg-[#20c45a] hover:bg-[#1bb050] text-white font-black text-xs uppercase rounded-xl transition-all shadow-lg">
                            ✓ Complete Order
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 2. MENU CRUD TAB */}
            {activeTab === 'menu' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-black">Menu Items Management</h1>

                {/* Add New Dish Form */}
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

                {/* Items List */}
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition-all ${
                            item.is_available ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {item.is_available ? 'In Stock' : 'Out of Stock'}
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="px-3 py-1.5 bg-[#181818] border border-[#333] hover:border-[#ffbd18] text-xs font-bold rounded-lg"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white text-xs font-bold rounded-lg"
                        >
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
                <h1 className="text-2xl font-black">Promotional Deals</h1>
                <div className="space-y-4">
                  {promos.length === 0 ? (
                    <p className="text-gray-500 text-sm">No active promo items created yet.</p>
                  ) : (
                    promos.map((promo) => (
                      <div key={promo.id} className="bg-[#121212] border border-[#292929] rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#070707]">
                            <Image src={promo.image_url} alt={promo.title} fill className="object-cover" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-[#e52a20]">{promo.badge}</span>
                            <h3 className="font-bold text-white">{promo.title}</h3>
                            <p className="text-xs text-[#ffbd18] font-bold">
                              LKR {promo.promo_price} <span className="line-through text-gray-500 text-[10px]">{promo.original_price}</span>
                            </p>
                          </div>
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
                <h1 className="text-2xl font-black">Ordering Channel Controls</h1>
                <div className="bg-[#121212] border border-[#292929] rounded-2xl p-6 space-y-6">
                  
                  {/* Direct Delivery Toggle */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
                    <div>
                      <h3 className="text-base font-bold text-white">DinuTharu Direct Delivery</h3>
                      <p className="text-xs text-gray-400 mt-1">Enable or disable direct website delivery checkout.</p>
                    </div>
                    <button
                      onClick={toggleDirectDelivery}
                      className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                        directDeliveryEnabled ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-[#e52a20] text-white shadow-lg shadow-red-500/20'
                      }`}
                    >
                      {directDeliveryEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  {/* Uber Eats Toggle */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
                    <div>
                      <h3 className="text-base font-bold text-white">Uber Eats Redirect</h3>
                      <p className="text-xs text-gray-400 mt-1">Show or hide Uber Eats order button on the site.</p>
                    </div>
                    <button
                      onClick={toggleUberEats}
                      className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                        ubereatsEnabled ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-[#e52a20] text-white shadow-lg shadow-red-500/20'
                      }`}
                    >
                      {ubereatsEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  {/* PickMe Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">PickMe Food Redirect</h3>
                      <p className="text-xs text-gray-400 mt-1">Show or hide PickMe Food order button on the site.</p>
                    </div>
                    <button
                      onClick={togglePickMe}
                      className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                        pickmeEnabled ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-[#e52a20] text-white shadow-lg shadow-red-500/20'
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

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#292929] rounded-2xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <h3 className="text-lg font-bold text-[#ffbd18]">Edit Item: {editingItem.title}</h3>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Title</label>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Price (LKR)</label>
              <input
                type="number"
                value={editingItem.price}
                onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Description</label>
              <textarea
                rows={3}
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full bg-[#070707] border border-[#292929] p-3 rounded-xl text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Replace Image (Optional)</label>
              <input id="edit-img-input" type="file" accept="image/*" className="text-xs text-gray-400" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222]">
              <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white">
                Cancel
              </button>
              <button type="button" onClick={handleSaveEdit} className="px-6 py-2 bg-[#ffbd18] text-[#070707] text-xs font-black rounded-xl hover:bg-[#e0a410]">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}