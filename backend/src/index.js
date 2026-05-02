require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const { generateRtcToken, APP_ID } = require('./services/agora');

const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matching');
const coinsRoutes = require('./routes/coins');
const usersRoutes = require('./routes/users');
const giftsRoutes = require('./routes/gifts');
const agoraRoutes = require('./routes/agora');

const app = express();
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
app.use('/auth', authRoutes);
app.use('/match', matchRoutes);
app.use('/coins', coinsRoutes);
app.use('/users', usersRoutes);
app.use('/gifts', giftsRoutes);
app.use('/agora', agoraRoutes);

// ─── IN-MEMORY STORES (MVP — swap to Redis for prod) ──────────────────────────
// socketId -> { userId, profile, filters, superMatch, socket, joinedAt }
const matchingQueue = new Map();
// sessionId -> { user1SocketId, user2SocketId }
const activeMatches = new Map();
// userId -> Set of blocked userIds
const blockedUsers = new Map();
// userId -> coins balance
const userCoins = new Map();

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // ── Join matching queue ───────────────────────────────────────────────────
  socket.on('join_queue', ({ userId, profile, filters, superMatch }) => {
    console.log(`[queue] ${userId} joined | gender=${filters?.genderFilter} country=${filters?.countryFilter} super=${!!superMatch}`);

    matchingQueue.set(socket.id, {
      userId,
      profile: profile || {},   // { displayName, flag, age, gender, country, avatar }
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
        // Re-queue the other user immediately
        const otherEntry = matchingQueue.get(otherId);
        if (!otherEntry) {
          const otherData = getSocketData(otherId);
          if (otherData) {
            matchingQueue.set(otherId, { ...otherData, socket: otherSocket, joinedAt: Date.now() });
          }
        }
        tryMatch(otherId);
      }
      activeMatches.delete(sessionId);
    }

    // Re-queue current user
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

  // ── Gift relay ────────────────────────────────────────────────────────────
  socket.on('send_gift', ({ sessionId, gift, senderId, senderName }) => {
    const otherId = getOtherUser(sessionId, socket.id);
    if (otherId) {
      io.sockets.sockets.get(otherId)?.emit('receive_gift', { gift, senderName, ts: Date.now() });
    }
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);
    matchingQueue.delete(socket.id);

    // Notify partner if in active match
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

  // Build candidate list — super match users checked first
  const candidates = [...matchingQueue.entries()]
    .filter(([id]) => id !== socketId)
    .sort((a, b) => (b[1].superMatch ? 1 : 0) - (a[1].superMatch ? 1 : 0));

  for (const [candidateId, candidate] of candidates) {
    // Skip blocked users
    const myBlocks = blockedUsers.get(user.userId) || new Set();
    const theirBlocks = blockedUsers.get(candidate.userId) || new Set();
    if (myBlocks.has(candidate.userId) || theirBlocks.has(user.userId)) continue;

    // Gender filter — both sides respected
    if (user.filters?.genderFilter && candidate.profile?.gender !== user.filters.genderFilter) continue;
    if (candidate.filters?.genderFilter && user.profile?.gender !== candidate.filters.genderFilter) continue;

    // Country filter
    if (user.filters?.countryFilter && candidate.profile?.country !== user.filters.countryFilter) continue;
    if (candidate.filters?.countryFilter && user.profile?.country !== candidate.filters.countryFilter) continue;

    // Match found — generate session + Agora tokens
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const channelName = `cn_${sessionId}`;

    // Generate unique UIDs for each user
    const uid1 = Math.floor(Math.random() * 100000) + 1;
    const uid2 = Math.floor(Math.random() * 100000) + 1;

    const token1 = generateRtcToken(channelName, uid1, 7200); // 2hr
    const token2 = generateRtcToken(channelName, uid2, 7200);

    matchingQueue.delete(socketId);
    matchingQueue.delete(candidateId);
    activeMatches.set(sessionId, { user1: socketId, user2: candidateId });

    const matchPayload1 = {
      sessionId,
      channelName,
      agoraToken: token1,
      agoraUid: uid1,
      agoraAppId: APP_ID,
      partner: {
        id: candidate.userId,
        displayName: candidate.profile?.displayName || 'Anonymous',
        flag: candidate.profile?.flag || '🌍',
        age: candidate.profile?.age || null,
        gender: candidate.profile?.gender || null,
        country: candidate.profile?.country || null,
        avatar: candidate.profile?.avatar || null,
      },
    };

    const matchPayload2 = {
      sessionId,
      channelName,
      agoraToken: token2,
      agoraUid: uid2,
      agoraAppId: APP_ID,
      partner: {
        id: user.userId,
        displayName: user.profile?.displayName || 'Anonymous',
        flag: user.profile?.flag || '🌍',
        age: user.profile?.age || null,
        gender: user.profile?.gender || null,
        country: user.profile?.country || null,
        avatar: user.profile?.avatar || null,
      },
    };

    user.socket.emit('match_found', matchPayload1);
    candidate.socket.emit('match_found', matchPayload2);

    console.log(`[match] ${user.userId} <-> ${candidate.userId} | session: ${sessionId}`);
    return;
  }

  // No match found yet — user stays in queue
  console.log(`[queue] ${user.userId} waiting... (queue size: ${matchingQueue.size})`);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getOtherUser(sessionId, mySocketId) {
  const match = activeMatches.get(sessionId);
  if (!match) return null;
  return match.user1 === mySocketId ? match.user2 : match.user1;
}

// Retrieve data stored during join (for re-queue after skip)
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
  res.json({ online: io.engine.clientsCount, queued: matchingQueue.size, matched: activeMatches.size * 2 });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 ConnectNow API on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = { app, io };
