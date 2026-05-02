# ConnectNow — Implementation Tracker

## STATUS KEY
- [x] Done
- [~] In progress
- [ ] Todo

## PHASE 1 — Make It Real (current sprint)

### Step 1: Real Socket.IO Matching (backend already ready)
- [x] Backend socket events exist (join_queue, match_found, skip_match, end_match)
- [ ] Mobile: install socket.io-client
- [ ] Mobile: create socketService.js (singleton socket connection)
- [ ] Mobile: update VideoChatScreen to use socket instead of HTTP+mock
- [ ] Backend: pass user profile (name, flag, age, gender) in match_found event
- [ ] Backend: add Agora token generation inside match_found (both users get token)

### Step 2: Real Agora Tokens in matching flow
- [ ] Backend: generateRtcToken called inside tryMatch(), included in match_found payload
- [ ] Mobile: receive token from socket, call initAgora()

### Step 3: Server-side coin validation
- [ ] Backend: add coins field to in-memory user store (MVP)
- [ ] Backend: POST /coins/spend endpoint with validation
- [ ] Mobile: call /coins/spend before every coin-gated action

### Step 4: Report & Block (proper)
- [ ] Already has handleReport() in VideoChatScreen — just needs block to filter matching queue
- [ ] Backend: store blocked users per userId, filter in tryMatch()

### Step 5: Super Match button
- [ ] Home screen: "Super Match" button (99 coins)
- [ ] Backend: priority flag in queue
- [ ] chatStore: superMatch filter

## PHASE 2 — Make It Sticky
- [ ] Push notifications
- [ ] Interest tags
- [ ] Social following
- [ ] Streak system

## DECISIONS
- socket.io-client version must match backend socket.io version (check package.json)
- Agora token generated server-side in tryMatch, NOT via separate HTTP call
- Coins stored server-side in Map for MVP, Redis later
