import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),

  updateUser: (updates) => set((state) => ({
    user: { ...state.user, ...updates }
  })),

  logout: () => set({
    user: null,
    token: null,
    isAuthenticated: false,
  }),

  addCoins: (amount) => set((state) => ({
    user: { ...state.user, coins: (state.user?.coins || 0) + amount }
  })),

  spendCoins: (amount) => {
    const { user } = get();
    if (!user || user.coins < amount) return false;
    set((state) => ({
      user: { ...state.user, coins: state.user.coins - amount }
    }));
    return true;
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
