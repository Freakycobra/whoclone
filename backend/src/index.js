require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const { generateRtcToken, APP_ID } = require('./services/agora');

const authRoutes    = require('./routes/auth');
const matchRoutes   = require('./routes/matching');
const coinsRoutes   = require('./routes/coins');
const usersRoutes   = require('./routes/users');
const giftsRoutes   = require('./routes/gifts');
const agoraRoutes   = require('./routes/agora');
const { router: leaderboardRouter } = require('./routes/leaderboard');
const { router: notificationsRouter, fcmTokens } = require('./routes/notifications');
const friendsRouter    = require('./routes/friends');
const purchasesRouter  = require('./routes/purchases');
const subscriptionsRouter = require('./routes/subscriptions');
const { router: moderationRouter, reports: reportStore } = require('./routes/moderation');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ConnectNow API', timestamp: new Date().toISOString() }));

// Routes
app.use('/auth',          authRoutes);
app.use('/match',         matchRoutes);
app.use('/coins',         coinsRoutes);
app.use('/users',         usersRoutes);
app.use('/gifts',         giftsRoutes);
app.use('/agora',         agoraRoutes);
app.use('/leaderboard',     leaderboardRouter);
app.use('/notifications',   notificationsRouter);
app.use('/friends',         friendsRouter);
app.use('/purchases',       purchasesRouter);
app.use('/subscriptions',   subscriptionsRouter);
app.use('/moderation',      moderationRouter);

// ─── FCM SEND HELPER ─────────────────────────────────────────────────────────
// Uses firebase-admin if GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT is set.
// Falls back to a no-op in dev if not configured (won't crash the server).
let firebaseAdmin = null;
try {
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : undefined;

    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      firebaseAdmin = admin;
      console.log('[FCM] firebase-admin initialized');
    } else {
      console.log('[FCM] FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled');
    }
  } else {
    firebaseAdmin = admin;
  }
} catch (err) {
  console.log('[FCM] firebase-admin not available:', err.message);
}

