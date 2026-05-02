# Phase 3 — Make it Pay

## Goal: Turn engagement into real revenue

### Tasks (in execution order)

1. [ ] `LiveStreamScreen.js` — full gifts tray, diamond earnings, live leaderboard
2. [ ] `backend/src/routes/live.js` — new route: POST /live/gift (deduct coins, credit diamonds)  
3. [ ] `backend/src/routes/gifts.js` — gift animation relay via socket
4. [ ] `backend/src/server.js` — wire live gift socket events
5. [ ] `store/authStore.js` — add `diamonds` field, `earnDiamonds(amount)` action
6. [ ] `store/liveStore.js` — NEW: live stream state (viewers, gifts, diamonds earned)
7. [ ] `screens/main/LeaderboardScreen.js` — real leaderboard from gift data (top gifters)
8. [ ] `screens/store/CoinStoreScreen.js` — wire "Watch Ad for coins" button (AdMob stub with real UX)
9. [ ] `screens/profile/ProfileScreen.js` — show diamond balance + "Cash Out" teaser
10. [ ] `constants/index.js` — add DIAMOND_TO_COIN_RATE, AD_REWARD_COINS
11. [ ] prebuild + commit + push

## Decisions
- Diamonds: earned by RECEIVING gifts. 1 gift = diamonds per gift.diamonds field (already in constants)
- Diamonds not cashed out yet (future) — but shown on profile with "Cash Out (Coming Soon)" CTA
- Live stream gifts use same GIFTS array as 1v1 gifts
- Leaderboard: top 10 gifters this week, tracked in backend in-memory
- Ad reward: 10 coins per ad watch — AdMob stub (real integration needs Google Play billing)
- No Stripe/RevenueCat this phase (requires Apple Dev + Google Dev accounts) — mark IAP as "coming soon" in UI

## NOT doing this phase (requires external accounts)
- Stripe wiring (needs API keys)
- RevenueCat (needs app store setup)
- Google Play Billing (needs app in Play Store)
- Firebase Blaze (needs billing enabled)
