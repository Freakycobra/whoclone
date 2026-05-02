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

// POST /users/block
router.post('/block', (req, res) => {
  const { userId } = req.body;
  res.json({ success: true, message: 'User blocked.' });
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
