import { v4 as uuidv4 } from 'uuid';

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

// Save customer default information locally
export function saveCustomerProfile(profile: CustomerProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
}

// Read customer default information locally
export function getSavedCustomerProfile(): CustomerProfile | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(CUSTOMER_PROFILE_KEY);
  return data ? JSON.parse(data) : null;
}