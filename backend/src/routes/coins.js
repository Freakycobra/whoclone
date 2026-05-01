const express = require('express');
const router = express.Router();

// GET /coins/balance
router.get('/balance', (req, res) => {
  res.json({ coins: 100, diamonds: 0 });
});

// POST /coins/purchase - Stripe payment intent
router.post('/purchase', async (req, res) => {
  const { packId, country } = req.body;

  // In production:
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const paymentIntent = await stripe.paymentIntents.create({ amount, currency });

  res.json({
    clientSecret: 'demo_client_secret',
    packId,
    message: 'Payment intent created. Use Stripe SDK to complete payment.',
  });
});

// POST /coins/iap/verify - Google Play IAP verification
router.post('/iap/verify', async (req, res) => {
  const { receipt, packId } = req.body;

  // In production: verify with Google Play Developer API
  // Prevent duplicate receipt use

  const PACK_COINS = {
    'coins_100_in': 100,
    'coins_500_in': 500,
    'coins_1200_in': 1200,
    'coins_3000_in': 3000, // + 500 bonus
    'coins_6000_in': 6000, // + 1000 bonus
    'coins_12000_in': 12000, // + 3000 bonus
  };

  const coins = PACK_COINS[packId] || 0;
  res.json({ success: true, coinsAdded: coins });
});

// POST /coins/daily-bonus
router.post('/daily-bonus', (req, res) => {
  // Check last claim time in DB
  res.json({ success: true, coinsAdded: 50, message: 'Daily bonus claimed!' });
});

// GET /coins/history
router.get('/history', (req, res) => {
  res.json({
    transactions: [
      { type: 'purchase', amount: 500, description: 'Popular Pack', date: new Date() },
      { type: 'gift_sent', amount: -29, description: 'Rose to Priya', date: new Date() },
      { type: 'daily_bonus', amount: 50, description: 'Daily bonus', date: new Date() },
    ],
  });
});

module.exports = router;
