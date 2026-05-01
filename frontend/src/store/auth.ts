import { create } from 'zustand';
import { api } from '../config/api';

interface User {
  accountId: string;
  name: string;
  phone: string;
  balance: number;
}

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
  updateBalance: (balance: number) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isLoading: false,
  
  login: async (phone, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { phone, password });
      localStorage.setItem('jlf_token', data.token);
      set({
        user: data.user,
        isAdmin: data.user.role === 'admin',
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  register: async (name, phone, password) => {
    set({ isLoading: true });
    const accountId = Math.floor(100000000 + Math.random() * 900000000).toString();
    try {
      const { data } = await api.post('/auth/register', { name, phone, password, accountId });
      localStorage.setItem('jlf_token', data.token);
      set({ user: data.user, isAdmin: false, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('jlf_token');
    set({ user: null, isAdmin: false });
  },
  
  updateBalance: (balance) => {
    set((state) => ({
      user: state.user ? { ...state.user, balance } : null,
    }));
  },
}));