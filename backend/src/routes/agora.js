const express = require('express');
const router = express.Router();
const { generateRtcToken, APP_ID } = require('../services/agora');

// GET /agora/token?channel=xxx&uid=0
// Called by the mobile app before joining a video channel
router.get('/token', (req, res) => {
  const { channel, uid } = req.query;

  if (!channel) return res.status(400).json({ error: 'channel required' });

  const token = generateRtcToken(channel, parseInt(uid) || 0);

  res.json({
    token,
    appId: APP_ID,
    channel,
    uid: parseInt(uid) || 0,
  });
});

module.exports = router;
