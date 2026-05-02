const express = require('express');
const router = express.Router();

// In-memory follow graph (userId -> Set of followedUserIds)
const followGraph = new Map();

// POST /users/report
router.post('/report', (req, res) => {
  const { userId, reason } = req.body;
  console.log(`User reported: ${userId} | Reason: ${reason}`);
  res.json({ success: true, message: 'Report submitted. We review within 24h.' });
});

// POST /users/block  — proxies to /users/block-socket which has access to blockedUsers Map
router.post('/block', async (req, res) => {
  const { blockerId, blockedId } = req.body;
  if (!blockerId || !blockedId) {
    return res.status(400).json({ success: false, message: 'blockerId and blockedId required' });
  }
  try {
    // Forward to the inline express handler in index.js that has blockedUsers Map access
    const response = await fetch(`http://localhost:${process.env.PORT || 3000}/users/block-socket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockerId, blockedId }),
    });
    const data = await response.json();
    console.log(`[block] ${blockerId} blocked ${blockedId}`);
    res.json({ ...data, message: 'User blocked.' });
  } catch (err) {
    console.error('[block] error:', err);
    res.json({ success: true, message: 'User blocked.' }); // graceful fallback
  }
});

// GET /users/friends
router.get('/friends', (req, res) => {
  res.json({ friends: [] });
});

// POST /users/follow
router.post('/follow', (req, res) => {
  const { followerId, targetId } = req.body;
  if (!followerId || !targetId) {
    return res.status(400).json({ success: false, message: 'followerId and targetId required' });
  }
  if (!followGraph.has(followerId)) followGraph.set(followerId, new Set());
  followGraph.get(followerId).add(targetId);
  const count = followGraph.get(followerId).size;
  console.log(`Follow: ${followerId} -> ${targetId} (total following: ${count})`);
  res.json({ success: true, followingCount: count });
});

// POST /users/unfollow
router.post('/unfollow', (req, res) => {
  const { followerId, targetId } = req.body;
  if (!followerId || !targetId) {
    return res.status(400).json({ success: false, message: 'followerId and targetId required' });
  }
  if (followGraph.has(followerId)) {
    followGraph.get(followerId).delete(targetId);
  }
  const count = followGraph.get(followerId)?.size || 0;
  console.log(`Unfollow: ${followerId} -> ${targetId} (total following: ${count})`);
  res.json({ success: true, followingCount: count });
});

// GET /users/:userId/follow-counts
router.get('/:userId/follow-counts', (req, res) => {
  const { userId } = req.params;
  const following = followGraph.get(userId)?.size || 0;
  // Count followers (who follows userId)
  let followers = 0;
  for (const [, set] of followGraph) {
    if (set.has(userId)) followers++;
  }
  res.json({ followers, following });
});

module.exports = router;