async function sendPush(userId, title, body, data = {}) {
  if (!firebaseAdmin) return;
  const token = fcmTokens.get(userId);
  if (!token) return;
  try {
    await firebaseAdmin.messaging().send({
      token,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
    console.log(`[FCM] push sent to ${userId}: ${title}`);
  } catch (err) {
    console.warn(`[FCM] push failed for ${userId}:`, err.message);
    // If token is invalid, remove it
    if (err.code === 'messaging/registration-token-not-registered') {
      fcmTokens.delete(userId);
    }
  }
}

// ─── IN-MEMORY STORES (MVP — swap to Redis for prod) ──────────────────────────
const matchingQueue  = new Map();  // socketId -> user data
const activeMatches  = new Map();  // sessionId -> { user1, user2 }
const blockedUsers   = new Map();  // userId -> Set<userId>
const liveStreams     = new Map();  // streamerId -> { socketId, viewerCount, title }

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── Join matching queue ───────────────────────────────────────────────────
  socket.on('join_queue', ({ userId, profile, filters, superMatch }) => {
    console.log(`[queue] ${userId} joined | gender=${filters?.genderFilter} country=${filters?.countryFilter} super=${!!superMatch}`);

    matchingQueue.set(socket.id, {
      userId,
      profile: profile || {},
      filters: filters || {},
      superMatch: !!superMatch,
      socket,
      joinedAt: Date.now(),
    });

    socket.emit('queue_joined', { status: 'searching' });
    tryMatch(socket.id);
  });

  // ── Skip current match ────────────────────────────────────────────────────
  socket.on('skip_match', ({ sessionId }) => {
    const match = activeMatches.get(sessionId);
    if (match) {
      const otherId = match.user1 === socket.id ? match.user2 : match.user1;
      const otherSocket = io.sockets.sockets.get(otherId);
      if (otherSocket) {
        otherSocket.emit('partner_skipped');
        const otherData = getSocketData(otherId);
        if (otherData && !matchingQueue.has(otherId)) {
          matchingQueue.set(otherId, { ...otherData, socket: otherSocket, joinedAt: Date.now() });
        }
        tryMatch(otherId);
      }
      activeMatches.delete(sessionId);
    }
    if (!matchingQueue.has(socket.id)) {
      const myData = getSocketData(socket.id);
      if (myData) matchingQueue.set(socket.id, { ...myData, socket, joinedAt: Date.now() });
    }
    tryMatch(socket.id);
  });

  // ── End match ────────────────────────────────────────────────────────────
  socket.on('end_match', ({ sessionId, rating }) => {
    const match = activeMatches.get(sessionId);
    if (match) {
      const otherId = match.user1 === socket.id ? match.user2 : match.user1;
      const otherSocket = io.sockets.sockets.get(otherId);
      if (otherSocket) otherSocket.emit('partner_ended');
      activeMatches.delete(sessionId);
    }
  });

  // ── Text message relay ────────────────────────────────────────────────────
  socket.on('send_message', ({ sessionId, text }) => {
    const otherId = getOtherUser(sessionId, socket.id);
    if (otherId) {
      io.sockets.sockets.get(otherId)?.emit('receive_message', { text, from: socket.id, ts: Date.now() });
    }
  });

  // ── Reaction relay ────────────────────────────────────────────────────────
  socket.on('send_reaction', ({ sessionId, reaction }) => {
    const otherId = getOtherUser(sessionId, socket.id);
    if (otherId) {
      io.sockets.sockets.get(otherId)?.emit('receive_reaction', { reaction });
    }
  });

  // ── 1v1 Gift relay ────────────────────────────────────────────────────────
  socket.on('send_gift', ({ sessionId, gift, senderId, senderName }) => {
    const otherId = getOtherUser(sessionId, socket.id);
    if (otherId) {
      io.sockets.sockets.get(otherId)?.emit('receive_gift', { gift, senderName, ts: Date.now() });
    }
  });

  // ── Live stream: start ────────────────────────────────────────────────────
  socket.on('live_start', ({ userId, title }) => {
    liveStreams.set(userId, { socketId: socket.id, viewerCount: 0, title: title || '', startedAt: Date.now() });
    console.log(`[live] ${userId} started stream: "${title}"`);
  });

  // ── Live stream: end ──────────────────────────────────────────────────────
  socket.on('live_end', ({ userId }) => {
    liveStreams.delete(userId);
    console.log(`[live] ${userId} ended stream`);
  });

  // ── Live stream: gift sent to streamer ────────────────────────────────────
  socket.on('live_gift', ({ streamerId, gift, senderId, senderName, senderFlag }) => {
    const stream = liveStreams.get(streamerId);
    if (stream) {
      // Notify streamer of gift received
      io.sockets.sockets.get(stream.socketId)?.emit('live_gift_received', {
        gift,
        senderName: senderName || 'Anonymous',
        senderFlag: senderFlag || '🌍',
        ts: Date.now(),
      });
      // Broadcast to all viewers in stream room (if using rooms — simplified: notify streamer)
      console.log(`[live-gift] ${senderId} -> ${streamerId}: ${gift?.name} (${gift?.cost} coins)`);
    }
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);
    matchingQueue.delete(socket.id);

    for (const [sessionId, match] of activeMatches) {
      if (match.user1 === socket.id || match.user2 === socket.id) {
        const otherId = match.user1 === socket.id ? match.user2 : match.user1;
        io.sockets.sockets.get(otherId)?.emit('partner_disconnected');
        activeMatches.delete(sessionId);
        break;
      }
    }
  });
});

