import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@connectnow_daily_bonus';

const DAY_REWARDS = [50, 100, 150, 200, 250, 300, 500];

export const useBonusStore = create((set, get) => ({
  // currentDay: 1-7 (which day they're on next), resets after day 7
  currentDay: 1,
  lastClaimedDate: null, // ISO date string (YYYY-MM-DD)
  hasShownToday: false,  // whether popup was shown this session/day

  // Load persisted state
  loadBonus: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      set({
        currentDay: data.currentDay || 1,
        lastClaimedDate: data.lastClaimedDate || null,
      });
    } catch (e) {}
  },

  // Save to storage
  _persist: async (state) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentDay: state.currentDay,
        lastClaimedDate: state.lastClaimedDate,
      }));
    } catch (e) {}
  },

  // Should the popup show today?
  shouldShowPopup: () => {
    const { lastClaimedDate, hasShownToday } = get();
    if (hasShownToday) return false;
    const today = new Date().toISOString().split('T')[0];
    // Show if never claimed OR if last claim was before today
    if (!lastClaimedDate) return true;
    return lastClaimedDate < today;
  },

  // Mark popup as shown (so it won't re-show in same session)
  markShown: () => set({ hasShownToday: true }),

  // Claim today's reward — returns coin amount or 0 if already claimed
  claimBonus: async () => {
    const { currentDay, lastClaimedDate } = get();
    const today = new Date().toISOString().split('T')[0];

    // Already claimed today
    if (lastClaimedDate === today) return 0;

    const reward = DAY_REWARDS[Math.min(currentDay - 1, 6)];
    const nextDay = currentDay >= 7 ? 1 : currentDay + 1;

    const newState = {
      currentDay: nextDay,
      lastClaimedDate: today,
      hasShownToday: true,
    };
    set(newState);
    await get()._persist(newState);
    return reward;
  },

  // Check if today is already claimed
  isClaimedToday: () => {
    const { lastClaimedDate } = get();
    const today = new Date().toISOString().split('T')[0];
    return lastClaimedDate === today;
  },

  DAY_REWARDS,
}));
