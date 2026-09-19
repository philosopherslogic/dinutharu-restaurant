import { supabase } from '@/lib/supabaseClient';

const GUEST_ID_KEY = 'dinutharu_guest_device_id';
const CUSTOMER_PROFILE_KEY = 'dinutharu_customer_profile';

export interface CustomerProfile {
  name: string;
  phone: string;
  address?: string;
  lat?: number;
  lng?: number;
}

// Get or generate persistent Guest Device ID
export function getGuestDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

// Save customer default information locally (Cache Fallback)
export function saveCustomerProfile(profile: CustomerProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
}

// Read local customer default information
export function getSavedCustomerProfile(): CustomerProfile | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(CUSTOMER_PROFILE_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Priority Profile Retriever:
 * Fetches profile from Supabase user_metadata if logged in.
 * Falls back to local browser storage only for guest users.
 */
export async function getCustomerProfile(userId?: string): Promise<CustomerProfile | null> {
  if (userId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata) {
        const meta = user.user_metadata;
        if (meta.full_name || meta.phone) {
          return {
            name: meta.full_name || '',
            phone: meta.phone || '',
            address: meta.address || undefined,
            lat: meta.lat || undefined,
            lng: meta.lng || undefined,
          };
        }
      }
    } catch (err) {
      console.error('Error fetching Supabase user metadata:', err);
    }
  }

  // Fallback to local storage if guest or metadata missing
  return getSavedCustomerProfile();
}

/**
 * Claims all previous guest orders for the newly logged-in user.
 * Finds orders matching guest_device_id or phone number and attaches user_id.
 */
export async function claimGuestOrders(userId: string, phone?: string): Promise<void> {
  const guestDeviceId = getGuestDeviceId();
  if (!userId) return;

  try {
    // 1. Claim orders matching guest device ID
    if (guestDeviceId) {
      await supabase
        .from('orders')
        .update({ user_id: userId })
        .eq('guest_device_id', guestDeviceId)
        .is('user_id', null);
    }

    // 2. Claim orders matching phone number if provided
    if (phone) {
      await supabase
        .from('orders')
        .update({ user_id: userId })
        .eq('phone', phone)
        .is('user_id', null);
    }
  } catch (err) {
    console.error('Error claiming guest orders:', err);
  }
}

/**
 * Syncs and saves user metadata to Supabase account
 * so details persist across all devices when logged in.
 */
export async function syncUserProfile(userId: string, profile: CustomerProfile): Promise<void> {
  // Save locally as backup
  saveCustomerProfile(profile);

  if (!userId) return;

  try {
    await supabase.auth.updateUser({
      data: {
        full_name: profile.name,
        phone: profile.phone,
        address: profile.address,
        lat: profile.lat,
        lng: profile.lng,
      },
    });
  } catch (err) {
    console.error('Error syncing user profile metadata:', err);
  }
}