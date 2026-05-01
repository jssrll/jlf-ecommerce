import { create } from 'zustand';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clear: () => void;
  total: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: JSON.parse(localStorage.getItem('jlf_cart') || '[]'),
  
  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity: 1 }] };
    });
    localStorage.setItem('jlf_cart', JSON.stringify(get().items));
  },
  
  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    localStorage.setItem('jlf_cart', JSON.stringify(get().items));
  },
  
  updateQuantity: (id, delta) => {
    set((state) => {
      const items = state.items.map((i) => {
        if (i.id === id) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      }).filter(Boolean) as CartItem[];
      return { items };
    });
    localStorage.setItem('jlf_cart', JSON.stringify(get().items));
  },
  
  clear: () => {
    set({ items: [] });
    localStorage.removeItem('jlf_cart');
  },
  
  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));