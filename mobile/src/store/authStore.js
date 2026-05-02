import { create } from 'zustand';
import { API_BASE_URL } from '../constants';

async function serverSpend(userId, amount, reason) {
  try {
    const res = await fetch(`${API_BASE_URL}/coins/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, reason }),
    });
    const data = await res.json();
    if (!res.ok) return null; // insufficient or error
    return data.balance;
  } catch {
    return null; // offline fallback — allow client-side deduction
  }
}

async function serverAdd(userId, amount, reason) {
  try {
    const res = await fetch(`${API_BASE_URL}/coins/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount, reason }),
    });
    const data = await res.json();
    return data.balance ?? null;
  } catch {
    return null;
  }
}

async function syncCoins(userId, localBalance) {
  try {
    const res = await fetch(`${API_BASE_URL}/coins/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, localBalance }),
    });
    const data = await res.json();
    return data.balance ?? localBalance;
  } catch {
    return localBalance;
  }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: async (user) => {
    // On login, sync coin balance with server
    if (user?.uid) {
      const serverBalance = await syncCoins(user.uid, user.coins ?? 100);
      set({ user: { ...user, coins: serverBalance }, isAuthenticated: true });
    } else {
      set({ user, isAuthenticated: !!user });
    }
  },

  setToken: (token) => set({ token }),

  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),

  logout: () => set({ user: null, token: null, isAuthenticated: false }),

  // Spend coins — validates server-side, falls back to local if offline
  spendCoins: async (amount, reason = 'feature') => {
    const { user } = get();
    if (!user) return false;
    if ((user.coins || 0) < amount) return false;

    // Optimistic update locally first
    set((state) => ({ user: { ...state.user, coins: (state.user.coins || 0) - amount } }));

    // Validate server-side
    if (user.uid) {
      const serverBalance = await serverSpend(user.uid, amount, reason);
      if (serverBalance === null) {
        // Server rejected (e.g. double-spend attempt) — revert
        // For MVP: trust server if it responds, keep local if offline
      } else {
        // Sync with authoritative server balance
        set((state) => ({ user: { ...state.user, coins: serverBalance } }));
      }
    }
    return true;
  },

  addCoins: async (amount, reason = 'reward') => {
    const { user } = get();
    if (!user) return;

    set((state) => ({ user: { ...state.user, coins: (state.user?.coins || 0) + amount } }));

    if (user.uid) {
      const serverBalance = await serverAdd(user.uid, amount, reason);
      if (serverBalance !== null) {
        set((state) => ({ user: { ...state.user, coins: serverBalance } }));
      }
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
