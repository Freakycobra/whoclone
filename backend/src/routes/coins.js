const express = require('express');
const router = express.Router();

// In-memory coin store (MVP — replace with DB in production)
// userId -> balance
const coinBalances = new Map();

const DEFAULT_BALANCE = 100; // New users start with 100 coins

function getBalance(userId) {
  if (!coinBalances.has(userId)) {
    coinBalances.set(userId, DEFAULT_BALANCE);
  }
  return coinBalances.get(userId);
}

// GET /coins/balance?userId=xxx
router.get('/balance', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  res.json({ userId, balance: getBalance(userId) });
});

// POST /coins/spend  { userId, amount, reason }
router.post('/spend', (req, res) => {
  const { userId, amount, reason } = req.body;
  if (!userId || !amount) return res.status(400).json({ error: 'userId and amount required' });

  const balance = getBalance(userId);
  if (balance < amount) {
    return res.status(402).json({ error: 'Insufficient coins', balance });
  }

  const newBalance = balance - amount;
  coinBalances.set(userId, newBalance);

  console.log(`[coins] ${userId} spent ${amount} for "${reason}" | balance: ${newBalance}`);
  res.json({ success: true, spent: amount, balance: newBalance, reason });
});

// POST /coins/add  { userId, amount, reason }
router.post('/add', (req, res) => {
  const { userId, amount, reason } = req.body;
  if (!userId || !amount) return res.status(400).json({ error: 'userId and amount required' });

  const newBalance = getBalance(userId) + amount;
  coinBalances.set(userId, newBalance);

  console.log(`[coins] ${userId} earned ${amount} for "${reason}" | balance: ${newBalance}`);
  res.json({ success: true, added: amount, balance: newBalance });
});

// POST /coins/sync  { userId, localBalance }
// Called on app launch — syncs local Zustand balance with server
router.post('/sync', (req, res) => {
  const { userId, localBalance } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  // If no server record yet, trust local balance (first launch)
  if (!coinBalances.has(userId) && localBalance != null) {
    coinBalances.set(userId, localBalance);
  }

  res.json({ balance: getBalance(userId) });
});

module.exports = router;
