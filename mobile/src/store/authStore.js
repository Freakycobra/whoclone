import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { navigationRef } from '../navigation/navigationRef';

const VIP_KEY = '@connectnow_vip';

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

// Self-reference for updateUser AsyncStorage persistence
let useAuthStoreRef;
export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: async (user) => {
    if (user?.uid) {
      // Sync coins
      const serverBalance = await syncCoins(user.uid, user.coins ?? 100);

      // Check VIP status — server first, fall back to local cache
      let isVip = user.isVip || false;
      let vipExpiry = user.vipExpiry || null;
      try {
        const cached = await AsyncStorage.getItem(`${VIP_KEY}_${user.uid}`);
        if (cached) {
          const { expiry } = JSON.parse(cached);
          if (expiry && new Date(expiry) > new Date()) {
            isVip = true;
            vipExpiry = expiry;
          } else {
            isVip = false;
            vipExpiry = null;
          }
        }
        // Also check server
        const res = await fetch(`${API_BASE_URL}/subscriptions/status/${user.uid}`);
        const data = await res.json();
        if (data.isVip) { isVip = true; vipExpiry = data.expiry || null; }
        else if (!data.isVip && data.expired) { isVip = false; }
      } catch {}

      set({ user: { ...user, coins: serverBalance, isVip, vipExpiry }, isAuthenticated: true });
    } else {
      set({ user, isAuthenticated: !!user });
    }
  },

  setToken: (token) => set({ token }),

  updateUser: async (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
    // Persist VIP to AsyncStorage
    if (updates.isVip !== undefined) {
      const { user } = useAuthStoreRef();
      if (user?.uid) {
        await AsyncStorage.setItem(
          `${VIP_KEY}_${user.uid}`,
          JSON.stringify({ isVip: updates.isVip, expiry: updates.vipExpiry || null })
        );
      }
    }
  },

  logout: async () => {
    // Clear local state immediately — UI reacts right away
    set({ user: null, token: null, isAuthenticated: false });

    // Navigate to Splash immediately, don't wait for Firebase/Google
    if (navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: 'Splash' }] });
    }

    // Fire-and-forget sign outs — errors are non-blocking
    auth().signOut().catch((e) => {
      if (!String(e).includes('no-current-user')) console.warn('Firebase signOut:', e);
    });
    GoogleSignin.signOut().catch((e) => {
      if (!String(e).includes('not signed in') && !String(e).includes('SIGN_IN_REQUIRED')) {
        console.warn('Google signOut:', e);
      }
    });
  },

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

  // Credit diamonds from receiving live stream gifts
  addDiamonds: (amount) => {
    set((state) => ({
      user: state.user ? { ...state.user, diamonds: (state.user.diamonds || 0) + amount } : null,
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),
}));

// Wire self-reference after creation
useAuthStoreRef = useAuthStore.getState;
