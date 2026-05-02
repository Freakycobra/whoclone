const express = require('express');
const router = express.Router();

const GIFT_TABLE = {
  heart:   { coins: 10,   diamonds: 5    },
  rose:    { coins: 29,   diamonds: 14   },
  kiss:    { coins: 49,   diamonds: 24   },
  crown:   { coins: 99,   diamonds: 49   },
  fire:    { coins: 149,  diamonds: 74   },
  rocket:  { coins: 199,  diamonds: 99   },
  diamond: { coins: 499,  diamonds: 249  },
  car:     { coins: 999,  diamonds: 499  },
  jet:     { coins: 1999, diamonds: 999  },
  castle:  { coins: 4999, diamonds: 2499 },
};

// Lazy-load to avoid circular dep
let recordGift;
function getRecordGift() {
  if (!recordGift) {
    recordGift = require('./leaderboard').recordGift;
  }
  return recordGift;
}

// In-memory balances (shared with coins route via require)
// In production: use DB. For MVP we keep it simple.
const diamondBalances = new Map();

function getDiamonds(userId) {
  return diamondBalances.get(userId) || 0;
}

function addDiamonds(userId, amount) {
  const newBalance = getDiamonds(userId) + amount;
  diamondBalances.set(userId, newBalance);
  return newBalance;
}

// GET /gifts/diamonds?userId=xxx
router.get('/diamonds', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  res.json({ userId, diamonds: getDiamonds(userId) });
});

// POST /gifts/send
// Body: { sessionId, giftId, senderId, senderName, senderFlag, recipientId, recipientName, recipientFlag }
router.post('/send', (req, res) => {
  const { giftId, senderId, senderName, senderFlag, recipientId, recipientName, recipientFlag } = req.body;

  const gift = GIFT_TABLE[giftId];
  if (!gift) return res.status(400).json({ error: 'Invalid gift ID' });
  if (!senderId || !recipientId) return res.status(400).json({ error: 'senderId and recipientId required' });

  // Credit diamonds to recipient
  const newDiamonds = addDiamonds(recipientId, gift.diamonds);

  // Record for leaderboard
  try {
    getRecordGift()(
      senderId, senderName || 'Anonymous', senderFlag || '🌍',
      gift.coins,
      recipientId, recipientName || 'Anonymous', recipientFlag || '🌍',
      gift.diamonds
    );
  } catch (_) {}

  console.log(`[gift] ${senderId} -> ${recipientId} | ${giftId} | ${gift.coins} coins | ${gift.diamonds} diamonds`);

  res.json({
    success: true,
    giftId,
    coinsDeducted: gift.coins,
    diamondsToRecipient: gift.diamonds,
    recipientDiamondBalance: newDiamonds,
  });
});

// POST /gifts/live-gift
// Body: { streamerId, giftId, senderId, senderName, senderFlag }
router.post('/live-gift', (req, res) => {
  const { streamerId, giftId, senderId, senderName, senderFlag } = req.body;

  const gift = GIFT_TABLE[giftId];
  if (!gift) return res.status(400).json({ error: 'Invalid gift ID' });
  if (!streamerId || !senderId) return res.status(400).json({ error: 'streamerId and senderId required' });

  // Credit diamonds to streamer
  const newDiamonds = addDiamonds(streamerId, gift.diamonds);

  // Record for leaderboard
  try {
    getRecordGift()(
      senderId, senderName || 'Anonymous', senderFlag || '🌍',
      gift.coins,
      streamerId, 'Streamer', '🌍',
      gift.diamonds
    );
  } catch (_) {}

  console.log(`[live-gift] ${senderId} -> streamer ${streamerId} | ${giftId} | ${gift.diamonds} diamonds`);

  res.json({
    success: true,
    giftId,
    coinsDeducted: gift.coins,
    diamondsEarned: gift.diamonds,
    streamerDiamondBalance: newDiamonds,
  });
});

module.exports = router;
