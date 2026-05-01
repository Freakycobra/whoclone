const express = require('express');
const router = express.Router();

// POST /match/start
router.post('/start', (req, res) => {
  const { genderFilter, countryFilter } = req.body;
  // Real matching happens via Socket.IO
  // This HTTP endpoint just validates and returns session info
  res.json({ status: 'searching', message: 'Joined matching queue' });
});

// POST /match/skip
router.post('/skip', (req, res) => {
  const { sessionId } = req.body;
  res.json({ status: 'skipped', sessionId });
});

// POST /match/end
router.post('/end', (req, res) => {
  const { sessionId, rating } = req.body;
  // Save rating to DB in production
  res.json({ status: 'ended', sessionId, rating });
});

module.exports = router;
