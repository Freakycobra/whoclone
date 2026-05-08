const express = require('express');
const router = express.Router();
const { moderateText, moderateImageUrl } = require('../services/moderation');

// In-memory report store (swap to DB in production)
const reports = [];

/**
 * POST /moderation/text
 * Body: { text }
 * Returns: { allowed, flagged, reason }
 */
router.post('/text', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  const result = await moderateText(text);
  res.json(result);
});

/**
 * POST /moderation/image
 * Body: { imageUrl }
 * Returns: { allowed, flagged, reason }
 */
router.post('/image', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });

  const result = await moderateImageUrl(imageUrl);
  res.json(result);
});

/**
 * POST /moderation/report
 * Body: { reporterId, reportedId, reportedName, reason, context, sessionId }
 * Returns: { success, reportId }
 */
router.post('/report', (req, res) => {
  const { reporterId, reportedId, reportedName, reason, context, sessionId } = req.body;

  if (!reporterId || !reportedId || !reason) {
    return res.status(400).json({ error: 'reporterId, reportedId, reason required' });
  }

  const report = {
    id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    reporterId,
    reportedId,
    reportedName: reportedName || 'Unknown',
    reason,
    context: context || null,
    sessionId: sessionId || null,
    status: 'pending',       // pending | reviewed | actioned | dismissed
    createdAt: new Date().toISOString(),
  };

  reports.push(report);

  console.log(`[report] ${reporterId} reported ${reportedId} for: ${reason}`);

  res.json({ success: true, reportId: report.id, message: 'Report submitted. Our team reviews within 24 hours.' });
});

/**
 * GET /moderation/reports  (admin only — no auth for MVP, add middleware before launch)
 */
router.get('/reports', (req, res) => {
  const sorted = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ reports: sorted, total: sorted.length });
});

module.exports = { router, reports };
