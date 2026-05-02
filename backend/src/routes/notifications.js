const express = require('express');
const router = express.Router();

// In-memory token store: userId -> fcmToken
const fcmTokens = new Map();

// POST /notifications/register-token
router.post('/register-token', (req, res) => {
  const { userId, fcmToken } = req.body;
  if (!userId || !fcmToken) {
    return res.status(400).json({ success: false, message: 'userId and fcmToken required' });
  }
  fcmTokens.set(userId, fcmToken);
  console.log(`[FCM] registered token for ${userId}`);
  res.json({ success: true });
});

// DELETE /notifications/unregister-token
router.delete('/unregister-token', (req, res) => {
  const { userId } = req.body;
  if (userId) fcmTokens.delete(userId);
  res.json({ success: true });
});

module.exports = { router, fcmTokens };
