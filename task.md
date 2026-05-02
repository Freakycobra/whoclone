# ConnectNow — Implementation Tracker

## STATUS KEY
- [x] Done  |  [~] In progress  |  [ ] Todo

## PHASE 1 — COMPLETE ✅
- [x] Real Socket.IO matching
- [x] Real Agora tokens from backend
- [x] Server-side coin validation
- [x] Super Match button (99 coins)
- [x] Gift animations + socket relay
- [x] Report/Block system

## PHASE 2 — Make It Sticky (current sprint)

### A. Location-Based Regional Pricing (from user image)
- [x] Expand COIN_PACKS + SUBSCRIPTION_PLANS to 10+ regions
- [x] useLocationPricing hook: reads expo-location, maps to country code
- [x] CoinStoreScreen: uses location-detected country for pricing
- [x] PremiumScreen: same
- [x] Backend /pricing endpoint for server-side price lookup
- [x] Anti-abuse: use device GPS country, not user-selected country

### B. Push Notifications (FCM)
- [x] expo-notifications installed
- [x] NotificationService (register token, handle foreground/background)
- [x] Backend POST /notifications/send route (firebase-admin)
- [x] Triggers: daily bonus ready, gift received, match found
- [x] App.js / SplashScreen: register on launch

### C. Interest Tags
- [x] INTERESTS constant (20 tags)
- [x] ProfileSetupScreen: step to pick 3-5 interests
- [x] ProfileScreen: show interest tags
- [x] chatStore: interestFilter array
- [x] Backend tryMatch: weight shared interests

### D. Social Following
- [x] followStore.js (followers/following per user, AsyncStorage)
- [x] Follow button on VideoChatScreen (after 10s)
- [x] ProfileScreen: followers/following count + list
- [x] DiscoverScreen: "Following" tab shows followed users' activity

### E. Daily Streak Extension
- [x] bonusStore: add streak counter (consecutive days)
- [x] streak freeze (99 coins — buys 1 day grace)
- [x] DailyBonusModal: show streak flame + day counter
- [x] 30-day milestone: 500 bonus coins + badge

## PHASE 3 — Make It Pay
- [ ] RevenueCat VIP subscription
- [ ] Google Play Billing coin packs
- [ ] Live stream gifts + diamond economy
- [ ] AdMob rewarded ads

## DECISIONS (Phase 2)
- Location pricing uses expo-location GPS → country code. Falls back to 'default' if denied.
- Anti-abuse: server also checks IP geolocation via backend before confirming purchase price
- Interest tags stored in user profile object in authStore
- Follow system is local + backend synced
