import { create } from 'zustand';
import { API_BASE_URL } from '../constants';

async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE_URL}${path}`, opts);
  return res.json();
}

export const useFriendStore = create((set, get) => ({
  friends: [],       // [{ id }]
  pending: [],       // incoming requests [{ id }]
  dmHistory: {},     // friendId -> [{ from, text, ts }]
  loading: false,

  loadFriends: async (userId) => {
    if (!userId) return;
    set({ loading: true });
    try {
      const data = await api(`/friends/${userId}`);
      set({ friends: data.friends || [], pending: data.pending || [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  sendRequest: async (fromId, toId) => {
    try {
      const data = await api('/friends/request', 'POST', { fromId, toId });
      return data;
    } catch {
      return { success: false };
    }
  },

  acceptRequest: async (userId, fromId) => {
    try {
      await api('/friends/accept', 'POST', { userId, fromId });
      set((state) => ({
        friends: [...state.friends, { id: fromId }],
        pending: state.pending.filter((p) => p.id !== fromId),
      }));
    } catch {}
  },

  declineRequest: async (userId, fromId) => {
    try {
      await api('/friends/decline', 'POST', { userId, fromId });
      set((state) => ({
        pending: state.pending.filter((p) => p.id !== fromId),
      }));
    } catch {}
  },

  removeFriend: async (userId, friendId) => {
    try {
      await api('/friends/remove', 'POST', { userId, friendId });
      set((state) => ({
        friends: state.friends.filter((f) => f.id !== friendId),
      }));
    } catch {}
  },

  checkFriendship: async (userId, otherId) => {
    try {
      const data = await api(`/friends/check/${userId}/${otherId}`);
      return data; // { areFriends, requestSent }
    } catch {
      return { areFriends: false, requestSent: false };
    }
  },

  loadDMs: async (userId, friendId) => {
    try {
      const data = await api(`/friends/dm/${userId}/${friendId}`);
      const msgs = data.messages || [];
      set((state) => ({
        dmHistory: { ...state.dmHistory, [friendId]: msgs },
      }));
      return msgs;
    } catch {
      return [];
    }
  },

  sendDM: async (fromId, toId, text) => {
    try {
      const data = await api('/friends/dm/send', 'POST', { fromId, toId, text });
      if (data.success && data.message) {
        set((state) => ({
          dmHistory: {
            ...state.dmHistory,
            [toId]: [...(state.dmHistory[toId] || []), data.message],
          },
        }));
      }
      return data;
    } catch {
      return { success: false };
    }
  },
}));
