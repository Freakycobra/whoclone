require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matching');
const coinsRoutes = require('./routes/coins');
const usersRoutes = require('./routes/users');
const giftsRoutes = require('./routes/gifts');

const app = express();
const server = http.createServer(app);

// Socket.IO for real-time matching
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ConnectNow API' }));

// Routes
app.use('/auth', authRoutes);
app.use('/match', matchRoutes);
app.use('/coins', coinsRoutes);
app.use('/users', usersRoutes);
app.use('/gifts', giftsRoutes);

// Matching queue (in-memory for MVP — use Redis in production)
const matchingQueue = new Map(); // socketId -> { userId, filters, socket }
const activeMatches = new Map(); // sessionId -> { user1, user2 }

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_queue', ({ userId, token, filters }) => {
    console.log(`User ${userId} joined matching queue`);

    // Add to queue
    matchingQueue.set(socket.id, { userId, filters, socket, joinedAt: Date.now() });

    // Try to match
    tryMatch(socket.id, filters);
  });

  socket.on('skip_match', ({ sessionId }) => {
    const match = activeMatches.get(sessionId);
    if (match) {
      // Notify the other user
      const otherId = match.user1 === socket.id ? match.user2 : match.user1;
      const otherSocket = io.sockets.sockets.get(otherId);
      if (otherSocket) {
        otherSocket.emit('partner_skipped');
        // Re-queue other user
        const otherUser = matchingQueue.get(otherId);
        if (otherUser) tryMatch(otherId, otherUser.filters);
      }
      activeMatches.delete(sessionId);
    }
    // Re-queue current user
    const user = matchingQueue.get(socket.id);
    if (user) tryMatch(socket.id, user?.filters);
  });

  socket.on('end_match', ({ sessionId, rating }) => {
    const match = activeMatches.get(sessionId);
    if (match) {
      const otherId = match.user1 === socket.id ? match.user2 : match.user1;
      const otherSocket = io.sockets.sockets.get(otherId);
      if (otherSocket) otherSocket.emit('partner_ended');
      activeMatches.delete(sessionId);
    }
  });

  socket.on('send_message', ({ sessionId, text }) => {
    const match = activeMatches.get(sessionId);
    if (match) {
      const otherId = match.user1 === socket.id ? match.user2 : match.user1;
      const otherSocket = io.sockets.sockets.get(otherId);
      if (otherSocket) otherSocket.emit('receive_message', { text, from: socket.id });
    }
  });

  socket.on('send_reaction', ({ sessionId, reaction }) => {
    const match = activeMatches.get(sessionId);
    if (match) {
      const otherId = match.user1 === socket.id ? match.user2 : match.user1;
      const otherSocket = io.sockets.sockets.get(otherId);
      if (otherSocket) otherSocket.emit('receive_reaction', { reaction });
    }
  });

  socket.on('disconnect', () => {
    matchingQueue.delete(socket.id);
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

function tryMatch(socketId, filters) {
  const user = matchingQueue.get(socketId);
  if (!user) return;

  for (const [candidateId, candidate] of matchingQueue) {
    if (candidateId === socketId) continue;

    // Gender filter check
    if (filters?.genderFilter && candidate.gender !== filters.genderFilter) continue;
    if (candidate.filters?.genderFilter && user.gender !== candidate.filters.genderFilter) continue;

    // Country filter check
    if (filters?.countryFilter && candidate.country !== filters.countryFilter) continue;

    // Match found!
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const channelName = `channel_${sessionId}`;

    matchingQueue.delete(socketId);
    matchingQueue.delete(candidateId);
    activeMatches.set(sessionId, { user1: socketId, user2: candidateId });

    // Notify both
    user.socket.emit('match_found', {
      sessionId,
      channelName,
      partner: { id: candidate.userId, displayName: 'New match' },
    });
    candidate.socket.emit('match_found', {
      sessionId,
      channelName,
      partner: { id: user.userId, displayName: 'New match' },
    });

    console.log(`Match: ${socketId} <-> ${candidateId} | Session: ${sessionId}`);
    return;
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 ConnectNow API running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = { app, io };
