import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';

const KEY = '@connectnow_follows';

export const useFollowStore = create((set, get) => ({
  // Set<userId> — people this user follows
  following: new Set(),
  // Set<userId> — people who follow this user (fetched from backend)
  followers: new Set(),
  // Array of { id, displayName, flag, avatar }
  followingProfiles: [],
  loaded: false,

  load: async (myUserId) => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const ids = JSON.parse(raw);
        set({ following: new Set(ids), loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch { set({ loaded: true }); }

    // Fetch follower counts from backend
    if (myUserId) {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${myUserId}/follow-counts`);
        if (res.ok) {
          const data = await res.json();
          // We only have a count, not IDs — create placeholder Set of that size
          // (real app would store follower IDs)
          set({ followers: { size: data.followers } });
        }
      } catch {}
    }
  },

  _save: async (following) => {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify([...following]));
    } catch {}
  },

  isFollowing: (userId) => get().following.has(userId),

  follow: async (userId, profile, myUserId) => {
    const next = new Set(get().following);
    next.add(userId);
    const profiles = [...get().followingProfiles.filter(p => p.id !== userId), { id: userId, ...profile }];
    set({ following: next, followingProfiles: profiles });
    await get()._save(next);
    // Sync to backend
    try {
      await fetch(`${API_BASE_URL}/users/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: myUserId, targetId: userId }),
      });
    } catch {}
  },

  unfollow: async (userId, myUserId) => {
    const next = new Set(get().following);
    next.delete(userId);
    const profiles = get().followingProfiles.filter(p => p.id !== userId);
    set({ following: next, followingProfiles: profiles });
    await get()._save(next);
    try {
      await fetch(`${API_BASE_URL}/users/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: myUserId, targetId: userId }),
      });
    } catch {}
  },

  getCount: () => get().following.size,
}));
