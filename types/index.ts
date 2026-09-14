// 1. Blueprint for any food item on your menu
export interface MenuItem {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isPopular?: boolean;
  isAvailable?: boolean; // 👈 Add this line
}

// 2. Blueprint for items placed inside the customer's cart
// Extends MenuItem so it inherits all fields, plus adds a 'quantity' field
export interface CartItem extends MenuItem {
  quantity: number;
}