import { create } from 'zustand';
import { API_BASE_URL } from '../constants';

// Leaderboard data cached per session
let leaderboardCache = null;
let leaderboardFetchedAt = 0;

export const useLiveStore = create((set, get) => ({
  // Current stream state (when YOU are live)
  isStreaming: false,
  streamTitle: '',
  viewerCount: 0,
  streamDiamonds: 0,       // diamonds earned THIS session
  streamGifts: [],         // list of gifts received this session
  streamDuration: 0,

  // Leaderboard (top gifters — fetched from backend)
  leaderboard: null,       // { topGifters: [...], topStreamers: [...] }
  leaderboardLoading: false,

  startStream: (title) => set({
    isStreaming: true,
    streamTitle: title || '',
    viewerCount: 0,
    streamDiamonds: 0,
    streamGifts: [],
    streamDuration: 0,
  }),

  endStream: () => {
    const earned = get().streamDiamonds;
    set({ isStreaming: false });
    return earned;
  },

  addStreamGift: (gift, senderName) => {
    set(s => ({
      streamDiamonds: s.streamDiamonds + (gift.diamonds || 0),
      streamGifts: [...s.streamGifts.slice(-20), { gift, senderName, id: Date.now().toString() }],
    }));
  },

  setViewerCount: (count) => set({ viewerCount: count }),

  tickDuration: () => set(s => ({ streamDuration: s.streamDuration + 1 })),

  fetchLeaderboard: async (force = false) => {
    const now = Date.now();
    if (!force && leaderboardCache && now - leaderboardFetchedAt < 60000) {
      set({ leaderboard: leaderboardCache });
      return leaderboardCache;
    }
    set({ leaderboardLoading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        leaderboardCache = data;
        leaderboardFetchedAt = now;
        set({ leaderboard: data, leaderboardLoading: false });
        return data;
      }
    } catch (_) {}
    set({ leaderboardLoading: false });
    return null;
  },
}));
