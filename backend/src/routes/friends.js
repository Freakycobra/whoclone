const express = require('express');
const router = express.Router();

// In-memory stores (swap to DB for prod)
const friendships   = new Map(); // userId -> Set<userId> (accepted friends)
const pendingRequests = new Map(); // userId -> Set<userId> (incoming requests)
const dmMessages    = new Map(); // `${u1}_${u2}` (sorted) -> [{ from, text, ts }]

function roomKey(a, b) {
  return [a, b].sort().join('_');
}

// ── POST /friends/request ─────────────────────────────────────────────────────
// Send a friend request
router.post('/request', (req, res) => {
  const { fromId, toId } = req.body;
  if (!fromId || !toId) return res.status(400).json({ success: false, message: 'fromId and toId required' });
  if (fromId === toId) return res.status(400).json({ success: false, message: 'Cannot friend yourself' });

  // Already friends?
  if (friendships.get(fromId)?.has(toId)) {
    return res.json({ success: false, message: 'Already friends' });
  }

  // Add pending request for toId
  if (!pendingRequests.has(toId)) pendingRequests.set(toId, new Set());
  pendingRequests.get(toId).add(fromId);
  console.log(`[friends] request: ${fromId} -> ${toId}`);
  res.json({ success: true, message: 'Friend request sent' });
});

// ── POST /friends/accept ──────────────────────────────────────────────────────
router.post('/accept', (req, res) => {
  const { userId, fromId } = req.body;
  if (!userId || !fromId) return res.status(400).json({ success: false, message: 'userId and fromId required' });

  // Remove from pending
  pendingRequests.get(userId)?.delete(fromId);

  // Add mutual friendship
  if (!friendships.has(userId)) friendships.set(userId, new Set());
  if (!friendships.has(fromId)) friendships.set(fromId, new Set());
  friendships.get(userId).add(fromId);
  friendships.get(fromId).add(userId);

  console.log(`[friends] accepted: ${userId} <-> ${fromId}`);
  res.json({ success: true, message: 'Friend added' });
});

// ── POST /friends/decline ─────────────────────────────────────────────────────
router.post('/decline', (req, res) => {
  const { userId, fromId } = req.body;
  if (!userId || !fromId) return res.status(400).json({ success: false });
  pendingRequests.get(userId)?.delete(fromId);
  res.json({ success: true });
});

// ── POST /friends/remove ──────────────────────────────────────────────────────
router.post('/remove', (req, res) => {
  const { userId, friendId } = req.body;
  if (!userId || !friendId) return res.status(400).json({ success: false });
  friendships.get(userId)?.delete(friendId);
  friendships.get(friendId)?.delete(userId);
  res.json({ success: true });
});

// ── GET /friends/:userId ──────────────────────────────────────────────────────
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const friends  = [...(friendships.get(userId) || [])].map(id => ({ id }));
  const pending  = [...(pendingRequests.get(userId) || [])].map(id => ({ id }));
  res.json({ friends, pending });
});

// ── GET /friends/check/:userId/:otherId ───────────────────────────────────────
router.get('/check/:userId/:otherId', (req, res) => {
  const { userId, otherId } = req.params;
  const areFriends = friendships.get(userId)?.has(otherId) || false;
  const hasPending = pendingRequests.get(otherId)?.has(userId) || false;
  res.json({ areFriends, requestSent: hasPending });
});

// ── POST /friends/dm/send ─────────────────────────────────────────────────────
router.post('/dm/send', (req, res) => {
  const { fromId, toId, text } = req.body;
  if (!fromId || !toId || !text) return res.status(400).json({ success: false });

  // Only friends can DM
  if (!friendships.get(fromId)?.has(toId)) {
    return res.status(403).json({ success: false, message: 'Not friends' });
  }

  const key = roomKey(fromId, toId);
  if (!dmMessages.has(key)) dmMessages.set(key, []);
  const msg = { from: fromId, text: text.trim(), ts: Date.now() };
  dmMessages.get(key).push(msg);

  // Keep last 200 messages per pair
  const msgs = dmMessages.get(key);
  if (msgs.length > 200) dmMessages.set(key, msgs.slice(-200));

  res.json({ success: true, message: msg });
});

// ── GET /friends/dm/:userId/:friendId ────────────────────────────────────────
router.get('/dm/:userId/:friendId', (req, res) => {
  const { userId, friendId } = req.params;
  if (!friendships.get(userId)?.has(friendId)) {
    return res.status(403).json({ success: false, message: 'Not friends' });
  }
  const key = roomKey(userId, friendId);
  const messages = dmMessages.get(key) || [];
  res.json({ messages });
});

module.exports = router;
