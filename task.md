# Report/Block + Push Notifications

## PLAN

### A — Report/Block (complete the system)
1. VideoChatScreen.js — add "Block" option alongside Report (already has report)
2. backend/routes/users.js — block route needs to actually store blocked users + filter in matching
3. backend/index.js — blockedUsers Map already exists, expose /users/block to update it
4. ProfileScreen.js — no changes needed (report is video-only)

### B — Push Notifications (FCM via @react-native-firebase/messaging)
Firebase is already installed (@react-native-firebase/app + auth).
Just need to add @react-native-firebase/messaging.

5. Install: @react-native-firebase/messaging
6. app.json — add POST_NOTIFICATIONS permission + messaging plugin
7. mobile/src/api/notifications.js — NEW: register device token, send local notif
8. mobile/src/hooks/usePushNotifications.js — NEW: setup on app launch
9. App.js (or root) — call usePushNotifications on mount
10. backend/routes/notifications.js — NEW: store FCM tokens, send notifications
11. backend/index.js — wire notifications route + emit push on match_found

### NOTIFICATION TYPES
- Match found → "⚡ Match found! Tap to join" (wake app from background)  
- Gift received → "🎁 @user sent you a Rose!" 
- Daily bonus ready → "🎁 Your daily reward is ready!"
- Follower online → "🔴 @user just went live!" (future — stub the handler)

### DECISIONS
- Use @react-native-firebase/messaging (not expo-notifications) — Firebase already in project, cleaner
- Token stored on backend per userId (in-memory for MVP)
- Notifications sent server-side via Firebase Admin SDK
- Foreground notifications: show custom in-app banner (not system notification)
- Background notifications: system tray via FCM
