import { create } from 'zustand';

interface User {
  name: string;
  email: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  fiscalYear: number;
  setFiscalYear: (year: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: localStorage.getItem('user_name') 
    ? { name: localStorage.getItem('user_name') || '', email: '' }
    : null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_name');
    set({ user: null, isAuthenticated: false });
  },
  fiscalYear: new Date().getFullYear(),
  setFiscalYear: (year: number) => set({ fiscalYear: year }),
}));
