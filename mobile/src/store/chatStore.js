import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  // Matching state
  isSearching: false,
  isConnected: false,
  currentMatch: null,
  matchStartTime: null,
  sessionId: null,

  // Agora
  agoraToken: null,
  channelName: null,
  remoteUid: null,

  // Chat messages
  messages: [],
  reactions: [],

  // Gifts received
  giftsReceived: [],

  // Filters (premium)
  genderFilter: null, // 'male' | 'female' | null
  countryFilter: null,

  setSearching: (isSearching) => set({ isSearching }),

  setConnected: (match, sessionId, agoraToken, channelName) => set({
    isConnected: true,
    isSearching: false,
    currentMatch: match,
    sessionId,
    agoraToken,
    channelName,
    matchStartTime: Date.now(),
    messages: [],
    reactions: [],
    giftsReceived: [],
  }),

  disconnect: () => set({
    isConnected: false,
    isSearching: false,
    currentMatch: null,
    matchStartTime: null,
    sessionId: null,
    agoraToken: null,
    channelName: null,
    remoteUid: null,
  }),

  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, { ...msg, id: Date.now().toString() }]
  })),

  addReaction: (reaction) => {
    const id = Date.now().toString();
    set((state) => ({ reactions: [...state.reactions, { reaction, id }] }));
    // Auto-remove after 3s
    setTimeout(() => {
      set((state) => ({ reactions: state.reactions.filter(r => r.id !== id) }));
    }, 3000);
  },

  addGiftReceived: (gift) => set((state) => ({
    giftsReceived: [...state.giftsReceived, { ...gift, id: Date.now().toString() }]
  })),

  setRemoteUid: (uid) => set({ remoteUid: uid }),

  setGenderFilter: (gender) => set({ genderFilter: gender }),
  setCountryFilter: (country) => set({ countryFilter: country }),

  getSessionDuration: () => {
    const { matchStartTime } = get();
    if (!matchStartTime) return 0;
    return Math.floor((Date.now() - matchStartTime) / 1000);
  },
}));
