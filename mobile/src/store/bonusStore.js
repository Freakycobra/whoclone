import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@connectnow_daily_bonus';

const DAY_REWARDS = [50, 100, 150, 200, 250, 300, 500];

export const useBonusStore = create((set, get) => ({
  currentDay: 1,
  lastClaimedDate: null,   // ISO date string (YYYY-MM-DD)
  hasShownToday: false,
  streak: 0,               // consecutive days claimed
  streakFreezeCount: 0,    // purchased freeze shields

  loadBonus: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      set({
        currentDay: data.currentDay || 1,
        lastClaimedDate: data.lastClaimedDate || null,
        streak: data.streak || 0,
        streakFreezeCount: data.streakFreezeCount || 0,
      });
    } catch (e) {}
  },

  _persist: async (state) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentDay: state.currentDay,
        lastClaimedDate: state.lastClaimedDate,
        streak: state.streak,
        streakFreezeCount: state.streakFreezeCount,
      }));
    } catch (e) {}
  },

  shouldShowPopup: () => {
    const { lastClaimedDate, hasShownToday } = get();
    if (hasShownToday) return false;
    const today = new Date().toISOString().split('T')[0];
    if (!lastClaimedDate) return true;
    return lastClaimedDate < today;
  },

  markShown: () => set({ hasShownToday: true }),

  claimBonus: async () => {
    const { currentDay, lastClaimedDate, streak } = get();
    const today = new Date().toISOString().split('T')[0];

    if (lastClaimedDate === today) return 0;

    // Calculate new streak
    let newStreak = 1;
    if (lastClaimedDate) {
      const last = new Date(lastClaimedDate);
      const todayDate = new Date(today);
      const diffDays = Math.round((todayDate - last) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // Claimed yesterday — extend streak
        newStreak = streak + 1;
      } else if (diffDays === 2 && get().streakFreezeCount > 0) {
        // Missed one day but have a freeze — use it and preserve streak
        newStreak = streak + 1;
        set(s => ({ streakFreezeCount: s.streakFreezeCount - 1 }));
      }
      // diffDays > 2 (or > 1 with no freeze) → streak resets to 1
    }

    const reward = DAY_REWARDS[Math.min(currentDay - 1, 6)];
    const nextDay = currentDay >= 7 ? 1 : currentDay + 1;

    const newState = {
      currentDay: nextDay,
      lastClaimedDate: today,
      hasShownToday: true,
      streak: newStreak,
      streakFreezeCount: get().streakFreezeCount,
    };
    set(newState);
    await get()._persist(newState);
    return reward;
  },

  // Purchase a streak freeze (costs 99 coins — caller must deduct coins)
  buyStreakFreeze: async () => {
    const newCount = get().streakFreezeCount + 1;
    set({ streakFreezeCount: newCount });
    await get()._persist({ ...get(), streakFreezeCount: newCount });
    return newCount;
  },

  isClaimedToday: () => {
    const { lastClaimedDate } = get();
    const today = new Date().toISOString().split('T')[0];
    return lastClaimedDate === today;
  },

  DAY_REWARDS,
}));
