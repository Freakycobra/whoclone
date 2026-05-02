const express = require('express');
const router = express.Router();

// In-memory gift ledger: userId -> { name, flag, coinsSpent, diamondsEarned }
const giftLedger = new Map();

// Called by gifts route to record a gift transaction
function recordGift(senderId, senderName, senderFlag, coinsSpent, recipientId, recipientName, recipientFlag, diamondsEarned) {
  // Update sender (top gifter)
  const s = giftLedger.get(senderId) || { userId: senderId, name: senderName, flag: senderFlag || '🌍', coinsSpent: 0, diamondsEarned: 0, type: 'gifter' };
  s.coinsSpent += coinsSpent;
  giftLedger.set(senderId, s);

  // Update recipient (top earner)
  const r = giftLedger.get(recipientId) || { userId: recipientId, name: recipientName, flag: recipientFlag || '🌍', coinsSpent: 0, diamondsEarned: 0, type: 'earner' };
  r.diamondsEarned += diamondsEarned;
  giftLedger.set(recipientId, r);
}

// GET /leaderboard
router.get('/', (req, res) => {
  const allEntries = [...giftLedger.values()];

  const topGifters = allEntries
    .filter(e => e.coinsSpent > 0)
    .sort((a, b) => b.coinsSpent - a.coinsSpent)
    .slice(0, 10)
    .map((e, i) => ({ rank: i + 1, name: e.name, flag: e.flag, value: e.coinsSpent, label: 'coins spent', emoji: '🎁' }));

  const topEarners = allEntries
    .filter(e => e.diamondsEarned > 0)
    .sort((a, b) => b.diamondsEarned - a.diamondsEarned)
    .slice(0, 10)
    .map((e, i) => ({ rank: i + 1, name: e.name, flag: e.flag, value: e.diamondsEarned, label: 'diamonds', emoji: '💎' }));

  res.json({ topGifters, topEarners, updatedAt: new Date().toISOString() });
});

// POST /leaderboard/record-gift (called internally or from gifts route)
router.post('/record-gift', (req, res) => {
  const { senderId, senderName, senderFlag, coinsSpent, recipientId, recipientName, recipientFlag, diamondsEarned } = req.body;
  if (!senderId || !recipientId || !coinsSpent) {
    return res.status(400).json({ error: 'senderId, recipientId, coinsSpent required' });
  }
  recordGift(senderId, senderName, senderFlag, coinsSpent, recipientId, recipientName, recipientFlag, diamondsEarned || Math.floor(coinsSpent * 0.5));
  res.json({ success: true });
});

module.exports = { router, recordGift };