// ─── MATCHING LOGIC ───────────────────────────────────────────────────────────
function tryMatch(socketId) {
  const user = matchingQueue.get(socketId);
  if (!user) return;

  const candidates = [...matchingQueue.entries()]
    .filter(([id]) => id !== socketId)
    .sort((a, b) => (b[1].superMatch ? 1 : 0) - (a[1].superMatch ? 1 : 0));

  for (const [candidateId, candidate] of candidates) {
    const myBlocks    = blockedUsers.get(user.userId)      || new Set();
    const theirBlocks = blockedUsers.get(candidate.userId) || new Set();
    if (myBlocks.has(candidate.userId) || theirBlocks.has(user.userId)) continue;

    if (user.filters?.genderFilter      && candidate.profile?.gender  !== user.filters.genderFilter)      continue;
    if (candidate.filters?.genderFilter && user.profile?.gender       !== candidate.filters.genderFilter) continue;
    if (user.filters?.countryFilter     && candidate.profile?.country !== user.filters.countryFilter)     continue;
    if (candidate.filters?.countryFilter && user.profile?.country     !== candidate.filters.countryFilter) continue;

    const sessionId   = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const channelName = `cn_${sessionId}`;
    const uid1 = Math.floor(Math.random() * 100000) + 1;
    const uid2 = Math.floor(Math.random() * 100000) + 1;

    const token1 = generateRtcToken(channelName, uid1, 7200);
    const token2 = generateRtcToken(channelName, uid2, 7200);

    matchingQueue.delete(socketId);
    matchingQueue.delete(candidateId);
    activeMatches.set(sessionId, { user1: socketId, user2: candidateId });

    user.socket.emit('match_found', {
      sessionId, channelName, agoraToken: token1, agoraUid: uid1, agoraAppId: APP_ID,
      partner: {
        id: candidate.userId,
        displayName: candidate.profile?.displayName || 'Anonymous',
        flag: candidate.profile?.flag || '🌍',
        age: candidate.profile?.age || null,
        gender: candidate.profile?.gender || null,
        country: candidate.profile?.country || null,
        avatar: candidate.profile?.avatar || null,
      },
    });

    candidate.socket.emit('match_found', {
      sessionId, channelName, agoraToken: token2, agoraUid: uid2, agoraAppId: APP_ID,
      partner: {
        id: user.userId,
        displayName: user.profile?.displayName || 'Anonymous',
        flag: user.profile?.flag || '🌍',
        age: user.profile?.age || null,
        gender: user.profile?.gender || null,
        country: user.profile?.country || null,
        avatar: user.profile?.avatar || null,
      },
    });

    console.log(`[match] ${user.userId} <-> ${candidate.userId} | session: ${sessionId}`);

    // Push notifications for matched users (fires & forgets)
    sendPush(user.userId, '🎉 Match Found!', `You matched with ${candidate.profile?.displayName || 'someone'}. Tap to connect!`, { type: 'match_found', sessionId });
    sendPush(candidate.userId, '🎉 Match Found!', `You matched with ${user.profile?.displayName || 'someone'}. Tap to connect!`, { type: 'match_found', sessionId });

    return;
  }
  console.log(`[queue] ${user.userId} waiting... (queue size: ${matchingQueue.size})`);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getOtherUser(sessionId, mySocketId) {
  const match = activeMatches.get(sessionId);
  if (!match) return null;
  return match.user1 === mySocketId ? match.user2 : match.user1;
}

const socketDataStore = new Map();
function getSocketData(socketId) {
  return socketDataStore.get(socketId);
}

// Block user
app.post('/users/block-socket', (req, res) => {
  const { blockerId, blockedId } = req.body;
  if (!blockedUsers.has(blockerId)) blockedUsers.set(blockerId, new Set());
  blockedUsers.get(blockerId).add(blockedId);
  res.json({ success: true });
});

// Online count
app.get('/stats/online', (req, res) => {
  res.json({ online: io.engine.clientsCount, queued: matchingQueue.size, matched: activeMatches.size * 2, live: liveStreams.size });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 ConnectNow API on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = { app, io };
