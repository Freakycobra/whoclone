const express = require('express');
const router = express.Router();

// POST /users/report
router.post('/report', (req, res) => {
  const { userId, reason } = req.body;
  console.log(`User reported: ${userId} | Reason: ${reason}`);
  // Queue for review or auto-ban based on report count
  res.json({ success: true, message: 'Report submitted. We review within 24h.' });
});

// POST /users/block
router.post('/block', (req, res) => {
  const { userId } = req.body;
  res.json({ success: true, message: 'User blocked.' });
});

// GET /users/friends
router.get('/friends', (req, res) => {
  res.json({ friends: [] });
});

module.exports = router;
