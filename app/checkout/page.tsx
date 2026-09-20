'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { 
  getGuestDeviceId, 
  saveCustomerProfile, 
  getCustomerProfile, 
  syncUserProfile, 
  claimGuestOrders 
} from '@/lib/customerIdentity';
import { sendTelegramOrderNotification } from '@/lib/telegram';
import AuthModal from '@/components/AuthModal';
import type LocationPickerModalType from '@/components/LocationPickerModal';

const LocationPickerModal = dynamic<React.ComponentProps<typeof LocationPickerModalType>>(
  () => import('@/components/LocationPickerModal'),
  { ssr: false }
);

// Reusable Thick Gold Arrow SVG Component
function ThickGoldArrow() {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className="w-12 h-12 sm:w-16 sm:h-16 filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]"
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE072"/>
          <stop offset="40%" stopColor="#FFBD18"/>
          <stop offset="75%" stopColor="#E0A410"/>
          <stop offset="100%" stopColor="#996A00"/>
        </linearGradient>

        <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.8"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#goldGlow)">
        <path 
          d="M 80 15 
             L 52 43 
             L 62 53 
             L 20 60 
             L 27 18 
             L 37 28 
             L 65 0 
             Z" 
          fill="url(#goldGradient)" 
          stroke="#050505" 
          strokeWidth="2.5" 
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [address, setAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [locationSelected, setLocationSelected] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [pickupTime, setPickupTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Closed Store Modal State
  const [isClosedModalOpen, setIsClosedModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Active Validation Error Field ID for Arrow Positioning
  const [activeErrorField, setActiveErrorField] = useState<string | null>(null);

  // Field Refs for Auto-scrolling
  const fieldRefs = {
    name: useRef<HTMLDivElement>(null),
    phone: useRef<HTMLDivElement>(null),
    pickupTime: useRef<HTMLDivElement>(null),
    location: useRef<HTMLDivElement>(null),
    address: useRef<HTMLDivElement>(null),
  };

  const { cart = [], updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCartStore();
  const subtotalPrice = getTotalPrice ? getTotalPrice() : 0;
  
  // Dynamic Delivery Fee Scale: LKR 100 for <= 0.5km, scaling up to LKR 350 at 5km
  const deliveryFee = deliveryType === 'delivery' && locationSelected && distanceKm !== null && distanceKm <= 5
    ? (distanceKm <= 0.5 ? 100 : Math.round((100 + ((distanceKm - 0.5) / 4.5) * 250) / 5) * 5)
    : 0;
    
  const finalTotalPrice = subtotalPrice + deliveryFee;

  useEffect(() => {
    setIsMounted(true);

    async function loadProfile() {
      const profile = await getCustomerProfile(user?.id);

      if (profile) {
        if (profile.name) setCustomerName(profile.name);
        if (profile.phone) setPhoneNumber(profile.phone);
        if (profile.address) setAddress(profile.address);
        if (profile.lat && profile.lng) {
          setSelectedLat(profile.lat);
          setSelectedLng(profile.lng);
          setLocationSelected(true);
        }
      } else if (user?.user_metadata?.full_name) {
        setCustomerName(user.user_metadata.full_name);
      }
    }

    loadProfile();
  }, [user]);

  const getMinPickupTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toTimeString().slice(0, 5);
  };

  // Helper to trigger active field error & scroll into view
  const triggerFieldError = (fieldKey: keyof typeof fieldRefs, message: string) => {
    setValidationError(message);
    setActiveErrorField(fieldKey);
    fieldRefs[fieldKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setActiveErrorField(null);

    // 1. Validate Form Fields with Pointer Guidance
    if (!customerName.trim()) {
      triggerFieldError('name', 'Please enter your full name.');
      return;
    }

    if (!phoneNumber.trim()) {
      triggerFieldError('phone', 'Please enter your phone number.');
      return;
    }

    if (deliveryType === 'delivery') {
      if (!locationSelected || distanceKm === null) {
        triggerFieldError('location', 'Please select your delivery location on the map.');
        return;
      }
      if (distanceKm > 5) {
        triggerFieldError('location', 'Selected location exceeds our 5km delivery radius.');
        return;
      }
      if (!address.trim()) {
        triggerFieldError('address', 'Please enter your complete street address details.');
        return;
      }
    }

    if (deliveryType === 'pickup') {
      if (!pickupTime) {
        triggerFieldError('pickupTime', 'Please select a pickup time.');
        return;
      }
      if (pickupTime < getMinPickupTime()) {
        triggerFieldError('pickupTime', 'Pickup time must be at least 30 minutes from now.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 2. Check Store Open/Closed Status in Realtime from Supabase
      const { data: settingsData } = await supabase
        .from('store_settings')
        .select('is_open')
        .limit(1)
        .maybeSingle();

      if (settingsData && settingsData.is_open === false) {
        setIsSubmitting(false);
        setIsClosedModalOpen(true);
        return;
      }

      const orderCode = Math.floor(1000 + Math.random() * 9000);
      const guestDeviceId = getGuestDeviceId();

      const profilePayload = {
        name: customerName,
        phone: phoneNumber,
        address: deliveryType === 'delivery' ? address : undefined,
        lat: selectedLat || undefined,
        lng: selectedLng || undefined,
      };

      // 3. Sync Profile Information
      if (user?.id) {
        await syncUserProfile(user.id, profilePayload);
        await claimGuestOrders(user.id, phoneNumber);
      } else {
        saveCustomerProfile(profilePayload);
      }

      // 4. Build Insertion Payload
      const orderData: Record<string, any> = {
        order_code: orderCode,
        customer_name: customerName,
        phone: phoneNumber,
        delivery_type: deliveryType,
        address: deliveryType === 'delivery' ? address : null,
        pickup_time: deliveryType === 'pickup' ? pickupTime : null,
        distance_km: deliveryType === 'delivery' ? distanceKm : 0,
        delivery_fee: deliveryFee,
        lat: selectedLat,
        lng: selectedLng,
        notes: notes || null,
        items: cart,
        total_price: finalTotalPrice,
        status: 'pending',
        guest_device_id: guestDeviceId || null,
      };

      if (user?.id) {
        orderData.user_id = user.id;
      }

      // 5. Insert Order into Supabase
      const { error } = await supabase.from('orders').insert([orderData]).select();

      if (error) {
        console.error('Supabase Error:', error);
        setValidationError(`Database Error: ${error.message}`);
        return;
      }

      // 6. Trigger Telegram Bot Alert
      await sendTelegramOrderNotification({
        orderCode,
        customerName,
        phoneNumber,
        deliveryType,
        address,
        pickupTime,
        distanceKm,
        deliveryFee,
        totalPrice: finalTotalPrice,
        notes,
        items: cart,
      });

      clearCart();
      router.push('/my-orders');
    } catch (err: any) {
      console.error('Order Submission Error:', err);
      setValidationError(`Failed to place order: ${err?.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#070707] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-[#222222] pb-6">
          <div>
            <span className="text-xs text-[#ffbd18] font-bold uppercase tracking-wider">Direct Order</span>
            <h1 className="text-3xl font-extrabold text-white mt-1">Checkout & Review</h1>
          </div>
          <Link href="/#menu" className="px-4 py-2 bg-[#121212] border border-[#292929] hover:border-[#ffbd18] text-xs font-bold uppercase rounded-xl transition-all text-gray-300">
            + Add More Items
          </Link>
        </div>

        {/* Guest User Authentication Prompt Banner */}
        {!user && (
          <div className="p-4 bg-[#121212] border border-[#292929] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔑</span>
              <div>
                <p className="text-xs font-bold text-white">Save your details across all devices</p>
                <p className="text-[11px] text-gray-400">Sign in to sync your order history and auto-fill your delivery address next time.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 bg-[#ffbd18] text-[#070707] text-xs font-black uppercase rounded-xl hover:bg-[#e0a410] transition-all flex-shrink-0"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {(!cart || cart.length === 0) ? (
          <div className="text-center py-20 bg-[#121212] border border-[#292929] rounded-2xl p-8">
            <span className="text-5xl">🛒</span>
            <h2 className="text-2xl font-bold mt-4">Your Cart is Empty</h2>
            <Link href="/#menu" className="inline-block mt-6 px-6 py-3 bg-[#ffbd18] text-[#070707] font-black text-xs uppercase rounded-xl">
              Back to Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Order Summary Column */}
            <div className="bg-[#121212] border border-[#292929] rounded-2xl p-6 h-fit shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-white pb-3 border-b border-[#222222]">Order Summary</h2>
              
              <div className="space-y-4">
                {cart.map((item) => {
                  const itemTitle = item.title || (item as any).name || 'Food Item';
                  const itemImage = item.image_url || (item as any).image;
                  return (
                    <div key={item.id} className="flex items-center justify-between bg-[#070707] p-3 rounded-xl border border-[#1f1f1f] gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#121212] flex-shrink-0">
                          {itemImage && <Image src={itemImage} alt={itemTitle} fill className="object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-white truncate">{itemTitle}</h3>
                          <p className="text-xs text-[#ffbd18] font-semibold mt-0.5">
                            LKR {item.price} × {item.quantity} = LKR {item.price * item.quantity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-lg border border-[#222]">
                          <button 
                            type="button" 
                            onClick={() => updateQuantity(item.id, -1)} 
                            className="w-6 h-6 bg-[#181818] border border-[#333] hover:border-[#ffbd18] rounded text-white font-bold flex items-center justify-center text-xs transition-colors"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                          <button 
                            type="button" 
                            onClick={() => updateQuantity(item.id, 1)} 
                            className="w-6 h-6 bg-[#181818] border border-[#333] hover:border-[#ffbd18] rounded text-white font-bold flex items-center justify-center text-xs transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Explicit Remove / Trash Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (removeFromCart) {
                              removeFromCart(item.id);
                            } else {
                              updateQuantity(item.id, -item.quantity);
                            }
                          }}
                          title="Remove item"
                          className="w-8 h-8 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 rounded-lg text-red-400 hover:text-red-300 flex items-center justify-center transition-all text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#222222] space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Items Subtotal</span>
                  <span className="text-white font-bold">LKR {subtotalPrice}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Delivery Charge</span>
                  <span className="text-white font-bold">
                    {deliveryType === 'pickup' 
                      ? 'LKR 0 (Pickup)' 
                      : locationSelected && distanceKm !== null 
                        ? `LKR ${deliveryFee} (${distanceKm.toFixed(2)} km)` 
                        : 'Select location to get delivery fee'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-[#ffbd18] pt-2 border-t border-[#1f1f1f]">
                  <span>Total Amount</span>
                  <span>LKR {finalTotalPrice}</span>
                </div>
              </div>
            </div>

            {/* Customer Details Form Column */}
            <form onSubmit={handlePlaceOrder} className="bg-[#121212] border border-[#292929] rounded-2xl p-6 space-y-4 shadow-xl">
              <h2 className="text-xl font-bold text-white pb-3 border-b border-[#222222]">Customer Details</h2>

              {validationError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span> {validationError}
                </div>
              )}

              {/* 1. Customer Name */}
              <div ref={fieldRefs.name} className="relative">
                {activeErrorField === 'name' && (
                  <div className="absolute -top-10 right-2 z-30 pointer-events-none animate-bounce-diagonal">
                    <ThickGoldArrow />
                  </div>
                )}
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ruwan Silva"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (activeErrorField === 'name') setActiveErrorField(null);
                  }}
                  className={`w-full bg-[#070707] border rounded-xl px-4 py-3 text-sm text-white outline-none transition-all ${
                    activeErrorField === 'name' 
                      ? 'border-red-500 ring-2 ring-red-500/30' 
                      : 'border-[#292929] focus:border-[#ffbd18]'
                  }`}
                />
              </div>

              {/* 2. Phone Number */}
              <div ref={fieldRefs.phone} className="relative">
                {activeErrorField === 'phone' && (
                  <div className="absolute -top-10 right-2 z-30 pointer-events-none animate-bounce-diagonal">
                    <ThickGoldArrow />
                  </div>
                )}
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 077 123 4567"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (activeErrorField === 'phone') setActiveErrorField(null);
                  }}
                  className={`w-full bg-[#070707] border rounded-xl px-4 py-3 text-sm text-white outline-none transition-all ${
                    activeErrorField === 'phone' 
                      ? 'border-red-500 ring-2 ring-red-500/30' 
                      : 'border-[#292929] focus:border-[#ffbd18]'
                  }`}
                />
              </div>

              {/* 3. Order Type Switcher */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-2">Order Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType('delivery');
                      setActiveErrorField(null);
                    }}
                    className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all ${deliveryType === 'delivery' ? 'bg-[#ffbd18] text-[#070707] border-[#ffbd18]' : 'bg-[#070707] text-gray-300 border-[#292929]'}`}
                  >
                    🛵 Home Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType('pickup');
                      setActiveErrorField(null);
                    }}
                    className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all ${deliveryType === 'pickup' ? 'bg-[#ffbd18] text-[#070707] border-[#ffbd18]' : 'bg-[#070707] text-gray-300 border-[#292929]'}`}
                  >
                    🏪 Store Pickup
                  </button>
                </div>
              </div>

              {/* Pickup Time Field */}
              {deliveryType === 'pickup' && (
                <div ref={fieldRefs.pickupTime} className="relative">
                  {activeErrorField === 'pickupTime' && (
                    <div className="absolute -top-10 right-2 z-30 pointer-events-none animate-bounce-diagonal">
                      <ThickGoldArrow />
                    </div>
                  )}
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Pickup Time (At least 30 mins from now) *</label>
                  <input
                    type="time"
                    min={getMinPickupTime()}
                    value={pickupTime}
                    onChange={(e) => {
                      setPickupTime(e.target.value);
                      if (activeErrorField === 'pickupTime') setActiveErrorField(null);
                    }}
                    className={`w-full bg-[#070707] border rounded-xl px-4 py-3 text-sm text-white outline-none transition-all ${
                      activeErrorField === 'pickupTime' 
                        ? 'border-red-500 ring-2 ring-red-500/30' 
                        : 'border-[#292929] focus:border-[#ffbd18]'
                    }`}
                  />
                </div>
              )}

              {/* Delivery Specific Fields */}
              {deliveryType === 'delivery' && (
                <div className="space-y-3">
                  {/* Location Picker Field */}
                  <div ref={fieldRefs.location} className="relative">
                    {activeErrorField === 'location' && (
                      <div className="absolute -top-10 right-2 z-30 pointer-events-none animate-bounce-diagonal">
                        <ThickGoldArrow />
                      </div>
                    )}
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Delivery Location *</label>
                    <button
                      type="button"
                      onClick={() => setIsMapOpen(true)}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                        activeErrorField === 'location'
                          ? 'bg-red-500/10 border-red-500 text-red-400 ring-2 ring-red-500/30'
                          : locationSelected && distanceKm !== null 
                            ? 'bg-green-500/10 border-green-500 text-green-400' 
                            : 'bg-[#181818] border-[#292929] text-[#ffbd18] hover:border-[#ffbd18]'
                      }`}
                    >
                      <span>📍</span>
                      <span>{locationSelected && distanceKm !== null ? `Location Confirmed (${distanceKm.toFixed(2)} km away)` : 'Select Location on Map'}</span>
                    </button>
                  </div>

                  {/* Street Address Details Field */}
                  <div ref={fieldRefs.address} className="relative">
                    {activeErrorField === 'address' && (
                      <div className="absolute -top-10 right-2 z-30 pointer-events-none animate-bounce-diagonal">
                        <ThickGoldArrow />
                      </div>
                    )}
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Full Address Details *</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. No. 25/A, School Lane, Niwanthidiya, Piliyandala"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (activeErrorField === 'address') setActiveErrorField(null);
                      }}
                      className={`w-full bg-[#070707] border rounded-xl px-4 py-3 text-sm text-white outline-none transition-all ${
                        activeErrorField === 'address' 
                          ? 'border-red-500 ring-2 ring-red-500/30' 
                          : 'border-[#292929] focus:border-[#ffbd18]'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Special Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Extra chilli paste"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#070707] border border-[#292929] focus:border-[#ffbd18] rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#ffbd18] hover:bg-[#e0a410] text-[#070707] font-black text-sm uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {isSubmitting ? 'Checking Store Status...' : 'Place Order'}
              </button>
            </form>

          </div>
        )}

      </div>

      {/* LOCATION PICKER MODAL */}
      <LocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirmLocation={(distance: number, lat: number, lng: number) => {
          setDistanceKm(distance);
          setSelectedLat(lat);
          setSelectedLng(lng);
          setLocationSelected(true);
          if (activeErrorField === 'location') setActiveErrorField(null);
        }}
      />

      {/* AUTHENTICATION MODAL */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* CUSTOM "RESTAURANT CLOSED" POPUP MODAL */}
      {isClosedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#292929] rounded-3xl p-6 md:p-8 max-w-md w-full space-y-5 text-center shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-3xl">
              🌙
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white uppercase tracking-wider">Restaurant Is Currently Closed</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                We are not taking live online orders right now. Please come back and place your order during our operating hours!
              </p>
            </div>

            <div className="bg-[#070707] p-4 rounded-2xl border border-[#222222] space-y-1 text-xs">
              <span className="text-[10px] font-black text-[#ffbd18] uppercase tracking-widest block">Opening Hours</span>
              <p className="font-extrabold text-white text-base">3:30 PM – 12:30 AM</p>
              <p className="text-[11px] text-gray-400">Daily Fresh Hot Meals</p>
            </div>

            <button
              type="button"
              onClick={() => setIsClosedModalOpen(false)}
              className="w-full py-3.5 bg-[#ffbd18] hover:bg-[#e0a410] text-[#070707] font-black text-xs uppercase rounded-xl transition-all shadow-lg"
            >
              Understand & Close
            </button>
          </div>
        </div>
      )}

      {/* Keyframe Animation for Diagonal Arrow Bouncing */}
      <style jsx global>{`
        @keyframes bounceDiagonal {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-6px, 8px);
          }
        }
        .animate-bounce-diagonal {
          animation: bounceDiagonal 0.7s infinite ease-in-out;
        }
      `}</style>

    </div>
  );
}