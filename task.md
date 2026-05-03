# Phase 4 — Premium Paywall + IAP + Friends System

## FEATURES
1. Google Play IAP — real purchases via expo-iap (replaces fake Alert)
2. Premium subscription paywall — isVip stored persistently, gated features
3. Friends system — add friend after chat, friend list screen, DM friends

## PLAN

### A — Google Play IAP (expo-iap)
- Install expo-iap (SDK 51 compatible)
- Create src/hooks/useIAP.js — initialize IAP, purchase coins, purchase VIP sub
- Update CoinStoreScreen — wire real purchase flow
- Update PremiumScreen — wire real subscription flow  
- Update authStore — persist isVip flag
- Backend: POST /purchases/verify — validate receipt (MVP: trust client, log server-side)

### B — Friends System
- Backend: routes/friends.js — sendRequest, accept, list, remove, DM
- Mobile: store/friendStore.js
- Mobile: screens/social/FriendsScreen.js — friend list + pending requests
- Mobile: screens/social/ChatDMScreen.js — simple text DM between friends
- Wire "Add Friend" button in VideoChatScreen post-match rating screen
- Add Friends tab to navigation or Friends button on Profile

### C — Persistence for isVip
- Store isVip + expiry in AsyncStorage
- Check expiry on app launch — downgrade if expired
- Backend: POST /subscriptions/activate, GET /subscriptions/status

## STATUS
- [ ] A — IAP
- [ ] B — Friends  
- [ ] C — VIP persistence
