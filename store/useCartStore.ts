import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem, CartItem } from '@/types';

// Define what data and actions our store will contain
interface CartState {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],

      // Add item to cart (or increment quantity if it already exists)
      addToCart: (item: MenuItem) => {
        const currentCart = get().cart;
        const existingItem = currentCart.find((i) => i.id === item.id);

        if (existingItem) {
          set({
            cart: currentCart.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({ cart: [...currentCart, { ...item, quantity: 1 }] });
        }
      },

      // Remove an item entirely by ID
      removeFromCart: (id: string) => {
        set({ cart: get().cart.filter((i) => i.id !== id) });
      },

      // Increase (+1) or Decrease (-1) item quantity
      updateQuantity: (id: string, delta: number) => {
        const updatedCart = get().cart
          .map((item) => {
            if (item.id === id) {
              const newQuantity = item.quantity + delta;
              return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[];

        set({ cart: updatedCart });
      },

      // Empty the cart
      clearCart: () => set({ cart: [] }),

      // Calculate total subtotal price
      getTotalPrice: () => {
        return get().cart.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      // Calculate total item count for the floating badge
      getTotalItems: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'dinutharu-cart-storage', // key name in browser localStorage
    }
  )
);