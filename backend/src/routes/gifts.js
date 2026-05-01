const express = require('express');
const router = express.Router();

// POST /gifts/send
router.post('/send', (req, res) => {
  const { sessionId, giftId, recipientId } = req.body;

  const GIFT_COINS = {
    heart: 10, rose: 29, kiss: 49, crown: 99, fire: 149,
    rocket: 199, diamond: 499, car: 999, jet: 1999, castle: 4999,
  };

  const GIFT_DIAMONDS = {
    heart: 5, rose: 14, kiss: 24, crown: 49, fire: 74,
    rocket: 99, diamond: 249, car: 499, jet: 999, castle: 2499,
  };

  const cost = GIFT_COINS[giftId];
  const diamonds = GIFT_DIAMONDS[giftId];

  if (!cost) return res.status(400).json({ error: 'Invalid gift' });

  // In production:
  // 1. Deduct coins from sender
  // 2. Credit diamonds to recipient (50% of coins value)
  // 3. Emit via Socket.IO to notify recipient in real-time

  res.json({
    success: true,
    giftId,
    coinsDeducted: cost,
    diamondsToRecipient: diamonds,
    message: 'Gift sent!',
  });
});

module.exports = router;
