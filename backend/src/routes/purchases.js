const express = require('express');
const router = express.Router();

// In-memory purchase log (audit trail — swap to DB for prod)
const purchaseLogs = [];

// POST /purchases/verify
// MVP: trusts client, logs server-side for manual audit
// Prod: call Google Play Developer API to verify receipt
router.post('/verify', (req, res) => {
  const { userId, productId, receipt } = req.body;
  if (!userId || !productId) return res.status(400).json({ success: false });

  const entry = {
    userId,
    productId,
    receiptHash: receipt ? receipt.slice(0, 40) : null,
    ts: new Date().toISOString(),
    verified: true, // MVP trust
  };
  purchaseLogs.push(entry);
  console.log(`[purchase] verified: ${userId} bought ${productId}`);
  res.json({ success: true, verified: true });
});

// GET /purchases/logs (admin only - no auth in MVP)
router.get('/logs', (req, res) => {
  res.json({ count: purchaseLogs.length, logs: purchaseLogs.slice(-50) });
});

module.exports = router;
