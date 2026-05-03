const express = require('express');
const router = express.Router();

// userId -> { productId, expiry, active }
const subscriptions = new Map();

// POST /subscriptions/activate
router.post('/activate', (req, res) => {
  const { userId, productId, expiry } = req.body;
  if (!userId || !productId) return res.status(400).json({ success: false });

  subscriptions.set(userId, {
    productId,
    expiry: expiry || null,
    activatedAt: new Date().toISOString(),
    active: true,
  });
  console.log(`[subscription] activated: ${userId} -> ${productId} (expires: ${expiry})`);
  res.json({ success: true });
});

// GET /subscriptions/status/:userId
router.get('/status/:userId', (req, res) => {
  const { userId } = req.params;
  const sub = subscriptions.get(userId);
  if (!sub) return res.json({ isVip: false });

  // Check expiry
  const now = new Date();
  const expired = sub.expiry ? new Date(sub.expiry) < now : false;
  if (expired) {
    sub.active = false;
    return res.json({ isVip: false, expired: true });
  }

  res.json({ isVip: sub.active, productId: sub.productId, expiry: sub.expiry });
});

// POST /subscriptions/cancel
router.post('/cancel', (req, res) => {
  const { userId } = req.body;
  if (userId && subscriptions.has(userId)) {
    subscriptions.get(userId).active = false;
  }
  res.json({ success: true });
});

module.exports = router;
